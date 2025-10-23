import { execSync } from "node:child_process";

export function execCommand(cmd: string, cwd?: string) {
  return execSync(cmd, { encoding: "utf8", cwd, maxBuffer: 10 * 1024 * 1024 /* 10 Mb */ }).trim();
}
