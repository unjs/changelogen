
## v1.0.3

[compare changes](https://github.com/phojie/changegear/compare/v1.0.2...v1.0.3)

### 🏡 Chore

- Fix scripts config ([d86b01d](https://github.com/phojie/changegear/commit/d86b01d))

### ❤️ Contributors

- Phojie Rengel ([@phojie](http://github.com/phojie))

## v1.0.2

[compare changes](https://github.com/phojie/changegear/compare/v1.0.1...v1.0.2)

### 🏡 Chore

- Init ([81a9c54](https://github.com/phojie/changegear/commit/81a9c54))
- Reconfig linter ([ca05eb5](https://github.com/phojie/changegear/commit/ca05eb5))
- Lint ([30f7360](https://github.com/phojie/changegear/commit/30f7360))
- Config pre-commits ([647c972](https://github.com/phojie/changegear/commit/647c972))

### ❤️ Contributors

- Phojie Rengel ([@phojie](http://github.com/phojie))

## v1.0.1

[compare changes](https://github.com/phojie/changegear/compare/v0.6.0...v1.0.1)

### 🏡 Chore

- Package version ([4254b80](https://github.com/phojie/changegear/commit/4254b80))

### ❤️ Contributors

- Phojie Rengel ([@phojie](http://github.com/phojie))

## v0.6.0


### 🚀 Enhancements

- Generate breaking changes section ([cc0b427](https://github.com/phojie/changegear/commit/cc0b427))
- Add missing commitlint types ([#6](https://github.com/phojie/changegear/pull/6))
- GetGitDiff ignores from ([#17](https://github.com/phojie/changegear/pull/17))
- Add gitmoji support ([#22](https://github.com/phojie/changegear/pull/22))
- Auto-update changelog files ([#24](https://github.com/phojie/changegear/pull/24))
- Support `--bump` to update version while generating changelog ([9bf9aff](https://github.com/phojie/changegear/commit/9bf9aff))
- Basic `--release` support ([934c487](https://github.com/phojie/changegear/commit/934c487))
- Generate markdown links when github is provided ([ffe1d08](https://github.com/phojie/changegear/commit/ffe1d08))
- **cli:** ⚠️  Show changelog in CLI unless bumping or releasing ([d348943](https://github.com/phojie/changegear/commit/d348943))
- Handle new version before generating changelog ([fd56f6b](https://github.com/phojie/changegear/commit/fd56f6b))
- Expose `determineSemverChange` and `bumpVersion` ([5451f18](https://github.com/phojie/changegear/commit/5451f18))
- Infer github config from package.json ([#37](https://github.com/phojie/changegear/pull/37))
- ⚠️  Resolve github usernames using `ungh/ungh` ([#46](https://github.com/phojie/changegear/pull/46))
- Update execa to v7 ([e61e2f6](https://github.com/phojie/changegear/commit/e61e2f6))
- ⚠️  Support different repository providers ([#55](https://github.com/phojie/changegear/pull/55))
- Github release integration ([#67](https://github.com/phojie/changegear/pull/67))
- Support explicit bumping as major, minor, or patch via cli ([c8afa86](https://github.com/phojie/changegear/commit/c8afa86))
- Automatically resolve github token from gh cli ([231a3ec](https://github.com/phojie/changegear/commit/231a3ec))
- Default `gh release` to latest version ([44788f5](https://github.com/phojie/changegear/commit/44788f5))
- Resolve repository config from git remote ([8401f91](https://github.com/phojie/changegear/commit/8401f91))
- Load config from `changelog` field in `package.json` ([#88](https://github.com/phojie/changegear/pull/88))
- Bump pre version ([#70](https://github.com/phojie/changegear/pull/70))
- Support templates for commit and tag messages ([#68](https://github.com/phojie/changegear/pull/68))
- Support `--publish` and `--canary` ([#123](https://github.com/phojie/changegear/pull/123))
- `repo` option as string ([#128](https://github.com/phojie/changegear/pull/128))
- Add param to require clean working dir ([#92](https://github.com/phojie/changegear/pull/92), [#93](https://github.com/phojie/changegear/pull/93))
- Add excludeAuthors option ([#95](https://github.com/phojie/changegear/pull/95))

### 🩹 Fixes

- Avoid `.exec` for multi matches ([7c612fc](https://github.com/phojie/changegear/commit/7c612fc))
- Format names for case matching ([ece2d90](https://github.com/phojie/changegear/commit/ece2d90))
- **cli:** Use `/usr/bin/env` ([#5](https://github.com/phojie/changegear/pull/5))
- Remove `general` in entries without scope ([31a0861](https://github.com/phojie/changegear/commit/31a0861))
- Expose `./config` ([#10](https://github.com/phojie/changegear/pull/10))
- Use `getCurrentGitRef` ([#15](https://github.com/phojie/changegear/pull/15))
- **parse:** ⚠️  `references` with type ([#27](https://github.com/phojie/changegear/pull/27))
- Convertminor to patch for 0.x versions ([011b6a1](https://github.com/phojie/changegear/commit/011b6a1))
- Run release step last ([b052f55](https://github.com/phojie/changegear/commit/b052f55))
- Handle breaking change commits for bumping ([f7ffaa4](https://github.com/phojie/changegear/commit/f7ffaa4))
- Show original semver type without 0.x changes in log ([ddd818a](https://github.com/phojie/changegear/commit/ddd818a))
- Use `v` prefix for git tag and annotate ([bf6b5da](https://github.com/phojie/changegear/commit/bf6b5da))
- Add missing annotate message ([157b0c5](https://github.com/phojie/changegear/commit/157b0c5))
- Use last commit for changelog diff ([6ac4b4b](https://github.com/phojie/changegear/commit/6ac4b4b))
- Use h2 for title ([fc0967c](https://github.com/phojie/changegear/commit/fc0967c))
- Import semver as default import ([3bd0b61](https://github.com/phojie/changegear/commit/3bd0b61))
- Use `creatordate` to find last tag ([#39](https://github.com/phojie/changegear/pull/39))
- Use release version in changelog title ([04671a6](https://github.com/phojie/changegear/commit/04671a6))
- Let `--output` work without value ([#43](https://github.com/phojie/changegear/pull/43))
- Consider docs and refactor as semver patch for bump ([648ccf1](https://github.com/phojie/changegear/commit/648ccf1))
- Only skip non breaking `chre(deps)` ([20e622e](https://github.com/phojie/changegear/commit/20e622e))
- **markdown:** Avoid rendering `noreply.github.com` emails ([4871721](https://github.com/phojie/changegear/commit/4871721))
- Avoid rendering authors with `[bot]` in their name ([4f3f644](https://github.com/phojie/changegear/commit/4f3f644))
- Format name to avoid duplicates ([f74a988](https://github.com/phojie/changegear/commit/f74a988))
- Bump by patch by default ([7e38438](https://github.com/phojie/changegear/commit/7e38438))
- Stage `CHANGELOG.md` and `package.json` when releasing ([69d375c](https://github.com/phojie/changegear/commit/69d375c))
- Add correct output file to git ([#64](https://github.com/phojie/changegear/pull/64))
- Update ungh link ([a5ab510](https://github.com/phojie/changegear/commit/a5ab510))
- Only access latest tag accessible from current branch ([#69](https://github.com/phojie/changegear/pull/69))
- **cli:** Don't eat up first `-*` arg ([77b483b](https://github.com/phojie/changegear/commit/77b483b))
- Allow providing no versions ([ac84c39](https://github.com/phojie/changegear/commit/ac84c39))
- Use parsed release body ([aec2341](https://github.com/phojie/changegear/commit/aec2341))
- Strip title line from release ([319f7ce](https://github.com/phojie/changegear/commit/319f7ce))
- Handle unset value for `config.repo` ([#72](https://github.com/phojie/changegear/pull/72))
- **getLastGitTag:** Handle when there are no git tags ([#77](https://github.com/phojie/changegear/pull/77))
- **markdown:** Remove unnecessary spaces ([#106](https://github.com/phojie/changegear/pull/106))
- Add missing type export to package.json ([#113](https://github.com/phojie/changegear/pull/113))
- Extra spaces in contributors and breaking changes ([#134](https://github.com/phojie/changegear/pull/134))
- Repo name with `-` or `.` ([#127](https://github.com/phojie/changegear/pull/127))
- Update bitbucket provider configuration ([81ee4a2](https://github.com/phojie/changegear/commit/81ee4a2))
- Update bitbucket provider url ([31f8b92](https://github.com/phojie/changegear/commit/31f8b92))

### 💅 Refactors

- Update emojies ([3c4fbac](https://github.com/phojie/changegear/commit/3c4fbac))
- Update types ([6f19cb3](https://github.com/phojie/changegear/commit/6f19cb3))
- ⚠️  Use flat scopes ([8e33e93](https://github.com/phojie/changegear/commit/8e33e93))
- Use lines array for constructing markdown ([#16](https://github.com/phojie/changegear/pull/16))
- Upgrade to `open` v9 ([315cbd0](https://github.com/phojie/changegear/commit/315cbd0))

### 📖 Documentation

- Small improvement ([#4](https://github.com/phojie/changegear/pull/4))
- Use `npx changelogen@latest` to ensure using latest version ([8ec40b5](https://github.com/phojie/changegear/commit/8ec40b5))
- Fix from format ([4373a86](https://github.com/phojie/changegear/commit/4373a86))
- Add documentation about `--push` flag ([#114](https://github.com/phojie/changegear/pull/114))

### 📦 Build

- Use dynamic import for execa for cjs support ([a794cf1](https://github.com/phojie/changegear/commit/a794cf1))

### 🏡 Chore

- Disable starter test ([9edd62d](https://github.com/phojie/changegear/commit/9edd62d))
- **release:** 0.0.2 ([38d7ba1](https://github.com/phojie/changegear/commit/38d7ba1))
- **release:** 0.0.3 ([1c0dcb7](https://github.com/phojie/changegear/commit/1c0dcb7))
- **release:** 0.0.4 ([125fc28](https://github.com/phojie/changegear/commit/125fc28))
- **release:** 0.0.5 ([0fb47ec](https://github.com/phojie/changegear/commit/0fb47ec))
- **release:** 0.0.6 ([ce317f8](https://github.com/phojie/changegear/commit/ce317f8))
- Comment unused fn ([9735e2e](https://github.com/phojie/changegear/commit/9735e2e))
- **release:** 0.1.0 ([79d6a90](https://github.com/phojie/changegear/commit/79d6a90))
- **release:** 0.1.1 ([37c407c](https://github.com/phojie/changegear/commit/37c407c))
- Update lockfile and vitest config ([48f609b](https://github.com/phojie/changegear/commit/48f609b))
- Use changelogen release flow ([2a8bb4f](https://github.com/phojie/changegear/commit/2a8bb4f))
- **release:** 0.2.0 ([0ee9ecf](https://github.com/phojie/changegear/commit/0ee9ecf))
- **release:** 0.2.1 ([99c4e6e](https://github.com/phojie/changegear/commit/99c4e6e))
- **release:** 0.2.2 ([d0ef976](https://github.com/phojie/changegear/commit/d0ef976))
- **release:** 0.2.3 ([8487e91](https://github.com/phojie/changegear/commit/8487e91))
- **release:** 0.3.0 ([cdc7dd4](https://github.com/phojie/changegear/commit/cdc7dd4))
- **release:** V0.3.1 ([25d8acc](https://github.com/phojie/changegear/commit/25d8acc))
- **release:** V0.3.2 ([5c2babc](https://github.com/phojie/changegear/commit/5c2babc))
- Manually update old changelog entries ([c3ff561](https://github.com/phojie/changegear/commit/c3ff561))
- Update dependencies ([c210976](https://github.com/phojie/changegear/commit/c210976))
- Fix typecheck ([8796cf1](https://github.com/phojie/changegear/commit/8796cf1))
- **release:** V0.3.3 ([f4f42a3](https://github.com/phojie/changegear/commit/f4f42a3))
- **release:** V0.3.4 ([6fc5087](https://github.com/phojie/changegear/commit/6fc5087))
- **release:** V0.3.5 ([3828bda](https://github.com/phojie/changegear/commit/3828bda))
- **release:** V0.4.0 ([a3cafa9](https://github.com/phojie/changegear/commit/a3cafa9))
- Update renovate config ([#54](https://github.com/phojie/changegear/pull/54))
- Update dependencies ([4216bc6](https://github.com/phojie/changegear/commit/4216bc6))
- Update repo ([83c349f](https://github.com/phojie/changegear/commit/83c349f))
- **release:** V0.4.1 ([d126f3a](https://github.com/phojie/changegear/commit/d126f3a))
- Fix lint issue and update snapshots ([e162ab8](https://github.com/phojie/changegear/commit/e162ab8))
- Mention gh cli login ([7f4a05f](https://github.com/phojie/changegear/commit/7f4a05f))
- **release:** V0.5.0 ([585594e](https://github.com/phojie/changegear/commit/585594e))
- Simplify release command ([225fa64](https://github.com/phojie/changegear/commit/225fa64))
- **release:** V0.5.1 ([a14d749](https://github.com/phojie/changegear/commit/a14d749))
- Update badges and small improvements ([146d1d4](https://github.com/phojie/changegear/commit/146d1d4))
- Update dev dependencies ([0f44ee9](https://github.com/phojie/changegear/commit/0f44ee9))
- **release:** V0.5.2 ([0a5d6c8](https://github.com/phojie/changegear/commit/0a5d6c8))
- **release:** V0.5.3 ([db1c625](https://github.com/phojie/changegear/commit/db1c625))
- **release:** V0.5.4 ([de240e5](https://github.com/phojie/changegear/commit/de240e5))
- Update dependencies ([81f37bf](https://github.com/phojie/changegear/commit/81f37bf))
- Keep prettier compatible ([cb9adf4](https://github.com/phojie/changegear/commit/cb9adf4))
- Add autofix ci ([5bfe08e](https://github.com/phojie/changegear/commit/5bfe08e))
- **release:** V0.5.5 ([14fa199](https://github.com/phojie/changegear/commit/14fa199))
- Init ([5f8f9d5](https://github.com/phojie/changegear/commit/5f8f9d5))
- **markdown:** Update default changelog title ([327c69c](https://github.com/phojie/changegear/commit/327c69c))
- Rename package to changegear ([eb46703](https://github.com/phojie/changegear/commit/eb46703))

### ✅ Tests

- Update snapshot ([102aa98](https://github.com/phojie/changegear/commit/102aa98))
- Update snapshot ([b264c80](https://github.com/phojie/changegear/commit/b264c80))

#### ⚠️ Breaking Changes

- **cli:** ⚠️  Show changelog in CLI unless bumping or releasing ([d348943](https://github.com/phojie/changegear/commit/d348943))
- ⚠️  Resolve github usernames using `ungh/ungh` ([#46](https://github.com/phojie/changegear/pull/46))
- ⚠️  Support different repository providers ([#55](https://github.com/phojie/changegear/pull/55))
- **parse:** ⚠️  `references` with type ([#27](https://github.com/phojie/changegear/pull/27))
- ⚠️  Use flat scopes ([8e33e93](https://github.com/phojie/changegear/commit/8e33e93))

### ❤️ Contributors

- Phojie Rengel ([@phojie](http://github.com/phojie))
- Pooya Parsa ([@pi0](http://github.com/pi0))
- John Campion Jr <john@brightshore.com>
- Waleed Khaled ([@Waleed-KH](http://github.com/Waleed-KH))
- Maciej Kasprzyk <kapustka.maciek@gmail.com>
- Daniel Roe <daniel@roe.dev>
- Mazel <me@loicmazuel.com>
- Thomas Lamant ([@tmlmt](http://github.com/tmlmt))
- Zhong666 ([@aa900031](http://github.com/aa900031))
- Donald Shtjefni ([@dnldsht](http://github.com/dnldsht))
- Sébastien Chopin <seb@nuxtjs.com>
- Nozomu Ikuta <nick.0508.nick@gmail.com>
- Lvjiaxuan <471501748@qq.com>
- Ahad Birang ([@farnabaz](http://github.com/farnabaz))
- Conner ([@Intevel](http://github.com/Intevel))
- Anthony Fu <anthonyfu117@hotmail.com>
- 三咲智子 <sxzz@sxzz.moe>
- Julien Ripouteau ([@Julien-R44](http://github.com/Julien-R44))

