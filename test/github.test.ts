import { afterEach, describe, expect, test, vi } from "vitest";
import { $fetch } from "ofetch";
import { getGithubChangelog } from "../src/github";
import { ChangelogConfig } from "../src";

vi.mock("ofetch", () => ({
  $fetch: vi.fn(),
}));

describe("github", () => {
  afterEach(() => {
    vi.mocked($fetch).mockClear();
  });

  test("getGithubChangelog should work", async () => {
    await getGithubChangelog({
      cwd: "/bar",
      output: "/bar/CHANGELOG.md",
      repo: {
        domain: "github.com",
        repo: "foo",
      },
      tokens: {
        github: undefined,
      },
    } as ChangelogConfig);

    expect($fetch).toBeCalledTimes(1);
    expect($fetch).toBeCalledWith(
      `https://raw.githubusercontent.com/foo/main/CHANGELOG.md`,
      expect.anything()
    );
  });
});
