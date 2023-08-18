import { ChangelogConfig } from "./config";

function format(template: string, vars: Record<string, string>) {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(key, value);
  }
  return result;
}

export function getCommitMessage(config: ChangelogConfig) {
  return format(config.templates.commitMessage, {
    "{{newVersion}}": config.newVersion,
  });
}

export function getTagMessage(config: ChangelogConfig) {
  return format(config.templates.tagMessage, {
    "{{newVersion}}": config.newVersion,
  });
}

export function getTagBody(config: ChangelogConfig) {
  return format(config.templates.tagBody, {
    "{{newVersion}}": config.newVersion,
  });
}

export function getTagMessagePattern(config: ChangelogConfig) {
  return format(config.templates.tagMessage, {
    "{{newVersion}}": "*",
  });
}
