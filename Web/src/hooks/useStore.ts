import { useState, useCallback, useEffect } from 'react';
import type { Agent, KnowledgeBase, Session, FileNode, TriggerSchema, Connection } from '../types';


const MOCK_KB: KnowledgeBase[] = [
  {
    id: 'internal-docs',
    name: 'Internal Documentation',
    description: 'Company-wide wiki and guides.',
    type: 'connector',
  },
  {
    id: 'notion-workspace',
    name: 'Product Notion',
    description: 'Product specs and roadmap.',
    type: 'notion',
  },
  {
    id: 'website-crawler',
    name: 'Official Website',
    description: 'Public facing marketing content.',
    type: 'website',
  },
];

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgents = useCallback(async () => {
    try {
      const resp = await fetch('http://localhost:4000/agents');
      if (resp.ok) {
        const data = await resp.json();
        // Map backend AgentConfig to frontend Agent type
        const mapped = data.map((a: any) => ({
          ...a,
          tools: a.tools || [],
          mcpTools: a.mcpTools || [],
          triggers: a.triggers || [],
          knowledgeBases: a.knowledgeBases || [],
          runningInstances: 0, // Mock for now
          colorClass: `agent-${['blue', 'emerald', 'amber', 'rose', 'purple'][Math.floor(Math.random() * 5)]}`
        }));
        setAgents(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addAgent = useCallback(async (agentData: any) => {
    try {
      const formData = new FormData();
      
      const config = {
        id: agentData.id,
        name: agentData.name,
        description: agentData.description,
        instruction: agentData.instruction,
        provider: agentData.provider || 'openai',
        model: agentData.model || 'gpt-4o',
        tools: agentData.tools || [],
        maxIterations: agentData.maxIterations || 10,
        temperature: agentData.temperature || 0.7,
      };

      formData.append('config', JSON.stringify(config));
      if (agentData.file) {
        formData.append('file', agentData.file);
      }

      const resp = await fetch('http://localhost:4000/agents/deploy', {
        method: 'POST',
        body: formData
      });

      if (resp.ok) {
        await fetchAgents();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to create agent:', err);
      return false;
    }
  }, [fetchAgents]);

  const updateAgent = useCallback((updatedAgent: Agent) => {
    setAgents(prev => prev.map(a => a.id === updatedAgent.id ? updatedAgent : a));
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const runTask = useCallback(async (agentId: string, instruction: string, metadata?: any) => {
    try {
      const resp = await fetch('http://localhost:4000/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, instruction, metadata })
      });
      return resp.json();
    } catch (err) {
      console.error('Failed to run task:', err);
      throw err;
    }
  }, []);

  return { agents, addAgent, updateAgent, runTask, loading, refresh: fetchAgents };
}

export function useSessions(agentId?: string) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSessions = useCallback(async () => {
    if (!agentId) return;
    setLoading(true);
    try {
      const resp = await fetch(`http://localhost:4000/sessions/${agentId}`);
      if (resp.ok) {
        const data = await resp.json();
        setSessions(data);
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { sessions, loading, refresh: fetchSessions };
}

export function useAllSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(`http://localhost:4000/sessions`);
      if (resp.ok) {
        const data = await resp.json();
        setSessions(data);
      }
    } catch (err) {
      console.error('Failed to fetch all sessions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { sessions, loading, refresh: fetchSessions };
}

export function useSessionDetail(agentId?: string, sessionId?: string) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!agentId || !sessionId) {
      setSession(null);
      return;
    }
    
    let isMounted = true;
    setLoading(true);
    
    fetch(`http://localhost:4000/sessions/${agentId}/${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (isMounted) setSession(data);
      })
      .catch(err => console.error('Failed to fetch session detail:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });
      
    return () => { isMounted = false; };
  }, [agentId, sessionId]);

  return { session, loading };
}

export function useAgentFiles(agentId?: string) {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFiles = useCallback(async () => {
    if (!agentId) return;
    setLoading(true);
    try {
      const resp = await fetch(`http://localhost:4000/agents/${agentId}/files`);
      if (resp.ok) {
        const data = await resp.json();
        setFiles(data);
      }
    } catch (err) {
      console.error('Failed to fetch files:', err);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  return { files, loading, refresh: fetchFiles };
}

export async function getFileContent(agentId: string, path: string): Promise<string> {
  try {
    const resp = await fetch(`http://localhost:4000/agents/${agentId}/files/content?path=${encodeURIComponent(path)}`);
    if (resp.ok) {
      return await resp.text();
    }
    return 'Error loading file content';
  } catch (err) {
    console.error('Failed to fetch file content:', err);
    return 'Error loading file content';
  }
}

export async function saveFileContent(agentId: string, path: string, content: string) {
  const res = await fetch(`http://localhost:4000/agents/${agentId}/files/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, content })
  });
  return res.json();
}

export async function updateAgentConfig(agentId: string, config: Partial<Agent>) {
  const res = await fetch(`http://localhost:4000/agents/${agentId}/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  return res.json();
}

export async function deleteAgent(agentId: string) {
  const res = await fetch(`http://localhost:4000/agents/${agentId}`, {
    method: 'DELETE'
  });
  return res.json();
}

export function useTools() {
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTools = useCallback(async () => {
    try {
      const resp = await fetch('http://localhost:4000/tools');
      if (resp.ok) {
        const data = await resp.json();
        setTools(data);
      }
    } catch (err) {
      console.error('Failed to fetch tools:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  return { tools, loading, refresh: fetchTools };
}

export function useKnowledgeBase() {
  const [knowledgeBases] = useState<KnowledgeBase[]>(MOCK_KB);
  return { knowledgeBases };
}

export function useConnections() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConnections = useCallback(async () => {
    try {
      const resp = await fetch('http://localhost:4000/connections');
      if (resp.ok) {
        const data = await resp.json();
        setConnections(data);
      }
    } catch (err) {
      console.error('Failed to fetch connections:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveConnection = useCallback(async (service: string, creds: Record<string, string>): Promise<{ success: boolean; error?: string }> => {
    try {
      const resp = await fetch(`http://localhost:4000/connections/${service}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds),
      });
      const data = await resp.json();
      if (resp.ok) {
        await fetchConnections();
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to save connection.' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [fetchConnections]);

  const deleteConnection = useCallback(async (service: string): Promise<boolean> => {
    try {
      const resp = await fetch(`http://localhost:4000/connections/${service}`, {
        method: 'DELETE',
      });
      if (resp.ok) {
        await fetchConnections();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to delete connection:', err);
      return false;
    }
  }, [fetchConnections]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  return { connections, loading, saveConnection, deleteConnection, refresh: fetchConnections };
}

export function useTriggers() {
  const [triggerSchemas, setTriggerSchemas] = useState<TriggerSchema[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchemas = useCallback(async () => {
    try {
      const resp = await fetch('http://localhost:4000/triggers/schemas');
      if (resp.ok) {
        const data = await resp.json();
        setTriggerSchemas(data);
      }
    } catch (err) {
      console.error('Failed to fetch trigger schemas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchemas();
  }, [fetchSchemas]);

  return { triggerSchemas, loading, refresh: fetchSchemas };
}

export function useModels() {
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchModels = useCallback(async () => {
    try {
      const resp = await fetch('http://localhost:4000/models');
      if (resp.ok) {
        const data = await resp.json();
        // data is { provider: string, models: string[] }[]
        const formatted = data.flatMap((p: any) => 
          p.models.map((m: string) => `${p.provider}:${m}`)
        );
        setModels(formatted);
      }
    } catch (err) {
      console.error('Failed to fetch models:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return { models, loading, refresh: fetchModels };
}

export function useTaskQueue() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = useCallback(async () => {
    try {
      const resp = await fetch('http://localhost:4000/tasks/queue');
      if (resp.ok) {
        const data = await resp.json();
        setQueue(data);
      }
    } catch (err) {
      console.error('Failed to fetch task queue:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  return { queue, loading, refresh: fetchQueue };
}
