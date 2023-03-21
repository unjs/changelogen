import { getPackages, Package } from "@manypkg/get-packages";
import { ChangelogConfig } from "./config";

export interface MonorepoConfig {
  filter?: string[];
  sort?: (pkg: Package) => number;
}

export async function getSubPackages(config: ChangelogConfig) {
  const { monorepo, cwd } = config;
  if (!monorepo) {
    return;
  }

  const pkgs = await getPackages(cwd);
  let result = pkgs.packages;

  result = result.filter((item) => item.packageJson.private !== true);

  if (typeof monorepo === "object" && monorepo != null) {
    if (monorepo.filter) {
      result = result.filter((item) =>
        monorepo.filter.includes(item.packageJson.name)
      );
    }
    if (monorepo.sort) {
      result.sort(monorepo.sort);
    }
  }

  return result;
}
