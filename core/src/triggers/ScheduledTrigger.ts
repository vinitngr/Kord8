import { BaseTrigger, TriggerContext } from "./BaseTrigger";

export class ScheduledTrigger extends BaseTrigger {
  type = "scheduled";
  private timer: NodeJS.Timeout | null = null;

  getFormSchema() {
    return {
      title: "One-Time Schedule",
      description: "Trigger a task once at a specific date and time.",
      fields: [
        {
          name: "date",
          label: "Target Date",
          type: "date",
          required: true
        },
        {
          name: "time",
          label: "Target Time",
          type: "text",
          placeholder: "HH:mm (e.g. 14:30)",
          required: true
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
    if (!config.date || !config.time) {
      throw new Error("Date and time are required for scheduled trigger");
    }
    if (!config.instruction) {
      throw new Error("Instruction required for scheduled trigger");
    }

    // Smart time padding: convert "6:17" to "06:17"
    let time = config.time.trim();
    if (/^\d:\d{2}$/.test(time)) {
      time = "0" + time;
    }

    const target = new Date(`${config.date}T${time}`);
    if (isNaN(target.getTime())) {
      const fallback = new Date(`${config.date} ${time}`);
      if (isNaN(fallback.getTime())) {
         throw new Error(`Invalid date/time format: ${config.date} ${time}. Please use YYYY-MM-DD and HH:mm`);
      }
    }
    
  }

  async start(config: any, context: TriggerContext) {
    let time = config.time.trim();
    if (/^\d:\d{2}$/.test(time)) {
      time = "0" + time;
    }

    const target = new Date(`${config.date}T${time}`);
    const actualTarget = isNaN(target.getTime()) ? new Date(`${config.date} ${time}`) : target;
    const delay = actualTarget.getTime() - Date.now();

    console.log(`[ScheduledTrigger] Starting for agent ${context.agentId}. Target: ${actualTarget.toISOString()}, Delay: ${delay}ms`);

    if (delay < 0) {
      console.warn(`[ScheduledTrigger] Target time ${target.toISOString()} is in the past for agent ${context.agentId}`);
      return;
    }

    this.timer = setTimeout(async () => {
      try {
        console.log(`[ScheduledTrigger] Executing task for agent ${context.agentId}`);
        await context.enqueueTask({
          agentId: context.agentId,
          instruction: config.instruction,
          metadata: { trigger: 'scheduled', scheduledTime: target.toISOString() }
        });
      } catch (error) {
        console.error(`[ScheduledTrigger] Failed to execute for ${context.agentId}:`, error);
      }
    }, delay);
  }

  async stop() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  getUpcomingRuns(config: any): { timestamp: string, instruction: string }[] {
    let time = config.time.trim();
    if (/^\d:\d{2}$/.test(time)) {
      time = "0" + time;
    }

    const target = new Date(`${config.date}T${time}`);
    const actualTarget = isNaN(target.getTime()) ? new Date(`${config.date} ${time}`) : target;

    if (actualTarget.getTime() > Date.now()) {
      return [{
        timestamp: actualTarget.toISOString(),
        instruction: config.instruction
      }];
    }
    return [];
  }
}
