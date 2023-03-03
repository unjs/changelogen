import { resolve } from "node:path";
import { loadConfig, setupDotenv } from "c12";
import { readPackageJSON } from "pkg-types";
import { getLastGitTag, getCurrentGitRef } from "./git";
import { getRepoConfig, RepoProvider } from "./repo";
import type { SemverBumpType } from "./semver";
import type { RepoConfig } from "./repo";

export interface ChangelogConfig {
  cwd: string;
  types: Record<string, { title: string; semver?: SemverBumpType }>;
  scopeMap: Record<string, string>;
  repo?: RepoConfig;
  tokens: Partial<Record<RepoProvider, string>>;
  from: string;
  to: string;
  newVersion?: string;
  output: string | boolean;
}

const getDefaultConfig = () =>
  <ChangelogConfig>{
    types: {
      feat: { title: "🚀 Enhancements", semver: "minor" },
      perf: { title: "🔥 Performance", semver: "patch" },
      fix: { title: "🩹 Fixes", semver: "patch" },
      refactor: { title: "💅 Refactors", semver: "patch" },
      docs: { title: "📖 Documentation", semver: "patch" },
      build: { title: "📦 Build", semver: "patch" },
      types: { title: "🌊 Types", semver: "patch" },
      chore: { title: "🏡 Chore" },
      examples: { title: "🏀 Examples" },
      test: { title: "✅ Tests" },
      style: { title: "🎨 Styles" },
      ci: { title: "🤖 CI" },
    },
    cwd: null,
    from: "",
    to: "",
    output: "CHANGELOG.md",
    scopeMap: {},
    tokens: {
      github:
        process.env.CHANGELOGEN_TOKENS_GITHUB ||
        process.env.GITHUB_TOKEN ||
        process.env.GH_TOKEN,
    },
  };

export async function loadChangelogConfig(
  cwd: string,
  overrides?: Partial<ChangelogConfig>
): Promise<ChangelogConfig> {
  await setupDotenv({ cwd });
  const defaults = getDefaultConfig();
  const { config } = await loadConfig<ChangelogConfig>({
    cwd,
    name: "changelog",
    defaults,
    overrides: {
      cwd,
      ...(overrides as ChangelogConfig),
    },
  });

  if (!config.from) {
    config.from = await getLastGitTag();
  }

  if (!config.to) {
    config.to = await getCurrentGitRef();
  }

  if (!config.output) {
    config.output = false;
  } else if (config.output) {
    config.output =
      config.output === true ? defaults.output : resolve(cwd, config.output);
  }

  if (!config.repo) {
    const pkg = await readPackageJSON(cwd).catch(() => {});
    if (pkg && pkg.repository) {
      const repoUrl =
        typeof pkg.repository === "string"
          ? pkg.repository
          : pkg.repository.url;
      config.repo = getRepoConfig(repoUrl);
    }
  }

  return config;
}
