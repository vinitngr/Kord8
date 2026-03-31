import { useState, useEffect } from "react";
import { Modal } from "../shared/Modal";
import { Badge } from "../shared/Badge";
import type { Agent } from "../../types";
import { useSessions, useAgentFiles, useSessionDetail, getFileContent, updateAgentConfig, saveFileContent, useTriggers, useModels } from "../../hooks/useStore";
import { ConnectionsPanel } from "./ConnectionsPanel";
import { 
  History,
  FileText,
  Settings,
  Folder,
  File,
  ChevronDown,
  ChevronRight,
  Pause, 
  Play,
  Trash2, 
  X,
  Activity,
  Send
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../shared/Button";

interface AgentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent | null;
  onRefresh?: () => void;
}

export function AgentDetailsModal({ isOpen, onClose, agent, onRefresh }: AgentDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<"details" | "files" | "sessions" | "settings">("details");
  const { sessions, loading: sessionsLoading } = useSessions(activeTab === "sessions" ? agent?.id : undefined);
  const { files, loading: filesLoading } = useAgentFiles(activeTab === "files" ? agent?.id : undefined);
  
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const { session: detailedSession, loading: detailLoading } = useSessionDetail(agent?.id, selectedSessionId || undefined);

  const [selectedFile, setSelectedFile] = useState<{name: string, path: string, content: string} | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [followUpText, setFollowUpText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [sessionTab, setSessionTab] = useState<"logs" | "raw">("logs");
  const [fileEditedContent, setFileEditedContent] = useState<string>("");
  const [isSubmittingFile, setIsSubmittingFile] = useState(false);
  const { triggerSchemas, loading: triggersLoading } = useTriggers();
  const { models, loading: modelsLoading } = useModels();

  // Local state for settings form
  const [localConfig, setLocalConfig] = useState<Partial<Agent>>({});

  useEffect(() => {
    if (agent) {
      setLocalConfig({
        name: agent.name,
        description: agent.description,
        instruction: agent.instruction,
        model: agent.model,
        temperature: agent.temperature,
        maxIterations: agent.maxIterations,
        maxTokens: agent.maxTokens,
        tools: agent.tools,
        knowledgeBases: agent.knowledgeBases,
        enabled: agent.enabled,
        triggers: agent.triggers,
      });
    }
  }, [agent]);

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => 
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  };

  const handleFileClick = async (name: string, path: string) => {
    if (!agent) return;
    const content = await getFileContent(agent.id, path);
    setSelectedFile({ name, path, content });
    setFileEditedContent(content);
  };

  const handleSaveFile = async () => {
    if (!agent || !selectedFile) return;
    setIsSubmittingFile(true);
    try {
      await saveFileContent(agent.id, selectedFile.path, fileEditedContent);
      setSelectedFile({ ...selectedFile, content: fileEditedContent });
      alert("File saved successfully!");
    } catch (err) {
      alert("Failed to save file.");
    } finally {
      setIsSubmittingFile(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!agent) return;
    setIsSaving(true);
    const success = await updateAgentConfig(agent.id, { ...agent, ...localConfig });
    setIsSaving(false);
    if (success) {
      onRefresh?.();
      alert("Configuration saved successfully!");
    } else {
      alert("Failed to save configuration.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={agent?.name || "Agent Details"}
      className="max-w-4xl"
    >
      <div className="flex flex-col h-[700px] text-left">
        {/* Tabs */}
        <div className="flex gap-8 border-b border-[#F0F0F0] mb-6">
          {[
            { id: "details", label: "Overview", icon: Activity },
            { id: "files", label: "Files", icon: FileText },
            { id: "sessions", label: "Sessions", icon: History },
            { id: "settings", label: "Settings", icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "pb-3 text-sm font-semibold transition-colors relative flex items-center gap-2",
                activeTab === tab.id ? "text-[#111]" : "text-[#999] hover:text-[#666]"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#111]" />}
            </button>
          ))}
        </div>

        {activeTab === "details" ? (
          <div className="space-y-8 pr-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left Column: Basic & Config */}
              <div className="md:col-span-1 space-y-6">
                <Section title="Description" content={agent?.description} />
                <Section title="Source Folder" content={agent?.uploadedFolder || "No folder uploaded"} isBadge />
                
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-[#999] uppercase tracking-wider">Active Triggers</h4>
                  <div className="space-y-2">
                    {agent?.triggers?.map((trigger, idx) => (
                      <div key={`${trigger.type}-${idx}`} className="p-3 bg-[#FAFAFA] border border-[#F0F0F0] rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-bold text-[#111] capitalize">{trigger.type}</p>
                          <Badge variant="outline" className="text-[9px] py-0 px-1 font-mono">Trigger</Badge>
                        </div>
                        {trigger.type === 'cron' && (
                          <p className="text-[10px] text-[#666]">
                            Runs: <span className="text-[#111] font-medium">{trigger.config?.expression}</span>
                          </p>
                        )}
                        {trigger.type === 'scheduled' && (
                          <p className="text-[10px] text-[#666]">
                            Target: <span className="text-[#111] font-medium">{trigger.config?.date} {trigger.config?.time}</span>
                          </p>
                        )}
                        {(trigger.type === 'webhook' || trigger.type === 'github') && (
                          <p className="text-[10px] text-[#22C55E] font-mono truncate">
                            /trigger/{agent.id}
                          </p>
                        )}
                        {trigger.config?.instruction && (
                          <p className="text-[9px] text-[#999] mt-1 italic line-clamp-1">"{trigger.config.instruction}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-[#999] uppercase tracking-wider">Tool Access</h4>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-[#BBB] font-medium uppercase">Core Tools</p>
                      <div className="flex flex-wrap gap-1.5">
                        {agent?.tools?.map(t => <Badge key={t} variant="outline" className="bg-white">{t}</Badge>)}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-[#BBB] font-medium uppercase">MCP Tools</p>
                      <div className="flex flex-wrap gap-1.5">
                        {agent?.mcpTools?.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-bold text-[#999] uppercase tracking-wider">Knowledge Base</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {agent?.knowledgeBases?.map(kb => (
                      <Badge key={kb} variant="default" className="bg-[#111] text-white">{kb}</Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="text-[10px] font-bold text-[#999] uppercase tracking-wider">Model Configuration</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-[#BBB] uppercase">Model</p>
                      <p className="text-xs font-semibold text-[#111]">{agent?.model || 'GPT-4o'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-[#BBB] uppercase">Temperature</p>
                      <p className="text-xs font-semibold text-[#111]">{agent?.temperature || 0.7}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-[#BBB] uppercase">Max Iterations</p>
                      <p className="text-xs font-semibold text-[#111]">{agent?.maxIterations || 10}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-[#BBB] uppercase">Tokens</p>
                      <p className="text-xs font-semibold text-[#111]">{agent?.maxTokens || 4096}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Instruction & Metadata */}
              <div className="md:col-span-2 space-y-6">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-[#999] uppercase tracking-wider">Instruction</h4>
                  <div className="bg-[#111] border border-[#333] rounded-xl p-6 font-mono text-[12px] text-[#D1D5DB] leading-relaxed shadow-inner max-h-96 overflow-y-auto font-medium">
                    {agent?.instruction}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === "files" ? (
          <div className="flex-1 flex gap-6 overflow-hidden">
            <div className="flex-1 flex border border-[#F0F0F0] rounded-2xl overflow-hidden bg-white">
              {/* File Explorer */}
              <div className="w-1/3 border-r border-[#F0F0F0] flex flex-col overflow-hidden">
                <div className="bg-[#FAFAFA] border-b border-[#E5E5E5] px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4 text-[#666]" />
                    <span className="text-sm font-semibold">Source Files</span>
                  </div>
                  {filesLoading && <div className="text-[10px] text-[#999] animate-pulse">Loading...</div>}
                </div>
                <div className="flex-1 overflow-y-auto p-3">
                  <FileTree 
                    nodes={files} 
                    expandedFolders={expandedFolders} 
                    onToggle={toggleFolder}
                    onFileClick={handleFileClick}
                  />
                </div>
              </div>

              {/* File Content */}
              <div className="flex-1 flex flex-col overflow-hidden bg-[#fafafa]">
                {selectedFile ? (
                  <>
                    <div className="bg-white border-b border-[#E5E5E5] px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#111]" />
                        <span className="text-sm font-bold text-[#111]">{selectedFile.name}</span>
                        {fileEditedContent !== selectedFile.content && (
                          <Badge variant="outline" className="text-[9px] py-0 border-amber-200 text-amber-600 bg-amber-50">Unsaved Changes</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {fileEditedContent !== selectedFile.content && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-7 text-[10px]" 
                              onClick={() => setFileEditedContent(selectedFile.content)}
                            >
                              Discard
                            </Button>
                            <Button 
                              size="sm" 
                              variant="primary" 
                              className="h-7 text-[10px]" 
                              onClick={handleSaveFile}
                              disabled={isSubmittingFile}
                            >
                              {isSubmittingFile ? "Saving..." : "Save"}
                            </Button>
                          </>
                        )}
                        <button onClick={() => setSelectedFile(null)} className="text-[#999] hover:text-[#111] ml-2">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-hidden relative">
                      <textarea
                        className="w-full h-full p-6 font-mono text-[12px] text-[#444] bg-transparent outline-none resize-none leading-relaxed"
                        value={fileEditedContent}
                        onChange={(e) => setFileEditedContent(e.target.value)}
                        placeholder="File is empty"
                        spellCheck={false}
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-[#999] space-y-2 opacity-50">
                    <FileText className="h-12 w-12" />
                    <p className="text-sm">Select a file to view its content</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === "sessions" ? (
          <div className="flex gap-6 pr-2">
            {/* Session List - Compact & Fixed Width */}
            <div className="w-64 shrink-0 border-r border-[#F0F0F0] pr-6 space-y-1.5">
              {sessionsLoading && <div className="p-4 text-center text-[10px] text-[#999] uppercase font-bold tracking-widest">Loading...</div>}
              {sessions.length === 0 && !sessionsLoading && <div className="p-4 text-center text-[10px] text-[#999] uppercase font-bold tracking-widest">No runs</div>}
              {sessions.map((session, index) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSessionId(session.id)}
                  className={cn(
                    "w-full text-left px-2 py-1.5 rounded-md border transition-all",
                    selectedSessionId === session.id 
                      ? "border-[#111] bg-white shadow-sm" 
                      : "border-transparent hover:bg-[#FAFAFA]"
                  )}
                >
                  <div className="flex justify-between items-center mb-0.5">
                    <p className="text-[9px] font-bold text-[#111]">Run #{sessions.length - index}</p>
                    {session.status === 'failed' && (
                      <div className="h-1 w-1 bg-red-500 rounded-full" />
                    )}
                  </div>
                  <p className="text-[8px] font-mono text-[#CCC] truncate">{session.id}</p>
                </button>
              ))}
            </div>

            {/* Session Details - Single Scroll Flow */}
            <div className="flex-1 pb-10">
              {detailLoading ? (
                <div className="py-20 text-center text-[#999] animate-pulse text-[10px] font-bold uppercase tracking-widest">Fetching...</div>
              ) : detailedSession ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#111]">Audit Stream</h4>
                      <p className="text-[9px] font-mono text-[#BBB]">{detailedSession.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="flex bg-[#F5F5F5] p-0.5 rounded-lg border border-[#EEE]">
                        <button 
                          onClick={() => setSessionTab("logs")}
                          className={cn(
                            "px-3 py-1 text-[9px] font-bold rounded-md transition-all",
                            sessionTab === "logs" ? "bg-white text-[#111] shadow-sm" : "text-[#888]"
                          )}
                        >
                          Logs
                        </button>
                        <button 
                          onClick={() => setSessionTab("raw")}
                          className={cn(
                            "px-3 py-1 text-[9px] font-bold rounded-md transition-all",
                            sessionTab === "raw" ? "bg-white text-[#111] shadow-sm" : "text-[#888]"
                          )}
                        >
                          JSON
                        </button>
                      </div>
                      <Badge variant={detailedSession.status === 'failed' ? "error" : "success"} className="h-5 px-2 text-[8px]">
                        {detailedSession.status === 'completed' ? 'Completed' : detailedSession.status === 'failed' ? 'Failed' : 'Running'}
                      </Badge>
                    </div>
                  </div>

                  {sessionTab === "logs" ? (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      {/* Task Instruction - Integrated */}
                      {detailedSession.instruction && (
                        <div className="bg-[#FAFAFA] border border-[#EEE] rounded-xl p-3">
                           <p className="text-[9px] font-bold text-[#999] uppercase tracking-widest mb-1">Instruction</p>
                           <p className="text-[11px] font-medium text-[#444] leading-relaxed italic">
                             "{detailedSession.instruction}"
                           </p>
                        </div>
                      )}

                      {/* Compact Audit Events */}
                      <div className="space-y-1.5">
                        <div className="bg-white rounded-xl border border-[#EEE] p-3 font-mono text-[11px] space-y-2">
                          {detailedSession.events && detailedSession.events.length > 0 ? detailedSession.events.map((ev: any, i: number) => {
                            const isTool = ev.type.includes('tool');
                            const isError = ev.type === 'error' || ev.type.toUpperCase() === 'ERROR';

                            return (
                              <div key={i} className="flex gap-3 py-1 border-b border-[#FAFAFA] last:border-0 border-transparent">
                                <span className="shrink-0 w-12 text-[9px] text-[#BBB] tabular-nums pt-0.5">
                                  {new Date(ev.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <div className="flex-1 flex gap-2 overflow-hidden">
                                  <span className={cn(
                                    "shrink-0 w-20 text-[9px] font-bold uppercase truncate pt-0.5",
                                    isError ? "text-red-500" : isTool ? "text-blue-500" : "text-[#999]"
                                  )}>
                                    {ev.type}
                                  </span>
                                  <div className="flex-1">
                                    <p className={cn(
                                      "text-[11px] font-medium leading-relaxed",
                                      isError ? "text-red-600 font-bold" : "text-[#444]"
                                    )}>
                                      {ev.message}
                                    </p>
                                    {ev.data && (
                                      <div className="mt-1 p-2 bg-[#FAFAFA] border border-[#EEE] rounded-lg text-[10px] text-[#666] overflow-x-auto">
                                        {typeof ev.data === 'object' ? JSON.stringify(ev.data) : String(ev.data)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          }) : (
                            <div className="py-10 text-center text-[#BBB] font-sans text-xs">
                              No history recorded
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Final Result - Integrated */}
                      {detailedSession.result && (
                        <div className="p-4 bg-[#FAFAFA] border border-[#EEE] rounded-xl">
                          <p className="text-[9px] font-bold text-[#999] uppercase tracking-widest mb-2">Outcome</p>
                          <div className="text-[12px] font-bold text-[#111] leading-relaxed whitespace-pre-wrap">
                            {typeof detailedSession.result === 'object' ? JSON.stringify(detailedSession.result, null, 2) : detailedSession.result}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white border border-[#EEE] rounded-xl overflow-hidden animate-in zoom-in-95 duration-200">
                      <div className="p-4 font-mono text-[11px] leading-relaxed text-[#555]">
                        <pre className="whitespace-pre-wrap select-text">
                          {JSON.stringify(detailedSession, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {detailedSession.usage && (
                    <div className="flex items-center gap-4 text-[9px] font-bold text-[#BBB] uppercase tracking-widest pt-2">
                       <span>Tokens: {detailedSession.usage.totalTokens}</span>
                       <div className="h-1 w-1 bg-[#EEE] rounded-full" />
                       <span>Steps: {detailedSession.steps || 0}</span>
                    </div>
                  )}

                  <div className="pt-6 border-t border-[#F0F0F0] space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#999] uppercase">Ask a follow up</label>
                      <div className="relative">
                        <textarea 
                          className="w-full h-20 p-3 bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl text-xs focus:outline-none"
                          placeholder="Ask about this run..."
                          value={followUpText}
                          onChange={(e) => setFollowUpText(e.target.value)}
                        />
                        <button 
                          className="absolute right-2 bottom-2 p-1.5 bg-[#111] text-white rounded-lg hover:bg-black transition-all"
                          onClick={() => alert(`Sending follow-up: ${followUpText}`)}
                        >
                          <Send className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 opacity-20 gap-3">
                  <Activity className="h-8 w-8" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Select a run</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-8 pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-[#111]">Management Actions</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-[#FAFAFA] border border-[#F0F0F0] rounded-xl">
                    <div>
                      <p className="text-sm font-semibold">Active State</p>
                      <p className="text-[11px] text-[#999]">{agent?.enabled ? 'Running normally' : 'Currently paused'}</p>
                    </div>
                    <Button 
                      variant={agent?.enabled ? "outline" : "primary"} 
                      size="sm" 
                      className="gap-2"
                      onClick={async () => {
                        await updateAgentConfig(agent!.id, { ...agent!, enabled: !agent?.enabled });
                        onRefresh?.();
                      }}
                    >
                      {agent?.enabled ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      {agent?.enabled ? 'Pause' : 'Resume'}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-red-50/50 border border-red-100 rounded-xl">
                    <div>
                      <p className="text-sm font-semibold text-red-600">Delete Agent</p>
                      <p className="text-[11px] text-red-400">Permanently remove this agent and its data</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 border-red-200 hover:bg-red-50 gap-2"
                      onClick={async () => {
                        if (confirm(`Are you sure you want to delete ${agent?.name}? This cannot be undone.`)) {
                          const res = await fetch(`http://localhost:4000/agents/${agent?.id}`, { method: 'DELETE' });
                          if (res.ok) {
                            onClose();
                            window.location.reload();
                          }
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <h3 className="text-sm font-bold text-[#111]">Connections & Tools</h3>
                  <ConnectionsPanel
                    agentTools={localConfig.tools || []}
                    onToolsChange={(tools) => setLocalConfig({ ...localConfig, tools })}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#111]">Update Configuration</h3>
                  <Badge variant="outline">Unsaved Changes</Badge>
                </div>
                
                <div className="space-y-4">

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#999] uppercase tracking-wider">Triggers</label>
                    {triggersLoading ? (
                      <div className="text-[10px] text-[#999]">Loading...</div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {triggerSchemas.map(t => (
                            <Button
                              key={t.type}
                              variant={localConfig.triggers?.some(tc => tc.type === t.type) ? "primary" : "outline"}
                              size="sm"
                              className="capitalize h-7 text-[10px]"
                              onClick={() => {
                                const exists = localConfig.triggers?.some(tc => tc.type === t.type);
                                if (exists) {
                                  setLocalConfig({
                                    ...localConfig,
                                    triggers: localConfig.triggers?.filter(tc => tc.type !== t.type)
                                  });
                                } else {
                                  setLocalConfig({
                                    ...localConfig,
                                    triggers: [...(localConfig.triggers || []), { type: t.type, config: {} }]
                                  });
                                }
                              }}
                            >
                              {t.type}
                            </Button>
                          ))}
                        </div>

                        {triggerSchemas.map(t => {
                          const config = localConfig.triggers?.find(tc => tc.type === t.type);
                          if (!config) return null;

                          return (
                            <div key={t.type} className="p-3 bg-[#FAFAFA] border border-[#F0F0F0] rounded-xl space-y-3">
                              <div className="space-y-0.5">
                                <h4 className="text-[9px] font-bold text-[#111] uppercase tracking-widest">{t.schema.title || t.type}</h4>
                                {t.schema.description && <p className="text-[9px] text-[#999]">{t.schema.description}</p>}
                              </div>

                              {t.schema.isWebhook && agent && (
                                <div className="p-3 bg-[#111] rounded-lg space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Target Endpoint</span>
                                    <button 
                                      onClick={() => {
                                        const url = `http://localhost:4000/trigger/${agent.id}`;
                                        navigator.clipboard.writeText(url);
                                        alert("Copied to clipboard!");
                                      }}
                                      className="text-[8px] text-white hover:text-[#999] underline transition-colors"
                                    >
                                      Copy URL
                                    </button>
                                  </div>
                                  <code className="block text-[9px] text-[#00FF00] font-mono break-all">
                                    http://localhost:4000/trigger/{agent.id}
                                  </code>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-3">
                                {t.schema.fields?.map((field: any) => (
                                  <div key={field.name} className={cn("space-y-1", field.type === 'textarea' && "col-span-2")}>
                                    <div className="flex justify-between items-center">
                                      <label className="text-[9px] font-bold text-[#999] uppercase">
                                        {field.label} {field.required && <span className="text-red-500">*</span>}
                                      </label>
                                      {field.type === 'range' && (
                                        <span className="text-[9px] font-mono text-[#111]">{config.config?.[field.name] || field.default || 0}</span>
                                      )}
                                    </div>

                                    {field.type === 'select' ? (
                                      <select 
                                        className="w-full p-2 bg-white border border-[#E5E5E5] rounded-lg text-xs"
                                        value={config.config?.[field.name] || field.default || ""}
                                        onChange={(e) => {
                                          const newTriggers = localConfig.triggers?.map(tc => 
                                            tc.type === t.type ? { ...tc, config: { ...tc.config, [field.name]: e.target.value } } : tc
                                          );
                                          setLocalConfig({ ...localConfig, triggers: newTriggers });
                                        }}
                                      >
                                        {!field.required && <option value="">None</option>}
                                        {field.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                                      </select>
                                    ) : field.type === 'range' ? (
                                      <input 
                                        type="range"
                                        min={field.min ?? 0}
                                        max={field.max ?? 100}
                                        step={field.step ?? 1}
                                        className="w-full h-1.5 bg-[#E5E5E5] rounded-lg appearance-none cursor-pointer accent-[#111]"
                                        value={config.config?.[field.name] || field.default || 0}
                                        onChange={(e) => {
                                          const newTriggers = localConfig.triggers?.map(tc => 
                                            tc.type === t.type ? { ...tc, config: { ...tc.config, [field.name]: parseFloat(e.target.value) } } : tc
                                          );
                                          setLocalConfig({ ...localConfig, triggers: newTriggers });
                                        }}
                                      />
                                    ) : field.type === 'checkbox' ? (
                                      <div className="flex items-center gap-2 pt-0.5">
                                        <input 
                                          type="checkbox"
                                          className="w-3.5 h-3.5 rounded border-[#E5E5E5] text-[#111] focus:ring-[#111]"
                                          checked={config.config?.[field.name] ?? field.default ?? false}
                                          onChange={(e) => {
                                            const newTriggers = localConfig.triggers?.map(tc => 
                                              tc.type === t.type ? { ...tc, config: { ...tc.config, [field.name]: e.target.checked } } : tc
                                            );
                                            setLocalConfig({ ...localConfig, triggers: newTriggers });
                                          }}
                                        />
                                        <span className="text-[10px] text-[#666]">{field.description}</span>
                                      </div>
                                    ) : field.type === 'textarea' ? (
                                      <textarea 
                                        className="w-full h-16 p-2 bg-white border border-[#E5E5E5] rounded-lg text-xs focus:outline-none resize-none"
                                        placeholder={field.placeholder || field.description}
                                        value={config.config?.[field.name] || ''}
                                        onChange={(e) => {
                                          const newTriggers = localConfig.triggers?.map(tc => 
                                            tc.type === t.type ? { ...tc, config: { ...tc.config, [field.name]: e.target.value } } : tc
                                          );
                                          setLocalConfig({ ...localConfig, triggers: newTriggers });
                                        }}
                                      />
                                    ) : (
                                      <input 
                                        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                                        className="w-full p-2 bg-white border border-[#E5E5E5] rounded-lg text-xs"
                                        placeholder={field.placeholder || field.description}
                                        value={config.config?.[field.name] || ''}
                                        onChange={(e) => {
                                          const val = field.type === 'number' ? parseFloat(e.target.value) : e.target.value;
                                          const newTriggers = localConfig.triggers?.map(tc => 
                                            tc.type === t.type ? { ...tc, config: { ...tc.config, [field.name]: val } } : tc
                                          );
                                          setLocalConfig({ ...localConfig, triggers: newTriggers });
                                        }}
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 pt-4 border-t border-[#F0F0F0]">
                    <h3 className="text-[11px] font-bold text-[#111] uppercase tracking-wider">Model & Architecture</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[#999] uppercase">LLM Model</label>
                        <select 
                          className="w-full p-2 bg-white border border-[#E5E5E5] rounded-lg text-xs focus:outline-none"
                          value={localConfig.model || 'gpt-4o'}
                          onChange={(e) => setLocalConfig({...localConfig, model: e.target.value})}
                          disabled={modelsLoading}
                        >
                          {modelsLoading ? (
                            <option>Loading...</option>
                          ) : (
                            models.map((m: string) => (
                              <option key={m} value={m.split(':')[1]}>{m}</option>
                            ))
                          )}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[#999] uppercase">Temperature</label>
                        <input 
                          type="number" 
                          step="0.1" 
                          className="w-full p-2 bg-white border border-[#E5E5E5] rounded-lg text-xs focus:outline-none" 
                          value={localConfig.temperature || 0.7} 
                          onChange={(e) => setLocalConfig({...localConfig, temperature: parseFloat(e.target.value)})}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[#999] uppercase">Max Iterations</label>
                        <input 
                          type="number" 
                          className="w-full p-2 bg-white border border-[#E5E5E5] rounded-lg text-xs focus:outline-none" 
                          value={localConfig.maxIterations || 10} 
                          onChange={(e) => setLocalConfig({...localConfig, maxIterations: parseInt(e.target.value)})}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[#999] uppercase">Max Tokens</label>
                        <input 
                          type="number" 
                          className="w-full p-2 bg-white border border-[#E5E5E5] rounded-lg text-xs focus:outline-none" 
                          value={localConfig.maxTokens || 4096} 
                          onChange={(e) => setLocalConfig({...localConfig, maxTokens: parseInt(e.target.value)})}
                        />
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <label className="text-[10px] font-bold text-[#999] uppercase">Reasoning Effort</label>
                        <select 
                          className="w-full p-2 bg-white border border-[#E5E5E5] rounded-lg text-xs focus:outline-none"
                          value={localConfig.reasoningEffort || 'medium'}
                          onChange={(e) => setLocalConfig({...localConfig, reasoningEffort: e.target.value as any})}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#999] uppercase">System Instruction</label>
                    <textarea 
                      className="w-full h-32 p-3 bg-[#111] border border-[#333] rounded-xl font-mono text-[12px] text-[#D1D5DB] leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-white/20" 
                      value={localConfig.instruction || ''}
                      onChange={(e) => setLocalConfig({...localConfig, instruction: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-6 border-t border-[#F0F0F0] flex justify-end gap-3">
              <Button variant="outline" onClick={() => setLocalConfig(agent || {})}>Discard Changes</Button>
              <Button variant="primary" onClick={handleSaveConfig} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Configuration"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function Section({ title, content, isCode, isBadge }: { title: string, content?: any, isCode?: boolean, isBadge?: boolean }) {
  const displayContent = typeof content === 'object' ? JSON.stringify(content, null, 2) : String(content || "");
  
  return (
    <div className="space-y-1.5">
      <h4 className="text-[10px] font-bold text-[#999] uppercase tracking-wider">{title}</h4>
      {isCode ? (
        <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg p-3 font-mono text-[11px] text-[#666] whitespace-pre-wrap leading-tight">
          {displayContent}
        </div>
      ) : isBadge ? (
        <Badge variant="outline" className="bg-[#F9F9FB] border-[#E5E5E5] font-mono text-[10px] py-1 text-[#111] font-semibold">
          {displayContent}
        </Badge>
      ) : (
        <p className="text-sm font-medium text-[#111] leading-relaxed">{displayContent}</p>
      )}
    </div>
  );
}

function FileTree({ nodes, expandedFolders, onToggle, onFileClick, depth = 0, pathPrefix = "" }: { 
  nodes: any[], 
  expandedFolders: string[], 
  onToggle: (path: string) => void,
  onFileClick: (name: string, path: string) => void,
  depth?: number,
  pathPrefix?: string
}) {
  return (
    <div className="space-y-1">
      {nodes.map((node) => {
        const currentPath = pathPrefix ? `${pathPrefix}/${node.name}` : node.name;
        const isExpanded = expandedFolders.includes(currentPath);
        const hasChildren = node.type === 'directory' && node.children;

        return (
          <div key={currentPath}>
            <div 
              className={cn(
                "flex items-center gap-2 p-1.5 rounded-md transition-colors cursor-pointer",
                node.type === 'directory' ? "hover:bg-gray-100" : "hover:bg-gray-50 bg-[#FAFAFA]/30"
              )}
              style={{ paddingLeft: `${depth * 16}px` }}
              onClick={() => node.type === 'directory' ? onToggle(currentPath) : onFileClick(node.name, currentPath)}
            >
              {node.type === 'directory' ? (
                <>
                  {isExpanded ? <ChevronDown className="h-3 w-3 text-[#999]" /> : <ChevronRight className="h-3 w-3 text-[#999]" />}
                  <Folder className="h-3.5 w-3.5 text-blue-500 fill-blue-500/10" />
                </>
              ) : (
                <File className="h-3.5 w-3.5 text-[#AAA] ml-5" />
              )}
              <span className={cn(
                "text-[12px]",
                node.type === 'directory' ? "font-semibold text-[#111]" : "text-[#666]"
              )}>
                {node.name}
              </span>
            </div>
            {node.type === 'directory' && isExpanded && hasChildren && (
              <div className="mt-1">
                <FileTree 
                  nodes={node.children} 
                  expandedFolders={expandedFolders} 
                  onToggle={onToggle} 
                  onFileClick={onFileClick}
                  depth={depth + 1} 
                  pathPrefix={currentPath}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
