import { ChangelogConfig } from "./config";
import { execCommand } from "./exec";

export async function publishNpmPackage(config: ChangelogConfig) {
  const args = ["publish"];

  if (config.edge && (!config.edgePackage || config.edgeTag)) {
    args.push("--tag", config.edgeTag ?? "edge");
  }

  return await execCommand("npm", args);
}
