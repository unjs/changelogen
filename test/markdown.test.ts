import { promises as fsp } from "node:fs";
import { describe, expect, test } from "vitest";
import { generateMarkDown, parseChangelogMarkdown } from "../src";
import type { ResolvedChangelogConfig } from "../src/config";
import type { GitCommit, GitCommitAuthor } from "../src/git";

const baseConfig: ResolvedChangelogConfig = {
  cwd: "/test",
  from: "1.0.0",
  to: "2.0.0",
  newVersion: "2.0.0",
  output: "CHANGELOG.md",
  types: {
    feat: { title: "🚀 Enhancements" },
    fix: { title: "🩹 Fixes" },
    docs: { title: "📖 Documentation" },
    chore: { title: "🏡 Chore" },
  },
  publish: {},
  repo: {
    provider: "github",
    domain: "github.com",
    repo: "test/repo",
  },
  tokens: {},
  scopeMap: {},
  templates: {
    tagBody: "v{{newVersion}}",
  },
  excludeAuthors: [],
  noAuthors: false,
  hideAuthorEmail: false,
};

describe("markdown", () => {
  test("should parse markdown", async () => {
    const contents = await fsp.readFile(
      new URL("fixtures/CHANGELOG.md", import.meta.url),
      "utf8"
    );
    expect(parseChangelogMarkdown(contents)).toMatchInlineSnapshot(`
      {
        "releases": [
          {
            "body": "[compare changes](https://github.com/unjs/changelogen/compare/v0.4.0...v0.4.1)

      ### 🩹 Fixes

      - Bump by patch by default ([7e38438](https://github.com/unjs/changelogen/commit/7e38438))

      ### 🏡 Chore

      - Update renovate config ([#54](https://github.com/unjs/changelogen/pull/54))
      - Update dependencies ([4216bc6](https://github.com/unjs/changelogen/commit/4216bc6))
      - Update repo ([83c349f](https://github.com/unjs/changelogen/commit/83c349f))

      ### ❤️ Contributors

      - Pooya Parsa <pooya@pi0.io>
      - Nozomu Ikuta <nick.0508.nick@gmail.com>",
            "version": "0.4.1",
          },
          {
            "body": "[compare changes](https://github.com/unjs/changelogen/compare/v0.3.5...v0.4.0)

      ### 🚀 Enhancements

      - ⚠️ Resolve github usernames using \`ungh/ungh\` ([#46](https://github.com/unjs/changelogen/pull/46))

      ### 🩹 Fixes

      - **markdown:** Avoid rendering \`noreply.github.com\` emails ([4871721](https://github.com/unjs/changelogen/commit/4871721))
      - Avoid rendering authors with \`[bot]\` in their name ([4f3f644](https://github.com/unjs/changelogen/commit/4f3f644))
      - Format name to avoid duplicates ([f74a988](https://github.com/unjs/changelogen/commit/f74a988))

      #### ⚠️ Breaking Changes

      - ⚠️ Resolve github usernames using \`ungh/ungh\` ([#46](https://github.com/unjs/changelogen/pull/46))

      ### ❤️ Contributors

      - Pooya Parsa ([@pi0](https://github.com/pi0))",
            "version": "0.4.0",
          },
        ],
      }
    `);
  });

  test("should exclude bot users from contributors", async () => {
    const commits: GitCommit[] = [
      {
        shortHash: "abc123",
        message: "feat: auto update",
        author: {
          name: "renovate[bot]",
          email: "bot@renovateapp.com",
        },
        type: "feat",
        scope: "",
        description: "auto update",
        body: "",
        isBreaking: false,
        references: [],
        authors: [],
      },
    ];

    const markdown = await generateMarkDown(commits, baseConfig);
    expect(markdown).not.toContain("[bot]");
    expect(markdown).not.toContain("### ❤️ Contributors");
  });

  test("should exclude noreply.github.com emails from contributors", async () => {
    const commits: GitCommit[] = [
      {
        shortHash: "abc123",
        message: "feat: add feature",
        author: {
          name: "test user",
          email: "test@noreply.github.com",
        },
        type: "feat",
        scope: "",
        description: "add feature",
        body: "",
        isBreaking: false,
        references: [],
        authors: [],
      },
      {
        shortHash: "def456",
        message: "fix: fix bug",
        author: {
          name: "test user",
          email: "real@example.com",
        },
        type: "fix",
        scope: "",
        description: "fix bug",
        body: "",
        isBreaking: false,
        references: [],
        authors: [],
      },
    ];

    const markdown = await generateMarkDown(commits, baseConfig);
    expect(markdown).toContain("real@example.com");
    expect(markdown).not.toContain("noreply.github.com");
  });

  test("should exclude authors based on excludeAuthors config", async () => {
    const commits: GitCommit[] = [
      {
        shortHash: "abc123",
        message: "feat: add feature",
        author: {
          name: "excluded user",
          email: "excluded@example.com",
        },
        type: "feat",
        scope: "",
        description: "add feature",
        body: "",
        isBreaking: false,
        references: [],
        authors: [],
      },
      {
        shortHash: "def456",
        message: "fix: fix bug",
        author: {
          name: "included user",
          email: "included@example.com",
        },
        type: "fix",
        scope: "",
        description: "fix bug",
        body: "",
        isBreaking: false,
        references: [],
        authors: [],
      },
    ];

    const config = {
      ...baseConfig,
      excludeAuthors: ["excluded"],
    };

    const markdown = await generateMarkDown(commits, config);
    expect(markdown).not.toContain("excluded user");
    expect(markdown).toContain("Included User");
  });

  test("should not include contributors when noAuthors is true", async () => {
    const commits: GitCommit[] = [
      {
        shortHash: "abc123",
        message: "feat: add feature",
        author: {
          name: "test user",
          email: "test@example.com",
        },
        type: "feat",
        scope: "",
        description: "add feature",
        body: "",
        isBreaking: false,
        references: [],
        authors: [],
      },
    ];

    const config = {
      ...baseConfig,
      noAuthors: true,
    };

    const markdown = await generateMarkDown(commits, config);
    expect(markdown).not.toContain("### ❤️ Contributors");
  });

  test("should handle commits without authors", async () => {
    const commits: GitCommit[] = [
      {
        shortHash: "abc123",
        message: "feat: add feature",
        author: null as unknown as GitCommitAuthor,
        type: "feat",
        scope: "",
        description: "add feature",
        body: "",
        isBreaking: false,
        references: [],
        authors: [],
      },
    ];

    const markdown = await generateMarkDown(commits, baseConfig);
    expect(markdown).toContain("- Add feature");
    expect(markdown).not.toContain("### ❤️ Contributors");
  });
});
