import { useState } from "react";
import { cn } from "../../lib/utils";
import { useConnections } from "../../hooks/useStore";
import { Check, Loader2, Cpu, ChevronDown, ChevronRight } from "lucide-react";
import { Logo } from "../shared/Logo";

interface ConnectionsPanelProps {
  agentTools: string[];
  onToolsChange: (tools: string[]) => void;
}

export function ConnectionsPanel({ agentTools, onToolsChange }: ConnectionsPanelProps) {
  const { connections, loading } = useConnections();
  const [expandedService, setExpandedService] = useState<string | null>(null);

  const connectedServices = connections.filter(c => c.isConnected && c.tools.length > 0);

  const toggleTool = (toolName: string) => {
    if (agentTools.includes(toolName)) {
      onToolsChange(agentTools.filter(t => t !== toolName));
    } else {
      onToolsChange([...agentTools, toolName]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#999]" />
        <span className="ml-2 text-[10px] text-[#999]">Loading...</span>
      </div>
    );
  }

  if (connectedServices.length === 0) {
    return (
      <div className="text-center py-5 border border-dashed border-[#DDD] rounded-xl bg-[#FAFAFA]">
        <Cpu className="h-4 w-4 text-[#CCC] mx-auto mb-1.5" />
        <p className="text-[10px] text-[#999] font-medium">No tools connected</p>
        <p className="text-[9px] text-[#BBB]">Go to <strong>Tools</strong> tab first</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
      {connectedServices.map((conn) => {
        const isExpanded = expandedService === conn.service;
        const activeCount = conn.tools.filter(t => agentTools.includes(t.name)).length;

        return (
          <div key={conn.service} className="border border-[#E5E5E5] rounded-lg bg-white overflow-hidden">
            {/* Collapsed header — click to expand */}
            <div
              className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-[#FAFAFA] transition-colors"
              onClick={() => setExpandedService(isExpanded ? null : conn.service)}
            >
              <div className="flex items-center gap-2">
                <Logo service={conn.service} size="xs" />
                <span className="text-[10px] font-bold text-[#111]">{conn.label}</span>
                <span className="text-[9px] text-[#999]">{activeCount}/{conn.tools.length}</span>
              </div>
              {isExpanded
                ? <ChevronDown className="h-3 w-3 text-[#999]" />
                : <ChevronRight className="h-3 w-3 text-[#999]" />}
            </div>

            {/* Expanded: tool toggles */}
            {isExpanded && (
              <div className="px-2 pb-2 space-y-1 border-t border-[#F0F0F0]">
                {conn.tools.map((tool) => {
                  const isActive = agentTools.includes(tool.name);
                  const shortName = tool.name.startsWith(conn.service + "_") ? tool.name.slice(conn.service.length + 1) : tool.name;

                  return (
                    <div
                      key={tool.name}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-md transition-all cursor-pointer mt-1",
                        isActive ? "bg-[#111] text-white" : "bg-[#F8F8F8] hover:bg-[#EEE]"
                      )}
                      onClick={() => toggleTool(tool.name)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-[10px] font-bold", isActive ? "text-white" : "text-[#333]")}>{shortName}</p>
                        <p className={cn("text-[9px] truncate", isActive ? "text-white/60" : "text-[#999]")}>{tool.description}</p>
                      </div>
                      <div className={cn(
                        "w-3.5 h-3.5 rounded border-2 flex items-center justify-center ml-2 flex-shrink-0",
                        isActive ? "border-white bg-white" : "border-[#CCC] bg-white"
                      )}>
                        {isActive && <Check className="h-2 w-2 text-[#111]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
