import { isCI, provider } from "std-env";

import { ChangelogConfig } from "./config";
import { execCommand } from "./exec";

export async function publishNpmPackage(config: ChangelogConfig) {
  const args = ["publish"];

  if (config.edge && (!config.edgePackage || config.edgeTag)) {
    args.push("--tag", config.edgeTag ?? "edge");
  }

  if (
    isCI &&
    provider === "github_actions" &&
    process.env.NPM_CONFIG_PROVENANCE !== "false"
  ) {
    args.push("--provenance");
  }

  return await execCommand("npm", args);
}
