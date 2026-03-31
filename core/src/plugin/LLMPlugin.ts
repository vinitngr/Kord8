import { AgentTeam } from "../agent/AgentTeam";
import { AgentTeamPlugin } from "./AgentTeamPlugin";
import { OpenAIProvider } from "../provider/OpenAIProvider";
import { GoogleProvider } from "../provider/GoogleProvider";

export interface LLMPluginOptions {
  provider: "openai" | "google";
  apiKey?: string;
}

export class LLMPlugin implements AgentTeamPlugin {
  name = "LLMPlugin";

  constructor(private options: LLMPluginOptions) {}

  async setup(app: AgentTeam): Promise<void> {
    app.providers.register(new OpenAIProvider());
    app.providers.register(new GoogleProvider());
    
    if (this.options.apiKey) {
      await app.saveCredential(this.options.provider, { apiKey: this.options.apiKey });
    }
  }
}
