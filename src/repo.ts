import type { Reference } from "./git";
import type { ChangelogConfig } from "./config";

const allowedRepoTypes = [
  "github",
  "gitlab",
  "bitbucket",
  "selfhosted",
] as const;

export type RepoType = (typeof allowedRepoTypes)[number];
export type RepoConfig = { domain: string; repo: string; type: RepoType };

const defaultRefTypeMap: Record<Reference["type"], string> = {
  "pull-request": "pull",
  hash: "commit",
  issue: "issues",
};

const refTypeMapByProvider: Record<
  RepoType,
  Record<Reference["type"], string>
> = {
  github: defaultRefTypeMap,
  gitlab: { ...defaultRefTypeMap, "pull-request": "merge_requests" },
  bitbucket: { ...defaultRefTypeMap, "pull-request": "pull-requests" },
  selfhosted: defaultRefTypeMap,
};

function baseUrl(config: RepoConfig) {
  return `https://${config.domain}/${config.repo}`;
}

export function formatReference(ref: Reference, config?: RepoConfig) {
  if (!config) {
    return ref.value;
  }
  const refTypeMap = refTypeMapByProvider[config.type];

  return `[${ref.value}](${baseUrl(config)}/${
    refTypeMap[ref.type]
  }/${ref.value.replace(/^#/, "")})`;
}

export function formatCompareChanges(v: string, config: ChangelogConfig) {
  const part =
    config.repo.type === "bitbucket" ? "branches/compare" : "compare";
  return `[compare changes](${baseUrl(config.repo)}/${part}/${config.from}...${
    v || config.to
  })`;
}

const typeDomainMap: Record<string, string> = {
  github: "github.com",
  gitlab: "gitlab.com",
  bitbucket: "bitbucket.org",
};

export function getRepoConfig(repoUrl = ""): RepoConfig | undefined {
  if (repoUrl) {
    // https://regex101.com/r/JZq179/1
    const { repoType, repo } =
      repoUrl.match(/(?:^(?<repoType>\w+):)?(?<repo>\w+\/\w+)(.git)?$/)
        ?.groups ?? {};

    // https://regex101.com/r/Bdwsxu/1
    const [domain] =
      repoUrl.match(
        /(((?!-))[\d_a-z-]{0,61}[\da-z]\.)*([\da-z-]{1,61}|[\da-z-]{1,30})\.[a-z]{2,}/
      ) || [];

    if (!repo) {
      return undefined;
    }

    // there is a repoType, but it's not a valid one and we dont have a domain
    const validRepoType =
      repoType !== "selfhosted" &&
      allowedRepoTypes.find((type) => type === repoType);
    if (repoType && !validRepoType && !domain) {
      return undefined;
    }

    const repoTypeByDomain = domain
      ? Object.keys(typeDomainMap).find((i) => typeDomainMap[i] === domain) ||
        "self-hosted"
      : undefined;
    const type = (validRepoType || repoTypeByDomain || "github") as RepoType;

    return {
      type,
      repo,
      domain: domain || typeDomainMap[type],
    };
  }
}
