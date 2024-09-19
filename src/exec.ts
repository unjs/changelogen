import {
  execSync,
  type ExecOptionsWithStringEncoding,
} from "node:child_process";

export function execCommand(
  cmd: string,
  args: string[],
  opts?: Omit<ExecOptionsWithStringEncoding, "encoding">
) {
  return execSync(`${cmd} ${args.join(" ")}`, { encoding: "utf8", ...opts });
}
