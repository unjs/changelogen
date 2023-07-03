import { resolve } from "pathe";
import { readPackageJSON, writePackageJSON } from "pkg-types";
import { ChangelogConfig } from "./config";

export async function usePkg(config: ChangelogConfig) {
  const pkgPath = resolve(config.cwd, "package.json");
  const pkg = await readPackageJSON(pkgPath);

  return {
    pkg,
    writePkg: () => writePackageJSON(pkgPath, pkg),
  };
}
