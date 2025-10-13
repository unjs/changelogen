import { beforeEach, describe, expect, test, vi } from "vitest";
import { loadChangelogConfig } from "../src";
import {
  getGithubChangelog,
  getGithubReleaseByTag,
  getPullRequestAuthorLogin,
  githubNewReleaseURL,
  listGithubReleases,
  resolveGithubToken,
  syncGithubRelease,
} from "../src/github";

vi.mock("ofetch", () => ({
  $fetch: vi.fn(),
}));

describe("github", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("getPullRequestAuthorLogin should return undefined when API call fails", async () => {
    const { $fetch } = await import("ofetch");
    vi.mocked($fetch).mockRejectedValueOnce(new Error("API Error"));

    const config = await loadChangelogConfig(process.cwd(), {
      repo: "test/repo",
    });

    const result = await getPullRequestAuthorLogin(config, 123);
    expect(result).toBeUndefined();
  });

  test("listGithubReleases should fetch releases with pagination", async () => {
    const { $fetch } = await import("ofetch");
    const mockReleases = [{ tag_name: "v1.0.0" }, { tag_name: "v0.9.0" }];
    vi.mocked($fetch).mockResolvedValueOnce(mockReleases);

    const config = await loadChangelogConfig(process.cwd(), {
      repo: "test/repo",
    });

    const releases = await listGithubReleases(config);
    expect(releases).toEqual(mockReleases);
    expect($fetch).toHaveBeenCalledWith("/repos/test/repo/releases", {
      baseURL: "https://api.github.com",
      headers: {
        "x-github-api-version": "2022-11-28",
        authorization: undefined,
      },
      query: { per_page: 100 },
    });
  });

  test("getGithubReleaseByTag should fetch specific release", async () => {
    const { $fetch } = await import("ofetch");
    const mockRelease = { tag_name: "v1.0.0", body: "Release notes" };
    vi.mocked($fetch).mockResolvedValueOnce(mockRelease);

    const config = await loadChangelogConfig(process.cwd(), {
      repo: "test/repo",
    });

    const release = await getGithubReleaseByTag(config, "v1.0.0");
    expect(release).toEqual(mockRelease);
    expect($fetch).toHaveBeenCalledWith(
      "/repos/test/repo/releases/tags/v1.0.0",
      {
        baseURL: "https://api.github.com",
        headers: {
          "x-github-api-version": "2022-11-28",
          authorization: undefined,
        },
      }
    );
  });

  test("syncGithubRelease should create new release when none exists", async () => {
    const { $fetch } = await import("ofetch");
    vi.mocked($fetch).mockRejectedValueOnce(new Error("Not found"));
    vi.mocked($fetch).mockResolvedValueOnce({ id: "new-release-id" });

    const config = await loadChangelogConfig(process.cwd(), {
      repo: "test/repo",
      tokens: { github: "test-token" },
    });

    const result = await syncGithubRelease(config, {
      version: "1.0.0",
      body: "Release notes",
    });

    expect(result).toEqual({
      status: "created",
      id: "new-release-id",
    });
  });

  test("syncGithubRelease should return manual URL when no token", async () => {
    const config = await loadChangelogConfig(process.cwd(), {
      repo: "test/repo",
    });

    const result = await syncGithubRelease(config, {
      version: "1.0.0",
      body: "Release notes",
    });

    expect(result).toEqual({
      status: "manual",
      url: expect.stringContaining("/releases/new?tag=v1.0.0"),
    });
  });

  test("githubNewReleaseURL should generate correct URL with encoded body", async () => {
    const config = await loadChangelogConfig(process.cwd(), {
      repo: "test/repo",
    });

    const url = githubNewReleaseURL(config, {
      version: "1.0.0",
      body: "Release notes with spaces & special chars",
    });

    expect(url).toBe(
      "https://github.com/test/repo/releases/new?tag=v1.0.0&title=v1.0.0&body=Release%20notes%20with%20spaces%20%26%20special%20chars"
    );
  });

  test("GitHub Enterprise API URLs should be handled correctly", async () => {
    const { $fetch } = await import("ofetch");
    vi.mocked($fetch).mockResolvedValueOnce([]);

    const config = await loadChangelogConfig(process.cwd(), {
      tokens: { github: "test-token" },
      // Override the domain to simulate enterprise GitHub
      repo: {
        domain: "github.enterprise.com",
        repo: "test/repo",
      },
    });

    await listGithubReleases(config);

    expect($fetch).toHaveBeenCalledWith("/repos/test/repo/releases", {
      baseURL: "https://github.enterprise.com/api/v3",
      headers: {
        "x-github-api-version": "2022-11-28",
        authorization: "Bearer test-token",
      },
      query: { per_page: 100 },
    });
  });

  test("getGithubChangelog should fetch changelog from main branch", async () => {
    const { $fetch } = await import("ofetch");
    const mockChangelog = "# Changelog";
    vi.mocked($fetch).mockResolvedValueOnce(mockChangelog);

    const config = await loadChangelogConfig(process.cwd(), {
      repo: "test/repo",
    });

    const changelog = await getGithubChangelog(config);
    expect(changelog).toBe(mockChangelog);
    expect($fetch).toHaveBeenCalledWith(
      "https://raw.githubusercontent.com/test/repo/main/CHANGELOG.md",
      expect.any(Object)
    );
  });

  test("syncGithubRelease should handle update errors", async () => {
    const { $fetch } = await import("ofetch");
    vi.mocked($fetch).mockResolvedValueOnce({ id: "existing-id" });
    vi.mocked($fetch).mockRejectedValueOnce(new Error("Update failed"));

    const config = await loadChangelogConfig(process.cwd(), {
      repo: "test/repo",
      tokens: { github: "test-token" },
    });

    const result = await syncGithubRelease(config, {
      version: "1.0.0",
      body: "Release notes",
    });

    expect(result).toEqual({
      status: "manual",
      error: expect.any(Error),
      url: expect.stringContaining("/releases/new?tag=v1.0.0"),
    });
  });

  test("resolveGithubToken should handle environment variables", async () => {
    const originalEnv = process.env;
    process.env = { ...originalEnv, GITHUB_TOKEN: "test-token" };

    const config = await loadChangelogConfig(process.cwd(), {
      repo: "test/repo",
    });

    const token = await resolveGithubToken(config);
    expect(token).toBe("test-token");

    process.env = originalEnv;
  });

  test("resolveGithubToken should try multiple environment variables", async () => {
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      CHANGELOGEN_TOKENS_GITHUB: "changelogen-token",
      GITHUB_TOKEN: "github-token",
      GH_TOKEN: "gh-token",
    };

    const config = await loadChangelogConfig(process.cwd(), {
      repo: "test/repo",
    });

    const token = await resolveGithubToken(config);
    expect(token).toBe("changelogen-token"); // Should use first available token

    process.env = originalEnv;
  });

  test("resolveGithubToken should return undefined when no token sources available", async () => {
    const originalEnv = process.env;
    process.env = { ...originalEnv }; // Clear token env vars
    delete process.env.CHANGELOGEN_TOKENS_GITHUB;
    delete process.env.GITHUB_TOKEN;
    delete process.env.GH_TOKEN;

    const config = await loadChangelogConfig(process.cwd(), {
      repo: "test/repo",
    });

    const token = await resolveGithubToken(config);
    expect(token).toBeUndefined();

    process.env = originalEnv;
  });
});
