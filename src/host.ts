import type { Reference } from "./git";
import type { ChangelogConfig } from "./config";

const allowedHostTypes = [
  "github",
  "gitlab",
  "bitbucket",
  "selfhosted",
] as const;

export type HostType = (typeof allowedHostTypes)[number];
export type HostConfig = { domain: string; repo: string; type: HostType };

const defaultRefTypeMap: Record<Reference["type"], string> = {
  "pull-request": "pull",
  hash: "commit",
  issue: "issues",
};

const refTypeMapByProvider: Record<
  HostType,
  Record<Reference["type"], string>
> = {
  github: defaultRefTypeMap,
  gitlab: { ...defaultRefTypeMap, "pull-request": "merge_requests" },
  bitbucket: { ...defaultRefTypeMap, "pull-request": "pull-requests" },
  selfhosted: defaultRefTypeMap,
};

function baseUrl(config: HostConfig) {
  return `https://${config.domain}/${config.repo}`;
}

export function formatReference(ref: Reference, config?: HostConfig) {
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
    config.host.type === "bitbucket" ? "branches/compare" : "compare";
  return `[compare changes](${baseUrl(config.host)}/${part}/${config.from}...${
    v || config.to
  })`;
}

const typeDomainMap: Record<string, string> = {
  github: "github.com",
  gitlab: "gitlab.com",
  bitbucket: "bitbucket.org",
};

export function getHostConfig(repoUrl = ""): HostConfig | undefined {
  if (repoUrl) {
    // https://regex101.com/r/JZq179/1
    const { hostType, repo } =
      repoUrl.match(/(?:^(?<hostType>\w+):)?(?<repo>\w+\/\w+)(.git)?$/)
        ?.groups ?? {};

    // https://regex101.com/r/Bdwsxu/1
    const [domain] =
      repoUrl.match(
        /(((?!-))[\d_a-z-]{0,61}[\da-z]\.)*([\da-z-]{1,61}|[\da-z-]{1,30})\.[a-z]{2,}/
      ) || [];

    if (!repo) {
      return undefined;
    }

    // there is a hostType, but it's not a valid one and we dont have a domain
    const validHostType =
      hostType !== "selfhosted" &&
      allowedHostTypes.find((type) => type === hostType);
    if (hostType && !validHostType && !domain) {
      return undefined;
    }

    const hostTypeByDomain = domain
      ? Object.keys(typeDomainMap).find((i) => typeDomainMap[i] === domain) ||
        "self-hosted"
      : undefined;
    const type = (validHostType || hostTypeByDomain || "github") as HostType;

    return {
      type,
      repo,
      domain: domain || typeDomainMap[type],
    };
  }
}
