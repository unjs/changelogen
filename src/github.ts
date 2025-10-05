import { existsSync, promises as fsp } from "node:fs";
import { homedir } from "node:os";
import { $fetch, FetchOptions } from "ofetch";
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
  return `${config.repo.protocol}//${config.repo.domain}/${config.repo.repo}/releases/new?tag=v${
    release.version
  }&title=v${release.version}&body=${encodeURIComponent(release.body)}`;
}

export async function resolveGithubToken(config: ResolvedChangelogConfig) {
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
    const ghCLIConfig = parseYAML(yamlContents);
    if (ghCLIConfig && ghCLIConfig[config.repo.domain]) {
      return ghCLIConfig["github.com"].oauth_token;
    }
  }
}

// --- Internal utils ---
async function githubFetch(
  config: ResolvedChangelogConfig,
  url: string,
  opts: FetchOptions = {}
) {
  return await $fetch(url, {
    ...opts,
    baseURL:
      config.repo.domain === "github.com"
        ? "https://api.github.com"
        : `${config.repo.protocol}//${config.repo.domain}/api/v3`,
    headers: {
      "x-github-api-version": "2022-11-28",
      ...opts.headers,
      authorization: config.tokens.github
        ? `Bearer ${config.tokens.github}`
        : undefined,
    },
  });
}
