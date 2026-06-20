import type { Agent } from "../../types";
import { Play, MoreHorizontal, Boxes } from "lucide-react";

interface AgentCardProps {
  agent: Agent;
  podName?: string;
  onSeeDetails: (agent: Agent) => void;
  onAssignTask: (agent: Agent) => void;
}

export function AgentCard({
  agent,
  podName,
  onSeeDetails,
  onAssignTask,
}: AgentCardProps) {
  return (
    <div 
      className="group relative p-6 bg-[#09090B] hover:bg-[#121214] flex flex-col gap-4 cursor-pointer transition-colors border-r border-b border-[#27272A]"
      onClick={() => onSeeDetails(agent)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-8 w-8 flex items-center justify-center bg-[#FF4A00]/10 text-[#FF4A00] rounded-lg border border-[#FF4A00]/20 shrink-0">
             <Boxes className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold text-[#FAFAFA] truncate group-hover:text-[#FF4A00] transition-colors leading-tight tracking-tight">
              {agent.name || "Untitled Agent"}
            </h3>
            {podName && (
               <div className="flex items-center gap-1 mt-1 opacity-50 group-hover:opacity-100 transition-opacity">
                  <span className="text-[9px] font-bold text-[#A1A1AA] group-hover:text-[#FF4A00] uppercase tracking-widest">{podName}</span>
               </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Tactical Role Badge */}
          {agent.triggers?.length > 0 && podName ? (
            <span 
              title="Vanguard: Multi-role elite. Handles both independent triggers and Pod missions."
              className="px-2 py-1 rounded border border-purple-500/20 text-[9px] uppercase font-black tracking-widest text-purple-500 bg-purple-500/5 shadow-[0_0_10px_rgba(168,85,247,0.1)] cursor-help"
            >
              Vanguard
            </span>
          ) : agent.triggers?.length > 0 ? (
            <span 
              title="Sentry: Autonomous unit. Runs independently based on triggers."
              className="px-2 py-1 rounded border border-green-500/20 text-[9px] uppercase font-black tracking-widest text-green-500 bg-green-500/5 cursor-help"
            >
              Sentry
            </span>
          ) : podName ? (
            <span 
              title="Operative: Specialized team member. Exclusively mission-responsive."
              className="px-2 py-1 rounded border border-blue-500/20 text-[9px] uppercase font-black tracking-widest text-blue-500 bg-blue-500/5 cursor-help"
            >
              Operative
            </span>
          ) : (
            <span 
              title="Reserve: Tactical reserve. Currently unassigned."
              className="px-2 py-1 rounded border border-[#27272A] text-[9px] uppercase font-black tracking-widest text-[#3F3F46] bg-[#000000] cursor-help"
            >
              Reserve
            </span>
          )}
          
          <button className="text-[#3F3F46] hover:text-[#FAFAFA] p-1 rounded hover:bg-[#27272A] transition-colors" onClick={(e) => { e.stopPropagation(); /* Menu logic */ }}>
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-[44px]">
        {agent.instruction ? (
          <p className="text-[13px] text-[#A1A1AA] line-clamp-2 gap-y-2 leading-relaxed font-medium">
            {agent.instruction}
          </p>
        ) : (
          <p className="text-[13px] text-[#3F3F46] italic font-medium">
            No intelligence constraints defined.
          </p>
        )}
      </div>

      <div className="flex justify-between items-end mt-4 pt-4 border-t border-[#18181B]">
        <div className="flex items-center gap-3">
           <button 
             onClick={(e) => { e.stopPropagation(); onAssignTask(agent); }}
             className="h-8 px-4 flex items-center justify-center gap-2 rounded-lg border border-[#18181B] bg-[#000] text-[#52525B] hover:bg-[#FF4A00] hover:text-white hover:border-[#FF4A00] transition-all text-[11px] font-bold tracking-wide shadow-sm hover:shadow-[0_0_15px_rgba(255,74,0,0.3)]"
           >
             <Play className="h-3 w-3 fill-current" /> Initialize Run
           </button>
        </div>

        <div className="text-right">
          <p className="text-[10px] text-[#3F3F46] font-bold tracking-widest uppercase">Instances</p>
          <p className="text-[12px] text-[#A1A1AA] mt-0.5 font-bold">{agent.runningInstances || 0} active</p>
        </div>
      </div>
    </div>
  );
}
