#!/usr/bin/env node
import consola from "consola";
import mri from "mri";

const subCommands = {
  _default: () => import("./commands/default"),
  gh: () => import("./commands/github"),
  github: () => import("./commands/github"),
};

async function main() {
  let subCommand = process.argv[2];

  if (!subCommand || subCommand.startsWith("-")) {
    subCommand = "_default";
  }

  if (!(subCommand in subCommands)) {
    consola.error(`Unknown command ${subCommand}`);
    process.exit(1);
  }

  consola.log(subCommand);

  await subCommands[subCommand]().then((r) =>
    r.default(mri(process.argv.splice(3)))
  );
}

main().catch(consola.error);
