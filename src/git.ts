import type { ChangelogConfig } from "./config";
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
  revertedHashes: string[];
}

export interface RevertPair {
  shortRevertingHash: string;
  revertedHash: string;
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
const RevertHashRE = /This reverts commit (?<hash>[\da-f]{40})./gm;

export function parseGitCommit(
  commit: RawGitCommit,
  config: ChangelogConfig
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

  // Extract the reverted hashes.
  const revertedHashes = [];
  const matchedHashes = commit.body.matchAll(RevertHashRE);
  for (const matchedHash of matchedHashes) {
    revertedHashes.push(matchedHash.groups.hash);
  }

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
    revertedHashes,
  };
}

export function filterCommits(
  commits: GitCommit[],
  config: ChangelogConfig
): GitCommit[] {
  const commitsWithNoDeps = commits.filter(
    (c) =>
      config.types[c.type] &&
      !(c.type === "chore" && c.scope === "deps" && !c.isBreaking)
  );

  let resolvedCommits: GitCommit[] = [];
  let revertWatchList: RevertPair[] = [];
  for (const commit of commitsWithNoDeps) {
    // Include the reverted hashes in the watch list
    if (commit.revertedHashes.length > 0) {
      revertWatchList.push(
        ...commit.revertedHashes.map(
          (revertedHash) =>
            ({
              revertedHash,
              shortRevertingHash: commit.shortHash,
            } as RevertPair)
        )
      );
    }

    // Find the commits which revert the current commit being evaluated
    const shortRevertingHashes = revertWatchList
      .filter((pair) => pair.revertedHash.startsWith(commit.shortHash))
      .map((pair) => pair.shortRevertingHash);

    if (shortRevertingHashes.length > 0) {
      // Remove commits that reverts this current commit
      resolvedCommits = resolvedCommits.filter(
        (resolvedCommit) =>
          !shortRevertingHashes.includes(resolvedCommit.shortHash)
      );

      // Unwatch reverting hashes that has been resolved
      revertWatchList = revertWatchList.filter(
        (watchedRevert) =>
          !shortRevertingHashes.includes(watchedRevert.shortRevertingHash)
      );
    } else {
      // If the current commit is known not to have been reverted, put it to resolved commits.
      resolvedCommits = [...resolvedCommits, commit];
    }
  }

  return resolvedCommits;
}
