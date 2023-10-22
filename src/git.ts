import type { ResolvedChangelogConfig } from "./config";
import { execCommand } from "./exec";

export interface GitCommitAuthor {
  name: string;
  email: string;
}

export interface RawGitCommit {
  message: string;
  body: string;
  shortHash: string;
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

export async function getLastGitTag() {
  const r = await execCommand("git", ["describe", "--tags", "--abbrev=0"])
    .then((r) => r.split("\n"))
    .catch(() => []);
  return r.at(-1);
}

export async function getCurrentGitBranch() {
  return await execCommand("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
}

export async function getCurrentGitTag() {
  return await execCommand("git", ["tag", "--points-at", "HEAD"]);
}

export async function getCurrentGitRef() {
  return (await getCurrentGitTag()) || (await getCurrentGitBranch());
}

export async function getGitRemoteURL(cwd: string, remote = "origin") {
  return await execCommand("git", [
    `--work-tree=${cwd}`,
    "remote",
    "get-url",
    remote,
  ]);
}

export async function getCurrentGitStatus() {
  return await execCommand("git", ["status", "--porcelain"]);
}

export async function getGitDiff(
  from: string | undefined,
  to = "HEAD"
): Promise<RawGitCommit[]> {
  // https://git-scm.com/docs/pretty-formats
  const r = await execCommand("git", [
    "--no-pager",
    "log",
    `${from ? `${from}...` : ""}${to}`,
    '--pretty="----%n%s|%h|%an|%ae%n%b"',
    "--name-status",
  ]);
  return r
    .split("----\n")
    .splice(1)
    .map((line) => {
      const [firstLine, ..._body] = line.split("\n");
      const [message, shortHash, authorName, authorEmail] =
        firstLine.split("|");
      const r: RawGitCommit = {
        message,
        shortHash,
        author: { name: authorName, email: authorEmail },
        body: _body.join("\n"),
      };
      return r;
    });
}

export function parseCommits(
  commits: RawGitCommit[],
  config: ResolvedChangelogConfig
): GitCommit[] {
  return commits
    .map((commit) => parseGitCommit(commit, config))
    .filter(Boolean);
}

export function filterParsedCommits(
  commits: GitCommit[],
  config: ResolvedChangelogConfig
): GitCommit[] {
  // parsing the exclude parameter ('chore(deps)' => ['chore(deps)','chore','(deps)','deps'])
  const excludes: RegExpMatchArray[] = config.exclude
    ? config.exclude.map((excludeString) =>
        excludeString.match(/(\*|[a-z]+)(\((.+)\))?/)
      )
    : [];
  return commits.filter(
    (c) =>
      config.types[c.type] &&
      !excludes.some(
        (e) =>
          e &&
          (e[1] === "*" || c.type === e[1]) &&
          (c.scope === e[3] || !e[3]) &&
          !c.isBreaking
      )
  );
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

  let scope = match.groups.scope || "";
  scope = config.scopeMap[scope] || scope;

  const isBreaking = Boolean(match.groups.breaking);
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
  references.push({ value: commit.shortHash, type: "hash" });

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
