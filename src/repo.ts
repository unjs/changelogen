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
  url?: string;
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


export function formatReference(ref: Reference, repo?: RepoConfig) {
  if (!repo || !(repo.provider in providerToRefSpec)) {
    return ref.value;
  }
  const refSpec = providerToRefSpec[repo.provider];
  return `[${ref.value}](${repo.url}/${
    refSpec[ref.type]
  }/${ref.value.replace(/^#/, "")})`;
}

export function formatCompareChanges(
  v: string,
  config: ResolvedChangelogConfig
) {
  const part =
    config.repo.provider === "bitbucket" ? "branches/compare" : "compare";
  const changes =
    config.repo.provider === "bitbucket"
      ? `${v || config.to}%0D${config.from}`
      : `${config.from}...${v || config.to}`;
  return `[compare changes](${config.repo.url}/${part}/${changes})`;
}

export async function resolveRepoConfig(cwd: string, repoType?: string) {
  // Try closest package.json
  const pkg = await readPackageJSON(cwd).catch(() => {});
  if (pkg && pkg.repository) {
    const url =
      typeof pkg.repository === "string" ? pkg.repository : pkg.repository.url;
    return getRepoConfig(url, repoType);
  }

  try {
    const gitRemote = getGitRemoteURL(cwd);
    if (gitRemote) {
      return getRepoConfig(gitRemote, repoType);
    }
  } catch {
    // Ignore
  }
}

export function getRepoConfig(repoUrl = "", repoType?: string): RepoConfig {
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
      .slice(1)
      .join("/")
      .replace(/\.git$/, "");
    provider = domainToProvider[domain] || repoType ;
  } else if (m.repo) {
    repo = m.repo;
    provider = repoType ||  "github";
    domain = providerToDomain[provider];
  }

  return {
    url: convertGitUrlToStandard(repoUrl),
    provider,
    repo,
    domain,
  };
}

/**
 * Converts Git URLs (SSH format or HTTP/HTTPS) to standardized HTTP/HTTPS format
 * - Removes .git suffix and trailing slashes
 * - Handles SSH (git@host:path) and SSH protocol (ssh://) formats
 * - Preserves custom ports, IPv6 addresses, and query parameters
 * 
 * @param url - Git URL in SSH or HTTP/HTTPS format
 * @param protocol - Target protocol (http or https), defaults to 'https'
 * @returns Standardized HTTP/HTTPS URL without .git suffix or trailing slash
 * @throws {Error} For invalid URL formats
 */
function convertGitUrlToStandard(
  url: string,
  protocol: "http" | "https" = "https"
): string {
  // Process HTTP/HTTPS URLs immediately
  if (/^https?:\/\//i.test(url)) {
    // Remove .git suffix and trailing slashes
    return url.replace(/\.git\/?$/i, "").replace(/\/$/, "");
  }

  let convertedUrl = url;

  // Handle SSH protocol format (ssh://user@host:port/path.git)
  if (/^ssh:\/\//i.test(convertedUrl)) {
    convertedUrl = convertedUrl.replace(/^ssh:\/\//i, `${protocol}://`);
  } 
  // Handle standard SSH format (user@host:path.git)
  else if (/^[\w-]+@.+/i.test(convertedUrl)) {
    convertedUrl = convertedUrl.replace(/^[\w-]+@/i, `${protocol}://`);
  }

  // Replace first colon with slash (handles git@host:path format)
  const firstColonIndex = convertedUrl.indexOf(":");
  if (firstColonIndex > 0) {
    convertedUrl = 
      convertedUrl.substring(0, firstColonIndex) +
      "/" +
      convertedUrl.substring(firstColonIndex + 1);
  }

  // Remove any username remaining after protocol
  convertedUrl = convertedUrl.replace(
    new RegExp(`^${protocol}://[^@]+@`, "i"), 
    `${protocol}://`
  );

  // Validate URL structure
  if (!convertedUrl.includes("://") || !convertedUrl.match(/\/.+/)) {
    throw new Error(`Invalid Git URL format: ${url}`);
  }

  // Final cleanup: remove .git suffix and trailing slashes
  return convertedUrl.replace(/\.git\/?$/i, "").replace(/\/$/, "");
}