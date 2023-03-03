import type { Argv } from "mri";
import { resolve } from "pathe";
import consola from "consola";
import { underline, cyan } from "colorette";
import {
  getGithubChangelog,
  syncGithubRelease,
  githubNewReleaseURL,
} from "../github";
import { loadChangelogConfig, parseChangelogMarkdown } from "..";

export default async function githubMain(args: Argv) {
  const cwd = resolve(args.dir || "");
  process.chdir(cwd);
  consola.wrapConsole();

  const [action, ..._versions] = args._;
  if (!action || _versions.length === 0) {
    throw new Error("Usage: changelogen github sync <versions...>");
  }

  let versions = [..._versions].map((v) => v.replace(/^v/, ""));

  const config = await loadChangelogConfig(cwd, {});

  if (config.repo?.provider !== "github") {
    consola.error("Sync is only supported for Github repos.");
    process.exit(1);
  }

  const changelogMd = await getGithubChangelog(config);
  const changelogReleases = parseChangelogMarkdown(changelogMd).releases;

  if (versions.length === 1 && versions[0] === "all") {
    versions = changelogReleases.map((r) => r.version).sort();
  }

  for (const version of versions) {
    const release = changelogReleases.find((r) => r.version === version);
    if (!release) {
      consola.warn(
        `No matching changelog entry found for ${version} in CHANGELOG.md`
      );
      continue;
    }
    try {
      await syncGithubRelease(config, {
        version,
        body: release.body,
      });
    } catch {
      const releaseURL = githubNewReleaseURL(
        config,
        release as { version: string; body: string }
      );
      consola.warn(
        `Failed to sync ${cyan(
          `v${version}`
        )} to Github releases! Open this link to manually create a release: \n\n` +
          underline(cyan(releaseURL)) +
          "\n"
      );
      process.exit(1);
    }
  }
}
