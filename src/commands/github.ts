import consola from "consola";
import type { Argv } from "mri";
import { resolve } from "pathe";
import {
  loadChangelogConfig
} from "..";
import { pullRequest } from "./github/pull-request";
import { release } from "./github/release";

const availableCommands = new Set(["release", "pull-request"]);

export default async function githubMain(args: Argv) {
  const cwd = resolve(args.dir || "");
  process.chdir(cwd);

  const [subCommand, ..._versions] = args._;
  if (!availableCommands.has(subCommand)) {
    consola.log(
      "Usage: changelogen gh release [all|versions...] [--dir] [--token]"
    );
    process.exit(1);
  }

  const config = await loadChangelogConfig(cwd, {});

  if (config.repo?.provider !== "github") {
    consola.error(
      "These command are only supported for github repository provider."
    );
    process.exit(1);
  }

  if (args.token) {
    config.tokens.github = args.token;
  }

  if (subCommand === "release") {
    await release(args, config);
  } else if (subCommand === "pull-request") {
    await pullRequest(args, config);
  }
}
