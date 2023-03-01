#!/usr/bin/env node
import { resolve } from "node:path";
import { existsSync, promises as fsp } from "node:fs";
import consola from "consola";
import mri from "mri";
import { execa } from "execa";
import { getGitDiff, parseCommits } from "./git";
import { loadChangelogConfig } from "./config";
import { generateMarkDown, parseChangelogMd } from "./markdown";
import { bumpVersion } from "./semver";

import {
  GithubOptions,
  getChangelogMd,
  updateRelease,
  createRelease,
  getReleaseByTag,
  // listReleases,
  GithubRelease,
} from "./github";

async function main() {
  const args = mri(process.argv.splice(2));

  if (args._[0] === "sync") {
    return syncMain(args);
  }

  const cwd = resolve(args._[0] || "");
  process.chdir(cwd);

  const config = await loadChangelogConfig(cwd, {
    from: args.from,
    to: args.to,
    output: args.output,
    newVersion: args.r,
  });

  const logger = consola.create({ stdout: process.stderr });
  logger.info(`Generating changelog for ${config.from}...${config.to}`);

  const rawCommits = await getGitDiff(config.from, config.to);

  // Parse commits as conventional commits
  const commits = parseCommits(rawCommits, config).filter(
    (c) =>
      config.types[c.type] &&
      !(c.type === "chore" && c.scope === "deps" && !c.isBreaking)
  );

  // Bump version optionally
  if (args.bump || args.release) {
    const newVersion = await bumpVersion(commits, config);
    if (!newVersion) {
      consola.error("Unable to bump version based on changes.");
      process.exit(1);
    }
    config.newVersion = newVersion;
  }

  // Generate markdown
  const markdown = await generateMarkDown(commits, config);

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
      await execa("git", ["add", ...filesToAdd], { cwd });
      await execa(
        "git",
        ["commit", "-m", `chore(release): v${config.newVersion}`],
        { cwd }
      );
    }
    if (args.tag !== false) {
      await execa(
        "git",
        ["tag", "-am", "v" + config.newVersion, "v" + config.newVersion],
        { cwd }
      );
    }
  }
}

async function syncMain(args: mri.Argv) {
  const repo = args._[1];
  let versions = (args._[2] || "")
    .split(",")
    .map((i) => i.trim())
    .filter(Boolean);

  if (!repo || versions.length === 0) {
    throw new Error("Usage: changelogen sync <repo> <versions>");
  }

  if (!process.env.CHANGELOGEN_GH_TOKEN) {
    throw new Error("No CHANGELOGEN_GH_TOKEN env var set!");
  }

  const config: GithubOptions = {
    repo,
    token: process.env.CHANGELOGEN_GH_TOKEN as string,
  };

  const changelogMd = await getChangelogMd(config);
  const changelogReleases = parseChangelogMd(changelogMd).releases;

  if (versions.length === 1 && versions[0] === "all") {
    versions = changelogReleases.map((r) => r.version).sort();
    // const ghReleases = await listReleases(config);
    // versions.splice(0, versions.length, ...ghReleases.map((r) => r.tag_name.replace(/^v/, '')).sort());
  }

  for (const version of versions) {
    await syncGithubRelease(version);
  }

  async function syncGithubRelease(version: string) {
    console.log("Syncing release", version);

    const changelogRelease = changelogReleases.find(
      (r) => r.version === version
    );
    if (!changelogRelease) {
      console.log("No release found in changelog!");
      return;
    }

    const ghRelease = await getReleaseByTag(config, `v${version}`).catch(
      () => {}
    );

    const release: GithubRelease = {
      tag_name: `v${version}`,
      name: `v${version}`,
      body: changelogRelease.body,
    };

    if (ghRelease) {
      console.log("Updating existing release...");
      await updateRelease(config, ghRelease.id, release);
    } else {
      console.log("Creating release...");
      await createRelease(config, release);
    }
  }
}

main().catch(consola.error);
