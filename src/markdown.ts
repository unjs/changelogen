import { upperFirst } from "scule";
import { convert } from "convert-gitmoji";
import { fetch } from "node-fetch-native";
import type { ResolvedChangelogConfig } from "./config";
import type { GitCommit, Reference } from "./git";
import { formatReference, formatCompareChanges } from "./repo";

export async function generateMarkDown(
  commits: GitCommit[],
  config: ResolvedChangelogConfig
) {
  const typeGroups = groupBy(commits, "type");

  const markdown: string[] = [];
  const breakingChanges = [];

  // Version Title
  const v = config.newVersion && `v${config.newVersion}`;
  markdown.push("", "## " + (v || `${config.from || ""}...${config.to}`), "");

  if (config.repo && config.from) {
    markdown.push(formatCompareChanges(v, config));
  }

  for (const type in config.types) {
    const group = typeGroups[type];
    if (!group || group.length === 0) {
      continue;
    }

    markdown.push("", "### " + config.types[type].title, "");
    for (const commit of group.reverse()) {
      const line = formatCommit(commit, config);
      markdown.push(line);
      if (commit.isBreaking) {
        breakingChanges.push(line);
      }
    }
  }

  if (breakingChanges.length > 0) {
    markdown.push("", "#### ⚠️ Breaking Changes", "", ...breakingChanges);
  }

  const _authors = new Map<string, { email: Set<string>; github?: string }>();
  for (const commit of commits) {
    if (!commit.author) {
      continue;
    }
    const name = formatName(commit.author.name);
    if (!name || name.includes("[bot]")) {
      continue;
    }
    if (_authors.has(name)) {
      const entry = _authors.get(name);
      entry.email.add(commit.author.email);
    } else {
      _authors.set(name, { email: new Set([commit.author.email]) });
    }
  }

  // Try to map authors to github usernames
  await Promise.all(
    [..._authors.keys()].map(async (authorName) => {
      const meta = _authors.get(authorName);
      for (const email of meta.email) {
        const { user } = await fetch(`https://ungh.cc/users/find/${email}`)
          .then((r) => r.json())
          .catch(() => ({ user: null }));
        if (user) {
          meta.github = user.username;
          break;
        }
      }
    })
  );

  const authors = [..._authors.entries()].map((e) => ({ name: e[0], ...e[1] }));

  if (authors.length > 0) {
    markdown.push(
      "",
      "### " + "❤️ Contributors",
      "",
      ...authors.map((i) => {
        const _email = [...i.email].find(
          (e) => !e.includes("noreply.github.com")
        );
        const email = _email ? `<${_email}>` : "";
        const github = i.github
          ? `([@${i.github}](http://github.com/${i.github}))`
          : "";
        return `- ${i.name} ${github || email}`;
      })
    );
  }

  return convert(markdown.join("\n").trim(), true);
}

export function parseChangelogMarkdown(contents: string) {
  const headings = [...contents.matchAll(CHANGELOG_RELEASE_HEAD_RE)];
  const releases: { version?: string; body: string }[] = [];

  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const nextHeading = headings[i + 1];
    const [, title] = heading;
    const version = title.match(VERSION_RE);
    const release = {
      version: version ? version[1] : undefined,
      body: contents
        .slice(
          heading.index + heading[0].length,
          nextHeading?.index ?? contents.length
        )
        .trim(),
    };
    releases.push(release);
  }

  return {
    releases,
  };
}

// --- Internal utils ---

function formatCommit(commit: GitCommit, config: ResolvedChangelogConfig) {
  return (
    "- " +
    (commit.scope ? `**${commit.scope.trim()}:** ` : "") +
    (commit.isBreaking ? "⚠️  " : "") +
    upperFirst(commit.description) +
    formatReferences(commit.references, config)
  );
}

function formatReferences(
  references: Reference[],
  config: ResolvedChangelogConfig
) {
  const pr = references.filter((ref) => ref.type === "pull-request");
  const issue = references.filter((ref) => ref.type === "issue");
  if (pr.length > 0 || issue.length > 0) {
    return (
      " (" +
      [...pr, ...issue]
        .map((ref) => formatReference(ref, config.repo))
        .join(", ") +
      ")"
    );
  }
  if (references.length > 0) {
    return " (" + formatReference(references[0], config.repo) + ")";
  }
  return "";
}

// function formatTitle (title: string = '') {
//   return title.length <= 3 ? title.toUpperCase() : upperFirst(title)
// }

function formatName(name = "") {
  return name
    .split(" ")
    .map((p) => upperFirst(p.trim()))
    .join(" ");
}

function groupBy(items: any[], key: string) {
  const groups = {};
  for (const item of items) {
    groups[item[key]] = groups[item[key]] || [];
    groups[item[key]].push(item);
  }
  return groups;
}

const CHANGELOG_RELEASE_HEAD_RE = /^#{2,}\s+.*(v?(\d+\.\d+\.\d+)).*$/gm;
const VERSION_RE = /^v?(\d+\.\d+\.\d+)$/;
