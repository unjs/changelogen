import { promises as fsp } from "node:fs";
import { resolve } from "node:path";
import semver from "semver";
import consola from "consola";
import type { ChangelogConfig } from "./config";
import type { GitCommit } from "./git";

export type SemverBumpType = "major" | "minor" | "patch";

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

export async function bumpVersion(
  commits: GitCommit[],
  config: ChangelogConfig,
  opts: { type?: SemverBumpType } = {}
): Promise<string | false> {
  let type = opts.type || determineSemverChange(commits, config) || "patch";
  const originalType = type;

  const pkgPath = resolve(config.cwd, "package.json");
  const pkg =
    JSON.parse(await fsp.readFile(pkgPath, "utf8").catch(() => "{}")) || {};
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
  } else if (type) {
    // eslint-disable-next-line import/no-named-as-default-member
    pkg.version = semver.inc(currentVersion, type);
    config.newVersion = pkg.version;
  }

  if (pkg.version === currentVersion) {
    return false;
  }

  consola.info(
    `Bumping version from ${currentVersion} to ${pkg.version} (${originalType})`
  );
  await fsp.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");

  return pkg.version;
}
