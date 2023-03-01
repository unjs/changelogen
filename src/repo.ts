import type { Reference } from "./git";
import type { ChangelogConfig } from "./config";

export type RepoProvider = "github" | "gitlab" | "bitbucket";

export type RepoConfig = {
  domain?: string;
  repo?: string;
  provider?: RepoProvider;
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

export function formatCompareChanges(v: string, config: ChangelogConfig) {
  const part =
    config.repo.provider === "bitbucket" ? "branches/compare" : "compare";
  return `[compare changes](${baseUrl(config.repo)}/${part}/${config.from}...${
    v || config.to
  })`;
}

export function getRepoConfig(repoUrl = ""): RepoConfig {
  let provider;
  let repo;
  let domain;

  let url;
  try {
    url = new URL(repoUrl);
  } catch {}

  // https://regex101.com/r/NA4Io6/1
  const proiderRe =
    /^(?:(?<user>\w+)@)?(?:(?<provider>[^/:]+):)?(?<repo>\w+\/\w+)(?:\.git)?$/;

  const m = repoUrl.match(proiderRe)?.groups ?? {};
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
    repo = url.pathname
      .split("/")
      .slice(1, 3)
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
