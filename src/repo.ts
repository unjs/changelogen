import { readPackageJSON } from "pkg-types";
import type { Reference } from "./git";
import type { ResolvedChangelogConfig } from "./config";
import { getGitRemoteURL } from "./git";

export type RepoProvider = "github" | "gitlab" | "bitbucket";

export type RepoConfig = {
  domain?: string;
  repo?: string;
  provider?: RepoProvider;
  token?: string;
};

const providerToRefSpec: Record<
  RepoProvider,
  Record<Reference["type"], string>
> = {
  github: { "pull-request": "pull", hash: "commit", issue: "issues" },
  gitlab: { "pull-request": "merge_requests", hash: "commit", issue: "issues" },
  bitbucket: {
    "pull-request": "pull-requests",
    hash: "commit",
    issue: "issues",
  },
};

const providerToDomain: Record<RepoProvider, string> = {
  github: "github.com",
  gitlab: "gitlab.com",
  bitbucket: "bitbucket.org",
};

const domainToProvider: Record<string, RepoProvider> = {
  "github.com": "github",
  "gitlab.com": "gitlab",
  "bitbucket.org": "bitbucket",
};

// https://regex101.com/r/NA4Io6/1
const providerURLRegex =
  /^(?:(?<user>[\w-]+)@)?(?:(?<provider>[^/:]+):)?(?<repo>[\w-]+\/(?:\w|\.(?!git$)|-)+)(?:\.git)?$/;

function baseUrl(config: RepoConfig) {
  return `https://${config.domain}/${config.repo}`;
}

export function formatReference(ref: Reference, repo?: RepoConfig) {
  if (!repo || !(repo.provider in providerToRefSpec)) {
    return ref.value;
  }
  const refSpec = providerToRefSpec[repo.provider];
  return `[${ref.value}](${baseUrl(repo)}/${
    refSpec[ref.type]
  }/${ref.value.replace(/^#/, "")})`;
}

export function formatCompareChanges(
  v: string,
  config: ResolvedChangelogConfig
) {
  const part =
    config.repo.provider === "bitbucket" ? "branches/compare" : "compare";
  return `[compare changes](${baseUrl(config.repo)}/${part}/${config.from}...${
    v || config.to
  })`;
}

export async function resolveRepoConfig(cwd: string) {
  // Try closest package.json
  const pkg = await readPackageJSON(cwd).catch(() => {});
  if (pkg && pkg.repository) {
    const url =
      typeof pkg.repository === "string" ? pkg.repository : pkg.repository.url;
    return getRepoConfig(url);
  }

  try {
    const gitRemote = getGitRemoteURL(cwd);
    if (gitRemote) {
      return getRepoConfig(gitRemote);
    }
  } catch {
    // Ignore
  }
}

export function getRepoConfig(repoUrl = ""): RepoConfig {
  let provider;
  let repo;
  let domain;

  let url: URL;
  try {
    url = new URL(repoUrl);
  } catch {
    // Ignore error
  }

  const m = repoUrl.match(providerURLRegex)?.groups ?? {};
  if (m.repo && m.provider) {
    repo = m.repo;
    provider =
      m.provider in domainToProvider
        ? domainToProvider[m.provider]
        : m.provider;
    domain =
      provider in providerToDomain ? providerToDomain[provider] : provider;
  } else if (url) {
    domain = url.hostname;
    const paths = url.pathname.split("/");
    repo = paths
      .slice(1, paths.length)
      .join("/")
      .replace(/\.git$/, "");
    provider = domainToProvider[domain];
  } else if (m.repo) {
    repo = m.repo;
    provider = "github";
    domain = providerToDomain[provider];
  }

  return {
    provider,
    repo,
    domain,
  };
}
