import { resolve } from "node:path";
import semver from "semver";
import consola from "consola";
import { readPackageJSON, writePackageJSON } from "pkg-types";
import type { ChangelogConfig } from "./config";
import type { GitCommit } from "./git";
import { usePkg } from "./pkg";

export type SemverBumpType =
  | "major"
  | "premajor"
  | "minor"
  | "preminor"
  | "patch"
  | "prepatch"
  | "prerelease";

export function determineSemverChange(
  commits: GitCommit[],
  config: ChangelogConfig
): SemverBumpType | null {
  let [hasMajor, hasMinor, hasPatch] = [false, false, false];
  for (const commit of commits) {
    const semverType = config.types[commit.type]?.semver;
    if (semverType === "major" || commit.isBreaking) {
      hasMajor = true;
    } else if (semverType === "minor") {
      hasMinor = true;
    } else if (semverType === "patch") {
      hasPatch = true;
    }
  }

  // eslint-disable-next-line unicorn/no-nested-ternary
  return hasMajor ? "major" : hasMinor ? "minor" : hasPatch ? "patch" : null;
}

export type BumpVersionOptions = {
  type?: SemverBumpType;
  preid?: string;
};

export async function bumpVersion(
  commits: GitCommit[],
  config: ChangelogConfig,
  opts: BumpVersionOptions = {}
): Promise<string | false> {
  let type = opts.type || determineSemverChange(commits, config) || "patch";
  const originalType = type;

  const { pkg, writePkg } = await usePkg(config);
  const currentVersion = pkg.version || "0.0.0";

  if (currentVersion.startsWith("0.")) {
    if (type === "major") {
      type = "minor";
    } else if (type === "minor") {
      type = "patch";
    }
  }

  if (config.newVersion) {
    pkg.version = config.newVersion;
  } else if (config.edge) {
    const date = Math.round(Date.now() / (1000 * 60));
    const hash = commits[0].shortHash;
    // eslint-disable-next-line import/no-named-as-default-member
    const nextVersion = semver.inc(currentVersion, type, opts.preid);
    pkg.version = `${nextVersion}-${date}.${hash}`;
    config.newVersion = pkg.version;
  } else if (type) {
    // eslint-disable-next-line import/no-named-as-default-member
    pkg.version = semver.inc(currentVersion, type, opts.preid);
    config.newVersion = pkg.version;
  }

  if (pkg.version === currentVersion) {
    return false;
  }

  consola.info(
    `Bumping version from ${currentVersion} to ${pkg.version} (${originalType})`
  );
  await writePkg();

  return pkg.version;
}

export async function updatePackageName(
  config: ChangelogConfig
): Promise<string | false> {
  if (!config.edge || !config.edgePackage) {
    return false;
  }

  const { pkg, writePkg } = await usePkg(config);
  consola.info(
    `Updating package name from ${pkg.name} to ${config.edgePackage} for edge release`
  );
  pkg.name = config.edgePackage;
  await writePkg();

  return pkg.name;
}
