import { useNavigate } from "react-router-dom";
import { Boxes, Plus, Trash2, ArrowRight, Clock } from "lucide-react";
import { Button } from "../shared/Button";
import { cn } from "../../lib/utils";
import { usePods, useAgents } from "../../hooks/useStore";

interface PodsViewProps {
  onAdd: () => void;
}

export function PodsView({ onAdd }: PodsViewProps) {
  const { pods, deletePod, loading } = usePods();
  const { agents } = useAgents();
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090B] overflow-y-auto custom-scrollbar">
      <div className="px-10 py-10 max-w-[1200px] w-full mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
             <h2 className="text-2xl font-bold flex items-center gap-3 text-[#FAFAFA]">
                <Boxes className="h-6 w-6 text-[#A1A1AA]" />
                Agent Pods
             </h2>
             <p className="text-[13px] text-[#52525B] mt-1">
                Group agents into collaborative teams with a shared goal.
             </p>
          </div>
          <Button 
            onClick={onAdd}
            className="h-10 px-5 rounded-lg bg-[#FF4A00] hover:bg-[#E64300] text-white font-semibold text-[14px] flex items-center gap-2 shadow-lg shadow-[#FF4A00]/20"
          >
            <Plus className="h-4 w-4" /> New Pod
          </Button>
        </div>

        {/* Connected Box Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 bg-[#09090B] border-t border-l border-[#27272A] rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
             <div className="col-span-full py-24 text-center border-r border-b border-[#27272A]">
                <div className="h-8 w-8 rounded-full border-2 border-[#3F3F46] border-t-[#FF4A00] animate-spin mx-auto mb-4" />
                <p className="text-[#A1A1AA] text-sm font-medium">Loading pods...</p>
             </div>
          ) : pods.length === 0 ? (
            <div className="col-span-full py-24 text-center border-r border-b border-[#27272A]">
               <Boxes className="h-12 w-12 text-[#27272A] mx-auto mb-4" />
               <p className="text-[#A1A1AA] text-[15px] font-medium">No pods yet</p>
               <p className="text-[13px] text-[#3F3F46] mt-1">Group your agents into teams to handle complex workflows.</p>
            </div>
          ) : (
            <>
              {pods.map((pod) => {
                const teamAgents = pod.agentIds.map(id => agents.find(a => a.id === id)).filter(Boolean);
                
                return (
                  <div 
                    key={pod.id} 
                    className="group bg-[#09090B] hover:bg-[#121214] flex flex-col transition-colors border-r border-b border-[#27272A] cursor-pointer"
                    onClick={() => navigate(`/pods/${pod.id}`)}
                  >
                    <div className="p-6 flex flex-col gap-4 flex-1">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="h-9 w-9 flex items-center justify-center bg-[#FF4A00]/10 text-[#FF4A00] rounded-lg border border-[#FF4A00]/20 shrink-0">
                            <Boxes className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                               <h3 className="text-[15px] font-semibold text-[#FAFAFA] truncate group-hover:text-[#FF4A00] transition-colors">
                                 {pod.name}
                               </h3>
                               <span className={cn(
                                 "px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase shrink-0 transition-all",
                                 pod.routingMode === 'pipeline' ? "bg-[#FF4A00]/10 text-[#FF4A00] border-[#FF4A00]/20" :
                                 pod.routingMode === 'coordinated' ? "bg-[#8B5CF6]/10 text-[#A78BFA] border-[#8B5CF6]/20" :
                                 "bg-[#18181B] text-[#52525B] border-[#27272A]"
                               )}>
                                  {pod.routingMode}
                               </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                               <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                               <span className="text-[11px] text-[#52525B]">{pod.agentIds.length} agents</span>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deletePod(pod.id); }}
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-[#27272A] hover:text-[#EF4444] hover:bg-[#EF4444]/5 transition-all opacity-0 group-hover:opacity-100"
                        >
                           <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Goal preview */}
                      <p className="text-[13px] text-[#71717A] line-clamp-2 leading-relaxed flex-1">
                        {pod.goal || "No goal defined yet."}
                      </p>

                      {/* Team avatars */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                         {teamAgents.slice(0, 5).map((agent: any) => (
                            <span key={agent.id} className="px-2 py-0.5 rounded-md bg-[#000] border border-[#18181B] text-[10px] font-medium text-[#A1A1AA]">
                               {agent.name.split(' ')[0]}
                            </span>
                         ))}
                         {teamAgents.length > 5 && <span className="text-[10px] text-[#3F3F46]">+{teamAgents.length - 5}</span>}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-3 border-t border-[#18181B] flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[11px] text-[#3F3F46]">
                         <Clock className="h-3 w-3" />
                         <span>Max {pod.maxRounds} rounds</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-[#27272A] group-hover:text-[#FF4A00] transition-colors" />
                    </div>
                  </div>
                );
              })}
              {/* Filler cells to maintain grid borders */}
              {Array.from({ length: (3 - (pods.length % 3)) % 3 }).map((_, i) => (
                <div key={`filler-lg-${i}`} className="hidden lg:block border-r border-b border-[#27272A] bg-[#09090B]/50" />
              ))}
              {Array.from({ length: (2 - (pods.length % 2)) % 2 }).map((_, i) => (
                <div key={`filler-md-${i}`} className="hidden md:block lg:hidden border-r border-b border-[#27272A] bg-[#09090B]/50" />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
