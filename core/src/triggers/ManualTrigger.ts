import { BaseTrigger, TriggerContext } from "./BaseTrigger";

export class ManualTrigger extends BaseTrigger {
  type = "manual";

  getFormSchema() {
    return {
      title: "Manual Trigger",
      description: "Trigger tasks manually via the UI or API.",
      fields: []
    };
  }

  validate(config: any) {
    // Manual trigger has no persistent config to validate
  }

  async start(config: any, context: TriggerContext) {
    // No automatic behavior for manual trigger
  }

  async fire(instruction: string, context: TriggerContext) {
    await context.enqueueTask({
      agentId: context.agentId,
      instruction
    });
  }

  async stop() {
    // Nothing to cleanup
  }
}
