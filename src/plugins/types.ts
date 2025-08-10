import type { GitCommit, RawGitCommit, Reference } from "../git";
import type { ResolvedChangelogConfig } from "../config";

export interface PluginContext {
  config: ResolvedChangelogConfig;
  logger: any; // consola instance
}

export interface PluginReference extends Reference {
  url?: string;
}

export interface ChangelogPlugin {
  name: string;
  version?: string;

  // Lifecycle hooks
  init?(context: PluginContext): Promise<void> | void;
  beforeCommitParsing?(
    commits: RawGitCommit[],
    config: ResolvedChangelogConfig
  ): Promise<RawGitCommit[]> | RawGitCommit[];
  afterCommitParsing?(
    commits: GitCommit[],
    config: ResolvedChangelogConfig
  ): Promise<GitCommit[]> | GitCommit[];
  beforeMarkdownGeneration?(
    commits: GitCommit[],
    config: ResolvedChangelogConfig
  ): Promise<GitCommit[]> | GitCommit[];
  afterMarkdownGeneration?(
    markdown: string,
    commits: GitCommit[],
    config: ResolvedChangelogConfig
  ): Promise<string> | string;
  beforeVersionBump?(
    commits: GitCommit[],
    config: ResolvedChangelogConfig
  ): Promise<void> | void;
  afterVersionBump?(
    newVersion: string,
    config: ResolvedChangelogConfig
  ): Promise<void> | void;
}

export interface PluginConfig {
  [key: string]: any;
}

export interface PluginDefinition {
  plugin: string | ChangelogPlugin;
  config?: PluginConfig;
}

export type PluginConfigMap = Record<string, PluginConfig | boolean>;

export interface PluginError extends Error {
  pluginName: string;
  hook?: string;
}

export class PluginLoadError extends Error implements PluginError {
  constructor(
    public pluginName: string,
    message: string,
    public cause?: Error
  ) {
    super(`Plugin "${pluginName}": ${message}`);
    this.name = "PluginLoadError";
  }
}

export class PluginExecutionError extends Error implements PluginError {
  constructor(
    public pluginName: string,
    public hook: string,
    message: string,
    public cause?: Error
  ) {
    super(`Plugin "${pluginName}" failed in hook "${hook}": ${message}`);
    this.name = "PluginExecutionError";
  }
}
