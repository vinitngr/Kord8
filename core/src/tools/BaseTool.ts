import { z } from "zod";

export interface ToolContext {
  sessionId: string;
  agentId: string;
  logger: any;
  agentConfig: any;
  metadata?: any;
  getCredential: (name: string) => any;
  app: any;
  signal?: AbortSignal;
}

export interface ConnectionField {
  name: string;
  label: string;
  type: "text" | "password";
  placeholder?: string;
  required: boolean;
}

export interface ConnectionManifest {
  service: string;
  label: string;
  description: string;
  icon?: string;
  fields: ConnectionField[];
  ping?: (creds: Record<string, string>) => Promise<boolean>;
}

export abstract class BaseTool<TInput = any, TOutput = any> {
  abstract name: string;
  abstract description: string;
  abstract schema: z.ZodSchema<TInput>;
  group?: string;
  groupLabel?: string;
  groupDescription?: string;
  hidden?: boolean;

  connectionManifest?: ConnectionManifest;

  abstract execute(input: TInput, context: ToolContext): Promise<TOutput>;

  protected requireCredential(context: ToolContext, service: string): Record<string, any> {
    const creds = context.getCredential(service);
    if (!creds) {
      throw new Error(
        `[${this.name}] Missing "${service}" credentials. Please connect "${service}" in Settings → Connections before using this tool.`
      );
    }
    return creds;
  }

  toJSON() {
    return {
      name: this.name,
      description: this.description,
      parameters: this.schema,
      group: this.group,
    };
  }
}
