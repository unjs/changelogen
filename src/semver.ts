import semver from "semver";
import consola from "consola";
import type { ChangelogConfig } from "./config";
import type { GitCommit } from "./git";
import { readPackageJSON, writePackageJSON } from "./package";

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
): Promise<string | false> {
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
    pkg.version = semver.inc(currentVersion, type, opts.preid);
    config.newVersion = pkg.version;
  }

  if (opts.suffix) {
    const suffix =
      typeof opts.suffix === "string"
        ? `-${opts.suffix}`
        : `+${fmtDate(new Date())}-${commits[0].shortHash}`;
    pkg.version = config.newVersion = config.newVersion.split("-")[0] + suffix;
  }

  if (pkg.version === currentVersion) {
    return false;
  }

  consola.info(
    `Bumping npm package version from \`${currentVersion}\` to \`${pkg.version}\` (${originalType})`
  );

  await writePackageJSON(config, pkg);

  return pkg.version;
}

function fmtDate(d: Date): string {
  // YYMMDD-HHMMSS: 2024819-135530
  const date = joinNumbers([d.getFullYear(), d.getMonth() + 1, d.getDate()]);
  const time = joinNumbers([d.getHours(), d.getMinutes(), d.getSeconds()]);
  return `${date}-${time}`;
}

function joinNumbers(items: number[]): string {
  return items.map((i) => (i + "").padStart(2, "0")).join("");
}
