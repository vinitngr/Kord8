import { ExecutionTask } from "./Worker";
import { AgentTeam } from "../agent/AgentTeam";
import { Logger } from "../utils/logger";

export class Runtime {
  private queue: ExecutionTask[] = [];
  private activeWorkers = 0;
  private logger = Logger.scope("runtime");

  constructor(
    private app: AgentTeam, 
    private maxWorkers: number = 2
  ) {}

  async enqueueTask(task: ExecutionTask): Promise<void> {
    this.logger.info(`Task enqueued for agent: ${task.agentId}`);
    this.app.emit("queue:enqueue", { agentId: task.agentId, metadata: task.metadata });
    this.queue.push(task);
    this.processQueue();
  }

  /**
   * Alias for enqueueTask to match trigger interface requirements.
   */
  async enqueue(task: ExecutionTask): Promise<void> {
    return this.enqueueTask(task);
  }

  private async processQueue(): Promise<void> {
    if (this.activeWorkers >= this.maxWorkers || this.queue.length === 0) {
      return;
    }

    const task = this.queue.shift()!;
    this.activeWorkers++;
    this.app.emit("queue:dequeue", { agentId: task.agentId });

    try {
      await this.app.worker.execute(task);
    } catch (error) {
      this.logger.error(`Worker error:`, error);
    } finally {
      this.activeWorkers--;
      this.processQueue();
    }
  }

  getQueue() {
    return this.queue;
  }

  getStats() {
    return {
      queueLength: this.queue.length,
      activeWorkers: this.activeWorkers,
      maxWorkers: this.maxWorkers
    };
  }
}
