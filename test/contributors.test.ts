import { describe, expect, test } from "vitest";
import { loadChangelogConfig, generateMarkDown } from "../src";
import { testCommits } from "./fixtures/commits";

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

  test("should dedupe authors that share an email under different names", async () => {
    const config = await loadChangelogConfig(process.cwd(), {
      from: "1.0.0",
      newVersion: "2.0.0",
    });
    const commits = [
      {
        author: {
          name: "Colin Ozanne",
          email: "git@finxol.io",
        },
        message: "feat: first",
        shortHash: "aaaa",
        body: "",
        type: "feat",
        description: "first",
        scope: "",
        references: [],
        authors: [],
        isBreaking: false,
      },
      {
        author: {
          name: "Finxol",
          email: "git@finxol.io",
        },
        message: "fix: second",
        shortHash: "bbbb",
        body: "",
        type: "fix",
        description: "second",
        scope: "",
        references: [],
        authors: [],
        isBreaking: false,
      },
      {
        author: {
          name: "Other Person",
          email: "other@example.com",
        },
        message: "chore: third",
        shortHash: "cccc",
        body: "",
        type: "chore",
        description: "third",
        scope: "",
        references: [],
        authors: [],
        isBreaking: false,
      },
    ];
    const contents = await generateMarkDown(commits as any, config);

    // Last name for the shared email wins; only one contributor line for it.
    expect(contents).toContain("Finxol");
    expect(contents).not.toContain("Colin Ozanne");
    expect(contents).toContain("Other Person");
    const contributorLines = contents
      .split("\n")
      .filter(
        (l) =>
          l.startsWith("- ") &&
          (l.includes("Finxol") || l.includes("finxol") || l.includes("Colin"))
      );
    expect(contributorLines).toHaveLength(1);
    expect(contributorLines[0]).toContain("Finxol");
  });

  test("should keep unrelated emails on the previous display name when one email moves", async () => {
    const config = await loadChangelogConfig(process.cwd(), {
      from: "1.0.0",
      newVersion: "2.0.0",
    });
    const commits = [
      {
        author: {
          name: "Alex",
          email: "alex@example.com",
        },
        message: "feat: first",
        shortHash: "aaaa",
        body: "",
        type: "feat",
        description: "first",
        scope: "",
        references: [],
        authors: [],
        isBreaking: false,
      },
      {
        author: {
          name: "Alex",
          email: "alex.other@example.com",
        },
        message: "feat: second",
        shortHash: "bbbb",
        body: "",
        type: "feat",
        description: "second",
        scope: "",
        references: [],
        authors: [],
        isBreaking: false,
      },
      {
        author: {
          name: "Sam",
          email: "alex@example.com",
        },
        message: "fix: third",
        shortHash: "cccc",
        body: "",
        type: "fix",
        description: "third",
        scope: "",
        references: [],
        authors: [],
        isBreaking: false,
      },
    ];
    const contents = await generateMarkDown(commits as any, config);

    expect(contents).toContain("Sam");
    expect(contents).toContain("Alex");
    // Shared email moved to Sam; Alex's other email must remain under Alex.
    const lines = contents.split("\n").filter((l) => l.startsWith("- "));
    expect(lines.some((l) => l.includes("Sam"))).toBe(true);
    expect(lines.some((l) => l.includes("Alex"))).toBe(true);
  });
});
