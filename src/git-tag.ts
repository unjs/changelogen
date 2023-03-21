import { Package } from "@manypkg/get-packages";
import { ChangelogConfig } from "./config";
import { format, getTemplateParams } from "./utils/template";

export interface GitTagConfig {
  message: string;
  body: string;
}

export function getTagMessage(config: ChangelogConfig, pkg?: Package): string {
  return format(config.tag.message, getTemplateParams(config, pkg));
}

export function getTagMessageWithAnyVersion(
  config: ChangelogConfig,
  pkg?: Package
) {
  return format(config.tag.message, {
    ...getTemplateParams(config, pkg),
    NEW_VERSION: "*",
  });
}

export function getTagBody(config: ChangelogConfig, pkg?: Package) {
  return format(config.tag.body, getTemplateParams(config, pkg));
}
