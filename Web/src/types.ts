export type AgentStatus = 'idle' | 'running' | 'error';

export interface Agent {
  id: string;
  name: string;
  description: string;
  instruction: string;
  runningInstances: number;
  uploadedFolder?: string;
  fileStructure?: FileNode[];
  tools: string[];
  mcpTools: string[];
  knowledgeBases: string[];
  triggers: TriggerConfig[];
  colorClass?: string;
  enabled?: boolean;
  provider?: string;
  model?: string;
  maxIterations?: number;
  maxTokens?: number;
  temperature?: number;
  reasoningEffort?: 'low' | 'medium' | 'high';
}

export type RoutingMode = 'swarm' | 'pipeline' | 'coordinated';

export interface Pod {
  id: string;
  name: string;
  goal: string;
  agentIds: string[];
  routingMode: RoutingMode;
  maxRounds: number;
  timeoutSeconds: number;
  triggers: TriggerConfig[];
  status: 'active' | 'idle';
  strategy?: string;
}

export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

export interface TriggerConfig {
  type: string;
  config: any;
  id?: string;
}

export interface SessionEvent {
  from: string;
  to: string;
  type: 'call' | 'response' | 'loop';
  timestamp: string;
  label?: string;
}

export interface Session {
  id: string;
  agentId?: string;
  podId?: string;
  runCount: number;
  toolsUsed: string[];
  timestamp: string;
  logs: string[];
  result: any;
  executionDetails: string;
  status?: AgentStatus | 'failed' | 'completed';
  messages?: any[];
  usage?: any;
  steps?: number;
  events?: SessionEvent[];
  summary?: string;
  instruction?: string;
  endedAt?: string;
  error?: string;
}

export interface Tool {
  id: string;
  name: string;
  type: 'core' | 'internal' | 'mcp';
  description: string;
  isConnected?: boolean;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  type: 'connector' | 'upload' | 'notion' | 'website' | 'google_drive' | 'github';
  service?: string;
}

export interface TriggerSchema {
  type: string;
  schema: any;
}

export interface ConnectionField {
  name: string;
  label: string;
  type: "text" | "password";
  placeholder?: string;
  required: boolean;
}

export interface ConnectionTool {
  name: string;
  description: string;
  kind?: 'action' | 'read' | 'other';
}

export interface Connection {
  service: string;
  label: string;
  description: string;
  fields: ConnectionField[];
  tools: ConnectionTool[];
  isConnected: boolean;
  hasPing: boolean;
}
