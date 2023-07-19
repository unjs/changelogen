import { promises as fsp } from "node:fs";
import { resolve } from "pathe";
import consola from "consola";
import { readPackageJSON as _readPackageJSON } from "pkg-types";
import { isCI, provider } from "std-env";
import { modify, applyEdits } from "jsonc-parser";
import type { ChangelogConfig } from "./config";
import { execCommand } from "./exec";

export function readPackageJSON(config: ChangelogConfig) {
  const path = resolve(config.cwd, "package.json");
  return _readPackageJSON(path);
}

async function updatePackageFile(cwd: string, prop: string, value: any) {
  const path = resolve(cwd, "package.json");
  const blob = await fsp.readFile(path, "utf8");
  await fsp.writeFile(path, applyEdits(blob, modify(blob, [prop], value, {})));
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
  await updatePackageFile(config.cwd, "name", pkg.name);
}

export async function updatePackageVersion(
  config: ChangelogConfig,
  newVersion: string
) {
  await updatePackageFile(config.cwd, "version", newVersion);
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
