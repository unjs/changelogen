import semver from "semver";
import consola from "consola";
import type { ChangelogConfig } from "./config";
import type { GitCommit } from "./git";
import {
  existsPackageLockJSON,
  readPackageJSON,
  readPackageLockJSON,
  writePackageJSON,
  writePackageLockJSON,
} from "./package";

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
  suffix?: boolean;
};

export async function bumpVersion(
  commits: GitCommit[],
  config: ChangelogConfig,
  opts: BumpVersionOptions = {}
): Promise<{ newVersion: string; changedFiles: string[] } | undefined> {
  let type = opts.type || determineSemverChange(commits, config) || "patch";
  const originalType = type;

  const pkg = await readPackageJSON(config);
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
  } else if (type || opts.preid) {
    // eslint-disable-next-line import/no-named-as-default-member
    pkg.version = semver.inc(currentVersion, type, opts.preid);
    config.newVersion = pkg.version;
  }

  if (opts.suffix) {
    const suffix =
      typeof opts.suffix === "string"
        ? `-${opts.suffix}`
        : `-${Math.round(Date.now() / 1000)}.${commits[0].shortHash}`;
    pkg.version = config.newVersion = config.newVersion.split("-")[0] + suffix;
  }

  if (pkg.version === currentVersion) {
    return undefined;
  }

  consola.info(
    `Bumping npm package version from \`${currentVersion}\` to \`${pkg.version}\` (${originalType})`
  );

  await writePackageJSON(config, pkg);
  const changedFiles = ["package.json"];

  for (const file of ["package-lock.json", "npm-shrinkwrap.json"] as const) {
    if (await existsPackageLockJSON(config, file)) {
      const pkgLock = await readPackageLockJSON(config, file);
      pkgLock.version = pkg.version;

      if (pkgLock.packages && pkgLock.packages[""]) {
        pkgLock.packages[""].version = pkg.version;
      }

      await writePackageLockJSON(config, pkgLock, file);
      changedFiles.push(file);
    }
  }

  return { newVersion: pkg.version, changedFiles };
}
