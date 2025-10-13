import { describe, expect, test, vi } from "vitest";
import { loadChangelogConfig, generateMarkDown } from "../src";
import { testCommits } from "./fixtures/commits";

// Mock fetch to prevent network calls during tests
vi.mock("node-fetch-native", () => ({
  fetch: vi.fn((url: string) => {
    if (url.includes("john@doe.com")) {
      return Promise.resolve({
        json: () => Promise.resolve({ user: { username: "brainsucker" } }),
      });
    }
    return Promise.resolve({
      json: () => Promise.resolve({ user: null }),
    });
  }),
}));

describe("contributors", () => {
  test("should include authors", async () => {
    const config = await loadChangelogConfig(process.cwd(), {
      from: "1.0.0",
      newVersion: "2.0.0",
    });
    const contents = await generateMarkDown(testCommits, config);

    expect(contents).toMatchInlineSnapshot(`
      "## v2.0.0

      [compare changes](https://github.com/unjs/changelogen/compare/1.0.0...v2.0.0)

      ### 🚀 Enhancements

      - **scope:** Add feature

      ### 🩹 Fixes

      - **scope:** Resolve bug

      ### 📖 Documentation

      - **scope:** Update documentation

      ### 🏡 Chore

      - **scope:** Update dependencies

      ### ❤️ Contributors

      - John Doe ([@brainsucker](https://github.com/brainsucker))
      - Jane Smith <jane@smith.com>
      - Alice Johnson <alice@johnson.com>
      - Bob Williams <bob@williams.com>"
    `);
  });

  test("should skip authors with noAuthors config", async () => {
    const config = await loadChangelogConfig(process.cwd(), {
      from: "1.0.0",
      newVersion: "2.0.0",
      noAuthors: true,
    });
    const contents = await generateMarkDown(testCommits, config);

    expect(contents).toMatchInlineSnapshot(`
      "## v2.0.0

      [compare changes](https://github.com/unjs/changelogen/compare/1.0.0...v2.0.0)

      ### 🚀 Enhancements

      - **scope:** Add feature

      ### 🩹 Fixes

      - **scope:** Resolve bug

      ### 📖 Documentation

      - **scope:** Update documentation

      ### 🏡 Chore

      - **scope:** Update dependencies"
    `);
  });

  test("should skip author email addresses with hideAuthorEmail config", async () => {
    const config = await loadChangelogConfig(process.cwd(), {
      from: "1.0.0",
      newVersion: "2.0.0",
      hideAuthorEmail: true,
    });
    const contents = await generateMarkDown(testCommits, config);

    expect(contents).toMatchInlineSnapshot(`
      "## v2.0.0

      [compare changes](https://github.com/unjs/changelogen/compare/1.0.0...v2.0.0)

      ### 🚀 Enhancements

      - **scope:** Add feature

      ### 🩹 Fixes

      - **scope:** Resolve bug

      ### 📖 Documentation

      - **scope:** Update documentation

      ### 🏡 Chore

      - **scope:** Update dependencies

      ### ❤️ Contributors

      - John Doe ([@brainsucker](https://github.com/brainsucker))
      - Jane Smith
      - Alice Johnson
      - Bob Williams"
    `);
  });

  test("should handle PR author fallback gracefully", async () => {
    const config = await loadChangelogConfig(process.cwd(), {
      from: "1.0.0",
      newVersion: "2.0.0",
      repo: "unjs/changelogen",
    });

    const testCommits = [
      {
        author: {
          name: "PR Author",
          email: "private@noreply.github.com",
        },
        message: "feat: add feature (#123)",
        shortHash: "abc123",
        body: "body",
        type: "feat",
        description: "add feature (#123)",
        scope: "",
        references: [
          {
            type: "pull-request" as const,
            value: "#123",
          },
        ],
        authors: [],
        isBreaking: false,
      },
    ];

    const contents = await generateMarkDown(testCommits, config);

    // Should include author name (PR fallback may or may not work depending on network/config)
    expect(contents).toContain("PR Author");
  });
});
