import { promises as fsp } from "node:fs";
import type { Argv } from "mri";
import { resolve } from "pathe";
import consola from "consola";
import { underline, cyan } from "colorette";
import open from "open";
import { Package } from "@manypkg/get-packages";
import {
  getGithubChangelog,
  resolveGithubToken,
  syncGithubRelease,
} from "../github";
import {
  ChangelogConfig,
  loadChangelogConfig,
  parseChangelogMarkdown,
} from "..";
import { getChangelogPath } from "../changelog";
import { getSubPackages } from "../monorepo";

export default async function githubMain(args: Argv) {
  const cwd = resolve(args.dir || "");
  process.chdir(cwd);

  const [subCommand, ..._versions] = args._;
  if (subCommand !== "release") {
    consola.log(
      "Usage: changelogen gh release [all|versions...] [--dir] [--token]"
    );
    process.exit(1);
  }

  const config = await loadChangelogConfig(cwd, {});

  if (config.repo?.provider !== "github") {
    consola.error(
      "This command is only supported for github repository provider."
    );
    process.exit(1);
  }

  if (args.token) {
    config.tokens.github = args.token;
  }

  if (config.monorepo) {
    const packages = await getSubPackages(config);
    for (const pkg of packages) {
      consola.info(`Release ${pkg.packageJson.name} changelog`);

      const changelogMd = await getChangelogMd(config, pkg);
      if (!changelogMd) {
        consola.error(`Cannot resolve CHANGELOG.md`);
        continue;
      }

      const changelogReleases = parseChangelogMarkdown(changelogMd).releases;

      const versions = getVersions(config, _versions, changelogReleases);
      if (versions.length === 0) {
        consola.error(`No versions specified to release!`);
        continue;
      }

      await execRelease(config, versions, changelogReleases, pkg);
    }
  } else {
    const changelogMd = await getChangelogMd(config);
    if (!changelogMd) {
      consola.error(`Cannot resolve CHANGELOG.md`);
      process.exit(1);
    }

    const changelogReleases = parseChangelogMarkdown(changelogMd).releases;

    const versions = getVersions(config, _versions, changelogReleases);
    if (versions.length === 0) {
      consola.error(`No versions specified to release!`);
      process.exit(1);
    }

    await execRelease(config, versions, changelogReleases);
  }
}

export async function githubRelease(
  config: ChangelogConfig,
  release: { version: string; body: string },
  pkg?: Package
) {
  if (!config.tokens.github) {
    config.tokens.github = await resolveGithubToken(config).catch(
      () => undefined
    );
  }
  const result = await syncGithubRelease(config, release, pkg);
  if (result.status === "manual") {
    if (result.error) {
      consola.error(result.error);
      process.exitCode = 1;
    }
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

async function getChangelogMd(config: ChangelogConfig, pkg?: Package) {
  let changelogMd: string;
  if (typeof config.output === "string") {
    changelogMd = await fsp
      .readFile(getChangelogPath(config, pkg), "utf8")
      .catch(() => null);
  }
  if (!changelogMd) {
    changelogMd = await getGithubChangelog(config, pkg).catch(() => null);
  }

  return changelogMd;
}

function getVersions(
  config: ChangelogConfig,
  _versions: string[],
  changelogReleases: ReturnType<typeof parseChangelogMarkdown>["releases"]
) {
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
  return versions;
}

async function execRelease(
  config: ChangelogConfig,
  versions: string[],
  changelogReleases: ReturnType<typeof parseChangelogMarkdown>["releases"],
  pkg?: Package
) {
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
    await githubRelease(
      config,
      {
        version: release.version,
        body: release.body,
      },
      pkg
    );
  }
}
