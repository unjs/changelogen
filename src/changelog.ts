import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { Package } from "@manypkg/get-packages";
import consola from "consola";
import { ChangelogConfig } from "./config";
import { format, getTemplateParams } from "./utils/template";

const lastEntryRE = /^###?\s+.*$/m;

export async function writeChangelog(
  config: ChangelogConfig,
  markdown: string,
  pkg?: Package
) {
  const targetPath = getChangelogPath(config, pkg);
  if (!targetPath) {
    return;
  }
  const shortPath = targetPath.replace(process.cwd(), "");
  let content: string;

  if (existsSync(targetPath)) {
    consola.info(`Updating ${shortPath}`);
    content = await readFile(targetPath, "utf8");
  } else {
    consola.info(`Creating ${shortPath}`);
    content = "# Changelog\n\n";
  }

  const lastEntry = content.match(lastEntryRE);

  if (lastEntry) {
    content =
      content.slice(0, lastEntry.index) +
      markdown +
      "\n\n" +
      content.slice(lastEntry.index);
  } else {
    content += "\n" + markdown + "\n\n";
  }

  await writeFile(targetPath, content);
}

export function getChangelogPath(config: ChangelogConfig, pkg?: Package) {
  if (config.output === false) {
    return;
  }

  const rawPath = format(
    config.output as string,
    getTemplateParams(config, pkg)
  );
  return resolve(rawPath);
}
