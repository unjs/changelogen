import { Argv } from "mri";
import consola from "consola";
import { ChangelogConfig } from "../../config";
import { getGitDiff, parseCommits } from "../../git";
import { bumpVersion } from "../../semver";
import { generateMarkDown } from "../../markdown";

/**
 * This command will:
 * - Get the new version
 * - Create a new issue with the changelog
 */
export async function issue(args: Argv, config: ChangelogConfig) {
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
  // TODO: create a new function to only get the new version (using semver.inc without bumping package.json)
  const newVersion = await bumpVersion(commits, config, bumpOptions);
  if (!newVersion) {
    consola.error("Unable to bump version based on changes.");
    process.exit(1);
  }
  config.newVersion = newVersion;

  // Generate changelog
  // TODO: Add a template for the markdown issue body
  const markdown = await generateMarkDown(commits, config);

  const [currentIssue] = await getGithubIssue(config);

  if (currentIssue) {
    await updateGithubIssue(config, currentIssue, markdown);
  }

  // TODO: Add a type for the issue body
  const body = {}

  await createGithubIssue(config, body);
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
