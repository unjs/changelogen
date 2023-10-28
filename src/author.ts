import { upperFirst } from "scule";
import { ResolvedChangelogConfig } from "./config";
import { GitCommit } from "./git";
import { getGithubLoginByCommit } from "./github";

export interface CommitAuthor {
  commits: string[];
  github?: string;
  email: Set<string>;
  name: string;
}

export async function resolveAuthorInfo(
  config: ResolvedChangelogConfig,
  info: CommitAuthor
): Promise<CommitAuthor> {
  if (info.github) {
    return info;
  }

  try {
    for (const email of info.email) {
      const { user } = await fetch(`https://ungh.cc/users/find/${email}`)
        .then((r) => r.json())
        .catch(() => ({ user: null }));
      if (user) {
        info.github = user.username;
        break;
      }
    }
  } catch {}

  if (info.github) {
    return info;
  }

  // token not provided, skip github resolving
  if (!config.tokens.github) {
    return info;
  }

  for (const commit in info.commits) {
    try {
      info.github = await getGithubLoginByCommit(config, commit);
      if (info.github) {
        break;
      }
    } catch {}
  }

  return info;
}

export async function resolveAuthors(
  commits: GitCommit[],
  config: ResolvedChangelogConfig
): Promise<CommitAuthor[]> {
  const _authors = new Map<string, CommitAuthor>();
  for (const commit of commits) {
    if (!commit.author) {
      continue;
    }
    const name = formatName(commit.author.name);
    if (!name || name.includes("[bot]")) {
      continue;
    }
    if (
      config.excludeAuthors &&
      config.excludeAuthors.some(
        (v) => name.includes(v) || commit.author.email?.includes(v)
      )
    ) {
      continue;
    }
    if (_authors.has(name)) {
      const entry = _authors.get(name);
      entry.email.add(commit.author.email);
      entry.commits.push(commit.shortHash);
    } else {
      _authors.set(name, {
        name,
        email: new Set([commit.author.email]),
        commits: [commit.shortHash],
      });
    }
  }

  // Try to map authors to github usernames
  const resolved = await Promise.all(
    [..._authors.values()].map((info) => resolveAuthorInfo(config, info))
  );

  // check for duplicate logins
  const loginSet = new Set<string>();
  return resolved.filter((i) => {
    if (i.github && loginSet.has(i.github)) {
      return false;
    }
    if (i.github) {
      loginSet.add(i.github);
    }
    return true;
  });
}

// --- Internal utils ---

function formatName(name = "") {
  return name
    .split(" ")
    .map((p) => upperFirst(p.trim()))
    .join(" ");
}
