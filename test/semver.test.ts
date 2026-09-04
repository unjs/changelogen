import { mkdtemp, rm, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "pathe";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { bumpVersion } from "../src";
import type { ChangelogConfig } from "../src";

describe("bumpVersion", () => {
  let cwd: string;
  let config: ChangelogConfig;

  beforeEach(async () => {
    cwd = await mkdtemp(resolve(tmpdir(), "changelogen-semver-"));
    await writeFile(
      resolve(cwd, "package.json"),
      JSON.stringify({ name: "test-pkg", version: "1.2.3" }, null, 2)
    );
    config = { cwd, types: {} } as ChangelogConfig;
  });

  afterEach(async () => {
    await rm(cwd, { recursive: true, force: true });
  });

  it("does not throw when there are no commits and a version suffix is requested (#159)", async () => {
    const version = await bumpVersion([], config, { suffix: true });
    expect(version).toMatch(/^1\.2\.4-\d{8}-\d{6}$/);
    const pkg = JSON.parse(
      await readFile(resolve(cwd, "package.json"), "utf8")
    );
    expect(pkg.version).toBe(version);
  });
});
