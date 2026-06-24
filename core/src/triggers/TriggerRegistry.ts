import { BaseTrigger, TriggerContext } from "./BaseTrigger";
import { Runtime } from "../runtime/Runtime";
import { Logger } from "../utils/logger";

/**
 * Registry for managing and retrieving trigger types.
 */
export class TriggerRegistry {
  private triggerClasses: Map<string, new () => BaseTrigger> = new Map();
  private runningTriggers: Map<string, { instance: BaseTrigger, config: any }[]> = new Map();
  private logger = Logger.scope("triggers");

  register(Type: new () => BaseTrigger): void {
    const instance = new Type();
    this.triggerClasses.set(instance.type, Type);
    this.logger.debug(`Trigger type registered: ${instance.type}`);
  }

  async startAgentTriggers(agentConfig: any, runtime: Runtime): Promise<void> {
    const triggers = agentConfig.triggers || [];
    const agentId = agentConfig.id;
    const instances: { instance: BaseTrigger, config: any }[] = [];

    for (const config of triggers) {
      const TriggerClass = this.triggerClasses.get(config.type);
      if (!TriggerClass) {
        this.logger.error(`Trigger type not found: ${config.type} for agent ${agentId}`);
        continue;
      }

      const instance = new TriggerClass();
      try {
        instance.validate(config.config);

        const context: TriggerContext = {
          agentId,
          enqueueTask: async (task) => {
            await runtime.enqueue(task);
          }
        };

        this.logger.debug(`Starting trigger ${config.type} for agent ${agentId} with config: ${JSON.stringify(config.config)}`);
        await instance.start(config.config, context);
        instances.push({ instance, config: config.config });
        this.logger.info(`Started trigger ${config.type} for agent ${agentId}`);
      } catch (error: any) {
        this.logger.error(`Failed to start trigger ${config.type} for agent ${agentId}: ${error.message}`, error);
      }
    }

    if (instances.length > 0) {
      this.runningTriggers.set(agentId, instances);
    }
  }

  async stopAgentTriggers(agentId: string): Promise<void> {
    const entries = this.runningTriggers.get(agentId) || [];
    for (const { instance } of entries) {
      try {
        await instance.stop();
      } catch (error: any) {
        this.logger.error(`Failed to stop trigger ${instance.type} for agent ${agentId}: ${error.message}`);
      }
    }
    this.runningTriggers.delete(agentId);
  }

  async stopAll(): Promise<void> {
    for (const [agentId, entries] of this.runningTriggers.entries()) {
      for (const { instance } of entries) {
        try {
          await instance.stop();
        } catch (error: any) {
          this.logger.error(`Failed to stop trigger ${instance.type} for agent ${agentId}: ${error.message}`);
        }
      }
    }
    this.runningTriggers.clear();
    this.logger.info("All triggers stopped");
  }

  getRunning(agentId: string): BaseTrigger[] {
    return (this.runningTriggers.get(agentId) || []).map(e => e.instance);
  }

  getUpcomingTasks(): any[] {
    const upcoming: any[] = [];
    for (const [agentId, entries] of this.runningTriggers.entries()) {
      for (const { instance, config } of entries) {
        const runs = instance.getUpcomingRuns(config);
        for (const run of runs) {
          upcoming.push({
            agentId,
            triggerType: instance.type,
            ...run
          });
        }
      }
    }
    // Sort by timestamp
    return upcoming.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async handleWebhook(agentId: string, payload: any, headers?: Record<string, any>): Promise<void> {
    const instances = this.getRunning(agentId);
    
    for (const trigger of instances) {
      if (trigger.type === "webhook" || trigger.type === "github") {
        if ('handleRequest' in trigger && typeof trigger.handleRequest === 'function') {
          await (trigger as any).handleRequest(payload, headers);
        }
      }
    }
  }

  listSchemas(): any[] {
    return Array.from(this.triggerClasses.entries()).map(([type, Type]) => {
      const instance = new Type();
      return {
        type,
        schema: instance.getFormSchema()
      };
    });
  }
}
