import { $fetch, FetchOptions } from "ofetch";
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
  return await githubFetch(
    config,
    `https://raw.githubusercontent.com/${ghOptions.repo}/main/CHANGELOG.md`
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

  const newGhRelease = await (currentGhRelease
    ? updateGithubRelease(config, currentGhRelease.id, ghRelease)
    : createGithubRelease(config, ghRelease));

  return {
    status: currentGhRelease ? "updated" : "created",
    id: newGhRelease.id,
  };
}

// --- Internal utils ---

function githubFetch(
  config: ChangelogConfig,
  url: string,
  opts: FetchOptions = {}
) {
  if (config.repo?.provider !== "github") {
    throw new Error("Cannot perform action on non-Github repositories!");
  }

  const githubToken =
    process.env.CHANGELOGEN_GITHUB_TOKEN ||
    process.env.GITHUB_TOKEN ||
    process.env.GH_TOKEN;

  return $fetch(url, {
    ...opts,
    baseURL: "https://api.github.com", // TODO: Support custom domain
    headers: {
      ...opts.headers,
      Authorization: githubToken ? `Token ${githubToken}` : undefined,
    },
  }).catch((error) => {
    if (error.status / 100 === 4 && !githubToken) {
      console.warn(
        "Please make sure `CHANGELOGEN_GITHUB_TOKEN` or `GITHUB_TOKEN` or `GH_TOKEN` env is provided!"
      );
    }
    throw error;
  });
}
