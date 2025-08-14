import { describe, expect, test } from "vitest";
import { getRepoConfig } from "../src";

describe("repo", () => {
  describe("getRepoConfig", () => {
    describe("when `m.repo` and `m.provider` are defined", () => {
      test.each([
        {
          input: "github:donaldsh/test",
          output: {
            domain: "github.com",
            provider: "github",
            repo: "donaldsh/test",
            protocol: "https:",
          },
        },
        {
          input: "gitlab:donaldsh/test.git",
          output: {
            domain: "gitlab.com",
            provider: "gitlab",
            repo: "donaldsh/test",
            protocol: "https:",
          },
        },
        {
          input: "gitlab:donaldsh/test.git",
          output: {
            domain: "gitlab.com",
            provider: "gitlab",
            repo: "donaldsh/test",
            protocol: "https:",
          },
        },
        {
          input: "git@bitbucket.org:donaldsh/test.git",
          output: {
            domain: "bitbucket.org",
            provider: "bitbucket",
            repo: "donaldsh/test",
            protocol: "https:",
          },
        },
        {
          input: "a@x:b/c",
          output: {
            domain: "x",
            provider: "x",
            repo: "b/c",
            protocol: "https:",
          },
        },
      ])("url=$input should return RepoConfig", ({ input, output }) => {
        expect(getRepoConfig(input)).toEqual(output);
      });
    });

    describe("when `url` is defined", () => {
      test.each([
        {
          input: "https://github.com/unjs/changelogen.git",
          output: {
            domain: "github.com",
            provider: "github",
            repo: "unjs/changelogen",
            protocol: "https:",
          },
        },
        {
          input: "https://github.com/unjs/changelogen",
          output: {
            domain: "github.com",
            provider: "github",
            repo: "unjs/changelogen",
            protocol: "https:",
          },
        },
        {
          input: "https://github.com/myproject.git",
          output: {
            domain: "github.com",
            provider: "github",
            repo: "myproject",
            protocol: "https:",
          },
        },
        {
          input: "https://github.com/account/project/sub1/sub2/myproject.git",
          output: {
            domain: "github.com",
            provider: "github",
            repo: "account/project/sub1/sub2/myproject",
            protocol: "https:",
          },
        },
        {
          input: {
            repo: "http://192.168.1.10/unjs/changelogen.git",
            repoType: "gitlab",
          },
          output: {
            domain: "192.168.1.10",
            provider: "gitlab",
            repo: "unjs/changelogen",
            protocol: "http:",
          },
        },
        {
          input: {
            repo: "http://192.168.1.10:8888/unjs/changelogen.git",
            repoType: "gitlab",
          },
          output: {
            domain: "192.168.1.10:8888",
            provider: "gitlab",
            repo: "unjs/changelogen",
            protocol: "http:",
          },
        },
      ])("url=$input should return RepoConfig", ({ input, output }) => {
        if (typeof input === "string") {
          expect(getRepoConfig(input)).toEqual(output);
        } else {
          expect(getRepoConfig(input.repo, input.repoType)).toEqual(output);
        }
      });
    });

    describe("when only `m.repo` is defined", () => {
      test.each([
        {
          input: "donaldsh/test.git",
          output: {
            domain: "github.com",
            provider: "github",
            repo: "donaldsh/test",
            protocol: "https:",
          },
        },
        {
          input: "unjs/changelogen",
          output: {
            domain: "github.com",
            provider: "github",
            repo: "unjs/changelogen",
            protocol: "https:",
          },
        },
      ])("url=$input should return RepoConfig", ({ input, output }) => {
        expect(getRepoConfig(input)).toEqual(output);
      });
    });

    describe("when `repoUrl` is empty", () => {
      test("should return empty RepoConfig", () => {
        expect(getRepoConfig()).toEqual({});
      });
    });
  });
});
