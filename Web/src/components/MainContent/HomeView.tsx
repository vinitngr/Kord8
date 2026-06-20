import { LayoutDashboard, FileText, Grip, Search as SearchIcon } from "lucide-react";
import { AgentCard } from "../Sidebar/AgentCard";
import type { Agent } from "../../types";
import { usePods } from "../../hooks/useStore";

interface HomeViewProps {
  agents: Agent[];
  onSeeDetails: (agent: Agent) => void;
  onAssignTask: (agent: Agent) => void;
}

export function HomeView({ agents, onSeeDetails, onAssignTask }: HomeViewProps) {
  const { pods } = usePods();

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090B] rounded-[16px] border border-[#27272A] text-[#FAFAFA] px-10 py-10 overflow-y-auto shadow-lg relative">
      <div className="max-w-[1200px] w-full mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <LayoutDashboard className="h-6 w-6 text-[#A1A1AA]" />
            My agents
          </h2>
          <button 
            onClick={() => onSeeDetails({} as Agent)}
            className="h-10 px-5 rounded-lg bg-[#FF4A00] hover:bg-[#E64300] text-white font-semibold text-[14px] transition-colors flex items-center gap-2 shadow-lg shadow-[#FF4A00]/20"
          >
            + New agent
          </button>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div className="relative flex-1 max-w-[320px]">
             <SearchIcon className="absolute left-3.5 top-2.5 h-[18px] w-[18px] text-[#A1A1AA]" />
             <input 
               className="w-full h-10 bg-[#000000] border border-[#27272A] hover:border-[#3F3F46] rounded-lg pl-10 pr-4 text-sm focus:outline-none focus:border-[#FF4A00] transition-all text-[#FAFAFA] placeholder:text-[#A1A1AA] shadow-sm"
               placeholder="Search agents..."
             />
          </div>
          
          <button className="h-10 px-4 bg-[#000000] border border-[#27272A] rounded-lg text-[13px] font-medium flex items-center gap-2 hover:bg-[#18181B] transition-colors text-[#FAFAFA] shadow-sm font-bold">
            All services <span className="text-[10px] ml-1 opacity-60">▼</span>
          </button>
          <button className="h-10 px-4 bg-[#000000] border border-[#27272A] rounded-lg text-[13px] font-medium flex items-center gap-2 hover:bg-[#18181B] transition-colors text-[#FAFAFA] shadow-sm font-bold">
            Active only <span className="text-[10px] ml-1 opacity-60">▼</span>
          </button>

          <div className="flex-1" />

          {/* view switch */}
          <div className="flex items-center gap-1 border border-[#27272A] rounded-lg p-1 bg-[#000000] shadow-sm">
             <button className="h-8 w-9 bg-[#18181B] text-[#FF4A00] rounded-md flex items-center justify-center border border-[#27272A]">
               <Grip className="h-4 w-4" />
             </button>
             <button className="h-8 w-9 text-[#A1A1AA] hover:text-[#FAFAFA] rounded-md flex items-center justify-center transition-colors">
               <FileText className="h-4 w-4" />
             </button>
          </div>
        </div>

        {/* Tactical Legend */}
        <div className="flex items-center gap-6 mb-10 p-4 bg-[#000] border border-[#18181B] rounded-xl">
           <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
              <span className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Vanguard: Multi-Role Elite</span>
           </div>
           <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              <span className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Sentry: Autonomous</span>
           </div>
           <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              <span className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Operative: Collaborative</span>
           </div>
           <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#3F3F46]" />
              <span className="text-[10px] font-bold text-[#3F3F46] uppercase tracking-wider">Reserve: Unassigned</span>
           </div>
        </div>

        {/* Connected Box Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 bg-[#09090B] border-t border-l border-[#27272A] rounded-[16px] overflow-hidden shadow-sm">
          {agents.length > 0 ? (
            <>
              {agents.map((agent) => {
                const pod = pods.find(p => p.agentIds.includes(agent.id));
                return (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    podName={pod?.name}
                    onSeeDetails={onSeeDetails}
                    onAssignTask={onAssignTask}
                  />
                );
              })}
              {/* Filler cells to maintain grid borders */}
              {Array.from({ length: (4 - (agents.length % 4)) % 4 }).map((_, i) => (
                <div key={`filler-${i}`} className="hidden xl:block border-r border-b border-[#27272A] bg-[#09090B]/50" />
              ))}
              {Array.from({ length: (3 - (agents.length % 3)) % 3 }).map((_, i) => (
                <div key={`filler-lg-${i}`} className="hidden lg:block xl:hidden border-r border-b border-[#27272A] bg-[#09090B]/50" />
              ))}
              {Array.from({ length: (2 - (agents.length % 2)) % 2 }).map((_, i) => (
                <div key={`filler-md-${i}`} className="hidden md:block lg:hidden border-r border-b border-[#27272A] bg-[#09090B]/50" />
              ))}
            </>
          ) : (
            <div className="col-span-full py-24 text-center bg-[#09090B] border-r border-b border-[#27272A]">
               <p className="text-[#A1A1AA] text-[15px] font-medium italic">No agents initialized yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
