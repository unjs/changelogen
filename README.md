# changelogen

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Codecov][codecov-src]][codecov-href]
[![License][license-src]][license-href]

Generate Beautiful Changelogs using [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)

## Quick Start

Generate a changelog in Markdown format and display in the console:

```sh
npx changelogen@latest
```

Generate a changelog, bump the version in `package.json` and update `CHANGELOG.md` (without commit):

```sh
npx changelogen@latest --bump
```

Bump the version, update `CHANGELOG.md` and make a git commit and tag:

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
- `--clean`: Determine if the working directory is clean and if it is not clean, exit.
- `--output`: Changelog file name to create or update. Defaults to `CHANGELOG.md` and resolved relative to dir. Use `--no-output` to write to console only.
- `--noAuthors`: Skip contributors section in changelog.
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
- `--hideAuthorEmail`: Do not include author email in changelog if github username cannot be found.

> [!NOTE]
> Version numbers starting with `0.` or `0.0.` follow different rules.
>
> In these cases, the second or third digit is treated as the major version. They use the formats `0.major.minor` and `0.0.major` instead of the standard `major.minor.patch`.
>
> To ensure consistent semantic versioning, start version numbering at `1.0.0`.

### `changelogen gh release`

Changelogen has built-in functionality to sync with Github releases.

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

Configuration is loaded by [unjs/c12](https://github.com/unjs/c12) from cwd. You can use either `changelog.config.json`, `changelog.config.{ts,js,mjs,cjs}`, `.changelogrc` or use the `changelog` field in `package.json`.

See [./src/config.ts](./src/config.ts) for available options and defaults.

## 🔌 Plugin System

Changelogen supports a powerful plugin system that allows you to extend and customize the changelog generation process. Plugins can modify commits, enhance markdown output, integrate with external services, and more.

### Quick Example

```javascript
// changelog.config.js
export default {
  plugins: {
    "changelogen-jira-plugin": {
      baseUrl: "https://citizenm.atlassian.net",
      projectKeys: ["PROJ", "TASK"],
    },
  },
};
```

### Plugin Capabilities

- **Commit Processing**: Enrich commits with additional metadata (e.g., Jira tickets, GitHub issues)
- **Markdown Generation**: Customize output format and add custom sections
- **Version Management**: Influence version bumping logic
- **Release Workflow**: Add custom release steps and notifications

### Available Hooks

Plugins can hook into various stages of the changelog generation:

- `init` - Plugin initialization
- `beforeCommitParsing` - Before parsing raw git commits
- `afterCommitParsing` - After parsing commits into structured data
- `beforeVersionBump` - Before calculating new version
- `afterVersionBump` - After version has been bumped
- `beforeMarkdownGeneration` - Before generating markdown
- `afterMarkdownGeneration` - After markdown has been generated

### Plugin Distribution

- **NPM Packages**: `@changelogen/plugin-name` or `changelogen-plugin-name`
- **Local Plugins**: Relative file paths in your project

### Documentation

For detailed plugin development guide, see [Plugin Documentation](./docs/plugins.md).

## � Development

- Clone this repository
- Enable [Corepack](https://github.com/nodejs/corepack) using `corepack enable` (use `npm i -g corepack` for Node.js < 16.10)
- Install dependencies using `pnpm install`
- Run interactive tests using `pnpm dev`

## License

Made with 💛

Published under [MIT License](./LICENSE).

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/changelogen?style=flat&colorA=18181B&colorB=F0DB4F
[npm-version-href]: https://npmjs.com/package/changelogen
[npm-downloads-src]: https://img.shields.io/npm/dm/changelogen?style=flat&colorA=18181B&colorB=F0DB4F
[npm-downloads-href]: https://npmjs.com/package/changelogen
[codecov-src]: https://img.shields.io/codecov/c/gh/unjs/changelogen/main?style=flat&colorA=18181B&colorB=F0DB4F
[codecov-href]: https://codecov.io/gh/unjs/changelogen
[license-src]: https://img.shields.io/github/license/unjs/changelogen.svg?style=flat&colorA=18181B&colorB=F0DB4F
[license-href]: https://github.com/unjs/changelogen/blob/main/LICENSE
