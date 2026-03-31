import { useState } from "react";
import { Modal } from "../shared/Modal";
import { Button } from "../shared/Button";
import { ChevronDown, ChevronRight, Zap, Database, Clock, Cpu } from "lucide-react";
import { useAgents, useKnowledgeBase, useTriggers, useModels } from "../../hooks/useStore";
import { cn } from "../../lib/utils";
import { ConnectionsPanel } from "./ConnectionsPanel";

interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateAgentModal({ isOpen, onClose }: CreateAgentModalProps) {
  const [expanded, setExpanded] = useState<string | null>("basic");
  const { knowledgeBases } = useKnowledgeBase();
  const { addAgent } = useAgents();
  
  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instruction, setInstruction] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [model, setModel] = useState("gpt-4o");
  const [provider, setProvider] = useState("openai");
  const [maxIterations, setMaxIterations] = useState(10);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [temperature, setTemperature] = useState(0.7);
  const [reasoningEffort, setReasoningEffort] = useState<"low" | "medium" | "high">("medium");

  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [selectedKBs, setSelectedKBs] = useState<string[]>([]);
  
  const { triggerSchemas, loading: triggersLoading } = useTriggers();
  const { models, loading: modelsLoading } = useModels();
  const [triggerConfigs, setTriggerConfigs] = useState<Record<string, any>>({});

  const toggleSection = (id: string) => setExpanded(expanded === id ? null : id);

  const handleCreateAgent = async () => {
    const id = name.toLowerCase().replace(/\s+/g, '-');
    if (!id || !instruction) {
      alert("Name and Instruction are required");
      return;
    }

    const triggers = Object.entries(triggerConfigs)
      .filter(([_, config]) => config.enabled)
      .map(([type, config]) => ({
        type,
        config: config.values
      }));

    const success = await addAgent({
      id,
      name,
      description,
      instruction,
      file: selectedFile,
      provider,
      model,
      maxIterations,
      maxTokens,
      temperature,
      reasoningEffort,
      tools: selectedTools,
      knowledgeBases: selectedKBs,
      triggers,
    });

    if (success) {
      onClose();
    } else {
      alert("Failed to create agent. Check console for details.");
    }
  };

  const handleTriggerToggle = (type: string) => {
    setTriggerConfigs(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        enabled: !prev[type]?.enabled
      }
    }));
  };

  const handleTriggerValueChange = (type: string, key: string, value: any) => {
    setTriggerConfigs(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        values: {
          ...prev[type]?.values,
          [key]: value
        }
      }
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Agent"
      className="max-w-xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreateAgent}>Create Agent</Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Basic Info */}
        <div className="border border-[#F0F0F0] rounded-lg overflow-hidden">
          <button 
            onClick={() => toggleSection("basic")}
            type="button"
            className="w-full flex items-center justify-between p-4 bg-[#FAFAFA] hover:bg-[#F5F5F5] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#111]" />
              <span className="text-sm font-semibold">Basic Info</span>
            </div>
            {expanded === "basic" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          {expanded === "basic" && (
              <div className="p-4 bg-white border-t border-[#F0F0F0] space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider">Agent Name</label>
                    <input 
                      className="w-full p-2.5 bg-white border border-[#E5E5E5] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#111] transition-all" 
                      placeholder="e.g. Researcher"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider">Skill Upload (Zip/Skill.md)</label>
                    <div className="relative">
                      <input 
                        type="file" 
                        id="skill-upload"
                        className="hidden" 
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      />
                      <label 
                        htmlFor="skill-upload"
                        className="w-full flex items-center justify-center gap-2 p-2.5 bg-[#FAFAFA] border border-dashed border-[#DDD] rounded-lg text-xs text-[#666] hover:bg-white hover:border-[#111] cursor-pointer transition-all"
                      >
                        <ChevronDown className="h-3.5 w-3.5 rotate-180" />
                        {selectedFile ? selectedFile.name : "Click to upload"}
                      </label>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider">Agent Description</label>
                  <input 
                    className="w-full p-2.5 bg-white border border-[#E5E5E5] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#111] transition-all" 
                    placeholder="Short summary of the agent's purpose"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider">System Instruction</label>
                  <textarea 
                    className="w-full h-28 p-2.5 bg-white border border-[#E5E5E5] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#111] transition-all resize-none" 
                    placeholder="Provide detailed operational instructions..." 
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                  />
                </div>
              </div>
          )}
        </div>
        
        {/* Model & Architecture */}
        <div className="border border-[#F0F0F0] rounded-lg overflow-hidden">
          <button 
            onClick={() => toggleSection("model")}
            type="button"
            className="w-full flex items-center justify-between p-4 bg-[#FAFAFA] hover:bg-[#F5F5F5] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-[#111]" />
              <span className="text-sm font-semibold">Model & Architecture</span>
            </div>
            {expanded === "model" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          {expanded === "model" && (
            <div className="p-4 bg-white border-t border-[#F0F0F0] space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider">Provider</label>
                  <select 
                    className="w-full p-2.5 bg-white border border-[#E5E5E5] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#111] transition-all"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                  >
                    <option value="openai">OpenAI</option>
                    <option value="google">Google AI (Gemini)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider">Select Model</label>
                  <select 
                    className="w-full p-2.5 bg-white border border-[#E5E5E5] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#111] transition-all"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    disabled={modelsLoading}
                  >
                    {modelsLoading ? (
                      <option>Loading models...</option>
                    ) : (
                      models.filter(m => m.startsWith(provider + ':')).map((m: string) => (
                        <option key={m} value={m.split(':')[1]}>{m.split(':')[1]}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider">Max Iterations</label>
                  <input 
                    type="number" 
                    className="w-full p-2.5 bg-white border border-[#E5E5E5] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#111] transition-all" 
                    value={maxIterations}
                    onChange={(e) => setMaxIterations(parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider">Max Tokens</label>
                  <input 
                    type="number" 
                    className="w-full p-2.5 bg-white border border-[#E5E5E5] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#111] transition-all" 
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider">Temperature</label>
                  <input 
                    type="number" step="0.1" 
                    className="w-full p-2.5 bg-white border border-[#E5E5E5] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#111] transition-all" 
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider">Reasoning Effort</label>
                <select 
                  className="w-full p-2.5 bg-white border border-[#E5E5E5] rounded-lg text-sm focus:outline-none"
                  value={reasoningEffort}
                  onChange={(e) => setReasoningEffort(e.target.value as any)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          )}
        </div>
        
        {/* Tools */}
        <div className="border border-[#F0F0F0] rounded-lg overflow-hidden shadow-sm">
          <button 
            onClick={() => toggleSection("tools")}
            type="button"
            className="w-full flex items-center justify-between p-4 bg-[#FAFAFA] hover:bg-[#F5F5F5] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-[#111]" />
              <span className="text-sm font-semibold">Integrations & Tools</span>
            </div>
            {expanded === "tools" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          {expanded === "tools" && (
            <div className="p-4 bg-white border-t border-[#F0F0F0] space-y-6">
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-[#999] uppercase tracking-wider">Connected Tools</h4>
                <ConnectionsPanel 
                  agentTools={selectedTools} 
                  onToolsChange={setSelectedTools} 
                />
              </div>

              <div className="space-y-3 pt-4 border-t border-[#F5F5F5]">
                <h4 className="text-[10px] font-bold text-[#999] uppercase tracking-wider">Knowledge Base</h4>
                <div className="grid grid-cols-2 gap-2">
                  {knowledgeBases.map(kb => (
                    <button
                      key={kb.id}
                      type="button"
                      onClick={() => setSelectedKBs(prev => prev.includes(kb.id) ? prev.filter(id => id !== kb.id) : [...prev, kb.id])}
                      className={cn(
                        "p-2 text-left border rounded-lg transition-all",
                        selectedKBs.includes(kb.id) ? "border-[#111] bg-[#111]/5" : "border-[#E5E5E5] bg-white hover:border-[#CCC]"
                      )}
                    >
                      <p className="text-[11px] font-semibold text-[#111] truncate">{kb.name}</p>
                      <p className="text-[9px] text-[#999] truncate">{kb.type}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Trigger Section (Dynamic) */}
        <div className="border border-[#F0F0F0] rounded-lg overflow-hidden">
          <button 
            onClick={() => toggleSection("trigger")}
            type="button"
            className="w-full flex items-center justify-between p-4 bg-[#FAFAFA] hover:bg-[#F5F5F5] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#111]" />
              <span className="text-sm font-semibold">Trigger Configuration</span>
            </div>
            {expanded === "trigger" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          {expanded === "trigger" && (
            <div className="p-4 bg-white border-t border-[#F0F0F0] space-y-4">
              {triggersLoading ? (
                <div className="text-center text-[10px] text-[#999] py-4">Loading triggers...</div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {triggerSchemas.map(t => (
                      <Button 
                        key={t.type}
                        type="button"
                        variant={triggerConfigs[t.type]?.enabled ? 'primary' : 'outline'} 
                        size="sm" 
                        className="capitalize"
                        onClick={() => handleTriggerToggle(t.type)}
                      >
                        {t.type}
                      </Button>
                    ))}
                  </div>

                  {triggerSchemas.map(t => triggerConfigs[t.type]?.enabled && (
                    <div key={t.type} className="p-4 bg-[#FAFAFA] border border-[#F0F0F0] rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2">
                      <div className="space-y-1">
                        <h4 className="text-[10px] font-bold text-[#111] uppercase tracking-widest">{t.schema.title || t.type}</h4>
                        {t.schema.description && <p className="text-[10px] text-[#999]">{t.schema.description}</p>}
                      </div>

                      {t.schema.isWebhook && (
                        <div className="p-3 bg-[#111] rounded-lg space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Target Endpoint</span>
                            <button 
                              onClick={() => {
                                const url = `http://localhost:4000/trigger/${name.toLowerCase().replace(/\s+/g, '-')}`;
                                navigator.clipboard.writeText(url);
                                alert("Copied to clipboard!");
                              }}
                              className="text-[9px] text-white hover:text-[#999] underline transition-colors"
                            >
                              Copy URL
                            </button>
                          </div>
                          <code className="block text-[10px] text-[#00FF00] font-mono break-all">
                            http://localhost:4000/trigger/{name.toLowerCase().replace(/\s+/g, '-') || "{agent-id}"}
                           </code>
                          <p className="text-[9px] text-white/40">
                             Send a POST request with any JSON payload. Use <code>{"{{payload}}"}</code> in templates.
                          </p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4">
                        {t.schema.fields?.map((field: any) => (
                          <div key={field.name} className={cn("space-y-1.5", field.type === 'textarea' && "col-span-2")}>
                            <div className="flex justify-between items-center">
                              <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider">
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                              </label>
                              {field.type === 'range' && (
                                <span className="text-[10px] font-mono text-[#111]">{triggerConfigs[t.type]?.values?.[field.name] || field.default || 0}</span>
                              )}
                            </div>

                            {field.type === 'select' ? (
                              <select 
                                className="w-full p-2.5 bg-white border border-[#E5E5E5] rounded-lg text-sm focus:outline-none"
                                value={triggerConfigs[t.type]?.values?.[field.name] || field.default || ""}
                                onChange={(e) => handleTriggerValueChange(t.type, field.name, e.target.value)}
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
                                value={triggerConfigs[t.type]?.values?.[field.name] || field.default || 0}
                                onChange={(e) => handleTriggerValueChange(t.type, field.name, parseFloat(e.target.value))}
                              />
                            ) : field.type === 'checkbox' ? (
                              <div className="flex items-center gap-2 pt-1">
                                <input 
                                  type="checkbox"
                                  className="w-4 h-4 rounded border-[#E5E5E5] text-[#111] focus:ring-[#111]"
                                  checked={triggerConfigs[t.type]?.values?.[field.name] ?? field.default ?? false}
                                  onChange={(e) => handleTriggerValueChange(t.type, field.name, e.target.checked)}
                                />
                                <span className="text-xs text-[#666]">{field.description}</span>
                              </div>
                            ) : field.type === 'textarea' ? (
                              <textarea 
                                className="w-full h-20 p-2.5 bg-white border border-[#E5E5E5] rounded-lg text-sm focus:outline-none resize-none"
                                placeholder={field.placeholder || field.description}
                                value={triggerConfigs[t.type]?.values?.[field.name] || ''}
                                onChange={(e) => handleTriggerValueChange(t.type, field.name, e.target.value)}
                              />
                            ) : field.type === 'upload' ? (
                              <div className="relative">
                                <input 
                                  type="file" 
                                  id={`file-${t.type}-${field.name}`}
                                  className="hidden" 
                                  onChange={(e) => handleTriggerValueChange(t.type, field.name, e.target.files?.[0] || null)}
                                />
                                <label 
                                  htmlFor={`file-${t.type}-${field.name}`}
                                  className="w-full flex items-center justify-center gap-2 p-2.5 bg-white border border-dashed border-[#DDD] rounded-lg text-xs text-[#666] hover:border-[#111] cursor-pointer transition-all"
                                >
                                  <ChevronDown className="h-3.5 w-3.5 rotate-180" />
                                  {triggerConfigs[t.type]?.values?.[field.name] ? triggerConfigs[t.type].values[field.name].name : "Upload File"}
                                </label>
                              </div>
                            ) : (
                              <input 
                                type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                                className="w-full p-2.5 bg-white border border-[#E5E5E5] rounded-lg text-sm focus:outline-none"
                                placeholder={field.placeholder || field.description}
                                value={triggerConfigs[t.type]?.values?.[field.name] || ''}
                                onChange={(e) => handleTriggerValueChange(t.type, field.name, field.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                              />
                            )}
                            {field.description && field.type !== 'checkbox' && (
                              <p className="text-[9px] text-[#999] italic">{field.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
