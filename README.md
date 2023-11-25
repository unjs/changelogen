# changegear

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Codecov][codecov-src]][codecov-href]
[![License][license-src]][license-href]

Generate Beautiful Changelogs using [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)

## Quick Start

Generate a changelog in Markdown format and display in the console:

```sh
npx changegear@latest
```

Generate a changelog, bump the version in `package.json` and update `CHANGELOG.md` (without commit):

```sh
npx changegear@latest --bump
```

Bump the version, update `CHANGELOG.md` and make a git commit and tag:

```sh
npx changegear@latest --release
```

## CLI Usage

```sh
npx changegear@latest [...args] [--dir <dir>]
```

**Arguments:**

- `--from`: Start commit reference. When not provided, **latest git tag** will be used as default.
- `--to`: End commit reference. When not provided, **latest commit in HEAD** will be used as default.
- `--dir`: Path to git repository. When not provided, **current working directory** will be used as as default.
- `--clean`: Determine if the working directory is clean and if it is not clean, exit.
- `--output`: Changelog file name to create or update. Defaults to `CHANGELOG.md` and resolved relative to dir. Use `--no-output` to write to console only.
- `--bump`: Determine semver change and update version in `package.json`.
- `--release`. Bumps version in `package.json` and creates commit and git tags using local `git`. You can disable commit using `--no-commit` and tag using `--no-tag`. You can enable the automatic push of the new tag and release commit to your git repository by adding `--push`.
- `--publish`. Publishes package as a new version on `npm`. You will need to set authorisation tokens separately via `.npmrc` or environment variables.
- `--publishTag` Use custom npm tag for publishing (Default is `latest`)
- `--nameSuffix`: Adds suffix to package name (Example: `--nameSuffix canary` renames `foo` to `foo-canary`)
- `--versionSuffix`: Adds suffix to package version. When set without value or to `true`, uses date + commit hash as commit
- `--canary`. Shortcut to `--bump --versionSuffix` (`--nameSuffix` will be also added if arg has a string value).
- `-r`: Release as specific version.
- `--major`: Bump as a semver-major version
- `--minor`: Bump as a semver-minor version
- `--patch`: Bump as a semver-patch version
- `--premajor`: Bump as a semver-premajor version, can set id with string.
- `--preminor`: Bump as a semver-preminor version, can set id with string.
- `--prepatch`: Bump as a semver-prepatch version, can set id with string.
- `--prerelease`: Bump as a semver-prerelease version, can set id with string.

### `changegear gh release`

Changelogen has built-in functionality to sync with with Github releases.

In order to manually sync a release, you can use `changegear gh release`. It will parse current `CHANGELOG.md` from current repository (local, then remote) and create or update releases.

Usage:

```sh
npx changegear@latest gh release [all|versions...] [--dir] [--token]
```

To enable this integration, make sure there is a valid `repository` field in `package.json` or `repo` is set in `.changelogenrc`.

By default in unauthenticated mode, changegear will open a browser link to make manual release. By providing github token, it can be automated.

- Using environment variables or `.env`, use `CHANGELOGEN_TOKENS_GITHUB` or `GITHUB_TOKEN` or `GH_TOKEN`
- Using CLI args, use `--token <token>`
- Using global configuration, put `tokens.github=<token>` inside `~/.changlogenrc`
- Using [GitHub CLI](https://cli.github.com/) token when authenticated with `gh auth login`

## Configuration

Configuration is loaded by [unjs/c12](https://github.com/unjs/c12) from cwd. You can use either `changelog.config.json`, `changelog.config.{ts,js,mjs,cjs}`, `.changelogrc` or use the `changelog` field in `package.json`.

See [./src/config.ts](./src/config.ts) for available options and defaults.

## 💻 Development

- Clone this repository
- Enable [Corepack](https://github.com/nodejs/corepack) using `corepack enable` (use `npm i -g corepack` for Node.js < 16.10)
- Install dependencies using `pnpm install`
- Run interactive tests using `pnpm dev`

## License

Made with 💛

Published under [MIT License](./LICENSE).

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/changegear?style=flat&colorA=18181B&colorB=F0DB4F
[npm-version-href]: https://npmjs.com/package/changegear
[npm-downloads-src]: https://img.shields.io/npm/dm/changegear?style=flat&colorA=18181B&colorB=F0DB4F
[npm-downloads-href]: https://npmjs.com/package/changegear
[codecov-src]: https://img.shields.io/codecov/c/gh/phojie/changegear/main?style=flat&colorA=18181B&colorB=F0DB4F
[codecov-href]: https://codecov.io/gh/phojie/changegear
[license-src]: https://img.shields.io/github/license/phojie/changegear.svg?style=flat&colorA=18181B&colorB=F0DB4F
[license-href]: https://github.com/phojie/changegear/blob/main/LICENSE
