import { readPackageJSON } from "pkg-types";
import type { Reference } from "./git";
import type { ResolvedChangelogConfig } from "./config";
import { getGitRemoteURL } from "./git";

export type RepoProvider = "github" | "gitlab" | "bitbucket" | "azure";

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
  azure: {
    "pull-request": "pullrequest",
    hash: "commit",
    issue: "workitems",
  },
};

const providerToDomain: Record<RepoProvider, string> = {
  github: "github.com",
  gitlab: "gitlab.com",
  bitbucket: "bitbucket.org",
  azure: "dev.azure.com",
};

const domainToProvider: Record<string, RepoProvider> = {
  "github.com": "github",
  "gitlab.com": "gitlab",
  "bitbucket.org": "bitbucket",
  "dev.azure.com": "azure",
  "ssh.dev.azure.com": "azure",
};

// https://regex101.com/r/NA4Io6/1
// Standard repository URL format (GitHub, GitLab, Bitbucket, etc.)
const standardRepoURLRegex =
  /^(?:(?<user>[\w-]+)@)?(?:(?<provider>[^/:]+):)?(?:(?<repo>[\w-]+\/(?:\w|\.(?!git$)|-)+))(?:\.git)?$/;

// Azure DevOps specific URL formats
const azureRepoURLRegex = {
  // SSH format: git@ssh.dev.azure.com:v3/organization/project/repository
  ssh: /^(?:(?<user>[\w-]+)@)?(?<provider>ssh\.dev\.azure\.com):v3\/(?<organization>[\w-]+)\/(?<project>[\w-]+)\/(?<repository>[\w-]+)(?:\.git)?$/,

  // HTTPS format: https://username@dev.azure.com/organization/project/_git/repository
  https:
    /^https:\/\/(?:(?<user>[\w-]+)@)?(?<provider>dev\.azure\.com)\/(?<organization>[\w-]+)\/(?<project>[\w-]+)\/_git\/(?<repository>[\w-]+)$/,
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

export function formatCompareChanges(
  v: string,
  config: ResolvedChangelogConfig
) {
  let part: string;
  let changes: string;
  switch (config.repo.provider) {
    case "bitbucket": {
      part = "branches/compare";
      changes = `${v || config.to}%0D${config.from}`;
      break;
    }
    case "azure": {
      part = "branchCompare";
      changes = `?baseVersion=GT${v || config.to}&targetVersion=GT${config.from}`;
      break;
    }
    default: {
      part = "compare";
      changes = `${config.from}...${v || config.to}`;
      break;
    }
  }

  return `[compare changes](${baseUrl(config.repo)}/${part}/${changes})`;
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
  // Try to match Azure DevOps HTTPS URL
  const azureHttpsMatch = repoUrl.match(azureRepoURLRegex.https)?.groups;
  if (azureHttpsMatch) {
    const { organization, project, repository } = azureHttpsMatch;
    repo = `${organization}/${project}/_git/${repository}`;
    provider = "azure";
    domain = providerToDomain[provider];
  }
  // Try to match Azure DevOps SSH URL
  else {
    const azureSshMatch = repoUrl.match(azureRepoURLRegex.ssh)?.groups;
    if (azureSshMatch) {
      const { organization, project, repository } = azureSshMatch;
      repo = `${organization}/${project}/_git/${repository}`;
      provider = "azure";
      domain = providerToDomain[provider];
    }
    // Try to match standard repository URL
    else {
      const standardMatch = repoUrl.match(standardRepoURLRegex)?.groups ?? {};

      if (standardMatch.repo && standardMatch.provider) {
        repo = standardMatch.repo;
        provider =
          standardMatch.provider in domainToProvider
            ? domainToProvider[standardMatch.provider]
            : standardMatch.provider;
        domain =
          provider in providerToDomain ? providerToDomain[provider] : provider;
      }
      // Handle URLs that don't match our regex
      else if (url) {
        domain = url.hostname;
        const paths = url.pathname.split("/");
        repo = paths
          .slice(1)
          .join("/")
          .replace(/\.git$/, "");
        provider = domainToProvider[domain];
      }
      // Fallback for simple repo paths
      else if (standardMatch.repo) {
        repo = standardMatch.repo;
        provider = "github";
        domain = providerToDomain[provider];
      }
    }
  }

  return {
    provider,
    repo,
    domain,
  };
}
