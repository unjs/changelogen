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
          },
        },
        {
          input: "gitlab:donaldsh/test.git",
          output: {
            domain: "gitlab.com",
            provider: "gitlab",
            repo: "donaldsh/test",
          },
        },
        {
          input: "gitlab:donaldsh/test.git",
          output: {
            domain: "gitlab.com",
            provider: "gitlab",
            repo: "donaldsh/test",
          },
        },
        {
          input: "git@bitbucket.org:donaldsh/test.git",
          output: {
            domain: "bitbucket.org",
            provider: "bitbucket",
            repo: "donaldsh/test",
          },
        },
        {
          input: "a@x:b/c",
          output: {
            domain: "x",
            provider: "x",
            repo: "b/c",
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
          },
        },
        {
          input: "https://github.com/unjs/changelogen",
          output: {
            domain: "github.com",
            provider: "github",
            repo: "unjs/changelogen",
          },
        },
        {
          input: "https://github.com/myproject.git",
          output: {
            domain: "github.com",
            provider: "github",
            repo: "myproject",
          },
        },
        {
          input: "https://github.com/account/project/sub1/sub2/myproject.git",
          output: {
            domain: "github.com",
            provider: "github",
            repo: "account/project/sub1/sub2/myproject",
          },
        },
      ])("url=$input should return RepoConfig", ({ input, output }) => {
        expect(getRepoConfig(input)).toEqual(output);
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
          },
        },
        {
          input: "unjs/changelogen",
          output: {
            domain: "github.com",
            provider: "github",
            repo: "unjs/changelogen",
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
