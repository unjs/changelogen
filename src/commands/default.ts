import type { Argv } from "mri";
import { resolve } from "pathe";
import consola from "consola";
import { execa } from "execa";
import { Package } from "@manypkg/get-packages";
import {
  loadChangelogConfig,
  getGitDiff,
  parseCommits,
  bumpVersion,
  generateMarkDown,
  ChangelogConfig,
  GitCommit,
  getLastGitTag,
} from "..";
import { getSubPackages } from "../monorepo";
import {
  getTagBody,
  getTagMessage,
  getTagMessageWithAnyVersion,
} from "../git-tag";
import { getCommitFiles, getCommitMessage } from "../git-commit";
import { writeChangelog } from "../changelog";
import { githubRelease } from "./github";

export default async function defaultMain(args: Argv) {
  const cwd = resolve(args._[0] /* bw compat */ || args.dir || "");
  process.chdir(cwd);
  consola.wrapConsole();

  const config = await loadChangelogConfig(cwd, {
    from: args.from,
    to: args.to,
    output: args.output,
    newVersion: args.r,
  });

  const logger = consola.create({ stdout: process.stderr });

  if (config.monorepo) {
    const packages = await getSubPackages(config);
    for (const pkg of packages) {
      const originCwd = config.cwd;
      const originFrom = config.from;
      const originNewVersion = config.newVersion;

      const pkgDir = pkg.dir;
      const pkgName = pkg.packageJson.name;

      config.cwd = pkgDir;
      config.from = await getLastGitTag(
        getTagMessageWithAnyVersion(config, pkg)
      );

      logger.info(
        `Generating changelog for ${config.from || ""}...${config.to}`
      );

      const commits = await getCommits(config, config.from, config.to);
      if (commits.length === 0) {
        logger.warn(`Package "${pkgName}" is not change`);
        continue;
      }

      await execBumpVersion(args, config, commits);
      const markdown = await generateMarkDown(commits, config);
      await genChangelog(args, config, markdown, pkg);
      await execRelease(args, config, markdown, pkg);

      config.cwd = originCwd;
      config.from = originFrom;
      config.newVersion = originNewVersion;
    }
  } else {
    logger.info(`Generating changelog for ${config.from || ""}...${config.to}`);

    const commits = await getCommits(config, config.from, config.to);
    await execBumpVersion(args, config, commits, true);
    const markdown = await generateMarkDown(commits, config);
    await genChangelog(args, config, markdown);
    await execRelease(args, config, markdown);
  }
}

async function getCommits(
  config: ChangelogConfig,
  from: string = config.from,
  to: string = config.to
) {
  const rawCommits = await getGitDiff(from, to, config.cwd);

  // Parse commits as conventional commits
  const commits = parseCommits(rawCommits, config).filter(
    (c) =>
      config.types[c.type] &&
      !(c.type === "chore" && c.scope === "deps" && !c.isBreaking)
  );

  return commits;
}

async function execBumpVersion(
  args: Argv,
  config: ChangelogConfig,
  commits: GitCommit[],
  strict = false
) {
  if (args.bump || args.release) {
    let type;
    if (args.major) {
      type = "major";
    } else if (args.minor) {
      type = "minor";
    } else if (args.patch) {
      type = "patch";
    }
    const newVersion = await bumpVersion(commits, config, { type });
    if (!newVersion) {
      if (strict) {
        consola.error("Unable to bump version based on changes.");
        process.exit(1);
      }
      return;
    }
    config.newVersion = newVersion;
  }
}

async function genChangelog(
  args: Argv,
  config: ChangelogConfig,
  markdown: string,
  pkg?: Package
) {
  // Show changelog in CLI unless bumping or releasing
  const displayOnly = !args.bump && !args.release;
  if (displayOnly) {
    consola.log("\n\n" + markdown + "\n\n");
  }

  // Update changelog file (only when bumping or releasing or when --output is specified as a file)
  if (typeof config.output === "string" && (args.output || !displayOnly)) {
    await writeChangelog(config, markdown, pkg);
  }
}

async function execRelease(
  args: Argv,
  config: ChangelogConfig,
  markdown: string,
  pkg?: Package
) {
  // Commit and tag changes for release mode
  if (args.release) {
    if (args.commit !== false) {
      const filesToAdd = getCommitFiles(config, pkg);
      await execa("git", ["add", ...filesToAdd], { cwd: config.cwd });

      const message = getCommitMessage(config, pkg);
      await execa("git", ["commit", "-m", message], { cwd: config.cwd });
    }
    if (args.tag !== false) {
      const message = getTagMessage(config, pkg);
      const body = getTagBody(config, pkg);
      await execa("git", ["tag", message, "-am", body], { cwd: config.cwd });
    }
    if (args.push === true) {
      await execa("git", ["push", "--follow-tags"], { cwd: config.cwd });
    }
    if (args.github !== false && config.repo?.provider === "github") {
      await githubRelease(config, {
        version: config.newVersion,
        body: markdown.split("\n").slice(2).join("\n"),
      });
    }
  }
}
