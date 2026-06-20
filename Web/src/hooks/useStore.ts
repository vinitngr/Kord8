import { useState, useCallback } from 'react';
import type { Agent, KnowledgeBase, Session, FileNode, TriggerSchema, Connection, Pod } from '../types';

const MOCK_KB: KnowledgeBase[] = [
  { id: 'internal-docs', name: 'Internal Documentation', description: 'Company-wide wiki and guides.', type: 'connector', service: 'core' },
  { id: 'notion-workspace', name: 'Product Notion', description: 'Product specs and roadmap.', type: 'notion', service: 'notion' },
  { id: 'website-crawler', name: 'Official Website', description: 'Public facing marketing content.', type: 'website', service: 'core' },
  { id: 'github-docs', name: 'API Reference', description: 'Technical documentation from GitHub.', type: 'github', service: 'github' }
];

const MOCK_AGENTS: Agent[] = [
  {
    id: 'agent-1', name: 'Research Assistant', description: 'Specializes in deep research and data synthesis.',
    instruction: 'Identify key trends in the provided data and summarize them.',
    tools: ['curl', 'search'], mcpTools: [], knowledgeBases: ['internal-docs'],
    triggers: [{ id: 't1', type: 'cron', config: { schedule: '0 9 * * *' } }],
    model: 'gpt-4o', temperature: 0.7, maxIterations: 10, runningInstances: 2, colorClass: 'agent-blue'
  },
  {
    id: 'agent-2', name: 'Customer Support', description: 'Handles common customer inquiries.',
    instruction: 'Be polite and helpful when answering customer questions.',
    tools: ['send_email'], mcpTools: [], knowledgeBases: ['website-crawler'],
    triggers: [{ id: 't2', type: 'webhook', config: { path: '/support' } }],
    model: 'claude-3-5-sonnet', temperature: 0.3, maxIterations: 5, runningInstances: 0, colorClass: 'agent-emerald'
  },
  {
    id: 'agent-3', name: 'Project Manager', description: 'Tracks project progress and deadlines.',
    instruction: 'Update the project board based on team updates.',
    tools: ['create_issue', 'read_issue'], mcpTools: [], knowledgeBases: ['notion-workspace'],
    triggers: [{ id: 't3', type: 'notion', config: { event: 'Page Created' } }],
    model: 'gpt-4o', temperature: 0.5, maxIterations: 8, runningInstances: 1, colorClass: 'agent-purple'
  },
  {
    id: 'agent-4', name: 'Security Auditor', description: 'Scans for vulnerabilities and checks permissions.',
    instruction: 'Identify potential security risks in the provided context.',
    tools: ['curl'], mcpTools: [], knowledgeBases: ['internal-docs'],
    triggers: [], model: 'gpt-4o', temperature: 0.1, maxIterations: 12, runningInstances: 0, colorClass: 'agent-rose'
  },
  {
    id: 'agent-5', name: 'Content Strategist', description: 'Drafts vision and communications copy.',
    instruction: 'Draft compelling narratives based on research data.',
    tools: ['search'], mcpTools: [], knowledgeBases: ['website-crawler'],
    triggers: [], model: 'claude-3-5-sonnet', temperature: 0.8, maxIterations: 5, runningInstances: 0, colorClass: 'agent-amber'
  },
  {
    id: 'agent-6', name: 'Backend Architect', description: 'Designs database schemas and API endpoints.',
    instruction: 'Design scalable system architectures for global services.',
    tools: ['notion'], mcpTools: [], knowledgeBases: ['internal-docs'],
    triggers: [], model: 'gpt-4o', temperature: 0.4, maxIterations: 10, runningInstances: 0, colorClass: 'agent-blue'
  },
  {
    id: 'agent-7', name: 'UX Researcher', description: 'Analyzes user sessions and feedback.',
    instruction: 'Summarize user pain points from feedback data.',
    tools: ['search'], mcpTools: [], knowledgeBases: ['website-crawler'],
    triggers: [], model: 'claude-3-5-sonnet', temperature: 0.6, maxIterations: 10, runningInstances: 0, colorClass: 'agent-purple'
  },
  {
    id: 'agent-8', name: 'Data Scientist', description: 'Statistical modeling and trend prediction.',
    instruction: 'Apply statistical models to project future growth.',
    tools: ['search'], mcpTools: [], knowledgeBases: ['internal-docs'],
    triggers: [], model: 'gpt-4o', temperature: 0.2, maxIterations: 15, runningInstances: 0, colorClass: 'agent-emerald'
  },
  {
    id: 'agent-9', name: 'DevOps Engineer', description: 'Automates deployments and health monitoring.',
    instruction: 'Scale infrastructures and monitor live telemetry.',
    tools: ['curl'], mcpTools: [], knowledgeBases: ['internal-docs'],
    triggers: [], model: 'gpt-4o', temperature: 0.1, maxIterations: 8, runningInstances: 1, colorClass: 'agent-rose'
  }
];

const MOCK_PODS: Pod[] = [
  {
    id: 'pod-1',
    name: 'Market Research Team',
    goal: 'Research competitor products, gather customer feedback, and create actionable tickets in the project board. The research agent gathers data, support agent provides customer insights, and the PM creates tickets.',
    agentIds: ['agent-1', 'agent-2', 'agent-3'],
    routingMode: 'coordinated',
    maxRounds: 10,
    timeoutSeconds: 300,
    triggers: [{ id: 'pt1', type: 'webhook', config: { path: '/pods/market-research' } }],
    status: 'active'
  },
  {
    id: 'pod-2',
    name: 'Tactical Response Unit',
    goal: 'Quickly identify and patch security vulnerabilities in the core platform. Auditor finds bugs, Architect designs fix, DevOps deploys.',
    agentIds: ['agent-4', 'agent-6', 'agent-9'],
    routingMode: 'pipeline',
    maxRounds: 10,
    timeoutSeconds: 300,
    triggers: [],
    status: 'active'
  },
  {
    id: 'pod-3',
    name: 'Global Hive',
    goal: 'End-to-end product development: Strategist drafts vision, Researcher validates, Data Scientist models impact, Architect builds, Auditor secures, and DevOps scales.',
    agentIds: ['agent-5', 'agent-7', 'agent-8', 'agent-6', 'agent-4', 'agent-9'],
    routingMode: 'swarm',
    maxRounds: 25,
    timeoutSeconds: 900,
    triggers: [],
    status: 'active'
  }
];

const MOCK_SESSIONS: Session[] = [
  {
    id: 'sess-1', agentId: 'agent-1', runCount: 5,
    toolsUsed: ['search', 'curl'],
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    logs: ['Starting research task...', 'Searching for trends...', 'Task completed successfully.'],
    result: { summary: 'Found 3 key trends in AI agents.' },
    executionDetails: 'Runtime: 4.2s', status: 'completed'
  },
  {
    id: 'pod-sess-1', podId: 'pod-1', runCount: 12,
    toolsUsed: ['search', 'curl', 'create_issue'],
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    logs: [
       '[Research Assistant] Starting data aggregation from internal docs...',
       '[Research Assistant] Found 12 relevant competitor pages.',
       '[Research Assistant → Customer Support] Requesting customer feedback summary.',
       '[Customer Support] Analyzing top 5 user pain points from recent tickets.',
       '[Customer Support → Research Assistant] Returning feedback analysis.',
       '[Research Assistant → Project Manager] Sending combined research + feedback report.',
       '[Project Manager] Creating 3 tickets in Notion based on findings.',
       '[System] Mission completed in 8 rounds. 3 deliverables created.'
    ],
    result: { summary: 'Completed market research with 3 actionable tickets created.' },
    executionDetails: 'Runtime: 12.5s', status: 'completed',
    events: [
       { from: 'agent-1', to: 'agent-2', type: 'call', timestamp: new Date().toISOString(), label: 'Request Feedback' },
       { from: 'agent-2', to: 'agent-1', type: 'response', timestamp: new Date().toISOString(), label: 'Return Analysis' },
       { from: 'agent-1', to: 'agent-3', type: 'call', timestamp: new Date().toISOString(), label: 'Send Report' }
    ]
  },
  {
    id: 'pod-sess-2', podId: 'pod-1', runCount: 4,
    toolsUsed: ['search'],
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    logs: [
       '[Research Assistant] Quick scan of latest industry news.',
       '[Research Assistant → Project Manager] No major changes. Summary update only.',
       '[Project Manager] Updated existing tickets with latest data.',
       '[System] Mission completed in 3 rounds.'
    ],
    result: { summary: 'Incremental update — no new tickets needed.' },
    executionDetails: 'Runtime: 4.1s', status: 'completed',
    events: [
       { from: 'agent-1', to: 'agent-3', type: 'call', timestamp: new Date().toISOString(), label: 'Update Report' }
    ]
  },
  {
    id: 'pod-sess-hive-1', podId: 'pod-3', runCount: 1,
    toolsUsed: ['search', 'notion', 'curl'],
    timestamp: new Date().toISOString(),
    logs: [
       '[Content Strategist] Starting swarm orchestration for Global v2.0 roadmap.',
       '[Content Strategist → UX Researcher] Requesting user pain point matrix.',
       '[Content Strategist → Data Scientist] Requesting performance baseline projection.',
       '[UX Researcher] Identified top 3 friction points in session recordings.',
       '[Data Scientist] Calculated 40% potential throughput gain in v2.0.',
       '[Backend Architect] Drafting secure API endpoints based on new scale requirements...',
       '[Backend Architect → Security Auditor] Requesting audit of draft schemas.',
       '[Security Auditor] Flagged potential injection vector in endpoint A-12.',
       '[Security Auditor → Backend Architect] Returning audit results (Vulnerable).',
       '[Backend Architect] Patching endpoint A-12 and refining SQL abstraction.',
       '[Backend Architect → Security Auditor] Requesting re-audit of patched schema.',
       '[Security Auditor] Patch verified. No and further risks detected.',
       '[DevOps Engineer] Provisioning auto-scaling staging infrastructure...',
       '[Content Strategist] Hive swarm successfully settled. All v2.0 deliverables are verified and staged.',
       '[System] Complex hive swarm mission completed in 16 rounds of active collaboration.'
    ],
    result: { summary: 'Global Hive v2.0 staging successfully provisioned with verified security architecture.' },
    executionDetails: 'Runtime: 52.8s', status: 'completed',
    events: [
       { from: 'agent-5', to: 'agent-7', type: 'call', timestamp: new Date().toISOString(), label: 'Request Matrix' },
       { from: 'agent-5', to: 'agent-8', type: 'call', timestamp: new Date().toISOString(), label: 'Request Growth Model' },
       { from: 'agent-5', to: 'agent-6', type: 'call', timestamp: new Date().toISOString(), label: 'Initial Design Lead' },
       { from: 'agent-6', to: 'agent-4', type: 'call', timestamp: new Date().toISOString(), label: 'Security Audit' },
       { from: 'agent-4', to: 'agent-6', type: 'response', timestamp: new Date().toISOString(), label: 'Audit Result (Risk Found)' },
       { from: 'agent-6', to: 'agent-4', type: 'call', timestamp: new Date().toISOString(), label: 'Verify Patch' },
       { from: 'agent-4', to: 'agent-6', type: 'response', timestamp: new Date().toISOString(), label: 'Audit Result (Verified)' },
       { from: 'agent-6', to: 'agent-5', type: 'response', timestamp: new Date().toISOString(), label: 'Design Confirmed' },
       { from: 'agent-5', to: 'agent-9', type: 'call', timestamp: new Date().toISOString(), label: 'Deploy Staging' }
    ]
  }
];

// ─── Hooks ────────────────────────────────────────────────────

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>(MOCK_AGENTS);
  const loading = false;
  const fetchAgents = useCallback(async () => {}, []);

  const addAgent = useCallback(async (agentData: any) => {
    const newAgent: Agent = {
      ...agentData,
      id: `agent-${Math.random().toString(36).substr(2, 9)}`,
      runningInstances: 0,
      colorClass: `agent-${['blue', 'emerald', 'amber', 'rose', 'purple'][Math.floor(Math.random() * 5)]}`
    };
    setAgents(prev => [...prev, newAgent]);
    return newAgent.id;
  }, []);

  const updateAgent = useCallback((updatedAgent: Agent) => {
    setAgents(prev => prev.map(a => a.id === updatedAgent.id ? updatedAgent : a));
  }, []);

  const runTask = useCallback(async (_agentId: string, _instruction: string) => {
    return { success: true, sessionId: 'sess-new' };
  }, []);

  return { agents, addAgent, updateAgent, runTask, loading, refresh: fetchAgents };
}

export function usePods() {
  const [pods, setPods] = useState<Pod[]>(MOCK_PODS);
  const loading = false;

  const addPod = useCallback(async (podData: Partial<Pod>) => {
    const newPod: Pod = {
      id: `pod-${Math.random().toString(36).substr(2, 9)}`,
      name: podData.name || 'Untitled Pod',
      goal: podData.goal || '',
      agentIds: podData.agentIds || [],
      routingMode: podData.routingMode || 'swarm',
      maxRounds: podData.maxRounds || 10,
      timeoutSeconds: podData.timeoutSeconds || 300,
      triggers: podData.triggers || [],
      status: 'active'
    };
    setPods(prev => [...prev, newPod]);
    return true;
  }, []);

  const updatePod = useCallback((updatedPod: Pod) => {
    setPods(prev => prev.map(p => p.id === updatedPod.id ? updatedPod : p));
  }, []);

  const deletePod = useCallback(async (podId: string) => {
    setPods(prev => prev.filter(p => p.id !== podId));
    return true;
  }, []);

  return { pods, addPod, updatePod, deletePod, loading };
}

export function useSessions(agentId?: string) {
  const [sessions] = useState<Session[]>(agentId ? MOCK_SESSIONS.filter(s => s.agentId === agentId) : MOCK_SESSIONS);
  const loading = false;
  const fetchSessions = useCallback(async () => {}, []);
  return { sessions, loading, refresh: fetchSessions };
}

export function usePodSessions(podId?: string) {
  const [sessions] = useState<Session[]>(podId ? MOCK_SESSIONS.filter(s => s.podId === podId) : []);
  const loading = false;
  return { sessions, loading };
}

export function useAllSessions() {
  const [sessions] = useState<Session[]>(MOCK_SESSIONS);
  const loading = false;
  const fetchSessions = useCallback(async () => {}, []);
  return { sessions, loading, refresh: fetchSessions };
}

export function useSessionDetail(_agentId?: string, sessionId?: string) {
  const [session] = useState<Session | null>(MOCK_SESSIONS.find(s => s.id === sessionId) || null);
  const loading = false;
  return { session, loading };
}

export function useAgentFiles(_agentId?: string) {
  const [files] = useState<FileNode[]>([
    { name: 'README.md', type: 'file' },
    { name: 'src', type: 'directory', children: [{ name: 'main.ts', type: 'file' }] }
  ]);
  const loading = false;
  const fetchFiles = useCallback(async () => {}, []);
  return { files, loading, refresh: fetchFiles };
}

export async function getFileContent(_agentId: string, _path: string): Promise<string> {
  return `// Content for ${_path}\nexport const hello = "world";`;
}
export async function saveFileContent(_agentId: string, _path: string, _content: string): Promise<{ success: boolean; error?: string }> { return { success: true }; }
export async function updateAgentConfig(_agentId: string, _config: Partial<Agent>): Promise<{ success: boolean; error?: string }> { return { success: true }; }
export async function deleteAgent(_agentId: string): Promise<{ success: boolean; error?: string }> { return { success: true }; }

export function useTools() {
  const [tools] = useState<any[]>([
    { name: 'curl', description: 'HTTP client' },
    { name: 'search', description: 'Google Search' },
    { name: 'send_email', description: 'Email automation' }
  ]);
  const loading = false;
  const fetchTools = useCallback(async () => {}, []);
  return { tools, loading, refresh: fetchTools };
}

export function useKnowledgeBase() {
  const [knowledgeBases] = useState<KnowledgeBase[]>(MOCK_KB);
  return { knowledgeBases };
}

const MOCK_CONNECTIONS: Connection[] = [
  {
    service: 'core', label: 'Core Actions', description: 'Basic system actions like curl and email',
    isConnected: true, hasPing: false, fields: [],
    tools: [
      { name: 'curl', description: 'Make an HTTP request to any URL', kind: 'action' },
      { name: 'send_email', description: 'Send an email', kind: 'action' },
      { name: 'search', description: 'Search the web using Serper', kind: 'read' },
    ]
  },
  {
    service: 'github', label: 'GitHub', description: 'Interact with GitHub repositories',
    isConnected: true, hasPing: true, fields: [],
    tools: [
      { name: 'create_issue', description: 'Create a new issue in a repository', kind: 'action' },
      { name: 'read_issue', description: 'Read issue details and comments', kind: 'read' },
      { name: 'create_pull_request', description: 'Create a new pull request', kind: 'action' },
      { name: 'list_repos', description: 'List user repositories', kind: 'read' }
    ]
  },
  {
    service: 'notion', label: 'Notion', description: 'Manage Notion databases and pages',
    isConnected: true, hasPing: true,
    fields: [{ name: 'apiKey', label: 'Internal Integration Token', type: 'password', required: true, placeholder: 'secret_...' }],
    tools: [
      { name: 'read_database', description: 'Read rows from a Notion database', kind: 'read' },
      { name: 'add_row', description: 'Add a new row to a Notion database', kind: 'action' },
      { name: 'update_page', description: 'Update an existing Notion page', kind: 'action' },
      { name: 'read_page', description: 'Get content of a Notion page', kind: 'read' },
      { name: 'search_notion', description: 'Search workspace for pages/databases', kind: 'read' }
    ]
  },
  {
    service: 'google_calendar', label: 'Google Calendar', description: 'Schedule and manage calendar events',
    isConnected: false, hasPing: true, fields: [],
    tools: [
      { name: 'list_events', description: 'List upcoming calendar events', kind: 'read' },
      { name: 'create_event', description: 'Schedule a new meeting', kind: 'action' },
      { name: 'delete_event', description: 'Remove a calendar event', kind: 'action' }
    ]
  },
  {
    service: 'slack', label: 'Slack', description: 'Send messages and interact with channels',
    isConnected: false, hasPing: true,
    fields: [{ name: 'token', label: 'Bot User OAuth Token', type: 'password', required: true, placeholder: 'xoxb-...' }],
    tools: [
      { name: 'send_message', description: 'Post a message to a channel', kind: 'action' },
      { name: 'read_messages', description: 'Fetch recent messages from a channel', kind: 'read' },
      { name: 'list_channels', description: 'List available Slack channels', kind: 'read' }
    ]
  },
  {
    service: 'google_drive', label: 'Google Drive', description: 'Synchronize documents and files',
    isConnected: false, hasPing: true,
    fields: [{ name: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'AIza...' }],
    tools: [
      { name: 'list_files', description: 'List files in a drive folder', kind: 'read' },
      { name: 'read_doc', description: 'Read content from a Google Doc', kind: 'read' }
    ]
  },
  {
    service: 'discord', label: 'Discord', description: 'Integrate with community channels',
    isConnected: false, hasPing: true,
    fields: [{ name: 'webhookUrl', label: 'Webhook URL', type: 'text', required: true, placeholder: 'https://discord.com/api/webhooks/...' }],
    tools: [{ name: 'post_message', description: 'Send a message to a Discord channel', kind: 'action' }]
  }
];

export function useConnections() {
  const [connections, setConnections] = useState<Connection[]>(MOCK_CONNECTIONS);
  const loading = false;
  const fetchConnections = useCallback(async () => {}, []);
  const saveConnection = useCallback(async (service: string, _creds: Record<string, string>): Promise<{ success: boolean; error?: string }> => {
    setConnections(prev => prev.map(c => c.service === service ? { ...c, isConnected: true } : c));
    return { success: true };
  }, []);
  const deleteConnection = useCallback(async (service: string): Promise<boolean> => {
    setConnections(prev => prev.map(c => c.service === service ? { ...c, isConnected: false } : c));
    return true;
  }, []);
  return { connections, loading, saveConnection, deleteConnection, refresh: fetchConnections };
}

export function useTriggers() {
  const [triggerSchemas] = useState<TriggerSchema[]>([
    { type: 'cron', schema: { description: 'Run on a repetitive schedule', fields: [{ name: 'schedule', label: 'CRON Expression', type: 'text', placeholder: '0 * * * *' }] } },
    { type: 'webhook', schema: { description: 'Trigger via HTTP POST request', fields: [{ name: 'path', label: 'Webhook Path', type: 'text', placeholder: '/my-webhook' }] } }
  ]);
  const loading = false;
  const fetchSchemas = useCallback(async () => {}, []);
  return { triggerSchemas, loading, refresh: fetchSchemas };
}

export function useModels() {
  const [models] = useState<string[]>(['openai:gpt-4o', 'openai:gpt-4o-mini', 'anthropic:claude-3-5-sonnet', 'google:gemini-1.5-pro']);
  const loading = false;
  const fetchModels = useCallback(async () => {}, []);
  return { models, loading, refresh: fetchModels };
}

export function useTaskQueue() {
  const [queue] = useState<any[]>([
    { id: 'task-1', agentId: 'agent-1', status: 'queued', createdAt: new Date().toISOString() },
    { id: 'task-2', agentId: 'agent-1', status: 'processing', createdAt: new Date().toISOString() }
  ]);
  const loading = false;
  const fetchQueue = useCallback(async () => {}, []);
  return { queue, loading, refresh: fetchQueue };
}
