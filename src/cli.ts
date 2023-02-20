#!/usr/bin/env node
import { resolve } from "node:path";
import { existsSync, promises as fsp } from "node:fs";
import consola from "consola";
import mri from "mri";
import { execa } from "execa";
import { getGitDiff, parseCommits, filterCommits } from "./git";
import { loadChangelogConfig } from "./config";
import { generateMarkDown } from "./markdown";
import { bumpVersion } from "./semver";

async function main() {
  const args = mri(process.argv.splice(2));
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
  const commits = parseCommits(rawCommits, config);
  const filteredCommits = filterCommits(commits, config);

  // Bump version optionally
  if (args.bump || args.release) {
    const newVersion = await bumpVersion(filteredCommits, config);
    if (!newVersion) {
      consola.error("Unable to bump version based on changes.");
      process.exit(1);
    }
    config.newVersion = newVersion;
  }

  // Generate markdown
  const markdown = await generateMarkDown(filteredCommits, config);

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
      await execa("git", ["add", "CHANGELOG.md", "package.json"], { cwd });
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

main().catch(consola.error);
