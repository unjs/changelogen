import { constants, promises as fsp } from "node:fs";

import { resolve } from "pathe";
import consola from "consola";
import {
  PackageJson,
  readPackageJSON as _readPackageJSON,
  writePackageJSON as _writePackageJSON,
} from "pkg-types";
import { isCI, provider } from "std-env";
import { parseJSON, stringifyJSON } from "confbox";

import type { ChangelogConfig } from "./config";

import { execCommand } from "./exec";

export function readPackageJSON(config: ChangelogConfig) {
  const path = resolve(config.cwd, "package.json");
  return _readPackageJSON(path);
}

export function writePackageJSON(config: ChangelogConfig, pkg: PackageJson) {
  const path = resolve(config.cwd, "package.json");
  return _writePackageJSON(path, pkg);
}

export async function renamePackage(config: ChangelogConfig, newName: string) {
  const pkg = await readPackageJSON(config);
  if (newName.startsWith("-")) {
    if (pkg.name.endsWith(newName)) {
      return;
    }
    newName = pkg.name + newName;
  }
  consola.info(`Renaming npm package from \`${pkg.name}\` to \`${newName}\``);
  pkg.name = newName;
  await writePackageJSON(config, pkg);
}

export async function npmPublish(config: ChangelogConfig) {
  const pkg = await readPackageJSON(config);

  const args = [...config.publish.args];

  if (!config.publish.private && !pkg.private) {
    args.push("--access", "public");
  }

  if (config.publish.tag) {
    args.push("--tag", config.publish.tag);
  }

  if (
    isCI &&
    provider === "github_actions" &&
    process.env.NPM_CONFIG_PROVENANCE !== "false"
  ) {
    args.push("--provenance");
  }

  return await execCommand("npm", ["publish", ...args]);
}

export async function existsPackageLockJSON(
  config: ChangelogConfig,
  file: "package-lock.json" | "npm-shrinkwrap.json"
) {
  const path = resolve(config.cwd, file);
  try {
    await fsp.access(path, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

export async function readPackageLockJSON(
  config: ChangelogConfig,
  file: "package-lock.json" | "npm-shrinkwrap.json"
) {
  const path = resolve(config.cwd, file);
  const blob = await fsp.readFile(path, "utf8");
  return parseJSON<any>(blob);
}

export function writePackageLockJSON(
  config: ChangelogConfig,
  pkg: Record<string, any>,
  file: "package-lock.json" | "npm-shrinkwrap.json"
) {
  const path = resolve(config.cwd, file);
  return fsp.writeFile(path, stringifyJSON(pkg));
}
