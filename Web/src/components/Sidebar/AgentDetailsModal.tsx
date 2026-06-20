import { useState, useEffect } from "react";
import { Modal } from "../shared/Modal";
import { Badge } from "../shared/Badge";
import type { Agent } from "../../types";
import { useAgentFiles, getFileContent, updateAgentConfig, saveFileContent, useTriggers, useModels, deleteAgent } from "../../hooks/useStore";
import { ConnectionsPanel } from "./ConnectionsPanel";
import { 
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
  const [activeTab, setActiveTab] = useState<"details" | "files" | "settings">("details");
  const { files, loading: filesLoading } = useAgentFiles(activeTab === "files" ? agent?.id : undefined);
  
  const [selectedFile, setSelectedFile] = useState<{name: string, path: string, content: string} | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
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
      dark
    >
      <div className="flex flex-col h-[700px] text-left">
        {/* Tabs */}
        <div className="flex gap-8 border-b border-[#18181B] mb-6">
          {[
            { id: "details", label: "Overview", icon: Activity },
            { id: "files", label: "Files", icon: FileText },
            { id: "settings", label: "Settings", icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "pb-3 text-sm font-semibold transition-colors relative flex items-center gap-2",
                activeTab === tab.id ? "text-[#FAFAFA]" : "text-[#52525B] hover:text-[#A1A1AA]"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF4A00]" />}
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
                  <h4 className="text-[10px] font-bold text-[#52525B] uppercase tracking-wider">Active Triggers</h4>
                  <div className="space-y-2">
                    {agent?.triggers?.map((trigger, idx) => (
                      <div key={`${trigger.type}-${idx}`} className="p-3 bg-[#000] border border-[#18181B] rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-bold text-[#FAFAFA] capitalize">{trigger.type}</p>
                          <Badge variant="outline" className="text-[9px] py-0 px-1 font-mono border-[#27272A] text-[#A1A1AA]">Trigger</Badge>
                        </div>
                        {trigger.type === 'cron' && (
                          <p className="text-[10px] text-[#52525B]">
                            Runs: <span className="text-[#FAFAFA] font-medium">{trigger.config?.expression}</span>
                          </p>
                        )}
                        {trigger.type === 'scheduled' && (
                          <p className="text-[10px] text-[#52525B]">
                            Target: <span className="text-[#FAFAFA] font-medium">{trigger.config?.date} {trigger.config?.time}</span>
                          </p>
                        )}
                        {(trigger.type === 'webhook' || trigger.type === 'github') && (
                          <p className="text-[10px] text-[#FF4A00] font-mono truncate opacity-80">
                            /trigger/{agent.id}
                          </p>
                        )}
                        {trigger.config?.instruction && (
                          <p className="text-[9px] text-[#3F3F46] mt-1 italic line-clamp-1">"{trigger.config.instruction}"</p>
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
                  <h4 className="text-[10px] font-bold text-[#52525B] uppercase tracking-wider">Model Configuration</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-[#3F3F46] uppercase">Model</p>
                      <p className="text-xs font-semibold text-[#FAFAFA]">{agent?.model || 'GPT-4o'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-[#3F3F46] uppercase">Temperature</p>
                      <p className="text-xs font-semibold text-[#FAFAFA]">{agent?.temperature || 0.7}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-[#3F3F46] uppercase">Max Iterations</p>
                      <p className="text-xs font-semibold text-[#FAFAFA]">{agent?.maxIterations || 10}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-[#3F3F46] uppercase">Tokens</p>
                      <p className="text-xs font-semibold text-[#FAFAFA]">{agent?.maxTokens || 4096}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Instruction & Metadata */}
              <div className="md:col-span-2 space-y-6">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-[#52525B] uppercase tracking-wider">Instruction</h4>
                  <div className="bg-[#000] border border-[#18181B] rounded-xl p-6 font-mono text-[12px] text-[#A1A1AA] leading-relaxed shadow-inner max-h-96 overflow-y-auto font-medium">
                    {agent?.instruction}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === "files" ? (
          <div className="flex-1 flex gap-6 overflow-hidden">
            <div className="flex-1 flex border border-[#18181B] rounded-2xl overflow-hidden bg-[#000]">
              {/* File Explorer */}
              <div className="w-1/3 border-r border-[#18181B] flex flex-col overflow-hidden">
                <div className="bg-[#09090B] border-b border-[#18181B] px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4 text-[#52525B]" />
                    <span className="text-sm font-semibold text-[#FAFAFA]">Source Files</span>
                  </div>
                  {filesLoading && <div className="text-[10px] text-[#3F3F46] animate-pulse">Loading...</div>}
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
              <div className="flex-1 flex flex-col overflow-hidden bg-[#09090B]">
                {selectedFile ? (
                  <>
                    <div className="bg-[#000] border-b border-[#18181B] px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#FAFAFA]" />
                        <span className="text-sm font-bold text-[#FAFAFA]">{selectedFile.name}</span>
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
                        className="w-full h-full p-6 font-mono text-[12px] text-[#A1A1AA] bg-transparent outline-none resize-none leading-relaxed"
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
        ) : (
          <div className="space-y-8 pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-[#111]">Management Actions</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-[#09090B] border border-[#18181B] rounded-xl">
                    <div>
                      <p className="text-sm font-semibold text-[#FAFAFA]">Active State</p>
                      <p className="text-[11px] text-[#52525B]">{agent?.enabled ? 'Running normally' : 'Currently paused'}</p>
                    </div>
                    <Button 
                      variant={agent?.enabled ? "outline" : "primary"} 
                      size="sm" 
                      className={cn("gap-2 border-[#27272A]", agent?.enabled ? "text-[#A1A1AA]" : "bg-[#FF4A00] text-white")}
                      onClick={async () => {
                        await updateAgentConfig(agent!.id, { ...agent!, enabled: !agent?.enabled });
                        onRefresh?.();
                      }}
                    >
                      {agent?.enabled ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      {agent?.enabled ? 'Pause' : 'Resume'}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[#EF4444]/5 border border-[#EF4444]/10 rounded-xl">
                    <div>
                      <p className="text-sm font-semibold text-[#EF4444]">Delete Agent</p>
                      <p className="text-[11px] text-[#7F1D1D]/70">Permanently remove this agent and its data</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-[#EF4444] border-[#EF4444]/20 hover:bg-[#EF4444]/10 gap-2 transition-all"
                      onClick={async () => {
                        if (confirm(`Are you sure you want to delete ${agent?.name}? This cannot be undone.`)) {
                          await deleteAgent(agent!.id);
                          onClose();
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
                                        const url = `https://api.agentteam.com/v1/trigger/${agent.id}`;
                                        navigator.clipboard.writeText(url);
                                        alert("Copied to clipboard!");
                                      }}
                                      className="text-[8px] text-white hover:text-[#999] underline transition-colors"
                                    >
                                      Copy URL
                                    </button>
                                  </div>
                                  <code className="block text-[9px] text-[#00FF00] font-mono break-all">
                                    https://api.agentteam.com/v1/trigger/{agent.id}
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
      <h4 className="text-[10px] font-bold text-[#52525B] uppercase tracking-wider">{title}</h4>
      {isCode ? (
        <div className="bg-[#000] border border-[#18181B] rounded-lg p-3 font-mono text-[11px] text-[#A1A1AA] whitespace-pre-wrap leading-tight">
          {displayContent}
        </div>
      ) : isBadge ? (
        <Badge variant="outline" className="bg-[#18181B] border-[#27272A] font-mono text-[10px] py-1 text-[#FAFAFA] font-semibold">
          {displayContent}
        </Badge>
      ) : (
        <p className="text-sm font-medium text-[#FAFAFA] leading-relaxed">{displayContent}</p>
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
                node.type === 'directory' ? "hover:bg-[#18181B]" : "hover:bg-[#18181B]/50 bg-[#000]/10"
              )}
              style={{ paddingLeft: `${depth * 16}px` }}
              onClick={() => node.type === 'directory' ? onToggle(currentPath) : onFileClick(node.name, currentPath)}
            >
              {node.type === 'directory' ? (
                <>
                  {isExpanded ? <ChevronDown className="h-3 w-3 text-[#52525B]" /> : <ChevronRight className="h-3 w-3 text-[#52525B]" />}
                  <Folder className="h-3.5 w-3.5 text-[#FF4A00] fill-[#FF4A00]/10" />
                </>
              ) : (
                <File className="h-3.5 w-3.5 text-[#3F3F46] ml-5" />
              )}
              <span className={cn(
                "text-[12px]",
                node.type === 'directory' ? "font-semibold text-[#FAFAFA]" : "text-[#A1A1AA]"
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
