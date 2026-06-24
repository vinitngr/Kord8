import { useState } from "react";
import { Cpu, ChevronDown, Unplug, Plug, Link2, Box, Terminal } from "lucide-react";
import { Button } from "../shared/Button";
import { Badge } from "../shared/Badge";
import { useConnections } from "../../hooks/useStore";
import { Logo } from "../shared/Logo";
import type { Connection } from "../../types";
import { cn } from "../../lib/utils";

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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#FAFAFA] flex items-center gap-3">
            <Plug className="h-6 w-6 text-[#FF4A00]" />
            Connectors
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-1">Manage external service integrations and custom MCP servers.</p>
        </div>
        {hasDisconnected && (
          <Button variant="outline" size="sm" className="gap-2 bg-[#FF4A00] border-[#FF4A00] text-white hover:bg-[#E64300] shadow-lg shadow-[#FF4A00]/10 rounded-xl h-10 px-5" onClick={onAdd}>
            <PlusIcon className="h-4 w-4" />
            Connect New Tool
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 bg-[#09090B] border border-[#27272A] rounded-2xl">
          <div className="animate-spin h-6 w-6 border-2 border-[#FF4A00] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-xs text-[#A1A1AA]">Syncing connectors...</p>
        </div>
      ) : (
        <div className="space-y-10">
          
          {/* 1. Official Connectors Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <div className="h-1.5 w-1.5 rounded-full bg-[#FF4A00]" />
              <h2 className="text-[11px] font-bold text-[#52525B] uppercase tracking-widest">Platform Connectors</h2>
            </div>
            
            {connectedServices.length === 0 ? (
              <div className="text-center py-16 border border-[#27272A] rounded-2xl bg-[#0E0E10] shadow-sm">
                <Box className="h-10 w-10 text-[#3F3F46] mx-auto mb-4" />
                <p className="text-sm font-bold text-[#FAFAFA]">No active connectors</p>
                <p className="text-xs text-[#A1A1AA] mt-1 mb-6 max-w-xs mx-auto">Connect your workspace tools to give agents access to your real-world data and actions.</p>
                <Button variant="primary" size="sm" className="bg-[#FF4A00] hover:bg-[#E64300] border-[#FF4A00]" onClick={onAdd}>
                  + Add First Connector
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {connectedServices.map((conn) => {
                  const isExpanded = expandedService === conn.service;

                  return (
                    <div 
                      key={conn.service} 
                      className={cn(
                        "group relative bg-[#09090B] border border-[#27272A] rounded-2xl transition-all duration-300 overflow-hidden",
                        isExpanded ? "ring-1 ring-[#FF4A00]/50 border-[#FF4A00]/30 shadow-2xl shadow-[#FF4A00]/5" : "hover:border-[#3F3F46] hover:bg-[#0E0E10]"
                      )}
                    >
                      <div
                        className="p-6 cursor-pointer"
                        onClick={() => setExpandedService(isExpanded ? null : conn.service)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="h-12 w-12 flex items-center justify-center shrink-0 bg-[#000] border border-[#27272A] rounded-xl shadow-inner group-hover:bg-[#09090B] transition-colors">
                              <Logo service={conn.service} size="lg" />
                            </div>
                            <div className="flex flex-col truncate">
                              <h4 className="text-[15px] font-bold text-[#FAFAFA] truncate group-hover:text-[#FF4A00] transition-colors">
                                {conn.label}
                              </h4>
                              <p className="text-[12px] text-[#A1A1AA] truncate mt-0.5">
                                {conn.tools.length} functional tools
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <Badge variant="success" className="bg-[#10B981]/10 border-[#10B981]/20 text-[#10B981] text-[9px] font-bold uppercase py-0.5">
                              Active
                            </Badge>
                            <div className={cn(
                              "text-[#3F3F46] group-hover:text-[#A1A1AA] transition-transform duration-300",
                              isExpanded ? "rotate-180" : ""
                            )}>
                              <ChevronDown className="h-4 w-4" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tools List Drawer */}
                      {isExpanded && (
                        <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
                          <div className="pt-4 border-t border-[#27272A] space-y-4">
                            <div className="grid grid-cols-1 gap-2">
                              {conn.tools.map((tool) => (
                                <div key={tool.name} className="flex items-center gap-3 p-3 rounded-xl bg-[#000] border border-[#27272A]/50 group/tool hover:border-[#FF4A00]/30 transition-colors">
                                  <div className="h-8 w-8 rounded-lg bg-[#09090B] border border-[#27272A] flex items-center justify-center">
                                    <Cpu className="h-4 w-4 text-[#FF4A00] opacity-70 group-hover/tool:opacity-100" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[12px] font-bold text-[#FAFAFA]">{tool.name.replace(`${conn.service}_`, '')}</p>
                                    <p className="text-[10px] text-[#A1A1AA] truncate">{tool.description}</p>
                                  </div>
                                  <Badge variant="outline" className="text-[8px] border-[#27272A] text-[#52525B] group-hover/tool:text-[#A1A1AA] uppercase">
                                    {tool.kind || 'Action'}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                            
                            <div className="flex justify-end pt-2">
                               <button
                                 className="flex items-center gap-2 text-[11px] text-[#EF4444] hover:text-[#FAFAFA] hover:bg-[#EF4444]/10 px-3 py-1.5 rounded-lg transition-all font-medium"
                                 onClick={(e) => { e.stopPropagation(); handleDisconnect(conn); }}
                               >
                                 <Unplug className="h-3.5 w-3.5" /> Remove Connector
                               </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 2. Custom Connectors (MCP) Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[#3B82F6]" />
                <h2 className="text-[11px] font-bold text-[#52525B] uppercase tracking-widest">Custom Connectors (MCP)</h2>
              </div>
              <Badge variant="outline" className="text-[9px] border-blue-500/30 text-blue-400 font-bold">Standardized Protocol</Badge>
            </div>

            <div className="bg-[#09090B] border border-[#27272A] rounded-2xl p-8 text-center relative overflow-hidden group">
               <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
               <Terminal className="h-10 w-10 text-[#3F3F46] mx-auto mb-4 group-hover:text-blue-500 transition-colors" />
               <h3 className="text-sm font-bold text-[#FAFAFA]">Model Context Protocol Servers</h3>
               <p className="text-xs text-[#A1A1AA] mt-2 mb-6 max-w-md mx-auto">
                 Connect local or remote MCP servers to extend your agents with custom tools using a standardized open protocol.
               </p>
               <Button variant="outline" size="sm" className="bg-[#000] border-[#27272A] text-[#FAFAFA] hover:border-blue-500/50 hover:bg-blue-500/5">
                 <Link2 className="h-3.5 w-3.5 mr-2 text-blue-500" /> Install Custom MCP Server
               </Button>
            </div>
          </section>

        </div>
      )}
    </div>
  );
}

function PlusIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
