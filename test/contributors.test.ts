import { describe, expect, test } from "vitest";
import { loadChangelogConfig, generateMarkDown } from "../src";
import { testCommits } from "./fixtures/commits";

describe("contributors", () => {
  test("should include authors", async () => {
    const config = await loadChangelogConfig(process.cwd(), {
      newVersion: "1.0.0",
    });
    const contents = await generateMarkDown(testCommits, config);

    expect(contents).toMatchInlineSnapshot(`
      "## v1.0.0


      ### 🚀 Enhancements

      - **scope:** Add feature

      ### 🩹 Fixes

      - **scope:** Resolve bug

      ### 📖 Documentation

      - **scope:** Update documentation

      ### 🏡 Chore

      - **scope:** Update dependencies

      ### ❤️ Contributors

      - John Doe ([@brainsucker](http://github.com/brainsucker))
      - Jane Smith <jane@smith.com>
      - Alice Johnson <alice@johnson.com>
      - Bob Williams <bob@williams.com>"
    `);
  });

  test("should skip authors", async () => {
    const config = await loadChangelogConfig(process.cwd(), {
      newVersion: "1.0.0",
      skipAuthors: true,
    });
    const contents = await generateMarkDown(testCommits, config);

    expect(contents).toMatchInlineSnapshot(`
      "## v1.0.0


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
});
