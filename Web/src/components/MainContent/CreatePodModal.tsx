import { useState } from "react";
import { Modal } from "../shared/Modal";
import { Button } from "../shared/Button";
import { useAgents, usePods } from "../../hooks/useStore";
import { Users, Search, Check, Info, Share2, GitBranch, Shield } from "lucide-react";
import { cn } from "../../lib/utils";
import type { RoutingMode } from "../../types";

interface CreatePodModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePodModal({ isOpen, onClose }: CreatePodModalProps) {
  const { agents } = useAgents();
  const { addPod } = usePods();
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [routingMode, setRoutingMode] = useState<RoutingMode>("pipeline");
  const [maxRounds, setMaxRounds] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAgents = agents.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleAgent = (id: string) => {
    setSelectedAgentIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!name || selectedAgentIds.length < 2) return;
    await addPod({ 
      name, 
      goal, 
      agentIds: selectedAgentIds, 
      routingMode,
      maxRounds 
    });
    setName("");
    setGoal("");
    setSelectedAgentIds([]);
    setRoutingMode("pipeline");
    setMaxRounds(10);
    onClose();
  };

  const modes = [
    { id: 'swarm' as const, label: 'Swarm', icon: Share2, desc: 'Decentralized' },
    { id: 'pipeline' as const, label: 'Pipeline', icon: GitBranch, desc: 'Sequential' },
    { id: 'coordinated' as const, label: 'Coordinated', icon: Shield, desc: 'Centralized' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      dark={true}
      noPadding={true}
      title="Create Agent Pod"
      className="max-w-lg border-[#18181B] bg-[#000] overflow-hidden"
    >
      <div className="flex flex-col max-h-[720px]">
        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6">
           
           {/* Name */}
           <div className="space-y-2.5">
              <label className="text-[11px] font-bold text-[#52525B] uppercase tracking-wider">Pod Name</label>
              <input 
                autoFocus
                className="w-full bg-[#09090B] border border-[#18181B] rounded-xl py-3 px-4 text-[14px] text-[#FAFAFA] font-semibold focus:outline-none focus:border-[#FF4A00]/40 placeholder:text-[#3F3F46]" 
                placeholder="e.g. Market Research Team" 
                value={name}
                onChange={e => setName(e.target.value)}
              />
           </div>

           {/* Goal */}
           <div className="space-y-2.5">
              <label className="text-[11px] font-bold text-[#52525B] uppercase tracking-wider">Mission Goal</label>
              <textarea 
                className="w-full h-24 p-4 bg-[#09090B] border border-[#18181B] rounded-xl text-[13px] text-[#FAFAFA] focus:outline-none focus:border-[#FF4A00]/40 resize-none placeholder:text-[#3F3F46] leading-relaxed" 
                placeholder="What should this team accomplish?" 
                value={goal}
                onChange={e => setGoal(e.target.value)}
              />
           </div>

           {/* Team Selection */}
           <div className="space-y-3">
              <div className="flex items-center justify-between">
                 <label className="text-[11px] font-bold text-[#52525B] uppercase tracking-wider">Team ({selectedAgentIds.length} agents)</label>
                 {agents.length > 4 && (
                   <div className="relative w-32">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-[#3F3F46]" />
                      <input 
                        className="w-full h-7 bg-[#09090B] border border-[#18181B] rounded-lg pl-7 pr-3 text-[10px] text-[#FAFAFA] focus:outline-none focus:border-[#FF4A00]/40"
                        placeholder="Filter..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                      />
                   </div>
                 )}
              </div>

              <div className="space-y-1.5 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                 {filteredAgents.map(agent => (
                    <button
                      key={agent.id}
                      onClick={() => toggleAgent(agent.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left",
                        selectedAgentIds.includes(agent.id)
                          ? "bg-[#FF4A00]/5 border-[#FF4A00]/20"
                          : "bg-[#09090B] border-[#18181B] hover:border-[#27272A]"
                      )}
                    >
                       <div className={cn(
                         "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-all",
                         selectedAgentIds.includes(agent.id) ? "bg-[#FF4A00] text-white" : "bg-[#000] border border-[#18181B] text-[#3F3F46]"
                       )}>
                          {selectedAgentIds.includes(agent.id) ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Users className="h-3.5 w-3.5" />}
                       </div>
                       <div className="flex flex-col min-w-0 flex-1">
                          <span className={cn("text-[13px] font-semibold truncate", selectedAgentIds.includes(agent.id) ? "text-[#FAFAFA]" : "text-[#71717A]")}>{agent.name}</span>
                          <span className="text-[11px] text-[#3F3F46] truncate">{agent.description}</span>
                       </div>
                    </button>
                 ))}
              </div>
           </div>

           {/* Routing Mode Selector */}
           <div className="space-y-2.5">
              <label className="text-[11px] font-bold text-[#52525B] uppercase tracking-wider">Starting Flow</label>
              <div className="grid grid-cols-3 gap-2">
                 {modes.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setRoutingMode(m.id)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                        routingMode === m.id 
                          ? "bg-[#FF4A00]/5 border-[#FF4A00]/40 text-[#FAFAFA]" 
                          : "bg-[#09090B] border-[#18181B] text-[#52525B] hover:border-[#27272A]"
                      )}
                    >
                       <m.icon className={cn("h-4 w-4", routingMode === m.id ? "text-[#FF4A00]" : "text-[#3F3F46]")} />
                       <span className="text-[11px] font-semibold">{m.label}</span>
                    </button>
                 ))}
              </div>
           </div>

           {/* Info */}
           <div className="p-3 bg-[#09090B] border border-[#18181B] rounded-xl flex items-start gap-2.5">
              <Info className="h-3.5 w-3.5 text-[#3F3F46] mt-0.5 shrink-0" />
              <p className="text-[10px] text-[#52525B] leading-relaxed">
                 You can change the routing flow and reorder agents in the Pod Editor after creation.
              </p>
           </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#18181B] bg-[#09090B]/50 shrink-0 flex items-center gap-3">
           <Button variant="outline" onClick={onClose} className="flex-1 h-11 border-[#18181B] text-[#52525B] font-semibold rounded-xl hover:text-[#FAFAFA] hover:bg-[#18181B]">Cancel</Button>
           <Button 
            disabled={!name || selectedAgentIds.length < 2} 
            onClick={handleCreate} 
            className="flex-[2] h-11 bg-[#FF4A00] hover:bg-[#E64300] font-bold rounded-xl shadow-lg shadow-[#FF4A00]/20 disabled:opacity-30 disabled:shadow-none text-white"
           >
              Create Pod
           </Button>
        </div>
      </div>
    </Modal>
  );
}
