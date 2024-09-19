import { execSync } from "node:child_process";

export function execCommand(cmd: string, args: string[]) {
  return execSync(`${cmd} ${args.join(" ")}`, { encoding: "utf8" });
}
