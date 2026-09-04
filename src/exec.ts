import { execSync, spawn } from "node:child_process";
import { isMacOS, isWindows } from "std-env";

export function execCommand(cmd: string, cwd?: string) {
  return execSync(cmd, { encoding: "utf8", cwd }).trim();
}

/**
 * Open an url with the OS default handler (browser).
 *
 * Resolves once the launcher is spawned and rejects if it cannot be started.
 */
export function openURL(url: string): Promise<void> {
  let cmd = "xdg-open";
  let args = [url];
  if (isWindows) {
    cmd = "cmd";
    args = ["/c", "start", '""', url.replace(/&/g, "^&")];
  } else if (isMacOS) {
    cmd = "open";
  }

  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: "ignore",
      detached: !isWindows,
      windowsHide: true,
    });
    child.on("error", reject);
    child.on("spawn", () => {
      child.off("error", reject);
      child.unref();
      resolve();
    });
  });
}
