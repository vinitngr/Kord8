import { z } from "zod";
import { EventEmitter } from "events";
import { Logger } from "../utils/logger";

export const AgentConfigSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  instruction: z.string(),
  provider: z.string(),
  model: z.string(),
  tools: z.array(z.string()),
  maxIterations: z.number().default(10),
  maxTokens: z.number().optional(),
  temperature: z.number().default(0.7),
  enabled: z.boolean().default(true),
  triggers: z.array(z.object({
    type: z.string(),
    config: z.any()
  })).optional(),
  reasoningEffort: z.enum(["low", "medium", "high"]).default("medium"),
});

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

export class AgentRegistry extends EventEmitter {
  private agents = new Map<string, AgentConfig>();
  private logger = Logger.scope("registry");

  constructor() {
    super();
  }

  register(config: AgentConfig) {
    const result = AgentConfigSchema.safeParse(config);
    if (!result.success) {
      this.logger.error(`Invalid agent config for ${config.id || "unknown"}:`, result.error.format());
      return;
    }
    this.agents.set(config.id, result.data);
    this.logger.info(`Agent dynamic registered: ${config.id}`);
    this.emit("registered", result.data);
  }

  unregister(id: string) {
    if (this.agents.has(id)) {
      this.agents.delete(id);
      this.logger.info(`Agent unregistered: ${id}`);
      this.emit("unregistered", id);
    }
  }

  get(id: string): AgentConfig | undefined {
    return this.agents.get(id);
  }

  list(): AgentConfig[] {
    return Array.from(this.agents.values());
  }

  clear() {
    this.agents.clear();
  }
}
