import { promises as fsp } from "node:fs";
import consola from "consola";
import type { Argv } from "mri";
import { resolve } from "pathe";
import { underline, cyan } from "colorette";
import { getGithubChangelog, resolveGithubToken, syncGithubRelease } from "../../github";
import { ChangelogConfig } from "../../config";
import { parseChangelogMarkdown } from "../../markdown";

export async function release(args: Argv, config: ChangelogConfig) {
  const [_, ..._versions] = args._;

  let changelogMd: string;
  if (typeof config.output === "string") {
    changelogMd = await fsp
      .readFile(resolve(config.output), "utf8")
      .catch(() => null);
  }
  if (!changelogMd) {
    changelogMd = await getGithubChangelog(config).catch(() => null);
  }
  if (!changelogMd) {
    consola.error(`Cannot resolve CHANGELOG.md`);
    process.exit(1);
  }

  const changelogReleases = parseChangelogMarkdown(changelogMd).releases;

  let versions = [..._versions].map((v) => v.replace(/^v/, ""));
  if (versions[0] === "all") {
    versions = changelogReleases.map((r) => r.version).sort();
  } else if (versions.length === 0) {
    if (config.newVersion) {
      versions = [config.newVersion];
    } else if (changelogReleases.length > 0) {
      versions = [changelogReleases[0].version];
    }
  }

  if (versions.length === 0) {
    consola.error(`No versions specified to release!`);
    process.exit(1);
  }

  for (const version of versions) {
    const release = changelogReleases.find((r) => r.version === version);
    if (!release) {
      consola.warn(
        `No matching changelog entry found for ${version} in CHANGELOG.md. Skipping!`
      );
      continue;
    }
    if (!release.body || !release.version) {
      consola.warn(
        `Changelog entry for ${version} in CHANGELOG.md is missing body or version. Skipping!`
      );
      continue;
    }
    await githubRelease(config, {
      version: release.version,
      body: release.body,
    });
  }
}

// Why not create a utility in ./src/github.ts?
export async function githubRelease(
  config: ChangelogConfig,
  release: { version: string; body: string }
) {
  if (!config.tokens.github) {
    config.tokens.github = await resolveGithubToken(config).catch(
      () => undefined
    );
  }
  const result = await syncGithubRelease(config, release);
  if (result.status === "manual") {
    if (result.error) {
      consola.error(result.error);
      process.exitCode = 1;
    }
    const open = await import("open").then((r) => r.default);
    await open(result.url)
      .then(() => {
        consola.info(`Followup in the browser to manually create the release.`);
      })
      .catch(() => {
        consola.info(
          `Open this link to manually create a release: \n` +
            underline(cyan(result.url)) +
            "\n"
        );
      });
  } else {
    consola.success(
      `Synced ${cyan(`v${release.version}`)} to Github releases!`
    );
  }
}
