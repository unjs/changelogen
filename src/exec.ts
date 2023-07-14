import type { Options } from "execa";

export async function execCommand(
  cmd: string,
  args: string[],
  options?: Options<string>
) {
  const { execa } = await import("execa");
  const res = await execa(cmd, args, options);
  return res.stdout;
}
