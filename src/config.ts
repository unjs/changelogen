import { defu } from "defu";
import { loadConfig, setupDotenv } from "c12";
import { getLastGitTag, getCurrentGitRef } from "./git";
import { resolveRepoConfig, RepoProvider } from "./repo";
import type { SemverBumpType } from "./semver";
import type { RepoConfig } from "./repo";
import type { MonorepoConfig } from "./monorepo";
import type { GitCommitConfig } from "./git-commit";
import type { GitTagConfig } from "./git-tag";

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
  commit: GitCommitConfig;
  tag: GitTagConfig;
  monorepo?: MonorepoConfig | boolean;
}

const DEFAULT_GIT_COMMIT_CONFIG = {
  commit: {
    message: "chore(release): v%NEW_VERSION%",
  },
  tag: {
    message: "v%NEW_VERSION%",
    body: "v%NEW_VERSION%",
  },
  output: "CHANGELOG.md",
};

const DEFAULT_MONOREPO_GIT_COMMIT_CONFIG = {
  commit: {
    message: "chore(release): %PACKAGE_NAME% v%NEW_VERSION%",
  },
  tag: {
    message: "%PACKAGE_NAME%@%NEW_VERSION%",
    body: "%PACKAGE_NAME% v%NEW_VERSION%",
  },
  output: "%PACKAGE_DIR%/CHANGELOG.md",
};

const getDefaultConfig = () =>
  ({
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
    scopeMap: {},
    tokens: {
      github:
        process.env.CHANGELOGEN_TOKENS_GITHUB ||
        process.env.GITHUB_TOKEN ||
        process.env.GH_TOKEN,
    },
    monorepo: false,
  } as any as ChangelogConfig);

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

  if (config.monorepo) {
    Object.assign(config, defu(config, DEFAULT_MONOREPO_GIT_COMMIT_CONFIG));
  } else {
    Object.assign(config, defu(config, DEFAULT_GIT_COMMIT_CONFIG));
  }

  if (!config.from && !config.monorepo) {
    config.from = await getLastGitTag();
  }

  if (!config.to) {
    config.to = await getCurrentGitRef();
  }

  if (!config.output) {
    config.output = false;
  } else if (config.output) {
    config.output = config.output === true ? defaults.output : config.output;
  }

  if (!config.repo) {
    config.repo = await resolveRepoConfig(cwd);
  }

  return config;
}
