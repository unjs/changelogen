import { existsSync, promises as fsp } from "node:fs";
import { homedir } from "node:os";
import { Package } from "@manypkg/get-packages";
import { $fetch, FetchOptions } from "ofetch";
import { join } from "pathe";
import { ChangelogConfig } from "./config";
import { getChangelogPath } from "./changelog";
import { getTagMessageWithVersion } from "./git-tag";

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

export async function getGithubChangelog(
  config: ChangelogConfig,
  pkg?: Package
) {
  const filePath = getChangelogPath(config, pkg, true);

  return await githubFetch(
    config,
    `https://raw.githubusercontent.com/${config.repo.repo}/main/${filePath}`
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
  release: { version: string; body: string },
  pkg?: Package
) {
  const tagName = getTagMessageWithVersion(config, release.version, pkg);
  const currentGhRelease = await getGithubReleaseByTag(config, tagName).catch(
    () => {}
  );

  const ghRelease: GithubRelease = {
    tag_name: tagName,
    name: tagName,
    body: release.body,
  };

  if (!config.tokens.github) {
    return {
      status: "manual",
      url: githubNewReleaseURL(config, {
        tag: tagName,
        body: release.body,
      }),
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
      url: githubNewReleaseURL(config, {
        tag: tagName,
        body: release.body,
      }),
    };
  }
}

export function githubNewReleaseURL(
  config: ChangelogConfig,
  release: { version: string; body: string } | { tag: string; body: string }
) {
  const tag = "tag" in release ? release.tag : `v${release.version}`;
  const url = new URL(
    `https://${config.repo.domain}/${config.repo.repo}/releases/new`
  );
  url.searchParams.set("tag", tag);
  url.searchParams.set("title", tag);
  url.searchParams.set("body", release.body);
  return url.toString();
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
