import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { resolveGithubToken } from "../src/github";
import type { ResolvedChangelogConfig } from "../src/config";

const baseConfig = {
  repo: {
    domain: "github.com",
    provider: "github",
    repo: "unjs/changelogen",
  },
} as ResolvedChangelogConfig;

const TOKEN_ENV_KEYS = [
  "CHANGELOGEN_TOKENS_GITHUB",
  "GITHUB_TOKEN",
  "GH_TOKEN",
] as const;

describe("resolveGithubToken", () => {
  const savedEnv: Partial<
    Record<(typeof TOKEN_ENV_KEYS)[number], string | undefined>
  > = {};
  let previousXdg: string | undefined;
  let tempConfigHome: string | undefined;

  beforeEach(() => {
    for (const key of TOKEN_ENV_KEYS) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
    previousXdg = process.env.XDG_CONFIG_HOME;
  });

  afterEach(async () => {
    for (const key of TOKEN_ENV_KEYS) {
      if (savedEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = savedEnv[key];
      }
    }
    if (previousXdg === undefined) {
      delete process.env.XDG_CONFIG_HOME;
    } else {
      process.env.XDG_CONFIG_HOME = previousXdg;
    }
    if (tempConfigHome) {
      await rm(tempConfigHome, { recursive: true, force: true });
      tempConfigHome = undefined;
    }
  });

  test("prefers environment variables", async () => {
    process.env.GH_TOKEN = "env-token";
    await expect(resolveGithubToken(baseConfig)).resolves.toBe("env-token");
  });

  test("reads oauth_token from gh hosts.yml", async () => {
    tempConfigHome = await mkdtemp(join(tmpdir(), "changelogen-gh-"));
    process.env.XDG_CONFIG_HOME = tempConfigHome;
    await mkdir(join(tempConfigHome, "gh"), { recursive: true });
    await writeFile(
      join(tempConfigHome, "gh", "hosts.yml"),
      "github.com:\n  oauth_token: hosts-yml-token\n  user: demo\n",
      "utf8"
    );

    await expect(resolveGithubToken(baseConfig)).resolves.toBe(
      "hosts-yml-token"
    );
  });

  test("falls back to gh auth token when hosts.yml has no oauth_token", async () => {
    tempConfigHome = await mkdtemp(join(tmpdir(), "changelogen-gh-"));
    process.env.XDG_CONFIG_HOME = tempConfigHome;
    await mkdir(join(tempConfigHome, "gh"), { recursive: true });
    // Keyring-backed login: host entry exists but token is not in the file
    await writeFile(
      join(tempConfigHome, "gh", "hosts.yml"),
      "github.com:\n  user: demo\n  git_protocol: https\n",
      "utf8"
    );

    const getGhCliToken = vi.fn().mockReturnValue("cli-token");
    await expect(
      resolveGithubToken(baseConfig, { getGhCliToken })
    ).resolves.toBe("cli-token");
    expect(getGhCliToken).toHaveBeenCalledWith("github.com");
  });

  test("does not call gh CLI when hosts.yml already has oauth_token", async () => {
    tempConfigHome = await mkdtemp(join(tmpdir(), "changelogen-gh-"));
    process.env.XDG_CONFIG_HOME = tempConfigHome;
    await mkdir(join(tempConfigHome, "gh"), { recursive: true });
    await writeFile(
      join(tempConfigHome, "gh", "hosts.yml"),
      "github.com:\n  oauth_token: hosts-yml-token\n",
      "utf8"
    );

    const getGhCliToken = vi.fn().mockReturnValue("should-not-be-used");
    await expect(
      resolveGithubToken(baseConfig, { getGhCliToken })
    ).resolves.toBe("hosts-yml-token");
    expect(getGhCliToken).not.toHaveBeenCalled();
  });

  test("soft-fails when gh CLI token lookup throws", async () => {
    tempConfigHome = await mkdtemp(join(tmpdir(), "changelogen-gh-"));
    process.env.XDG_CONFIG_HOME = tempConfigHome;

    const getGhCliToken = vi.fn().mockImplementation(() => {
      throw new Error("gh not found");
    });
    await expect(
      resolveGithubToken(baseConfig, { getGhCliToken })
    ).resolves.toBeUndefined();
  });
});
