import { describe, it, expect, vi } from "vitest";

const mocks = vi.hoisted(() => {
  return {
    mockGithubFetch: vi.fn(),
  };
});

describe("github", () => {
  describe("listGithubReleases", () => {
    it("should call githubFetch with the correct parameters", async () => {
      vi.mock("ofetch", () => ({
        $fetch: mocks.mockGithubFetch,
      }));
      const config = {
        repo: { repo: "owner/repo", domain: "domain" },
        tokens: { github: "test-token" },
      };
      const { listGithubReleases } = await import("../src/github");

      await listGithubReleases(config as any);

      expect(mocks.mockGithubFetch).toHaveBeenCalledWith(
        "/repos/owner/repo/releases",
        {
          baseURL: "https://domain/api/v3",
          headers: {
            authorization: "Bearer test-token",
            "x-github-api-version": "2022-11-28",
          },
          query: {
            per_page: 100,
          },
        }
      );
    });
  });

  describe("getGithubReleaseByTag", () => {
    it("should call githubFetch with the correct parameters", async () => {
      vi.mock("ofetch", () => ({
        $fetch: mocks.mockGithubFetch,
      }));
      const config = {
        repo: { repo: "owner/repo", domain: "domain" },
        tokens: { github: "test-token" },
      };
      const { getGithubReleaseByTag } = await import("../src/github");

      await getGithubReleaseByTag(config as any, "v1.0.0");

      expect(mocks.mockGithubFetch).toHaveBeenCalledWith(
        "/repos/owner/repo/releases/tags/v1.0.0",
        {
          baseURL: "https://domain/api/v3",
          headers: {
            authorization: "Bearer test-token",
            "x-github-api-version": "2022-11-28",
          },
        }
      );
    });
  });

  describe("getGithubChangelog", () => {
    it("should call githubFetch with the correct parameters", async () => {
      vi.mock("ofetch", () => ({
        $fetch: mocks.mockGithubFetch,
      }));
      const config = {
        repo: { repo: "owner/repo", domain: "domain" },
        tokens: { github: "test-token" },
      };
      const { getGithubChangelog } = await import("../src/github");

      await getGithubChangelog(config as any);

      expect(mocks.mockGithubFetch).toHaveBeenCalledWith(
        "https://raw.githubusercontent.com/owner/repo/main/CHANGELOG.md",
        {
          baseURL: "https://domain/api/v3",
          headers: {
            authorization: "Bearer test-token",
            "x-github-api-version": "2022-11-28",
          },
        }
      );
    });
  });

  describe("createGithubRelease", () => {
    it("should call githubFetch with the correct parameters", async () => {
      vi.mock("ofetch", () => ({
        $fetch: mocks.mockGithubFetch,
      }));
      const config = {
        repo: { repo: "owner/repo", domain: "domain" },
        tokens: { github: "test-token" },
      };
      const { createGithubRelease } = await import("../src/github");

      await createGithubRelease(config as any, { tag_name: "v1.0.0" });

      expect(mocks.mockGithubFetch).toHaveBeenCalledWith(
        "/repos/owner/repo/releases",
        {
          baseURL: "https://domain/api/v3",
          body: {
            tag_name: "v1.0.0",
          },
          headers: {
            authorization: "Bearer test-token",
            "x-github-api-version": "2022-11-28",
          },
          method: "POST",
        }
      );
    });
  });

  describe("updateGithubRelease", () => {
    it("should call githubFetch with the correct parameters", async () => {
      vi.mock("ofetch", () => ({
        $fetch: mocks.mockGithubFetch,
      }));
      const config = {
        repo: { repo: "owner/repo", domain: "domain" },
        tokens: { github: "test-token" },
      };
      const { updateGithubRelease } = await import("../src/github");

      await updateGithubRelease(config as any, "id", { tag_name: "v1.0.0" });

      expect(mocks.mockGithubFetch).toHaveBeenCalledWith(
        "/repos/owner/repo/releases/id",
        {
          baseURL: "https://domain/api/v3",
          body: {
            tag_name: "v1.0.0",
          },
          headers: {
            authorization: "Bearer test-token",
            "x-github-api-version": "2022-11-28",
          },
          method: "PATCH",
        }
      );
    });
  });

  describe("githubNewReleaseURL", () => {
    it("should return expected value", async () => {
      const config = {
        repo: { repo: "owner/repo", domain: "domain" },
        tokens: { github: "test-token" },
      };
      const release = { version: "1.0.0", body: "Release notes" };
      const { githubNewReleaseURL } = await import("../src/github");

      const actual = githubNewReleaseURL(config as any, release);

      expect(actual).toBe(
        "https://domain/owner/repo/releases/new?tag=v1.0.0&title=v1.0.0&body=Release%20notes"
      );
    });
  });

  describe("resolveGithubToken", () => {
    it("should return the token if it exists CHANGELOGEN_TOKENS_GITHUB", async () => {
      process.env.CHANGELOGEN_TOKENS_GITHUB = "CHANGELOGEN_TOKENS_GITHUB";
      const config = {
        tokens: { github: "token" },
      };
      const { resolveGithubToken } = await import("../src/github");

      const actual = await resolveGithubToken(config as any);

      expect(actual).toBe("CHANGELOGEN_TOKENS_GITHUB");
      delete process.env.CHANGELOGEN_TOKENS_GITHUB;
    });

    it("should return the token if it exists GITHUB_TOKEN", async () => {
      process.env.GITHUB_TOKEN = "GITHUB_TOKEN";
      const config = {
        tokens: { github: "token" },
      };
      const { resolveGithubToken } = await import("../src/github");

      const actual = await resolveGithubToken(config as any);

      expect(actual).toBe("GITHUB_TOKEN");
      delete process.env.GITHUB_TOKEN;
    });

    it("should return the token if it exists GH_TOKEN", async () => {
      process.env.GH_TOKEN = "GH_TOKEN";
      const config = {
        tokens: { github: "token" },
      };
      const { resolveGithubToken } = await import("../src/github");

      const actual = await resolveGithubToken(config as any);

      expect(actual).toBe("GH_TOKEN");
      delete process.env.GH_TOKEN;
    });
  });

  describe("syncGithubRelease", () => {
    it("if tokens undefined, should return status is manual", async () => {
      vi.mock("ofetch", () => ({
        $fetch: mocks.mockGithubFetch,
      }));
      const config = {
        repo: { repo: "owner/repo", domain: "domain" },
        tokens: { github: undefined },
      };
      const release = {
        version: "1.0.0",
        body: "Release notes",
      };
      const { syncGithubRelease } = await import("../src/github");

      const actual = await syncGithubRelease(config as any, release);

      expect(actual.status).toBe("manual");
    });

    it("if currentGhRelease exists, should return status is updated", async () => {
      vi.mock("ofetch", () => ({
        $fetch: mocks.mockGithubFetch.mockResolvedValue({
          id: "id",
          tag_name: "v1.0.0",
        }),
      }));
      const config = {
        repo: { repo: "owner/repo", domain: "domain" },
        tokens: { github: "test-token" },
      };
      const release = {
        version: "1.0.0",
        body: "Release notes",
      };
      const { syncGithubRelease } = await import("../src/github");

      const actual = await syncGithubRelease(config as any, release);

      expect(actual.status).toBe("updated");
    });
  });
});
