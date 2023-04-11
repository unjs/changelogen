import { describe, test, expect } from "vitest";
import {
  getCommitMessage,
  getTagMessage,
  getTagBody,
  getTagMessagePattern,
} from "../src/template";
import { ChangelogConfig } from "../src";

describe("template", () => {
  test("getCommitMessage should work", () => {
    const result = getCommitMessage({
      templates: {
        commitMessage: "v{{newVersion}}",
      },
      newVersion: "1.0.0",
    } as ChangelogConfig);

    expect(result).toBe("v1.0.0");
  });
  test("getTagMessage should work", () => {
    const result = getTagMessage({
      templates: {
        tagMessage: "v{{newVersion}}",
      },
      newVersion: "1.0.0",
    } as ChangelogConfig);

    expect(result).toBe("v1.0.0");
  });
  test("getTagBody should work", () => {
    const result = getTagBody({
      templates: {
        tagBody: "Release new version: v{{newVersion}}",
      },
      newVersion: "1.0.0",
    } as ChangelogConfig);

    expect(result).toBe("Release new version: v1.0.0");
  });
  test("getTagMessagePattern should work", () => {
    const result = getTagMessagePattern({
      templates: {
        tagMessage: "v{{newVersion}}",
      },
      newVersion: "1.0.0",
    } as ChangelogConfig);

    expect(result).toBe("v*");
  });
});
