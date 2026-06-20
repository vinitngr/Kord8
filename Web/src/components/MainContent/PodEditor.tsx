import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
   Activity, Settings, Users, ArrowLeft, Zap, Clock, Terminal, Trash2, Plus, Info,
   Webhook, GitBranch, Share2, Shield, CheckCircle2
} from "lucide-react";
import { Button } from "../shared/Button";
import { Badge } from "../shared/Badge";
import { cn } from "../../lib/utils";
import { usePods, useAgents, usePodSessions, useTriggers } from "../../hooks/useStore";
import { RelationGraph } from "./RelationGraph";
import { PromptEditor } from "./PromptEditor";
import { TriggerModal } from "../Sidebar/TriggerModal";

interface PodEditorProps {
   onClose: () => void;
}

export function PodEditor({ onClose }: PodEditorProps) {
   const { id } = useParams<{ id: string }>();
   const { pods, updatePod, deletePod } = usePods();
   const { agents } = useAgents();
   const { sessions } = usePodSessions(id);
   const { triggerSchemas } = useTriggers();

   const [pod, setPod] = useState<any>(null);
   const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
   const [activeTab, setActiveTab] = useState<"overview" | "activity" | "settings">("overview");
   const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);

   useEffect(() => {
      if (id) {
         const found = pods.find(p => p.id === id);
         if (found) {
            setPod({ ...found });
            if (sessions.length > 0 && !selectedSessionId) {
               setSelectedSessionId(sessions[0].id);
            }
         }
      }
   }, [id, pods]);

   if (!pod) return null;

   const selectedSession = sessions.find(s => s.id === selectedSessionId) || null;
   const teamAgents = pod.agentIds.map((aid: string) => agents.find(a => a.id === aid)).filter(Boolean);

   const handleUpdate = (field: string, value: any) => {
      const updated = { ...pod, [field]: value };
      setPod(updated);
      updatePod(updated);
   };

   const triggerIcons: Record<string, any> = {
      cron: Clock, scheduled: Clock, webhook: Webhook, github: GitBranch,
   };

   const handleAddTrigger = (type: string, config: any) => {
      const newTrigger = { id: Math.random().toString(36).substr(2, 9), type, config };
      handleUpdate('triggers', [...(pod.triggers || []), newTrigger]);
   };

   const handleRemoveTrigger = (triggerId: string) => {
      handleUpdate('triggers', (pod.triggers || []).filter((t: any) => t.id !== triggerId));
   };

   const routingModes = [
      { id: 'swarm', label: 'Swarm', icon: Share2, desc: 'Decentralized — Agents collaborate freely. Max rounds prevent loops.' },
      { id: 'pipeline', label: 'Pipeline', icon: GitBranch, desc: 'Linear — Agents work in sequence. Output flows to next input.' },
      { id: 'coordinated', label: 'Coordinated', icon: Shield, desc: 'Centralized — System orchestrates tasks based on the goal.' },
   ];

   return (
      <div className="flex-1 flex flex-col h-full bg-[#09090B] text-[#FAFAFA] overflow-hidden">
         {/* Header */}
         <header className="h-14 px-6 flex items-center justify-between shrink-0 bg-[#09090B] border-b border-[#18181B] z-10">
            <div className="flex items-center gap-4">
               <button onClick={onClose} className="text-[#52525B] hover:text-white transition-colors h-9 w-9 flex justify-center items-center rounded-lg bg-[#000] border border-[#18181B]">
                  <ArrowLeft className="h-4 w-4" />
               </button>
               <div className="flex items-center gap-3">
                  <h2 className="text-[16px] font-semibold text-[#FAFAFA]">{pod.name}</h2>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                  <span className="text-[12px] text-[#52525B]">{pod.agentIds.length} agents</span>
               </div>
            </div>
            <Button className="h-9 bg-[#FF4A00] hover:bg-[#E64300] text-white font-semibold rounded-lg px-5 flex items-center gap-2 shadow-lg shadow-[#FF4A00]/20 text-[13px]">
               <Zap className="h-3.5 w-3.5" /> Run Mission
            </Button>
         </header>

         {/* Tabs */}
         <div className="flex items-center gap-6 px-8 bg-[#09090B] border-b border-[#18181B] shrink-0">
            {([
               { key: "overview" as const, label: "Overview", icon: Settings },
               { key: "activity" as const, label: "Activity", icon: Activity },
               { key: "settings" as const, label: "Settings", icon: Settings },
            ]).map(tab => (
               <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={cn("py-3.5 text-[13px] font-semibold border-b-2 transition-all flex items-center gap-2",
                     activeTab === tab.key ? "border-[#FF4A00] text-[#FAFAFA]" : "border-transparent text-[#52525B] hover:text-[#A1A1AA]"
                  )}>
                  <tab.icon className="h-3.5 w-3.5" /> {tab.label}
               </button>
            ))}
         </div>

         {/* Content */}
         <div className="flex-1 overflow-y-auto custom-scrollbar">

            {/* ═══ OVERVIEW TAB ═══ */}
            {activeTab === "overview" && (
               <div className="max-w-3xl mx-auto p-8 space-y-8">

                  {/* Goal */}
                  <section className="space-y-3">
                     <label className="text-[11px] font-bold text-[#52525B] uppercase tracking-wider">Mission Goal</label>
                     <div className="border border-[#18181B] rounded-2xl overflow-hidden bg-[#000]">
                        <PromptEditor
                           value={pod.goal}
                           onChange={(val) => handleUpdate('goal', val)}
                           placeholder="Describe what this team should accomplish..."
                           availableTools={teamAgents.flatMap((a: any) => a?.tools || [])}
                           availableKbs={teamAgents.flatMap((a: any) => a?.knowledgeBases || [])}
                        />
                     </div>
                     <div className="flex items-start gap-3 p-3 bg-[#09090B] border border-[#18181B] rounded-xl">
                        <Info className="h-4 w-4 text-[#3F3F46] mt-0.5 shrink-0" />
                        <p className="text-[11px] text-[#52525B] leading-relaxed">
                           This goal is the primary objective for the whole mission. All agents receive this prompt when they are summoned.
                        </p>
                     </div>
                  </section>

                  {/* Coordination Strategy — specific for Coordinated Mode */}
                  {(pod.routingMode || 'swarm') === 'coordinated' && (
                     <section className="p-6 bg-gradient-to-br from-[#09090B] to-[#000] border border-[#FF4A00]/20 rounded-2xl space-y-4 shadow-[0_4px_20px_rgba(255,74,0,0.05)]">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-[#FF4A00]" />
                              <label className="text-[11px] font-bold text-[#FAFAFA] uppercase tracking-wider">Coordination Strategy (SOP)</label>
                           </div>
                           <span className="text-[9px] font-mono text-[#FF4A00] bg-[#FF4A00]/10 px-2 py-0.5 rounded border border-[#FF4A00]/20 uppercase font-bold tracking-widest shadow-[0_0_10px_rgba(255,74,0,0.1)]">System_Logic</span>
                        </div>
                        <div className="border border-[#18181B] rounded-xl overflow-hidden bg-[#000]">
                           <PromptEditor
                              value={pod.strategy || ''}
                              onChange={(val) => handleUpdate('strategy', val)}
                              placeholder="Define how the platform should manage its agents (e.g., 'Prioritize speed over accuracy' or 'Verify each step with Auditor')..."
                              availableTools={teamAgents.flatMap((a: any) => a?.tools || [])}
                              availableKbs={teamAgents.flatMap((a: any) => a?.knowledgeBases || [])}
                           />
                        </div>
                        <div className="flex items-start gap-2 text-[#3F3F46]">
                           <Info className="h-3 w-3 mt-0.5" />
                           <p className="text-[10px] leading-relaxed italic">
                              This strategy guides the platform's decision-making. It tells the coordinator *how* to manage the team to reach the Goal.
                           </p>
                        </div>
                     </section>
                  )}

                  {/* Routing Mode */}
                  <section className="space-y-3">
                     <label className="text-[11px] font-bold text-[#52525B] uppercase tracking-wider">Routing Mode</label>
                     <div className="grid grid-cols-3 gap-3">
                        {routingModes.map(mode => (
                           <button
                              key={mode.id}
                              onClick={() => handleUpdate('routingMode', mode.id)}
                              className={cn(
                                 "p-4 rounded-xl border transition-all text-left flex flex-col gap-3",
                                 (pod.routingMode || 'swarm') === mode.id
                                    ? "bg-[#FF4A00]/5 border-[#FF4A00]/40"
                                    : "bg-[#000] border-[#18181B] hover:border-[#27272A]"
                              )}
                           >
                              <div className={cn(
                                 "h-9 w-9 rounded-lg flex items-center justify-center",
                                 (pod.routingMode || 'swarm') === mode.id ? "bg-[#FF4A00] text-white" : "bg-[#09090B] border border-[#18181B] text-[#52525B]"
                              )}>
                                 <mode.icon className="h-4 w-4" />
                              </div>
                              <div>
                                 <p className={cn("text-[13px] font-semibold", (pod.routingMode || 'swarm') === mode.id ? "text-[#FAFAFA]" : "text-[#52525B]")}>{mode.label}</p>
                                 <p className="text-[10px] text-[#3F3F46] mt-0.5 leading-relaxed">{mode.desc}</p>
                              </div>
                           </button>
                        ))}
                     </div>

                     {/* Coordinated info — shows when coordinated mode selected */}
                     {(pod.routingMode || 'swarm') === 'coordinated' && (
                        <div className="p-4 bg-[#09090B] border border-[#18181B] rounded-xl space-y-2">
                           <div className="flex items-center gap-2">
                              <Shield className="h-3.5 w-3.5 text-[#FF4A00]" />
                              <label className="text-[11px] font-semibold text-[#FAFAFA]">Centralized Coordination</label>
                           </div>
                           <p className="text-[10px] text-[#52525B] leading-relaxed">
                              In this mode, the platform acts as the coordinator. It breaks down the mission goal into tasks and selects the best agent for each step based on your defined Strategy.
                           </p>
                        </div>
                     )}

                     {/* Pipeline order — shows when pipeline mode selected */}
                     {(pod.routingMode || 'swarm') === 'pipeline' && teamAgents.length > 0 && (
                        <div className="p-4 bg-[#09090B] border border-[#18181B] rounded-xl space-y-3">
                           <div className="flex items-center gap-2">
                              <GitBranch className="h-3.5 w-3.5 text-[#FF4A00]" />
                              <label className="text-[11px] font-semibold text-[#FAFAFA]">Execution Order</label>
                           </div>
                           <p className="text-[10px] text-[#52525B]">Agents run in this order. Each agent's output becomes the next agent's input.</p>
                           <div className="space-y-1.5">
                              {pod.agentIds.map((aid: string, idx: number) => {
                                 const agent = agents.find(a => a.id === aid);
                                 if (!agent) return null;
                                 const isFirst = idx === 0;
                                 const isLast = idx === pod.agentIds.length - 1;
                                 return (
                                    <div key={aid} className="flex items-center gap-3">
                                       <span className="text-[11px] font-bold text-[#FF4A00] w-5 text-center">{idx + 1}</span>
                                       <div className="flex-1 flex items-center gap-3 p-2.5 bg-[#000] border border-[#18181B] rounded-lg">
                                          <Users className="h-3.5 w-3.5 text-[#52525B] shrink-0" />
                                          <span className="text-[12px] font-semibold text-[#FAFAFA] flex-1 truncate">{agent.name}</span>
                                          <span className="text-[9px] font-semibold text-[#3F3F46] uppercase">{isFirst ? 'Start' : isLast ? 'End' : ''}</span>
                                       </div>
                                    </div>
                                 );
                              })}
                           </div>
                        </div>
                     )}
                  </section>

                  {/* Team */}
                  <section className="space-y-3">
                     <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-[#52525B] uppercase tracking-wider">Team ({teamAgents.length})</label>
                        <button className="text-[11px] font-semibold text-[#FF4A00] hover:text-white transition-colors flex items-center gap-1">
                           <Plus className="h-3 w-3" /> Add Agent
                        </button>
                     </div>
                     <div className="space-y-2">
                        {teamAgents.map((agent: any, idx: number) => {
                           return (
                              <div key={agent.id} className="flex items-center gap-3 p-3.5 bg-[#000] border border-[#18181B] rounded-xl group hover:border-[#27272A] transition-colors relative">
                                 <div className="h-8 w-8 rounded-lg border flex items-center justify-center shrink-0 bg-[#FF4A00]/10 border-[#FF4A00]/20 text-[#FF4A00]">
                                    <Users className="h-3.5 w-3.5" />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-semibold text-[#FAFAFA] truncate flex items-center gap-2">
                                       {agent.name}
                                       {idx === 0 && (pod.routingMode || "swarm") !== "coordinated" && <span className="text-[9px] font-bold text-[#FF4A00]/70 bg-[#FF4A00]/5 px-1.5 py-0.5 rounded border border-[#FF4A00]/10 uppercase">Mission Lead</span>}
                                    </p>
                                    <p className="text-[11px] text-[#52525B] truncate">{agent.description}</p>
                                 </div>
                                 <div className="flex items-center gap-2">
                                    {/* Set as Lead Action */}
                                    {idx !== 0 && (
                                       <button
                                          onClick={(e) => {
                                             e.stopPropagation();
                                             const ids = [...pod.agentIds];
                                             const [target] = ids.splice(idx, 1);
                                             ids.unshift(target);
                                             handleUpdate('agentIds', ids);
                                          }}
                                          className="text-[10px] font-bold text-[#FF4A00] hover:text-white bg-[#FF4A00]/5 hover:bg-[#FF4A00] px-2.5 py-1 rounded border border-[#FF4A00]/20 transition-all uppercase opacity-0 group-hover:opacity-100"
                                       >
                                          Set as Lead
                                       </button>
                                    )}
                                    <span className="px-2 py-0.5 rounded border border-[#18181B] text-[9px] font-medium text-[#52525B] bg-[#09090B] ml-2">{agent.tools?.length || 0} tools</span>
                                    <button
                                       onClick={(e) => { e.stopPropagation(); handleUpdate('agentIds', pod.agentIds.filter((aid: string) => aid !== agent.id)); }}
                                       className="h-7 w-7 rounded-md flex items-center justify-center text-[#27272A] hover:text-[#EF4444] hover:bg-[#EF4444]/5 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                       <Trash2 className="h-3 w-3" />
                                    </button>
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  </section>

                  {/* Safety */}
                  <section className="space-y-3">
                     <label className="text-[11px] font-bold text-[#52525B] uppercase tracking-wider">Safety Limits</label>
                     <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-[#000] border border-[#18181B] rounded-xl space-y-2">
                           <p className="text-[11px] font-semibold text-[#A1A1AA]">Max Rounds</p>
                           <p className="text-[10px] text-[#3F3F46]">Total agent-to-agent exchanges</p>
                           <input
                              type="number" min={1} max={50} value={pod.maxRounds}
                              onChange={e => handleUpdate('maxRounds', parseInt(e.target.value) || 10)}
                              className="w-full bg-[#09090B] border border-[#18181B] rounded-lg py-2 px-3 text-[13px] font-semibold text-[#FF4A00] focus:outline-none focus:border-[#FF4A00]/40"
                           />
                        </div>
                        <div className="p-4 bg-[#000] border border-[#18181B] rounded-xl space-y-2">
                           <p className="text-[11px] font-semibold text-[#A1A1AA]">Timeout</p>
                           <p className="text-[10px] text-[#3F3F46]">Hard time limit (seconds)</p>
                           <input
                              type="number" min={30} max={3600} step={30} value={pod.timeoutSeconds}
                              onChange={e => handleUpdate('timeoutSeconds', parseInt(e.target.value) || 300)}
                              className="w-full bg-[#09090B] border border-[#18181B] rounded-lg py-2 px-3 text-[13px] font-semibold text-[#FF4A00] focus:outline-none focus:border-[#FF4A00]/40"
                           />
                        </div>
                     </div>
                     <div className="flex items-start gap-3 p-3 bg-[#09090B] border border-[#FF4A00]/10 rounded-xl">
                        <Shield className="h-4 w-4 text-[#FF4A00]/40 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-[#52525B] leading-relaxed">
                           <span className="text-[#FAFAFA] font-bold mr-1">Safety Pulse:</span>
                           Mission terminates automatically if <span className="text-[#A1A1AA]">any agent signals goal completion</span>,
                           reaches <span className="text-[#A1A1AA]">Max Rounds</span>, or hits the <span className="text-[#A1A1AA]">Hard Timeout</span>.
                        </p>
                     </div>
                  </section>
               </div>
            )}

            {/* ═══ ACTIVITY TAB ═══ */}
            {activeTab === "activity" && (
               <div className="flex h-full min-h-0 bg-[#000]">
                  <div className="w-[300px] shrink-0 border-r border-[#18181B] overflow-y-auto custom-scrollbar bg-[#09090B]/50">
                     {sessions.length === 0 ? (
                        <div className="p-12 text-center opacity-20">
                           <Activity className="h-10 w-10 mx-auto mb-4" />
                           <p className="text-[12px] font-bold uppercase tracking-widest">No history recorded</p>
                        </div>
                     ) : (
                        <div className="py-2">
                           {sessions.map((s, index) => (
                              <button key={s.id} onClick={() => setSelectedSessionId(s.id)}
                                 className={cn(
                                    "w-full px-6 py-4 text-left border-b border-[#18181B]/50 transition-all group",
                                    selectedSessionId === s.id ? "bg-[#18181B] shadow-xl" : "hover:bg-[#18181B]/30"
                                 )}>
                                 <div className="flex justify-between items-center mb-1.5">
                                    <p className={cn("text-[11px] font-bold uppercase tracking-wider", selectedSessionId === s.id ? "text-[#FF4A00]" : "text-[#FAFAFA]")}>Mission #{sessions.length - index}</p>
                                    <span className="text-[9px] font-mono text-[#3F3F46]">{new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                 </div>
                                 <p className="text-[12px] text-[#A1A1AA] line-clamp-1 mb-2 font-medium">{s.result?.summary || "Mission in progress..."}</p>
                                 <div className="flex items-center gap-2">
                                    <div className="h-1 flex-1 bg-[#18181B] rounded-full overflow-hidden">
                                       <div className="h-full bg-[#10B981] w-full shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                                    </div>
                                    <span className="text-[9px] font-bold text-[#10B981] uppercase">Success</span>
                                 </div>
                              </button>
                           ))}
                        </div>
                     )}
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#000]">
                     {selectedSession ? (
                        <div className="p-10 space-y-10 max-w-4xl mx-auto">
                           <div className="flex items-center justify-between border-b border-[#18181B] pb-6">
                              <div>
                                 <h2 className="text-[18px] font-bold text-[#FAFAFA] tracking-tight">Audit Stream</h2>
                                 <p className="text-[11px] font-mono text-[#52525B] mt-1 uppercase tracking-widest">{selectedSession.id}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                 <Badge variant="outline" className="border-[#18181B] text-[#52525B] font-mono py-1 px-2.5">MISSION_LOG</Badge>
                                 <Badge variant="success" className="bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20 py-1 px-2.5 uppercase font-bold text-[10px]">Completed</Badge>
                              </div>
                           </div>

                           {selectedSession.events && selectedSession.events.length > 0 && (
                              <section className="space-y-4">
                                 <label className="text-[11px] font-bold text-[#52525B] uppercase tracking-wider flex items-center gap-2">
                                    <Activity className="h-3.5 w-3.5 text-[#FF4A00]" /> High-Level Execution Graph
                                 </label>
                                 <div className="p-6 bg-[#09090B] border border-[#18181B] rounded-2xl shadow-inner shadow-black/50 overflow-hidden">
                                    <RelationGraph agents={pod.agentIds} events={selectedSession.events} className="w-full h-[320px]" />
                                 </div>
                              </section>
                           )}

                           <section className="space-y-4">
                              <label className="text-[11px] font-bold text-[#52525B] uppercase tracking-wider flex items-center gap-2">
                                 <Terminal className="h-3.5 w-3.5 text-[#FF4A00]" /> Mission Event Log
                              </label>
                              <div className="bg-[#09090B] border border-[#18181B] rounded-2xl overflow-hidden divide-y divide-[#18181B]/50 font-mono">
                                 {selectedSession.logs.map((log, i) => {
                                    const isSystem = log.startsWith('[System]');
                                    return (
                                       <div key={i} className={cn(
                                          "px-6 py-4 flex gap-6 hover:bg-[#18181B]/20 transition-colors",
                                          isSystem && "bg-[#FF4A00]/5"
                                       )}>
                                          <span className="w-16 shrink-0 text-[10px] text-[#3F3F46] tabular-nums pt-1">
                                             {i % 2 === 0 ? '14:22:04' : '14:22:09'}
                                          </span>
                                          <p className={cn(
                                             "text-[13px] leading-relaxed flex-1",
                                             isSystem ? "text-[#FF4A00] font-bold" :
                                                log.includes('→') ? "text-[#8B5CF6]" : "text-[#A1A1AA]"
                                          )}>{log}</p>
                                       </div>
                                    );
                                 })}
                              </div>
                           </section>

                           {selectedSession.result && (
                              <section className="p-6 bg-gradient-to-br from-[#09090B] to-[#000] border border-[#18181B] rounded-2xl relative overflow-hidden group">
                                 <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <CheckCircle2 className="h-32 w-32 text-[#FF4A00]" />
                                 </div>
                                 <p className="text-[10px] font-bold text-[#FF4A00] uppercase tracking-widest mb-4">Mission Debrief</p>
                                 <div className="text-[14px] font-bold text-[#FAFAFA] leading-relaxed whitespace-pre-wrap relative z-10">
                                    {typeof selectedSession.result === 'object' ? JSON.stringify(selectedSession.result, null, 2) : selectedSession.result}
                                 </div>
                              </section>
                           )}
                        </div>
                     ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20">
                           <div className="h-24 w-24 bg-[#18181B] rounded-full flex items-center justify-center mb-6">
                              <Activity className="h-10 w-10 text-[#52525B]" />
                           </div>
                           <p className="text-[14px] font-bold uppercase tracking-widest text-[#FAFAFA]">Awaiting Selection</p>
                           <p className="text-[12px] text-[#52525B] mt-2">Select a mission session to decode the audit stream</p>
                        </div>
                     )}
                  </div>
               </div>
            )}

            {/* ═══ SETTINGS TAB ═══ */}
            {activeTab === "settings" && (
               <div className="max-w-xl mx-auto p-8 space-y-8">
                  <section className="space-y-3">
                     <label className="text-[11px] font-bold text-[#52525B] uppercase tracking-wider">Pod Name</label>
                     <input
                        value={pod.name}
                        onChange={e => handleUpdate('name', e.target.value)}
                        className="w-full bg-[#000] border border-[#18181B] rounded-xl py-3 px-4 text-[14px] text-[#FAFAFA] font-semibold focus:outline-none focus:border-[#FF4A00]/40"
                     />
                  </section>

                  {/* Triggers */}
                  <section className="space-y-3">
                     <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-[#52525B] uppercase tracking-wider">Triggers</label>
                        <button onClick={() => setIsTriggerModalOpen(true)}
                           className="text-[11px] font-semibold text-[#FF4A00] hover:text-white transition-colors flex items-center gap-1 bg-[#FF4A00]/5 px-2.5 py-1 rounded-lg border border-[#FF4A00]/10">
                           <Plus className="h-3 w-3" /> Add Trigger
                        </button>
                     </div>
                     {(pod.triggers || []).length === 0 ? (
                        <div className="p-6 bg-[#000] border border-[#18181B] rounded-xl text-center">
                           <p className="text-[12px] text-[#3F3F46]">No triggers configured.</p>
                           <p className="text-[11px] text-[#27272A] mt-1">This pod can only be run manually. Add a trigger to automate it.</p>
                        </div>
                     ) : (
                        <div className="border border-[#18181B] rounded-xl overflow-hidden divide-y divide-[#18181B]">
                           {(pod.triggers || []).map((trigger: any) => {
                              const TIcon = triggerIcons[trigger.type] || Zap;
                              return (
                                 <div key={trigger.id} className="flex items-center justify-between px-4 py-3.5 bg-[#000] hover:bg-[#09090B] transition-colors group">
                                    <div className="flex items-center gap-3">
                                       <div className="h-8 w-8 rounded-lg bg-[#09090B] border border-[#18181B] flex items-center justify-center text-[#52525B]">
                                          <TIcon className="h-3.5 w-3.5" />
                                       </div>
                                       <div>
                                          <p className="text-[12px] font-semibold text-[#FAFAFA] capitalize">{trigger.type}</p>
                                          <p className="text-[10px] text-[#3F3F46] font-mono">
                                             {trigger.type === 'webhook' && trigger.config?.path}
                                             {trigger.type === 'cron' && trigger.config?.schedule}
                                             {!trigger.config?.path && !trigger.config?.schedule && 'Configured'}
                                          </p>
                                       </div>
                                    </div>
                                    <button onClick={() => handleRemoveTrigger(trigger.id)}
                                       className="h-7 w-7 rounded-md flex items-center justify-center text-[#27272A] hover:text-[#EF4444] hover:bg-[#EF4444]/5 transition-all opacity-0 group-hover:opacity-100">
                                       <Trash2 className="h-3 w-3" />
                                    </button>
                                 </div>
                              );
                           })}
                        </div>
                     )}
                     <div className="flex items-start gap-3 p-3 bg-[#09090B] border border-[#18181B] rounded-xl">
                        <Info className="h-4 w-4 text-[#3F3F46] mt-0.5 shrink-0" />
                        <p className="text-[11px] text-[#52525B] leading-relaxed">
                           Pod triggers start the whole team. Individual agent triggers (set in each agent's editor) still fire independently for solo work.
                        </p>
                     </div>
                  </section>

                  {/* Danger Zone */}
                  <section className="pt-8 border-t border-[#18181B] space-y-3">
                     <label className="text-[11px] font-bold text-[#EF4444] uppercase tracking-wider">Danger Zone</label>
                     <div className="p-4 border border-[#EF4444]/20 rounded-xl bg-[#EF4444]/5 flex items-center justify-between">
                        <div>
                           <p className="text-[13px] font-semibold text-[#FAFAFA]">Delete this pod</p>
                           <p className="text-[11px] text-[#71717A] mt-0.5">This action cannot be undone.</p>
                        </div>
                        <Button onClick={() => { deletePod(pod.id); onClose(); }}
                           className="h-9 bg-[#EF4444] hover:bg-[#DC2626] text-white font-semibold rounded-lg px-4 text-[12px] shrink-0">
                           <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
                        </Button>
                     </div>
                  </section>
               </div>
            )}
         </div>

         <TriggerModal
            isOpen={isTriggerModalOpen}
            onClose={() => setIsTriggerModalOpen(false)}
            triggerSchemas={triggerSchemas}
            onSave={handleAddTrigger}
         />
      </div>
   );
}
