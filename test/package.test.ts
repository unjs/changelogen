import { promises as fsp } from "node:fs";
import { describe, expect, test } from "vitest";
import { readPackageJSON, writePackageJSON } from "../src/package";

describe("package", () => {
  const config = {
    cwd: "./test/fixtures",
    types: {},
    scopeMap: {},
    tokens: {},
    from: "",
    to: "",
    output: "",
    publish: {},
    templates: {},
    excludeAuthors: [],
  };

  test("read package.json with trailing newlines", async () => {
    const file = await readPackageJSON(config);

    expect(file).toMatchInlineSnapshot(`
      {
        "//": "This file must have an empty ending line",
      }
    `);
  });

  test("write package.json with trailing newlines", async () => {
    const file = await readPackageJSON(config);

    await writePackageJSON(config, file);

    const newFile = await fsp.readFile("./test/fixtures/package.json", "utf8");

    expect(newFile).toMatchInlineSnapshot(`
      "{
        "//": "This file must have an empty ending line"
      }
      "
    `);
  });
});
