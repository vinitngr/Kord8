import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Activity, Settings, Database, Zap, Clock, Webhook, GitBranch, ArrowLeft, Target, Sliders } from "lucide-react";
import { Button } from "../shared/Button";
import { cn } from "../../lib/utils";
import { useAgents, useKnowledgeBase, useConnections, useTriggers, useModels } from "../../hooks/useStore";
import { Logo } from "../shared/Logo";

import { AddToolToAgentModal } from "./AddToolToAgentModal";
import { AddToolModal } from "./AddToolModal";
import { AddKBToAgentModal } from "./AddKBToAgentModal";
import { AddSourceModal } from "./AddSourceModal";

import { InspectView } from "./InspectView";
import { PromptEditor } from "./PromptEditor";
import { TriggerModal } from "../Sidebar/TriggerModal";

type EditorTab = "logic" | "activity";

interface AgentEditorProps {
  onClose: () => void;
}

export function AgentEditor({ onClose }: AgentEditorProps) {
  const { id } = useParams<{ id: string }>();
  const { agents } = useAgents();
  const { knowledgeBases } = useKnowledgeBase();
  const { connections } = useConnections();
  const { triggerSchemas: coreTriggerSchemas } = useTriggers();
  const { models } = useModels();

  const [activeTab, setActiveTab] = useState<EditorTab>("logic");
  
  const [isToolModalOpen, setIsToolModalOpen] = useState(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isCreateSourceModalOpen, setIsCreateSourceModalOpen] = useState(false);
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState("Untitled Agent");
  const [description, setDescription] = useState("");
  const [instruction, setInstruction] = useState("");
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const [activeKbs, setActiveKbs] = useState<string[]>([]);
  const [triggers, setTriggers] = useState<any[]>([]);
  
  const [model, setModel] = useState("openai:gpt-4o");
  const [temperature, setTemperature] = useState(0.7);
  const [maxIterations, setMaxIterations] = useState(10);

  useEffect(() => {
    if (id) {
      const existing = agents.find(a => a.id === id);
      if (existing) {
        setName(existing.name);
        setDescription(existing.description || "");
        setInstruction(existing.instruction || "");
        setActiveTools(existing.tools || []);
        setActiveKbs(existing.knowledgeBases || []);
        setTriggers(existing.triggers || []);
        if (existing.model) setModel(existing.model);
        if (existing.temperature !== undefined) setTemperature(existing.temperature);
        if (existing.maxIterations !== undefined) setMaxIterations(existing.maxIterations);
      }
    }
  }, [id, agents]);

  const handleSave = async () => { onClose(); };

  const toggleTool = (toolName: string) => {
    setActiveTools(prev => prev.includes(toolName) ? prev.filter(t => t !== toolName) : [...prev, toolName]);
  };

  const getToolService = (toolName: string) => {
    for (const conn of connections) {
      if (conn.tools.some(t => t.name === toolName)) return conn.service;
    }
    return "core";
  };

  const getKbService = (kbId: string) => {
    const kb = knowledgeBases.find(k => k.id === kbId);
    return kb?.service || "core";
  };

  const connectedServices = connections.filter(c => c.isConnected && c.tools.length > 0);

  const triggerIcons: Record<string, any> = {
    cron: Clock,
    scheduled: Clock,
    webhook: Webhook,
    github: GitBranch,
  };

  const filteredTools = connectedServices.flatMap(c => 
     c.tools
      .filter(t => activeTools.includes(t.name))
      .map(t => ({ ...t, serviceName: c.label }))
  );
  
  const filteredKbs = knowledgeBases.filter(kb => activeKbs.includes(kb.id));

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090B] rounded-xl border border-[#18181B] text-[#FAFAFA] font-sans shadow-lg overflow-hidden relative">
      <header className="h-16 px-6 flex items-center justify-between shrink-0 bg-[#09090B] border-b border-[#18181B] z-10 sticky top-0 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="text-[#A1A1AA] hover:text-white transition-colors h-9 w-9 flex justify-center items-center rounded-lg bg-[#000] border border-[#18181B] shadow-sm hover:bg-[#121214]">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
             <input className="text-[16px] font-bold bg-transparent border-none focus:outline-none placeholder:text-[#3F3F46] w-64 text-[#FAFAFA]"
               value={name} onChange={e => setName(e.target.value)} placeholder="Agent Name" />
             <span className="px-2.5 py-[3px] rounded border border-[#18181B] text-[9px] uppercase font-bold text-[#3F3F46] bg-[#000] ml-2 hidden sm:inline-block shadow-sm">Draft</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleSave} className="gap-2 bg-[#000] border-[#18181B] text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#121214] h-9 shadow-sm rounded-lg px-4">Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSave} className="gap-2 bg-[#FF4A00] hover:bg-[#E64300] border-[#FF4A00] text-white font-bold h-9 shadow-md shadow-[#FF4A00]/20 rounded-lg px-6">Publish</Button>
        </div>
      </header>

      <div className="flex items-center gap-8 px-10 bg-[#09090B] border-b border-[#18181B] overflow-x-auto shrink-0 z-10 no-scrollbar">
        {([
          { key: "logic", label: "Logic", icon: Settings },
          { key: "activity", label: "Activity", icon: Activity },
        ] as const).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={cn("py-4 text-[13px] font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap",
              activeTab === tab.key ? "border-[#FF4A00] text-[#FF4A00]" : "border-transparent text-[#3F3F46] hover:text-[#A1A1AA]"
            )}>
            <tab.icon className="h-3.5 w-3.5" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden relative bg-[#09090B] flex flex-col">
        {activeTab === "logic" && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            <div className="w-full md:w-[360px] bg-[#000] border-r border-[#18181B] overflow-y-auto shrink-0 flex flex-col custom-scrollbar divide-y divide-[#18181B]">
                
                {/* Identity Box */}
                <div className="p-5 flex flex-col gap-2.5">
                   <label className="text-[10px] font-bold text-[#3F3F46] uppercase tracking-[0.2em] opacity-60">Identity</label>
                   <textarea
                     className="w-full h-14 p-2 bg-[#09090B] border border-[#18181B] rounded-lg text-[12px] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:outline-none focus:border-[#FF4A00]/40 resize-none transition-all leading-relaxed"
                     placeholder="Describe mission..." value={description} onChange={e => setDescription(e.target.value)} />
                </div>

                {/* Triggers Section */}
                <div className="divide-y divide-[#18181B]">
                   <div className="bg-[#09090B]/40 px-5 py-3 flex items-center justify-between">
                      <label className="text-[10px] font-bold text-[#3F3F46] uppercase tracking-[0.2em]">Triggers</label>
                      <button onClick={() => setIsTriggerModalOpen(true)} className="text-[10px] font-bold text-[#FF4A00] hover:text-[#FAFAFA] transition-colors bg-[#FF4A00]/5 px-2 py-0.5 rounded border border-[#FF4A00]/10 tracking-widest">+ Connect</button>
                   </div>
                   {triggers.length === 0 ? <div className="px-5 py-6 text-center text-[11px] text-[#3F3F46]">No active triggers.</div> : triggers.map((tc, index) => {
                        const TIcon = triggerIcons[tc.type] || Zap;
                        return (
                         <div key={tc.id || index} className="px-5 py-3.5 flex items-center justify-between bg-[#000] hover:bg-[#09090B] transition-colors">
                             <div className="flex items-center gap-3">
                                <TIcon className="h-4 w-4 text-[#3F3F46]" />
                                <span className="text-[11px] font-bold text-[#FAFAFA] capitalize tracking-tight">{tc.type}</span>
                             </div>
                         </div>
                        );
                   })}
                </div>

                {/* Tools Section */}
                <div className="divide-y divide-[#18181B]">
                   <div className="bg-[#09090B]/40 px-5 py-3 flex items-center justify-between">
                      <label className="text-[10px] font-bold text-[#3F3F46] uppercase tracking-[0.2em]">Tools</label>
                      <button onClick={() => setIsToolModalOpen(true)} className="text-[10px] font-bold text-[#FF4A00] hover:text-[#FAFAFA] transition-colors bg-[#FF4A00]/5 px-2 py-0.5 rounded border border-[#FF4A00]/10 tracking-widest">+ Add</button>
                   </div>
                   {activeTools.length === 0 ? <div className="px-5 py-6 text-center text-[11px] text-[#3F3F46]">No tools added.</div> : activeTools.map((tName) => (
                        <div key={tName} className="px-5 py-3.5 flex items-center justify-between bg-[#000] hover:bg-[#09090B] transition-colors">
                           <div className="flex items-center gap-3 min-w-0">
                              <Logo service={getToolService(tName)} size="xs" className="opacity-80" />
                              <span className="text-[11px] font-bold text-[#FAFAFA] truncate">{tName}</span>
                           </div>
                           <button onClick={() => toggleTool(tName)} className="text-[#3F3F46] hover:text-[#EF4444] transition-all"><Zap className="h-3 w-3" /></button>
                        </div>
                   ))}
                </div>

                {/* Knowledge Section */}
                <div className="divide-y divide-[#18181B]">
                   <div className="bg-[#09090B]/40 px-5 py-3 flex items-center justify-between">
                      <label className="text-[10px] font-bold text-[#3F3F46] uppercase tracking-[0.2em]">Knowledge</label>
                      <button onClick={() => setIsSourceModalOpen(true)} className="text-[10px] font-bold text-[#FF4A00] hover:text-[#FAFAFA] transition-colors bg-[#FF4A00]/5 px-2 py-0.5 rounded border border-[#FF4A00]/10 tracking-widest">+ Link</button>
                   </div>
                   {activeKbs.length === 0 ? <div className="px-5 py-6 text-center text-[11px] text-[#3F3F46]">No sources linked.</div> : activeKbs.map((kbId) => {
                        const kb = knowledgeBases.find(k => k.id === kbId);
                        return (
                         <div key={kbId} className="px-5 py-3.5 flex items-center justify-between bg-[#000] hover:bg-[#09090B] transition-colors">
                           <div className="flex items-center gap-3 min-w-0">
                              <Logo service={getKbService(kbId)} size="xs" className="opacity-80" />
                              <span className="text-[11px] font-bold text-[#FAFAFA] truncate">{kb?.name || kbId}</span>
                           </div>
                           <button onClick={() => setActiveKbs(prev => prev.filter(k => k !== kbId))} className="text-[#3F3F46] hover:text-[#EF4444] transition-all"><Database className="h-3 w-3" /></button>
                         </div>
                        );
                   })}
                </div>

                {/* Configuration Section (mt-auto pushing to bottom) */}
                <div className="mt-auto divide-y divide-[#18181B]">
                   <div className="bg-[#09090B]/40 px-5 py-3 flex items-center gap-2">
                      <Sliders className="h-3.5 w-3.5 text-[#3F3F46]" />
                      <label className="text-[10px] font-bold text-[#3F3F46] uppercase tracking-[0.2em]">Configuration</label>
                   </div>
                   <div className="px-5 py-4 bg-[#000] flex flex-col gap-2">
                      <span className="text-[9px] font-bold text-[#3F3F46] uppercase tracking-wider">Computation Model</span>
                      <select value={model} onChange={e => setModel(e.target.value)}
                        className="w-full bg-[#09090B] border border-[#18181B] rounded-lg py-2 px-3 text-[12px] font-bold text-[#FAFAFA] focus:outline-none focus:border-[#FF4A00]/40">
                         {models.map(m => <option key={m} value={m}>{m.split(':')[1] || m}</option>)}
                      </select>
                   </div>
                   <div className="grid grid-cols-2 divide-x divide-[#18181B]">
                      <div className="px-5 py-4 bg-[#000] flex flex-col gap-2">
                         <span className="text-[9px] font-bold text-[#3F3F46] uppercase tracking-wider">Creativity</span>
                         <input type="number" step="0.1" min="0" max="2" value={temperature} onChange={e => setTemperature(parseFloat(e.target.value))}
                           className="w-full bg-[#09090B] border border-[#18181B] rounded-lg py-2 px-3 text-[12px] font-bold text-[#FAFAFA] focus:outline-none focus:border-[#FF4A00]/40" />
                      </div>
                      <div className="px-5 py-4 bg-[#000] flex flex-col gap-2">
                         <span className="text-[9px] font-bold text-[#3F3F46] uppercase tracking-wider">Max Iterations</span>
                         <input type="number" min="1" max="50" value={maxIterations} onChange={e => setMaxIterations(parseInt(e.target.value))}
                           className="w-full bg-[#09090B] border border-[#18181B] rounded-lg py-2 px-3 text-[12px] font-bold text-[#FAFAFA] focus:outline-none focus:border-[#FF4A00]/40" />
                      </div>
                   </div>
                </div>
            </div>
            
            <div className="flex-1 bg-[#09090B] flex flex-col p-8">
               <PromptEditor value={instruction} onChange={setInstruction}
                 placeholder="Define agent persona and mission... type / to mention resources."
                 availableTools={filteredTools} availableKbs={filteredKbs} />
            </div>
          </div>
        )}

        {activeTab === "activity" && <div className="p-10 hide-scrollbar overflow-y-auto"><div className="max-w-4xl mx-auto"><InspectView /></div></div>}
      </div>

      <AddToolToAgentModal isOpen={isToolModalOpen} onClose={() => setIsToolModalOpen(false)} activeTools={activeTools} onToggleTool={toggleTool} />
      <AddToolModal isOpen={isAddServiceModalOpen} onClose={() => setIsAddServiceModalOpen(false)} />
      <AddKBToAgentModal isOpen={isSourceModalOpen} onClose={() => setIsSourceModalOpen(false)} activeKbs={activeKbs} onToggleKb={(kbId) => setActiveKbs(prev => prev.includes(kbId) ? prev.filter(id => id !== kbId) : [...prev, kbId])} onAddNewSource={() => setIsCreateSourceModalOpen(true)} />
      <AddSourceModal isOpen={isCreateSourceModalOpen} onClose={() => setIsCreateSourceModalOpen(false)} />
      <TriggerModal isOpen={isTriggerModalOpen} onClose={() => setIsTriggerModalOpen(false)} triggerSchemas={[]} onSave={(trigger_type, config) => setTriggers(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), type: trigger_type, config }])} />
    </div>
  );  
}
