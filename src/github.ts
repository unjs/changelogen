import { existsSync, promises as fsp } from "node:fs";
import { homedir } from "node:os";
import { $fetch, FetchOptions } from "ofetch";
import { join, relative } from "pathe";
import { joinURL } from "ufo";
import { ChangelogConfig } from "./config";

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
  config: ChangelogConfig
): Promise<GithubRelease[]> {
  return await githubFetch(config, `/repos/${config.repo.repo}/releases`, {
    query: { per_page: 100 },
  });
}

export async function getGithubReleaseByTag(
  config: ChangelogConfig,
  tag: string
): Promise<GithubRelease> {
  return await githubFetch(
    config,
    `/repos/${config.repo.repo}/releases/tags/${tag}`,
    {}
  );
}

export async function getGithubChangelog(config: ChangelogConfig) {
  const filePath = relative(config.cwd, config.output as string)
  const urlPath = joinURL(config.repo.repo, 'main', filePath)
  return await githubFetch(
    config,
    `https://raw.githubusercontent.com/${urlPath}`
  );
}

export async function createGithubRelease(
  config: ChangelogConfig,
  body: GithubRelease
) {
  return await githubFetch(config, `/repos/${config.repo.repo}/releases`, {
    method: "POST",
    body,
  });
}

export async function updateGithubRelease(
  config: ChangelogConfig,
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
  config: ChangelogConfig,
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
  config: ChangelogConfig,
  release: { version: string; body: string }
) {
  return `https://${config.repo.domain}/${config.repo.repo}/releases/new?tag=v${
    release.version
  }&title=v${release.version}&body=${encodeURIComponent(release.body)}`;
}

export async function resolveGithubToken(config: ChangelogConfig) {
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
    const parseYAML = await import("yaml").then((r) => r.parse);
    const ghCLIConfig = parseYAML(yamlContents);
    if (ghCLIConfig && ghCLIConfig[config.repo.domain]) {
      return ghCLIConfig["github.com"].oauth_token;
    }
  }
}

// --- Internal utils ---
async function githubFetch(
  config: ChangelogConfig,
  url: string,
  opts: FetchOptions = {}
) {
  return await $fetch(url, {
    ...opts,
    baseURL:
      config.repo.domain === "github.com"
        ? "https://api.github.com"
        : `https://${config.repo.domain}/api/v3`,
    headers: {
      ...opts.headers,
      authorization: config.tokens.github
        ? `Token ${config.tokens.github}`
        : undefined,
    },
  });
}
