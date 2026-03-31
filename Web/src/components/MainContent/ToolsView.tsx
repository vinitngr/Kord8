import { useState } from "react";
import { Cpu, ChevronDown, ChevronRight, Check, Unplug, Plug } from "lucide-react";
import { Button } from "../shared/Button";
import { Badge } from "../shared/Badge";
import { useConnections } from "../../hooks/useStore";
import { Logo } from "../shared/Logo";
import type { Connection } from "../../types";

interface ToolsViewProps {
  onAdd: () => void;
}

export function ToolsView({ onAdd }: ToolsViewProps) {
  const { connections, loading, deleteConnection } = useConnections();
  const [expandedService, setExpandedService] = useState<string | null>(null);

  const connectedServices = connections.filter(c => c.isConnected);
  const hasDisconnected = connections.some(c => !c.isConnected);

  const handleDisconnect = async (conn: Connection) => {
    await deleteConnection(conn.service);
    setExpandedService(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#111]">Connected Tools</h1>
          <p className="text-xs text-[#999] mt-1">Manage your tool integrations and API credentials.</p>
        </div>
        {hasDisconnected && (
          <Button variant="outline" size="sm" className="gap-2" onClick={onAdd}>
            <Plug className="h-3.5 w-3.5" />
            Connect New Tool
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-xs text-[#999]">Loading connections...</p>
        </div>
      ) : connectedServices.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#DDD] rounded-2xl bg-white">
          <Cpu className="h-8 w-8 text-[#CCC] mx-auto mb-3" />
          <p className="text-sm font-bold text-[#999]">No tools connected</p>
          <p className="text-xs text-[#BBB] mt-1 mb-4">Connect a tool to give your agents real-world capabilities.</p>
          <Button variant="primary" size="sm" onClick={onAdd}>
            <Plug className="h-3.5 w-3.5 mr-2" /> Connect Your First Tool
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {connectedServices.map((conn) => {
            const isExpanded = expandedService === conn.service;

            return (
              <div key={conn.service} className="bg-white border border-[#E5E5E5] rounded-xl overflow-hidden card-hover">
                {/* Card Header */}
                <div
                  className="p-4 flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedService(isExpanded ? null : conn.service)}
                >
                  <div className="flex gap-4 items-center">
                    <Logo service={conn.service} size="lg" />
                    <div>
                      <h4 className="text-sm font-semibold text-[#111]">{conn.label}</h4>
                      <p className="text-[10px] text-[#999]">
                        {conn.tools.length} tool{conn.tools.length !== 1 ? "s" : ""} available
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="success">
                      <Check className="h-2.5 w-2.5 mr-1" /> Connected
                    </Badge>
                    {isExpanded
                      ? <ChevronDown className="h-3.5 w-3.5 text-[#999]" />
                      : <ChevronRight className="h-3.5 w-3.5 text-[#999]" />}
                  </div>
                </div>

                {/* Expanded: show tools + disconnect */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-[#F0F0F0]">
                    <p className="text-[9px] font-bold text-[#999] uppercase tracking-wider pt-3">Included Tools</p>
                    <div className="space-y-1">
                      {conn.tools.map((tool) => {
                        const shortName = tool.name.startsWith(conn.service + "_") ? tool.name.slice(conn.service.length + 1) : tool.name;
                        return (
                          <div key={tool.name} className="flex items-center gap-2 p-2 rounded-lg bg-[#F8F8F8]">
                            <Cpu className="h-3 w-3 text-[#999] flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-bold text-[#333]">{shortName}</p>
                              <p className="text-[9px] text-[#999] truncate">{tool.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {conn.fields.length > 0 && (
                      <button
                        className="flex items-center gap-1.5 text-[10px] text-red-500 hover:text-red-700 font-medium transition-colors pt-1"
                        onClick={() => handleDisconnect(conn)}
                      >
                        <Unplug className="h-3 w-3" /> Disconnect
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
