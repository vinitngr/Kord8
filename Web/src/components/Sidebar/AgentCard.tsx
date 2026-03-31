import type { Agent } from "../../types";
import { Badge } from "../shared/Badge";
import { Button } from "../shared/Button";
import { Activity, Info, Play } from "lucide-react";
import { cn } from "../../lib/utils";

interface AgentCardProps {
  agent: Agent;
  onSeeDetails: (agent: Agent) => void;
  onAssignTask: (agent: Agent) => void;
  onRunningClick: (agent: Agent) => void;
}

export function AgentCard({
  agent,
  onSeeDetails,
  onAssignTask,
  onRunningClick,
}: AgentCardProps) {
  return (
    <div className={cn(
      "group relative p-4 bg-white border border-[#E5E5E5] rounded-r-lg rounded-l-[2px] card-hover flex flex-col gap-4 border-l-4 transition-all",
      agent.colorClass || "agent-slate",
      agent.enabled === false && "opacity-60 grayscale-[0.5]"
    )}
    style={{ borderLeftColor: agent.enabled === false ? '#999' : `hsl(var(--agent-accent))` }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1 overflow-hidden">
          <h3 className="text-sm font-semibold text-[#111] leading-none truncate">
            {agent.name}
          </h3>
          <p className="text-[12px] text-[#666] line-clamp-1">
            {agent.description}
          </p>
        </div>
        {agent.runningInstances > 0 && (
          <button
            onClick={() => onRunningClick(agent)}
            className="flex items-center shrink-0 ml-2 hover:opacity-80 transition-opacity"
          >
            <Badge variant="success" className="animate-pulse whitespace-nowrap flex items-center">
              <Activity className="h-2 w-2 mr-1" />
              Running: {agent.runningInstances}
            </Badge>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {agent.triggers?.some(t => t.type === 'manual') && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-[11px] h-8 gap-1.5"
            onClick={() => onAssignTask(agent)}
          >
            <Play className="h-3 w-3 fill-current" />
            Assign Task
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-[#999] hover:text-[#111]"
          onClick={() => onSeeDetails(agent)}
        >
          <Info className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
