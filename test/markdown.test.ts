import { promises as fsp } from "node:fs";
import { describe, expect, test } from "vitest";
import {
  loadChangelogConfig,
  generateMarkDown,
  parseChangelogMarkdown,
} from "../src";
import type { GitCommit } from "../src/git";

describe("markdown", () => {
  test("should not add an extra space after a gitmoji code in a description (#122)", async () => {
    const config = await loadChangelogConfig(process.cwd(), {
      from: "1.0.0",
      newVersion: "2.0.0",
      noAuthors: true,
    });
    const commits = [
      {
        author: { name: "John Doe", email: "john@doe.com" },
        message: "feat: add :sparkles: feature",
        shortHash: "1234",
        body: "",
        type: "feat",
        description: "add :sparkles: feature",
        scope: "",
        references: [],
        authors: [],
        isBreaking: false,
      } as GitCommit,
    ];
    const contents = await generateMarkDown(commits, config);
    // The gitmoji code is replaced by the emoji; the space that followed
    // the code in the description must stay a single space.
    expect(contents).toContain("- Add ✨ feature");
    expect(contents).not.toContain("✨  ");
  });
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
});
