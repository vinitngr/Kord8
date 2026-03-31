import cron from "node-cron";
import { BaseTrigger, TriggerContext } from "./BaseTrigger";

export class CronTrigger extends BaseTrigger {
  type = "cron";
  private job: any;

  getFormSchema() {
    return {
      title: "Cron Trigger",
      description: "Schedule tasks using standard cron expressions.",
      fields: [
        {
          name: "expression",
          label: "Cron Expression",
          type: "text",
          placeholder: "* * * * *",
          required: true,
          description: "Minute Hour Day Month Weekday"
        },
        {
          name: "instruction",
          label: "Task Instruction",
          type: "text",
          placeholder: "What should the agent do?",
          required: true
        }
      ]
    };
  }

  validate(config: any) {
    if (!config.expression) {
      throw new Error("Cron expression required");
    }
    if (!cron.validate(config.expression)) {
      throw new Error(`Invalid cron expression: ${config.expression}`);
    }
    if (!config.instruction) {
      throw new Error("Instruction required for cron trigger");
    }
  }

  async start(config: any, context: TriggerContext) {
    console.log(`[CronTrigger] Starting for agent ${context.agentId} with expression: ${config.expression}`);
    this.job = cron.schedule(config.expression, async () => {
      console.log(`[CronTrigger] Executing task for agent ${context.agentId}`);
      try {
        await context.enqueueTask({
          agentId: context.agentId,
          instruction: config.instruction,
          metadata: { trigger: 'cron', expression: config.expression }
        });
      } catch (error) {
        console.error(`[CronTrigger] Failed to enqueue task for ${context.agentId}:`, error);
      }
    });
  }

  async stop() {
    if (this.job) {
      console.log(`[CronTrigger] Stopping job`);
      this.job.stop();
      this.job = null;
    }
  }
}
