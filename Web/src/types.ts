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
  // Model Configuration
  model?: string;
  maxIterations?: number;
  maxTokens?: number;
  temperature?: number;
  reasoningEffort?: 'low' | 'medium' | 'high';
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

export interface Session {
  id: string;
  agentId: string;
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
  events?: any[];
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
  type: 'connector' | 'upload' | 'notion' | 'website';
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
