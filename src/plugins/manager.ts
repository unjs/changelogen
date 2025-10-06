import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import consola from "consola";
import type {
  ChangelogPlugin,
  PluginConfig,
  PluginConfigMap,
  PluginContext,
} from "./types";
import {
  PluginLoadError as PluginLoadErrorClass,
  PluginExecutionError as PluginExecutionErrorClass,
} from "./types";
import type { ResolvedChangelogConfig } from "../config";
import type { GitCommit, RawGitCommit } from "../git";

export class PluginManager {
  private plugins: ChangelogPlugin[] = [];
  private context: PluginContext;
  private logger = consola.withTag("plugins");

  constructor(config: ResolvedChangelogConfig) {
    this.context = {
      config,
      logger: this.logger,
    };
  }

  async loadPlugins(pluginConfigs: PluginConfigMap): Promise<void> {
    this.logger.debug(`Loading ${Object.keys(pluginConfigs).length} plugins`);

    for (const [pluginPath, config] of Object.entries(pluginConfigs)) {
      if (config === false) {
        this.logger.debug(`Skipping disabled plugin: ${pluginPath}`);
        continue;
      }

      try {
        const plugin = await this.loadPlugin(
          pluginPath,
          config === true ? {} : config
        );
        this.plugins.push(plugin);
        this.logger.success(`Loaded plugin: ${plugin.name}`);
      } catch (error) {
        this.logger.error(`Failed to load plugin: ${pluginPath}`);
        throw error;
      }
    }

    // Initialize all plugins
    await this.executeHook("init", this.context);
  }

  private async loadPlugin(
    pluginPath: string,
    config: PluginConfig
  ): Promise<ChangelogPlugin> {
    try {
      let pluginModule: any;

      if (pluginPath.startsWith(".") || pluginPath.startsWith("/")) {
        // Local plugin - resolve relative to cwd
        const fullPath = resolve(this.context.config.cwd, pluginPath);
        const fileUrl = pathToFileURL(fullPath).href;
        pluginModule = await import(fileUrl);
      } else {
        // NPM package
        pluginModule = await import(pluginPath);
      }

      // Handle different export patterns
      const PluginClass = pluginModule.default || pluginModule;

      let plugin: ChangelogPlugin;

      if (typeof PluginClass === "function") {
        // Plugin is a class constructor
        plugin = new PluginClass(config);
      } else if (typeof PluginClass === "object" && PluginClass.name) {
        // Plugin is already an instance
        plugin = PluginClass;
      } else {
        throw new Error(
          "Plugin must export a class constructor or plugin instance"
        );
      }

      // Validate plugin interface
      if (!plugin.name || typeof plugin.name !== "string") {
        throw new Error("Plugin must have a 'name' property");
      }

      return plugin;
    } catch (error) {
      throw new PluginLoadErrorClass(
        pluginPath,
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error : undefined
      );
    }
  }

  async executeHook<T>(
    hookName: keyof ChangelogPlugin,
    ...args: any[]
  ): Promise<T> {
    let result = args[0];

    for (const plugin of this.plugins) {
      const hookFn = plugin[hookName];
      if (typeof hookFn === "function") {
        try {
          this.logger.debug(
            `Executing ${hookName} hook for plugin: ${plugin.name}`
          );
          const hookResult = await hookFn.call(
            plugin,
            result,
            ...args.slice(1)
          );

          // Only update result if hook returned something
          if (hookResult !== undefined) {
            result = hookResult;
          }
        } catch (error) {
          throw new PluginExecutionErrorClass(
            plugin.name,
            hookName as string,
            error instanceof Error ? error.message : String(error),
            error instanceof Error ? error : undefined
          );
        }
      }
    }

    return result;
  }

  // Convenience methods for specific hooks
  async beforeCommitParsing(commits: RawGitCommit[]): Promise<RawGitCommit[]> {
    return this.executeHook(
      "beforeCommitParsing",
      commits,
      this.context.config
    );
  }

  async afterCommitParsing(commits: GitCommit[]): Promise<GitCommit[]> {
    return this.executeHook("afterCommitParsing", commits, this.context.config);
  }

  async beforeMarkdownGeneration(commits: GitCommit[]): Promise<GitCommit[]> {
    return this.executeHook(
      "beforeMarkdownGeneration",
      commits,
      this.context.config
    );
  }

  async afterMarkdownGeneration(
    markdown: string,
    commits: GitCommit[]
  ): Promise<string> {
    return this.executeHook(
      "afterMarkdownGeneration",
      markdown,
      commits,
      this.context.config
    );
  }

  async beforeVersionBump(commits: GitCommit[]): Promise<void> {
    await this.executeHook("beforeVersionBump", commits, this.context.config);
  }

  async afterVersionBump(newVersion: string): Promise<void> {
    await this.executeHook("afterVersionBump", newVersion, this.context.config);
  }

  getLoadedPlugins(): ChangelogPlugin[] {
    return [...this.plugins];
  }

  hasPlugins(): boolean {
    return this.plugins.length > 0;
  }
}
