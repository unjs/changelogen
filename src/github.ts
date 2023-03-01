import { $fetch, FetchOptions } from "ofetch";

export interface GithubOptions {
  repo: string;
  token: string;
}

interface ghFetchOptions extends FetchOptions {
  url: string;
  token: string;
}

function ghFetch(opts: ghFetchOptions) {
  return $fetch(opts.url, {
    ...opts,
    baseURL: "https://api.github.com",
    headers: {
      ...opts.headers,
      Authorization: `Token ${opts.token}`,
    },
  });
}

export interface GithubRelease {
  id?: string;
  tag_name: string;
  name?: string;
  body?: string;
  draft?: boolean;
  prerelease?: boolean;
}

export async function listReleases(
  ghOptions: GithubOptions
): Promise<GithubRelease[]> {
  return await ghFetch({
    url: `/repos/${ghOptions.repo}/releases`,
    token: ghOptions.token,
    query: { per_page: 100 },
  });
}

export async function getReleaseByTag(
  ghOptions: GithubOptions,
  tag: string
): Promise<GithubRelease> {
  return await ghFetch({
    url: `/repos/${ghOptions.repo}/releases/tags/${tag}`,
    token: ghOptions.token,
  });
}

export async function getChangelogMd(ghOptions: GithubOptions) {
  return await ghFetch({
    url: `https://raw.githubusercontent.com/${ghOptions.repo}/main/CHANGELOG.md`,
    token: ghOptions.token,
  });
}

export async function createRelease(
  ghOptions: GithubOptions,
  body: GithubRelease
) {
  return await ghFetch({
    url: `/repos/${ghOptions.repo}/releases`,
    token: ghOptions.token,
    method: "POST",
    body,
  });
}

export async function updateRelease(
  ghOptions: GithubOptions,
  id: string,
  body: GithubRelease
) {
  return await ghFetch({
    url: `/repos/${ghOptions.repo}/releases/${id}`,
    token: ghOptions.token,
    method: "PATCH",
    body,
  });
}
