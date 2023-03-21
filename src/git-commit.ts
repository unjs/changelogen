import { resolve } from "node:path";
import { Package } from "@manypkg/get-packages";
import { ChangelogConfig } from "./config";
import { format, getTemplateParams } from "./utils/template";
import { getChangelogPath } from "./changelog";

export interface GitCommitConfig {
  message: string;
}

export function getCommitMessage(
  config: ChangelogConfig,
  pkg?: Package
): string {
  return format(config.commit.message, getTemplateParams(config, pkg));
}

export function getCommitFiles(config: ChangelogConfig, pkg?: Package) {
  const changelogPath = getChangelogPath(config, pkg);
  const packagePath = resolve(pkg?.dir ?? config.cwd, "package.json");

  return [changelogPath, packagePath].filter((f) => f && typeof f === "string");
}
