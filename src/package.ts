import { resolve } from "pathe";
import consola from "consola";
import {
  PackageJson,
  readPackageJSON as _readPackageJSON,
  writePackageJSON as _writePackageJSON,
} from "pkg-types";
import { isCI, provider } from "std-env";
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

  return execCommand("npm", ["publish", ...args]);
}
