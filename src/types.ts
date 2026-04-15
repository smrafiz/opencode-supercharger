export interface ToolInput {
  tool: string;
}

export interface ToolArgs {
  command?: string;
  content?: string;
  new_string?: string;
  filePath?: string;
}

export interface PluginEvent {
  type: string;
}

export interface PluginContext {
  tool: {
    execute: {
      before: (input: ToolInput, args: ToolArgs) => Promise<void>;
      after: (
        input: ToolInput,
        output: unknown,
        args: ToolArgs,
      ) => Promise<void>;
    };
  };
  event: (ctx: { event: PluginEvent }) => Promise<void>;
}

export type Plugin = (ctx: PluginContext) => Promise<{
  "tool.execute.before": (input: ToolInput, args: ToolArgs) => Promise<void>;
  "tool.execute.after": (
    input: ToolInput,
    output: unknown,
    args: ToolArgs,
  ) => Promise<void>;
  event: (ctx: { event: PluginEvent }) => Promise<void>;
}>;
