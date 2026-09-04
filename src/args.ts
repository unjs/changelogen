import { parseArgs } from "node:util";

export type ArgSpec = {
  /**
   * - `string`: always expects a value (`--from v1.0.0`)
   * - `boolean`: never consumes a value (`--bump`, `--no-bump`)
   * - `optional`: `true` when used as a flag, otherwise the given value
   */
  type: "string" | "boolean" | "optional";
  /** Single character alias (`-r`) */
  short?: string;
};

export type ArgsSpec = Record<string, ArgSpec>;

type ArgValue<T extends ArgSpec> = T["type"] extends "string"
  ? string | undefined
  : T["type"] extends "boolean"
    ? boolean | undefined
    : string | boolean | undefined;

export type Args<T extends ArgsSpec> = { _: string[] } & {
  -readonly [K in keyof T]: ArgValue<T[K]>;
};

export function parseCliArgs<T extends ArgsSpec>(
  rawArgs: string[],
  spec: T
): Args<T> {
  const { values, positionals } = parseArgs({
    // Args are normalized to `--name=value` form to support optional values
    args: _normalize(rawArgs, spec),
    options: Object.fromEntries(
      Object.entries(spec).map(([name, { short }]) => [
        name,
        { type: "string" as const, ...(short && { short }) },
      ])
    ),
    allowPositionals: true,
  });

  const args = { _: positionals } as Record<string, unknown>;
  for (const [name, value] of Object.entries(values)) {
    args[name] = _coerce(value as string, spec[name].type);
  }
  return args as Args<T>;
}

function _normalize(rawArgs: string[], spec: ArgsSpec): string[] {
  const args: string[] = [];
  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];
    if (arg === "--") {
      args.push(...rawArgs.slice(i));
      break;
    }
    if (arg.startsWith("--") && !arg.includes("=")) {
      const negated = arg.startsWith("--no-");
      const name = negated ? arg.slice(5) : arg.slice(2);
      const type = _getSpec(spec, name)?.type;
      if (type && type !== "string") {
        if (negated) {
          args.push(`--${name}=false`);
          continue;
        }
        // Optional args only consume the next token when it looks like a value
        const next = rawArgs[i + 1];
        if (type === "boolean" || !next || next.startsWith("-")) {
          args.push(`--${name}=true`);
          continue;
        }
      }
    }
    args.push(arg);
  }
  return args;
}

function _coerce(value: string, type: ArgSpec["type"]): string | boolean {
  if (type === "string") {
    return value;
  }
  if (value === "true" || value === "false") {
    return value === "true";
  }
  return type === "boolean" ? true : value;
}

function _getSpec(spec: ArgsSpec, name: string): ArgSpec | undefined {
  return Object.hasOwn(spec, name) ? spec[name] : undefined;
}
