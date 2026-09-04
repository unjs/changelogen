import { describe, expect, test } from "vitest";
import { parseCliArgs, type ArgsSpec } from "../src/args";

const spec = {
  dir: { type: "string" },
  r: { type: "string", short: "r" },
  bump: { type: "boolean" },
  commit: { type: "boolean" },
  output: { type: "optional" },
  canary: { type: "optional" },
} as const satisfies ArgsSpec;

describe("parseCliArgs", () => {
  test.each([
    { args: [], expected: { _: [] } },
    { args: ["--bump"], expected: { _: [], bump: true } },
    { args: ["--bump=false"], expected: { _: [], bump: false } },
    { args: ["--no-commit"], expected: { _: [], commit: false } },
    { args: ["--dir", "."], expected: { _: [], dir: "." } },
    { args: ["--dir=."], expected: { _: [], dir: "." } },
    { args: ["-r", "1.2.3"], expected: { _: [], r: "1.2.3" } },
    { args: ["--output"], expected: { _: [], output: true } },
    { args: ["--no-output"], expected: { _: [], output: false } },
    {
      args: ["--output", "CHANGELOG.md"],
      expected: { _: [], output: "CHANGELOG.md" },
    },
    {
      args: ["--canary", "--bump"],
      expected: { _: [], canary: true, bump: true },
    },
    { args: ["--canary", "next"], expected: { _: [], canary: "next" } },
    { args: ["--canary=next"], expected: { _: [], canary: "next" } },
    {
      args: ["release", "1.0.0", "--dir", "."],
      expected: { _: ["release", "1.0.0"], dir: "." },
    },
    { args: ["--", "--bump"], expected: { _: ["--bump"] } },
  ])("$args", ({ args, expected }) => {
    expect(parseCliArgs(args, spec)).toEqual(expected);
  });

  test("throws on unknown args", () => {
    expect(() => parseCliArgs(["--unknown"], spec)).toThrow(
      /Unknown option '--unknown'/
    );
  });
});
