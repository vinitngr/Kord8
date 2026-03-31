import { Plus, Settings } from "lucide-react";
import { Button } from "../shared/Button";
import { AgentCard } from "./AgentCard";
import type { Agent } from "../../types";

interface SidebarProps {
  agents: Agent[];
  onSeeDetails: (agent: Agent) => void;
  onAssignTask: (agent: Agent) => void;
  onCreateAgent: () => void;
}

export function Sidebar({ agents, onSeeDetails, onAssignTask, onCreateAgent }: SidebarProps) {

  return (
    <aside className="w-80 h-full border-r border-[#E5E5E5] bg-white flex flex-col">
      {/* Header */}
      <div className="p-6 pb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-[#111] uppercase tracking-wider">
          Agents
        </h2>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onCreateAgent}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Agent List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onSeeDetails={onSeeDetails}
            onAssignTask={onAssignTask}
            onRunningClick={onSeeDetails}
          />
        ))}
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-[#F5F5F5] space-y-2">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#FAFAFA] cursor-pointer transition-colors group">
          <div className="h-8 w-8 rounded-full bg-[#111] text-white flex items-center justify-center text-xs font-bold">
            V
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-[12px] font-semibold text-[#111] truncate">Vinit</p>
            <p className="text-[10px] text-[#999] truncate">vinit@agent.team</p>
          </div>
          <Settings className="h-4 w-4 text-[#999] group-hover:text-[#111] transition-colors" />
        </div>
      </div>
    </aside>
  );
}
