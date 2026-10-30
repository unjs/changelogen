import { execFileSync } from "node:child_process";
import { existsSync, promises as fsp } from "node:fs";
import { homedir } from "node:os";
import { join } from "pathe";
import { ResolvedChangelogConfig } from "./config";

export interface GithubOptions {
  repo: string;
  token: string;
}

export interface GithubRelease {
  id?: string;
  tag_name: string;
  name?: string;
  body?: string;
  draft?: boolean;
  prerelease?: boolean;
}

export async function listGithubReleases(
  config: ResolvedChangelogConfig
): Promise<GithubRelease[]> {
  return await githubFetch(config, `/repos/${config.repo.repo}/releases`, {
    query: { per_page: 100 },
  });
}

export async function getGithubReleaseByTag(
  config: ResolvedChangelogConfig,
  tag: string
): Promise<GithubRelease> {
  return await githubFetch(
    config,
    `/repos/${config.repo.repo}/releases/tags/${tag}`
  );
}

export async function getGithubChangelog(config: ResolvedChangelogConfig) {
  return await githubFetch(
    config,
    `https://raw.githubusercontent.com/${config.repo.repo}/main/CHANGELOG.md`
  );
}

export async function createGithubRelease(
  config: ResolvedChangelogConfig,
  body: GithubRelease
) {
  return await githubFetch(config, `/repos/${config.repo.repo}/releases`, {
    method: "POST",
    body,
  });
}

export async function updateGithubRelease(
  config: ResolvedChangelogConfig,
  id: string,
  body: GithubRelease
) {
  return await githubFetch(
    config,
    `/repos/${config.repo.repo}/releases/${id}`,
    {
      method: "PATCH",
      body,
    }
  );
}

export async function syncGithubRelease(
  config: ResolvedChangelogConfig,
  release: { version: string; body: string }
) {
  const currentGhRelease = await getGithubReleaseByTag(
    config,
    `v${release.version}`
  ).catch(() => {});

  const ghRelease: GithubRelease = {
    tag_name: `v${release.version}`,
    name: `v${release.version}`,
    body: release.body,
  };

  if (!config.tokens.github) {
    return {
      status: "manual",
      url: githubNewReleaseURL(config, release),
    };
  }

  try {
    const newGhRelease = await (currentGhRelease
      ? updateGithubRelease(config, currentGhRelease.id, ghRelease)
      : createGithubRelease(config, ghRelease));
    return {
      status: currentGhRelease ? "updated" : "created",
      id: newGhRelease.id,
    };
  } catch (error) {
    return {
      status: "manual",
      error,
      url: githubNewReleaseURL(config, release),
    };
  }
}

export function githubNewReleaseURL(
  config: ResolvedChangelogConfig,
  release: { version: string; body: string }
) {
  return `https://${config.repo.domain}/${config.repo.repo}/releases/new?tag=v${
    release.version
  }&title=v${release.version}&body=${encodeURIComponent(release.body)}`;
}

export type ResolveGithubTokenOptions = {
  /**
   * Override for resolving a token via the GitHub CLI.
   * Used in tests; production uses `gh auth token`.
   */
  getGhCliToken?: (hostname: string) => string | undefined;
};

/**
 * Resolve a GitHub token from env, `~/.config/gh/hosts.yml`, or `gh auth token`.
 *
 * Modern `gh auth login` often stores the token in the OS keyring, so
 * `hosts.yml` has no `oauth_token`. In that case we shell out to
 * `gh auth token`, matching the README claim that an authenticated `gh`
 * CLI is enough. Failures soft-fall through so callers can open a manual
 * browser release URL.
 */
export async function resolveGithubToken(
  config: ResolvedChangelogConfig,
  options: ResolveGithubTokenOptions = {}
) {
  const env =
    process.env.CHANGELOGEN_TOKENS_GITHUB ||
    process.env.GITHUB_TOKEN ||
    process.env.GH_TOKEN;
  if (env) {
    return env;
  }

  const configHome = process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
  const ghCLIPath = join(configHome, "gh", "hosts.yml");
  if (existsSync(ghCLIPath)) {
    const yamlContents = await fsp.readFile(ghCLIPath, "utf8");
    const { parseYAML } = await import("confbox/yaml");
    const ghCLIConfig = parseYAML(yamlContents) as
      Record<string, { oauth_token?: string }> | undefined;
    const hostToken = ghCLIConfig?.[config.repo.domain]?.oauth_token;
    if (hostToken) {
      return hostToken;
    }
  }

  const getGhCliToken = options.getGhCliToken || getTokenFromGhCli;
  try {
    return getGhCliToken(config.repo.domain || "github.com");
  } catch {
    return undefined;
  }
}

function getTokenFromGhCli(hostname: string): string | undefined {
  const stdout = execFileSync(
    "gh",
    ["auth", "token", "-h", hostname || "github.com"],
    {
      encoding: "utf8",
      // Keep failures quiet; callers soft-fail to manual browser release.
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 10_000,
    }
  );
  const token = stdout.trim();
  return token || undefined;
}

// --- Internal utils ---
async function githubFetch(
  config: ResolvedChangelogConfig,
  url: string,
  opts: RequestInit = {}
) {
  const headers = new Headers(opts.headers);
  headers.set("x-github-api-version", "2022-11-28");
  if (config.tokens.github) {
    headers.set("authorization", `Bearer ${config.tokens.github}`);
  }

  const baseURL =
    config.repo.domain === "github.com"
      ? "https://api.github.com"
      : `https://${config.repo.domain}/api/v3`;

  const res = await fetch(baseURL + url, {
    ...opts,
    headers,
  });

  return await res.json();
}
