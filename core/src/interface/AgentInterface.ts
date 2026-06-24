export interface AgentInterface {
  start(): Promise<void>;
  stop(): Promise<void>;
}
