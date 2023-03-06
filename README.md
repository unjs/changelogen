# changelogen

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Github Actions][github-actions-src]][github-actions-href]
[![Codecov][codecov-src]][codecov-href]

> Generate Beautiful Changelogs using [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)

## Quick Start

Generate changelog in markdown format and show in console:

```sh
npx changelogen@latest
```

Generate changelog, bump version in `package.json` automatically and update `CHANGELOG.md` (without commit)

```sh
npx changelogen@latest --bump
```

Bump version, update `CHANGELOG.md` and make a git commit and tag:

```sh
npx changelogen@latest --release
```

## CLI Usage

```sh
npx changelogen@latest [...args] [--dir <dir>]
```

**Arguments:**

- `--from`: Start commit reference. When not provided, **latest git tag** will be used as default.
- `--to`: End commit reference. When not provided, **latest commit in HEAD** will be used as default.
- `--dir`: Path to git repository. When not provided, **current working directory** will be used as as default.
- `--output`: Changelog file name to create or update. Defaults to `CHANGELOG.md` and resolved relative to dir. Use `--no-output` to write to console only.
- `--bump`: Determine semver change and update version in `package.json`.
- `--release`. Bumps version in `package.json` and creates commit and git tags using local `git`. You can disable commit using `--no-commit` and tag using `--no-tag`.
- `-r`: Release as specific version.
- `--major`: Bump as a semver-major version
- `--minor`: Bump as a semver-minor version
- `--patch`: Bump as a semver-patch version
- `--premajor`: Bump as a semver-premajor version, can set id with string, default are `beta` (ex: `--premajor=alpha`)
- `--preminor`: Bump as a semver-preminor version, can set id with string, default are `beta` (ex: `--preminor=alpha`)
- `--prepatch`: Bump as a semver-prepatch version, can set id with string, default are `beta` (ex: `--prepatch=alpha`)
- `--prerelease`: Bump as a semver-prerelease version, can set id with string, default are `beta` (ex: `--prerelease=alpha`)

### `changelogen gh release`

Changelogen has built-in functionality to sync with with Github releases!

In order to manually sync a release, you can use `changelogen gh release`. It will parse current `CHANGELOG.md` from current repository (local, then remote) and create or update releases.

Usage:

```sh
npx changelogen@latest gh release [all|versions...] [--dir] [--token]
```

To enable this integration, make sure there is a valid `repository` field in `package.json` or `repo` is set in `.changelogenrc`.

By default in unauthenticated mode, changelogen will open a browser link to make manual release. By providing github token, it can be automated.

- Using environment variables or `.env`, use `CHANGELOGEN_TOKENS_GITHUB` or `GITHUB_TOKEN` or `GH_TOKEN`
- Using CLI args, use `--token <token>`
- Using global configuration, put `tokens.github=<token>` inside `~/.changlogenrc`
- Using [GitHub CLI](https://cli.github.com/) token when authenticated with `gh auth login`

## Configuration

Configuration is loaded by [unjs/c12](https://github.com/unjs/c12) from cwd. You can use either `changelog.json`, `changelog.{ts,js,mjs,cjs}`, `.changelogrc` or use the `changelog` field in `package.json`.

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

[npm-version-src]: https://img.shields.io/npm/v/changelogen?style=flat-square
[npm-version-href]: https://npmjs.com/package/changelogen
[npm-downloads-src]: https://img.shields.io/npm/dm/changelogen?style=flat-square
[npm-downloads-href]: https://npmjs.com/package/changelogen
[github-actions-src]: https://img.shields.io/github/workflow/status/unjs/changelogen/ci/main?style=flat-square
[github-actions-href]: https://github.com/unjs/changelogen/actions?query=workflow%3Aci
[codecov-src]: https://img.shields.io/codecov/c/gh/unjs/changelogen/main?style=flat-square
[codecov-href]: https://codecov.io/gh/unjs/changelogen
