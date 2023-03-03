import { promises as fsp } from "node:fs";
import type { Argv } from "mri";
import { resolve } from "pathe";
import consola from "consola";
import { underline, cyan } from "colorette";
import open from "open";
import { getGithubChangelog, syncGithubRelease } from "../github";
import { loadChangelogConfig, parseChangelogMarkdown } from "..";

export default async function githubMain(args: Argv) {
  const cwd = resolve(args.dir || "");
  process.chdir(cwd);

  const [action, ..._versions] = args._;
  if (action !== "release" || _versions.length === 0) {
    consola.log(
      "Usage: changelogen gh release <versions|all> [--dir] [--token]"
    );
    process.exit(1);
  }

  let versions = [..._versions].map((v) => v.replace(/^v/, ""));

  const config = await loadChangelogConfig(cwd, {});

  if (config.repo?.provider !== "github") {
    consola.error(
      "This command is only supported for github repository provider."
    );
    process.exit(1);
  }

  if (args.token) {
    config.token.github = args.token;
  }

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

  if (versions.length === 1 && versions[0] === "all") {
    versions = changelogReleases.map((r) => r.version).sort();
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

    const result = await syncGithubRelease(config, {
      version,
      body: release.body,
    });

    if (result.status === "manual") {
      if (result.error) {
        consola.error(result.error);
        process.exitCode = 1;
      }
      await open(result.url)
        .then(() => {
          consola.info(
            `Followup in the browser to manually create the release.`
          );
        })
        .catch(() => {
          consola.info(
            `Open this link to manually create a release: \n` +
              underline(cyan(result.url)) +
              "\n"
          );
        });
    } else {
      consola.success(`Synced ${cyan(`v${version}`)} to Github releases!`);
    }
  }
}
