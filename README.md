# changelogen

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Github Actions][github-actions-src]][github-actions-href]
[![Codecov][codecov-src]][codecov-href]

> Generate Beautiful Changelogs using [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)

## Quick Start

Generate changelog in markdown format to the console output:

```sh
npx changelogen
```


## CLI Usage

```sh
npx changelogen [--from=] [--to=...] [<rootDir>]
```

**Arguments:**

- `from`: Start commit reference. When not provided, **latest git tag** will be used as default.
- `to`: End commit reference. When not provided, **latest commit in HEAD** will be used as default.
- `rootDir`: Path to git repository. When not provided, **current working directory** will be used as as default.




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
