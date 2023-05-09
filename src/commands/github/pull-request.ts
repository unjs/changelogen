import { execa } from "execa";
import { Argv } from "mri";
import consola from "consola";
import { ChangelogConfig } from "../../config";
import { BumpVersionOptions, bumpVersion } from "../../semver";
import { getGitDiff, parseCommits } from "../../git";
import { generateMarkDown } from "../../markdown";
import { createGithubPullRequest, getGithubPullRequest, updateGithubPullRequest } from "../../github";

/**
 * This command will:
 * - Bump version
 * - Create a new branch
 * - Commit the new version
 * - Push the new branch
 * - Create a pull request with changelog
 */
export async function pullRequest(args: Argv, config: ChangelogConfig) {
  const filesToAdd = ["package.json"];

  // Get raw commits from the last release
  const rawCommits = await getGitDiff(config.from, config.to);

  // Parse commits as conventional commits in order to get the new version
  const commits = parseCommits(rawCommits, config).filter(
    (c) =>
      config.types[c.type] &&
      !(c.type === "chore" && c.scope === "deps" && !c.isBreaking)
  );

  // Get the new version
  const bumpOptions = _getBumpVersionOptions(args);
  const newVersion = await bumpVersion(commits, config, bumpOptions);
  if (!newVersion) {
    consola.error("Unable to bump version based on changes.");
    process.exit(1);
  }
  config.newVersion = newVersion;

  // Create a new branch before committing
  await execa("git", ["checkout", "-b", "v" + config.newVersion], { cwd: config.cwd });

  // Add updated files to git
  await execa("git", ["add", ...filesToAdd], { cwd: config.cwd });
  // Commit the changes
  const msg = config.templates.commitMessage.replaceAll(
    "{{newVersion}}",
    config.newVersion
  );

  // TODO: Add a way to configure username and email

  await execa("git", ["commit", "-m", msg], { cwd: config.cwd });

  // Push branch and changes to remote
  // TODO: Add a way to configure remote (useful for forks in dev mode)
  await execa("git", ["push", "-u", "--force", "fork", "v" + config.newVersion], { cwd: config.cwd });

  // Generate changelog
  // TODO: Add a template for the markdown PR body
  const markdown = await generateMarkDown(commits, config);

  const [currentPR] = await getGithubPullRequest(config);

  if (currentPR) {
    await updateGithubPullRequest(config, currentPR.number, markdown);
  }

  // TODO: Add a type for the body
  const body = {
      title: 'v' + config.newVersion,
      head: 'v' + config.newVersion,
      base: 'main',
      body: markdown,
      draft: true,
  }

  await createGithubPullRequest(config, body);
}

// Duplicated from ./src/commands/default.ts. Can we create a shared function?
function _getBumpVersionOptions(args: Argv): BumpVersionOptions {
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
