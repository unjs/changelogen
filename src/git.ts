import { execCommand } from "./exec";
import type { ChangelogConfig, ResolvedChangelogConfig } from "./config";

export interface GitCommitAuthor {
  name: string;
  email: string;
}

export interface RawGitCommit {
  message: string;
  body: string;
  shortHash: string;
  fullHash: string;
  author: GitCommitAuthor;
}

export interface Reference {
  type: "hash" | "issue" | "pull-request";
  value: string;
}

export interface GitCommit extends RawGitCommit {
  description: string;
  type: string;
  scope: string;
  references: Reference[];
  authors: GitCommitAuthor[];
  isBreaking: boolean;
}

export async function getLastGitTag(cwd?: string) {
  try {
    return execCommand("git describe --tags --abbrev=0", cwd)
      ?.split("\n")
      .at(-1);
  } catch {
    // Ignore
  }
}

export function getCurrentGitBranch(cwd?: string) {
  return execCommand("git rev-parse --abbrev-ref HEAD", cwd);
}

export function getCurrentGitTag(cwd?: string) {
  return execCommand("git tag --points-at HEAD", cwd);
}

export function getCurrentGitRef(cwd?: string) {
  return getCurrentGitTag(cwd) || getCurrentGitBranch(cwd);
}

export function getGitRemoteURL(cwd: string, remote = "origin") {
  return execCommand(
    `git --work-tree="${cwd}" remote get-url "${remote}"`,
    cwd
  );
}

export async function getCurrentGitStatus(cwd?: string) {
  return execCommand("git status --porcelain", cwd);
}

export async function getGitDiff(
  from: string | undefined,
  to = "HEAD",
  cwd?: string
): Promise<RawGitCommit[]> {
  // https://git-scm.com/docs/pretty-formats
  const r = execCommand(
    `git --no-pager log "${from ? `${from}...` : ""}${to}" --pretty="----%n%s|%h|%H|%an|%ae%n%b" --name-status`,
    cwd
  );

  return r
    .split("----\n")
    .splice(1)
    .map((line) => {
      const [firstLine, ..._body] = line.split("\n");
      const [message, shortHash, fullHash, authorName, authorEmail] =
        firstLine.split("|");
      const r: RawGitCommit = {
        message,
        shortHash,
        fullHash,
        author: { name: authorName, email: authorEmail },
        body: _body.join("\n"),
      };
      return r;
    });
}

export function parseCommits(
  commits: RawGitCommit[],
  config: ChangelogConfig
): GitCommit[] {
  return commits
    .map((commit) => parseGitCommit(commit, config))
    .filter(Boolean);
}

// https://www.conventionalcommits.org/en/v1.0.0/
// https://regex101.com/r/FSfNvA/1
const ConventionalCommitRegex =
  /(?<emoji>:.+:|(\uD83C[\uDF00-\uDFFF])|(\uD83D[\uDC00-\uDE4F\uDE80-\uDEFF])|[\u2600-\u2B55])?( *)?(?<type>[a-z]+)(\((?<scope>.+)\))?(?<breaking>!)?: (?<description>.+)/i;
const CoAuthoredByRegex = /co-authored-by:\s*(?<name>.+)(<(?<email>.+)>)/gim;
const PullRequestRE = /\([ a-z]*(#\d+)\s*\)/gm;
const IssueRE = /(#\d+)/gm;

export function parseGitCommit(
  commit: RawGitCommit,
  config: ResolvedChangelogConfig
): GitCommit | null {
  const match = commit.message.match(ConventionalCommitRegex);
  if (!match) {
    return null;
  }

  const type = match.groups.type;
  const hasBreakingBody = /breaking change:/i.test(commit.body);

  let scope = match.groups.scope || "";
  scope = config.scopeMap[scope] || scope;

  const isBreaking = Boolean(match.groups.breaking || hasBreakingBody);
  let description = match.groups.description;

  // Extract references from message
  const references: Reference[] = [];
  for (const m of description.matchAll(PullRequestRE)) {
    references.push({ type: "pull-request", value: m[1] });
  }
  for (const m of description.matchAll(IssueRE)) {
    if (!references.some((i) => i.value === m[1])) {
      references.push({ type: "issue", value: m[1] });
    }
  }

  if (config.repo.provider === "azure") {
    references.push({ value: commit.fullHash, type: "hash" });
  } else {
    references.push({ value: commit.shortHash, type: "hash" });
  }

  // Remove references and normalize
  description = description.replace(PullRequestRE, "").trim();

  // Find all authors
  const authors: GitCommitAuthor[] = [commit.author];
  for (const match of commit.body.matchAll(CoAuthoredByRegex)) {
    authors.push({
      name: (match.groups.name || "").trim(),
      email: (match.groups.email || "").trim(),
    });
  }

  return {
    ...commit,
    authors,
    description,
    type,
    scope,
    references,
    isBreaking,
  };
}
