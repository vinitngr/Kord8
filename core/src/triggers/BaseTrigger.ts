export interface TriggeredTask {
  agentId: string;
  instruction: string;
  metadata?: Record<string, any>;
}

export interface TriggerContext {
  agentId: string;
  enqueueTask: (task: TriggeredTask) => Promise<void>;
}

export abstract class BaseTrigger<TConfig = any> {
  abstract type: string;
  
  abstract getFormSchema(): any;

  abstract validate(config: TConfig): void;

  abstract start(config: TConfig, context: TriggerContext): Promise<void>;

  abstract stop(): Promise<void> | void;
  
  getUpcomingRuns(config: TConfig): { timestamp: string, instruction: string }[] {
    return [];
  }
}
