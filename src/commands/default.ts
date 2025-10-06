import { existsSync, promises as fsp } from "node:fs";
import type { Argv } from "mri";
import { resolve } from "pathe";
import consola from "consola";
import {
  loadChangelogConfig,
  getGitDiff,
  getCurrentGitStatus,
  parseCommits,
  bumpVersion,
  generateMarkDown,
  BumpVersionOptions,
  PluginManager,
} from "..";
import { npmPublish, renamePackage } from "../package";
import { githubRelease } from "./github";
import { execCommand } from "../exec";

export default async function defaultMain(args: Argv) {
  const cwd = resolve(args._[0] /* bw compat */ || args.dir || "");
  process.chdir(cwd);
  consola.wrapConsole();

  const config = await loadChangelogConfig(cwd, {
    from: args.from,
    to: args.to,
    output: args.output,
    newVersion: typeof args.r === "string" ? args.r : undefined,
    noAuthors: args.noAuthors,
    hideAuthorEmail: args.hideAuthorEmail,
  });

  if (args.strictPath) {
    config.strictPath = true;
  }

  // Initialize plugin manager
  const pluginManager = new PluginManager(config);

  // Load and initialize plugins
  if (config.plugins && Object.keys(config.plugins).length > 0) {
    try {
      await pluginManager.loadPlugins(config.plugins);
    } catch (error) {
      consola.error("Failed to load plugins:", error.message);
      process.exit(1);
    }
  }

  if (args.clean) {
    const dirty = await getCurrentGitStatus(cwd);
    if (dirty) {
      consola.error("Working directory is not clean.");
      process.exit(1);
    }
  }

  const logger = consola.create({ stdout: process.stderr });
  logger.info(`Generating changelog for ${config.from || ""}...${config.to}`);

  let rawCommits = await getGitDiff(
    config.from,
    config.to,
    config.cwd,
    config.strictPath
  );

  // Plugin hook: beforeCommitParsing
  if (pluginManager.hasPlugins()) {
    rawCommits = await pluginManager.beforeCommitParsing(rawCommits);
  }

  // Parse commits as conventional commits
  let commits = parseCommits(rawCommits, config)
    .map((c) => ({ ...c, type: c.type.toLowerCase() /* #198 */ }))
    .filter(
      (c) =>
        config.types[c.type] &&
        !(
          c.type === "chore" &&
          ["deps", "release"].includes(c.scope) &&
          !c.isBreaking
        )
    );

  // Plugin hook: afterCommitParsing
  if (pluginManager.hasPlugins()) {
    commits = await pluginManager.afterCommitParsing(commits);
  }

  // Shortcut for canary releases
  if (args.canary) {
    if (args.bump === undefined) {
      args.bump = true;
    }
    if (args.versionSuffix === undefined) {
      args.versionSuffix = true;
    }
    if (args.nameSuffix === undefined && typeof args.canary === "string") {
      args.nameSuffix = args.canary;
    }
  }

  // Rename package name optionally
  if (typeof args.nameSuffix === "string") {
    await renamePackage(config, `-${args.nameSuffix}`);
  }

  // Bump version optionally
  if (args.bump || args.release) {
    // Plugin hook: beforeVersionBump
    if (pluginManager.hasPlugins()) {
      await pluginManager.beforeVersionBump(commits);
    }

    const bumpOptions = _getBumpVersionOptions(args);
    const newVersion = await bumpVersion(commits, config, bumpOptions);
    if (!newVersion) {
      consola.error("Unable to bump version based on changes.");
      process.exit(1);
    }
    config.newVersion = newVersion;

    // Plugin hook: afterVersionBump
    if (pluginManager.hasPlugins()) {
      await pluginManager.afterVersionBump(newVersion);
    }
  }

  // Plugin hook: beforeMarkdownGeneration
  if (pluginManager.hasPlugins()) {
    commits = await pluginManager.beforeMarkdownGeneration(commits);
  }

  // Generate markdown
  let markdown = await generateMarkDown(commits, config);

  // Plugin hook: afterMarkdownGeneration
  if (pluginManager.hasPlugins()) {
    markdown = await pluginManager.afterMarkdownGeneration(markdown, commits);
  }

  // Show changelog in CLI unless bumping or releasing
  const displayOnly = !args.bump && !args.release;
  if (displayOnly) {
    consola.log("\n\n" + markdown + "\n\n");
  }

  // Update changelog file (only when bumping or releasing or when --output is specified as a file)
  if (typeof config.output === "string" && (args.output || !displayOnly)) {
    let changelogMD: string;
    if (existsSync(config.output)) {
      consola.info(`Updating ${config.output}`);
      changelogMD = await fsp.readFile(config.output, "utf8");
    } else {
      consola.info(`Creating  ${config.output}`);
      changelogMD = "# Changelog\n\n";
    }

    const lastEntry = changelogMD.match(/^###?\s+.*$/m);

    if (lastEntry) {
      changelogMD =
        changelogMD.slice(0, lastEntry.index) +
        markdown +
        "\n\n" +
        changelogMD.slice(lastEntry.index);
    } else {
      changelogMD += "\n" + markdown + "\n\n";
    }

    await fsp.writeFile(config.output, changelogMD);
  }

  // Commit and tag changes for release mode
  if (args.release) {
    if (args.commit !== false) {
      const filesToAdd = [config.output, "package.json"].filter(
        (f) => f && typeof f === "string"
      ) as string[];
      execCommand(`git add ${filesToAdd.map((f) => `"${f}"`).join(" ")}`, cwd);
      const msg = config.templates.commitMessage.replaceAll(
        "{{newVersion}}",
        config.newVersion
      );
      execCommand(`git commit -m "${msg}"`, cwd);
    }
    if (args.tag !== false) {
      const msg = config.templates.tagMessage.replaceAll(
        "{{newVersion}}",
        config.newVersion
      );
      const body = config.templates.tagBody.replaceAll(
        "{{newVersion}}",
        config.newVersion
      );
      execCommand(
        `git tag ${config.signTags ? "-s" : ""} -am "${msg}" "${body}"`,
        cwd
      );
    }
    if (args.push === true) {
      execCommand("git push --follow-tags", cwd);
    }
    if (args.github !== false && config.repo?.provider === "github") {
      await githubRelease(config, {
        version: config.newVersion,
        body: markdown.split("\n").slice(2).join("\n"),
      });
    }
  }

  // Publish package optionally
  if (args.publish) {
    if (args.publishTag) {
      config.publish.tag = args.publishTag;
    }
    await npmPublish(config);
  }
}

function _getBumpVersionOptions(args: Argv): BumpVersionOptions {
  if (args.versionSuffix) {
    return {
      suffix: args.versionSuffix,
    };
  }

  for (const type of [
    "major",
    "premajor",
    "minor",
    "preminor",
    "patch",
    "prepatch",
    "prerelease",
  ] as const) {
    const value = args[type];
    if (value) {
      if (type.startsWith("pre")) {
        return {
          type,
          preid: typeof value === "string" ? value : "",
        };
      }
      return {
        type,
      };
    }
  }
}
