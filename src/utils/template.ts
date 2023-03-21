import { Package } from "@manypkg/get-packages";
import { ChangelogConfig } from "../config";

export type TemplateParamKeys = "NEW_VERSION" | "PACKAGE_NAME" | "PACKAGE_DIR";

export function format(
  template: string,
  params: Partial<Record<TemplateParamKeys, string>>
): string {
  let str = template;
  for (const [key, value] of Object.entries(params)) {
    str = str.replace(`%${key}%`, value);
  }
  return str;
}

export function getTemplateParams(
  config: ChangelogConfig,
  pkg?: Package
): Partial<Record<TemplateParamKeys, string>> {
  return {
    NEW_VERSION: config.newVersion ?? pkg?.packageJson.version,
    PACKAGE_NAME: pkg?.packageJson.name,
    PACKAGE_DIR: pkg?.dir,
  };
}
