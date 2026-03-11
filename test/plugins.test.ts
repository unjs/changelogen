import { describe, it, expect, beforeEach } from "vitest";
import { PluginManager } from "../src/plugins/manager";
import type { ChangelogPlugin, PluginContext } from "../src/plugins/types";
import type { ResolvedChangelogConfig } from "../src/config";
import type { GitCommit } from "../src/git";

// Mock plugin for testing
class TestPlugin implements ChangelogPlugin {
  name = "test-plugin";
  version = "1.0.0";

  private initialized = false;

  init(context: PluginContext): void {
    this.initialized = true;
  }

  afterCommitParsing(commits: GitCommit[]): GitCommit[] {
    return commits.map((commit) => ({
      ...commit,
      description: `[TEST] ${commit.description}`,
    }));
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

// Mock configuration
const mockConfig: ResolvedChangelogConfig = {
  cwd: "/test",
  types: {
    feat: { title: "Features", semver: "minor" },
    fix: { title: "Fixes", semver: "patch" },
  },
  scopeMap: {},
  repo: {
    provider: "github",
    domain: "github.com",
    repo: "test/repo",
  },
  tokens: {},
  from: "v1.0.0",
  to: "HEAD",
  output: "CHANGELOG.md",
  publish: {
    private: false,
    tag: "latest",
    args: [],
  },
  templates: {
    commitMessage: "chore(release): v{{newVersion}}",
    tagMessage: "v{{newVersion}}",
    tagBody: "v{{newVersion}}",
  },
  excludeAuthors: [],
  noAuthors: false,
  strictPath: false,
  plugins: {},
};

describe("PluginManager", () => {
  let pluginManager: PluginManager;

  beforeEach(() => {
    pluginManager = new PluginManager(mockConfig);
  });

  it("should initialize without plugins", () => {
    expect(pluginManager.hasPlugins()).toBe(false);
    expect(pluginManager.getLoadedPlugins()).toHaveLength(0);
  });

  it("should execute hooks when no plugins are loaded", async () => {
    const mockCommits: GitCommit[] = [
      {
        message: "feat: add feature",
        body: "",
        shortHash: "abc123",
        fullHash: "abc123456",
        author: { name: "Test User", email: "test@example.com" },
        description: "add feature",
        type: "feat",
        scope: "",
        references: [],
        authors: [],
        isBreaking: false,
      },
    ];

    const result = await pluginManager.afterCommitParsing(mockCommits);
    expect(result).toEqual(mockCommits);
  });

  it("should load and execute plugin hooks", async () => {
    const testPlugin = new TestPlugin();

    // Manually add plugin for testing (simulating successful load)
    (pluginManager as any).plugins = [testPlugin];

    // Initialize plugins
    await pluginManager.executeHook("init", {
      config: mockConfig,
      logger: console,
    });

    expect(testPlugin.isInitialized()).toBe(true);
    expect(pluginManager.hasPlugins()).toBe(true);
    expect(pluginManager.getLoadedPlugins()).toHaveLength(1);

    // Test hook execution
    const mockCommits: GitCommit[] = [
      {
        message: "feat: add feature",
        body: "",
        shortHash: "abc123",
        fullHash: "abc123456",
        author: { name: "Test User", email: "test@example.com" },
        description: "add feature",
        type: "feat",
        scope: "",
        references: [],
        authors: [],
        isBreaking: false,
      },
    ];

    const result = await pluginManager.afterCommitParsing(mockCommits);
    expect(result[0].description).toBe("[TEST] add feature");
  });
});
