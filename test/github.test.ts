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

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

// Minimal `Response` stand-in for the `res.json()` call in `githubFetch`
function jsonResponse(body: unknown) {
  return { json: () => Promise.resolve(body) };
}

function lastRequest() {
  const [url, init] = fetchMock.mock.calls.at(-1);
  return { url, headers: new Headers(init?.headers) };
}

describe("github", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("getPullRequestAuthorLogin should return undefined when API call fails", async () => {
    fetchMock.mockRejectedValueOnce(new Error("API Error"));

    const config = await loadChangelogConfig(process.cwd(), {
      repo: "test/repo",
    });

    const result = await getPullRequestAuthorLogin(config, 123);
    expect(result).toBeUndefined();
  });

  test("getPullRequestAuthorLogin should return the PR author login", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ user: { login: "brainsucker" } })
    );

    const config = await loadChangelogConfig(process.cwd(), {
      repo: "test/repo",
    });

    const result = await getPullRequestAuthorLogin(config, 123);
    expect(result).toBe("brainsucker");
    expect(lastRequest().url).toBe(
      "https://api.github.com/repos/test/repo/pulls/123"
    );
  });

  test("listGithubReleases should fetch releases", async () => {
    const mockReleases = [{ tag_name: "v1.0.0" }, { tag_name: "v0.9.0" }];
    fetchMock.mockResolvedValueOnce(jsonResponse(mockReleases));

    const config = await loadChangelogConfig(process.cwd(), {
      repo: "test/repo",
    });

    const releases = await listGithubReleases(config);
    expect(releases).toEqual(mockReleases);

    const { url, headers } = lastRequest();
    expect(url).toBe("https://api.github.com/repos/test/repo/releases");
    expect(headers.get("x-github-api-version")).toBe("2022-11-28");
    expect(headers.get("authorization")).toBeNull();
  });

  test("getGithubReleaseByTag should fetch specific release", async () => {
    const mockRelease = { tag_name: "v1.0.0", body: "Release notes" };
    fetchMock.mockResolvedValueOnce(jsonResponse(mockRelease));

    const config = await loadChangelogConfig(process.cwd(), {
      repo: "test/repo",
    });

    const release = await getGithubReleaseByTag(config, "v1.0.0");
    expect(release).toEqual(mockRelease);
    expect(lastRequest().url).toBe(
      "https://api.github.com/repos/test/repo/releases/tags/v1.0.0"
    );
  });

  test("syncGithubRelease should create new release when none exists", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Not found"));
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: "new-release-id" }));

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
    fetchMock.mockRejectedValueOnce(new Error("Not found"));

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
    fetchMock.mockResolvedValueOnce(jsonResponse([]));

    const config = await loadChangelogConfig(process.cwd(), {
      tokens: { github: "test-token" },
      // Override the domain to simulate enterprise GitHub
      repo: {
        domain: "github.enterprise.com",
        repo: "test/repo",
      },
    });

    await listGithubReleases(config);

    const { url, headers } = lastRequest();
    expect(url).toBe(
      "https://github.enterprise.com/api/v3/repos/test/repo/releases"
    );
    expect(headers.get("authorization")).toBe("Bearer test-token");
  });

  test("getGithubChangelog should fetch changelog from main branch", async () => {
    const mockChangelog = "# Changelog";
    fetchMock.mockResolvedValueOnce(jsonResponse(mockChangelog));

    const config = await loadChangelogConfig(process.cwd(), {
      repo: "test/repo",
    });

    const changelog = await getGithubChangelog(config);
    expect(changelog).toBe(mockChangelog);
  });

  test("syncGithubRelease should handle update errors", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: "existing-id" }));
    fetchMock.mockRejectedValueOnce(new Error("Update failed"));

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
