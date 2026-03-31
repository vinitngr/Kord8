import { BaseTrigger, TriggerContext } from "./BaseTrigger";

export class WebhookTrigger extends BaseTrigger {
  type = "webhook";

  getFormSchema() {
    return {
      title: "Webhook Trigger",
      description: "Trigger tasks via HTTP POST requests. The incoming JSON will be automatically provided to the agent.",
      isWebhook: true,
      fields: [
        {
          name: "instruction",
          label: "Agent Instruction",
          type: "text",
          placeholder: "e.g. Analyze the incoming data and summarize it",
          required: true,
          description: "What the agent should do when it receives data."
        }
      ]
    };
  }

  validate(config: any) {
    if (!config.instruction) {
      throw new Error("Instruction is required for webhook trigger");
    }
  }

  private context?: TriggerContext;
  private config?: any;

  async start(config: any, context: TriggerContext) {
    this.config = config;
    this.context = context;
  }

  async stop() {
    this.context = undefined;
    this.config = undefined;
  }

  async handleRequest(payload: any) {
    if (!this.context || !this.config) return;

    // Simply dump the JSON into the context for the agent
    const fullInstruction = `${this.config.instruction}\n\nIncoming Data (JSON):\n${JSON.stringify(payload, null, 2)}`;
    
    await this.context.enqueueTask({
      agentId: this.context.agentId,
      instruction: fullInstruction,
      metadata: { trigger: 'webhook', payload }
    });
  }
}
