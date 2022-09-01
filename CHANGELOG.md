# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [main](https://github.com/unjs/changelogen/compare/v0.2.0...main)


### 🩹 Fixes

  - Use last commit for changelog diff (6ac4b4b)
  - Use h2 for title (fc0967c)

### ✅ Tests

  - Update snapshot (102aa98)

### ❤️  Contributors

- Pooya Parsa

## [0.2.0](https://github.com/unjs/changelogen/compare/v0.1.1...0.2.0)


### 🚀 Enhancements

  - GetGitDiff ignores from (#17)
  - Add gitmoji support (#22)
  - Auto-update changelog files (#24)
  - Support `--bump` to update version while generating changelog (9bf9aff)
  - Basic `--release` support (934c487)

### 🩹 Fixes

  - Expose `./config` (#10)
  - Use `getCurrentGitRef` (#15)
  - **parse:** ⚠️  `references` with type (#27)
  - Convertminor to patch for 0.x versions (011b6a1)
  - Run release step last (b052f55)
  - Handle breaking change commits for bumping (f7ffaa4)
  - Show original semver type without 0.x changes in log (ddd818a)
  - Use `v` prefix for git tag and annotate (bf6b5da)
  - Add missing annotate message (157b0c5)

### 💅 Refactors

  - Use lines array for constructing markdown (#16)

### 🏡 Chore

  - Update lockfile and vitest config (48f609b)
  - Use changelogen release flow (2a8bb4f)

#### ⚠️  Breaking Changes

  - **parse:** ⚠️  `references` with type (#27)

### ❤️  Contributors

- Anthony Fu
- Conner
- Pooya Parsa
- 三咲智子

### [0.1.1](https://github.com/unjs/changelogen/compare/v0.1.0...v0.1.1) (2022-06-12)


### Bug Fixes

* remove `general` in entries without scope ([31a0861](https://github.com/unjs/changelogen/commit/31a08615bb7da611dcaefe33b510d23aa7d2cc29))

## [0.1.0](https://github.com/unjs/changelogen/compare/v0.0.6...v0.1.0) (2022-06-12)


### ⚠ BREAKING CHANGES

* use flat scopes

* use flat scopes ([8e33e93](https://github.com/unjs/changelogen/commit/8e33e93e6c4aa4b0b727d351fd73590626d1d6ce))

### [0.0.6](https://github.com/unjs/changelogen/compare/v0.0.5...v0.0.6) (2022-05-10)

### [0.0.5](https://github.com/unjs/changelogen/compare/v0.0.4...v0.0.5) (2022-05-05)


### Features

* add missing commitlint types ([#6](https://github.com/unjs/changelogen/issues/6)) ([0a6deef](https://github.com/unjs/changelogen/commit/0a6deefae9a433bbb2136ac8675976ac455dd159))

### [0.0.4](https://github.com/unjs/changelogen/compare/v0.0.3...v0.0.4) (2022-05-05)


### Bug Fixes

* **cli:** use `/usr/bin/env` (resolves [#5](https://github.com/unjs/changelogen/issues/5)) ([e4218cc](https://github.com/unjs/changelogen/commit/e4218cc08d07b597137469396ba83ec709d7f174))

### [0.0.3](https://github.com/unjs/changelogen/compare/v0.0.2...v0.0.3) (2022-05-02)


### Features

* generate breaking changes section ([cc0b427](https://github.com/unjs/changelogen/commit/cc0b4272543ffc012d15f038ffa62cdcaca35a44))


### Bug Fixes

* avoid `.exec` for multi matches ([7c612fc](https://github.com/unjs/changelogen/commit/7c612fc4e698e9f8fa1554405efb19b51d7c412f))
* format names for case matching ([ece2d90](https://github.com/unjs/changelogen/commit/ece2d9067171e2b34f45f3d86c28912e90106a6c))

### 0.0.2 (2022-05-02)
