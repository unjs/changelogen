import { describe, expect, type MockedFunction, test, vi } from "vitest";
import { generateMarkDown, loadChangelogConfig } from "../src";
import { getPullRequestAuthorLogin } from "../src/github";

// Mock fetch to avoid real network calls during tests
vi.mock("node-fetch-native", () => ({
  fetch: vi.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ user: null }),
    })
  ),
}));

// Mock GitHub API calls to avoid real network requests
vi.mock("ofetch", () => ({
  $fetch: vi.fn(),
}));

describe("PR Author Fallback", () => {
  test("should use PR author login when email resolution fails", async () => {
    // Mock the GitHub API response
    const { $fetch } = await import("ofetch");
    const mockFetch = $fetch as MockedFunction<typeof $fetch>;
    mockFetch.mockResolvedValue({
      user: {
        login: "pr-author-username",
      },
    });

    const config = await loadChangelogConfig(process.cwd(), {
      from: "1.0.0",
      newVersion: "2.0.0",
      repo: "unjs/changelogen",
      tokens: { github: "test-token" },
    });

    const testCommits = [
      {
        author: {
          name: "PR Author",
          email: "pr-author@private.com",
        },
        message: "feat: add feature (#123)",
        shortHash: "1234",
        body: "body",
        type: "feat",
        description: "add feature (#123)",
        scope: "scope",
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

    // Should show GitHub username from PR lookup fallback
    expect(contents).toContain("PR Author");
    expect(contents).toContain("[@pr-author-username]");

    // Verify the GitHub API was called correctly
    expect(mockFetch).toHaveBeenCalledWith(
      "/repos/unjs/changelogen/pulls/123",
      expect.objectContaining({
        baseURL: "https://api.github.com",
        headers: expect.objectContaining({
          authorization: "Bearer test-token",
        }),
      })
    );
  });

  test("should handle GitHub API errors gracefully", async () => {
    // Mock the GitHub API to throw an error
    const { $fetch } = await import("ofetch");
    const mockFetch = $fetch as MockedFunction<typeof $fetch>;
    mockFetch.mockRejectedValue(new Error("API Error"));

    const config = await loadChangelogConfig(process.cwd(), {
      from: "1.0.0",
      newVersion: "2.0.0",
      repo: "unjs/changelogen",
      tokens: { github: "test-token" },
    });

    // Test the getPullRequestAuthorLogin function directly
    const result = await getPullRequestAuthorLogin(config, 123);
    expect(result).toBeUndefined();
  });

  test("should not attempt PR lookup for non-GitHub repos", async () => {
    const config = await loadChangelogConfig(process.cwd(), {
      from: "1.0.0",
      newVersion: "2.0.0",
      repo: "gitlab.com/user/repo",
    });

    const testCommits = [
      {
        author: {
          name: "Test Author",
          email: "test@private.com",
        },
        message: "feat: add feature (#123)",
        shortHash: "1234",
        body: "body",
        type: "feat",
        description: "add feature (#123)",
        scope: "scope",
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

    // Should show author name with email since no GitHub username lookup
    expect(contents).toContain("Test Author <test@private.com>");
  });

  test("should extract PR number from commit references correctly", async () => {
    const { $fetch } = await import("ofetch");
    const mockFetch = $fetch as MockedFunction<typeof $fetch>;
    mockFetch.mockResolvedValue({
      user: {
        login: "contributor-123",
      },
    });

    const config = await loadChangelogConfig(process.cwd(), {
      from: "1.0.0",
      newVersion: "2.0.0",
      repo: "unjs/changelogen",
      tokens: { github: "test-token" },
    });

    const testCommits = [
      {
        author: {
          name: "Test Contributor",
          email: "contributor@private.com",
        },
        message: "fix: resolve issue (#456)",
        shortHash: "abc123",
        body: "body",
        type: "fix",
        description: "resolve issue (#456)",
        scope: "",
        references: [
          {
            type: "pull-request" as const,
            value: "#456",
          },
        ],
        authors: [],
        isBreaking: false,
      },
    ];

    const contents = await generateMarkDown(testCommits, config);

    // Should extract PR number 456 and use it for GitHub lookup
    expect(mockFetch).toHaveBeenCalledWith(
      "/repos/unjs/changelogen/pulls/456",
      expect.any(Object)
    );
    expect(contents).toContain("[@contributor-123]");
  });

  test("should handle missing author gracefully", async () => {
    const config = await loadChangelogConfig(process.cwd(), {
      from: "1.0.0",
      newVersion: "2.0.0",
      repo: "unjs/changelogen",
    });

    const testCommits = [
      {
        author: {
          name: "",
          email: "",
        },
        message: "feat: add feature",
        shortHash: "1234",
        body: "body",
        type: "feat",
        description: "add feature",
        scope: "",
        references: [],
        authors: [],
        isBreaking: false,
      },
    ];

    const contents = await generateMarkDown(testCommits, config);

    // Should not crash and should not include contributors section for empty authors
    expect(contents).not.toContain("❤️ Contributors");
  });

  test("should handle commits without PR references", async () => {
    const config = await loadChangelogConfig(process.cwd(), {
      from: "1.0.0",
      newVersion: "2.0.0",
      repo: "unjs/changelogen",
    });

    const testCommits = [
      {
        author: {
          name: "Direct Commit Author",
          email: "direct@private.com",
        },
        message: "feat: direct commit without PR",
        shortHash: "abc123",
        body: "body",
        type: "feat",
        description: "direct commit without PR",
        scope: "",
        references: [
          {
            type: "hash" as const,
            value: "abc123",
          },
        ],
        authors: [],
        isBreaking: false,
      },
    ];

    const contents = await generateMarkDown(testCommits, config);

    // Should show author with email since no PR to look up
    expect(contents).toContain("Direct Commit Author <direct@private.com>");
  });

  test("getPullRequestAuthorLogin should return undefined for invalid PR response", async () => {
    const { $fetch } = await import("ofetch");
    const mockFetch = $fetch as MockedFunction<typeof $fetch>;
    mockFetch.mockResolvedValue({
      // Missing user.login property
      user: null,
    });

    const config = await loadChangelogConfig(process.cwd(), {
      repo: "unjs/changelogen",
      tokens: { github: "test-token" },
    });

    const result = await getPullRequestAuthorLogin(config, 123);
    expect(result).toBeUndefined();
  });
});
