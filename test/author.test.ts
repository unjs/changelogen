import { describe, expect, test } from "vitest";
import {
  getGitDiff,
  loadChangelogConfig,
  parseCommits,
  resolveAuthors,
} from "../src";
const config = await loadChangelogConfig(process.cwd());
describe("author", () => {
  test.runIf(config.tokens.github)(
    "resolves author info with GitHub token",
    async () => {
      const COMMIT_FROM = "610934e644e690c8d0d77197d018498fc43ab0e9";
      const COMMIT_TO = "14fa199c295a6e7620ff373a043790414d795fa5";

      const commits = await getGitDiff(COMMIT_FROM, COMMIT_TO);
      commits[1].message =
        "fix(scope)!: breaking change example, close #123 (#134)";

      const config = await loadChangelogConfig(process.cwd(), {
        from: COMMIT_FROM,
        to: COMMIT_TO,
      });

      const parsed = parseCommits(commits, config);
      const authors = await resolveAuthors(parsed, config);
      expect(authors).toMatchInlineSnapshot(
        `
    [
      {
        "commits": [
          "14fa199",
          "5bfe08e",
          "cb9adf4",
          "81f37bf",
          "de240e5",
        ],
        "email": Set {
          "pooya@pi0.io",
        },
        "github": "pi0",
        "name": "Pooya Parsa",
      },
      {
        "commits": [
          "aa1a650",
          "6fd8dbb",
        ],
        "email": Set {
          "john@brightshore.com",
        },
        "github": "JohnCampionJr",
        "name": "John Campion Jr",
      },
      {
        "commits": [
          "d0acbfd",
          "46f60cc",
        ],
        "email": Set {
          "waleed1kh@outlook.com",
        },
        "github": "Waleed-KH",
        "name": "Waleed Khaled",
      },
      {
        "commits": [
          "5b68aed",
        ],
        "email": Set {
          "kapustka.maciek@gmail.com",
        },
        "github": "maciej-ka",
        "name": "Maciej Kasprzyk",
      },
      {
        "commits": [
          "1e5f0b7",
        ],
        "email": Set {
          "daniel@roe.dev",
        },
        "github": "danielroe",
        "name": "Daniel Roe",
      },
      {
        "commits": [
          "ec858d1",
        ],
        "email": Set {
          "me@loicmazuel.com",
        },
        "github": "LouisMazel",
        "name": "Mazel",
      },
    ]
  `
      );
    }
  );
  test.runIf(!config.tokens.github)(
    "resolves author info witout Github token",
    async () => {
      const COMMIT_FROM = "610934e644e690c8d0d77197d018498fc43ab0e9";
      const COMMIT_TO = "14fa199c295a6e7620ff373a043790414d795fa5";

      const commits = await getGitDiff(COMMIT_FROM, COMMIT_TO);
      commits[1].message =
        "fix(scope)!: breaking change example, close #123 (#134)";

      const config = await loadChangelogConfig(process.cwd(), {
        from: COMMIT_FROM,
        to: COMMIT_TO,
      });

      const parsed = parseCommits(commits, config);
      const authors = await resolveAuthors(parsed, config);
      expect(authors).toMatchInlineSnapshot(
        `
        [
          {
            "commits": [
              "14fa199",
              "5bfe08e",
              "cb9adf4",
              "81f37bf",
              "de240e5",
            ],
            "email": Set {
              "pooya@pi0.io",
            },
            "github": "pi0",
            "name": "Pooya Parsa",
          },
          {
            "commits": [
              "aa1a650",
              "6fd8dbb",
            ],
            "email": Set {
              "john@brightshore.com",
            },
            "name": "John Campion Jr",
          },
          {
            "commits": [
              "d0acbfd",
              "46f60cc",
            ],
            "email": Set {
              "waleed1kh@outlook.com",
            },
            "github": "Waleed-KH",
            "name": "Waleed Khaled",
          },
          {
            "commits": [
              "5b68aed",
            ],
            "email": Set {
              "kapustka.maciek@gmail.com",
            },
            "name": "Maciej Kasprzyk",
          },
          {
            "commits": [
              "1e5f0b7",
            ],
            "email": Set {
              "daniel@roe.dev",
            },
            "name": "Daniel Roe",
          },
          {
            "commits": [
              "ec858d1",
            ],
            "email": Set {
              "me@loicmazuel.com",
            },
            "name": "Mazel",
          },
        ]
      `
      );
    }
  );
});
