import type { Argv } from "mri";
import { resolve } from "pathe";
import consola from "consola";
import { getGithubChangelog, syncGithubRelease } from "../github";
import { loadChangelogConfig, parseChangelogMarkdown } from "..";

export default async function githubMain(args: Argv) {
  const cwd = resolve(args.dir || "");
  process.chdir(cwd);

  const config = await loadChangelogConfig(cwd, {});
  const [action, ..._versions] = args._;

  if (!action || _versions.length === 0) {
    throw new Error("Usage: changelogen github sync <versions...>");
  }

  let versions = [..._versions].map((v) => v.replace(/^v/, ""));

  const changelogMd = await getGithubChangelog(config);
  const changelogReleases = parseChangelogMarkdown(changelogMd).releases;

  if (versions.length === 1 && versions[0] === "all") {
    versions = changelogReleases.map((r) => r.version).sort();
  }

  for (const version of versions) {
    const r = changelogReleases.find((r) => r.version === version);
    if (!r) {
      consola.warn(
        `No matching changelog entry found for ${version} in CHANGELOG.md`
      );
      continue;
    }
    await syncGithubRelease(config, {
      version,
      body: r.body,
    });
  }
}
