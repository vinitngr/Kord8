import { useState } from "react";
import { Plug, Plus, ExternalLink, Settings, ShieldCheck, Zap, Server, Terminal, Link2 } from "lucide-react";
import { Button } from "../shared/Button";
import { useConnections } from "../../hooks/useStore";
import { Logo } from "../shared/Logo";
import { cn } from "../../lib/utils";

interface ConnectorsViewProps {
  onAdd?: () => void;
  onAddMCP?: () => void;
}

type ConnectorTab = "apps" | "mcp";

export function ConnectorsView({ onAdd, onAddMCP }: ConnectorsViewProps) {
  const { connections, loading } = useConnections();
  const [activeTab, setActiveTab] = useState<ConnectorTab>("apps");

  const mcpServers = [
    { id: '1', name: 'Postgres MCP', type: 'stdio', status: 'connected', description: 'Local database context with read/write capabilities.' },
    { id: '2', name: 'File Explorer', type: 'stdio', status: 'connected', description: 'Read local markdown files for RAG context.' },
    { id: '3', name: 'Slack SSE', type: 'sse', status: 'disconnected', description: 'Event-driven Slack connector for real-time notifications.' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090B] overflow-y-auto custom-scrollbar animate-in fade-in duration-500">
      <div className="px-10 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col gap-1">
             <h2 className="text-2xl font-bold flex items-center gap-3">
                <Plug className="h-6 w-6 text-[#A1A1AA]" />
                Connectors
             </h2>
             <div className="flex items-center gap-6 mt-4">
                <button 
                  onClick={() => setActiveTab("apps")}
                  className={cn(
                    "text-[13px] font-bold pb-2 transition-all border-b-2",
                    activeTab === "apps" ? "text-[#FF4A00] border-[#FF4A00]" : "text-[#3F3F46] border-transparent hover:text-[#A1A1AA]"
                  )}
                >
                  App Marketplace
                </button>
                <button 
                  onClick={() => setActiveTab("mcp")}
                  className={cn(
                    "text-[13px] font-bold pb-2 transition-all border-b-2",
                    activeTab === "mcp" ? "text-[#FF4A00] border-[#FF4A00]" : "text-[#3F3F46] border-transparent hover:text-[#A1A1AA]"
                  )}
                >
                  Custom (MCP)
                </button>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
             {activeTab === "apps" ? (
                <Button 
                  variant="primary" 
                  size="sm" 
                  className="h-10 px-5 rounded-lg bg-[#FF4A00] hover:bg-[#E64300] text-white font-semibold text-[14px] transition-colors flex items-center gap-2 shadow-sm"
                  onClick={onAdd}
                >
                  + New Connection
                </Button>
             ) : (
                <Button 
                  variant="primary" 
                  size="sm" 
                  className="h-10 px-5 rounded-lg bg-[#FF4A00] hover:bg-[#E64300] text-white font-semibold text-[14px] transition-colors flex items-center gap-2 shadow-sm"
                  onClick={onAddMCP}
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  Install MCP Server
                </Button>
             )}
          </div>
        </div>

        {activeTab === "apps" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 bg-[#09090B] border-t border-l border-[#27272A] rounded-[16px] overflow-hidden shadow-sm">
            {loading ? (
               <div className="col-span-full py-24 text-center border-r border-b border-[#27272A]">
                  <div className="h-8 w-8 rounded-full border-2 border-[#3F3F46] border-t-[#FF4A00] animate-spin mx-auto mb-4" />
                  <p className="text-[#A1A1AA] text-[15px] font-medium">Fetching connectors...</p>
               </div>
            ) : connections.length === 0 ? (
              <div className="col-span-full py-24 text-center border-r border-b border-[#27272A]">
                 <p className="text-[#A1A1AA] text-[15px] font-medium">No connectors linked yet.</p>
              </div>
            ) : (
              <>
                {connections.map((conn) => (
                  <div 
                    key={conn.service} 
                    className="group relative p-6 bg-[#09090B] hover:bg-[#121214] flex flex-col gap-4 cursor-pointer transition-colors border-r border-b border-[#27272A]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-8 w-8 flex items-center justify-center bg-[#000] rounded-lg border border-[#27272A] shrink-0 group-hover:border-[#3F3F46] transition-all">
                          <Logo service={conn.service} size="xs" />
                        </div>
                        <h3 className="text-[15px] font-semibold text-[#FAFAFA] truncate group-hover:text-[#FF4A00] transition-colors leading-tight">
                          {conn.label}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                         {conn.isConnected ? (
                            <span className="px-2 py-1 rounded border border-[#10B981]/20 text-[9px] uppercase font-bold tracking-wider text-[#10B981] bg-[#10B981]/5">
                              Active
                            </span>
                         ) : (
                            <span className="px-2 py-1 rounded border border-[#27272A] text-[9px] uppercase font-bold tracking-wider text-[#3F3F46] bg-[#000000]">
                              Idle
                            </span>
                         )}
                      </div>
                    </div>

                    <div className="flex-1 min-h-[44px]">
                       <p className="text-[12px] text-[#52525B] line-clamp-2 leading-relaxed font-normal group-hover:text-[#A1A1AA] transition-colors">
                         {conn.description || "Enterprise integration for functional autonomous capabilities."}
                       </p>
                    </div>

                    <div className="flex justify-between items-end mt-4 pt-4 border-t border-[#27272A]">
                      <div className="flex flex-col gap-2">
                         <div className="flex items-center gap-2">
                            <Zap className="h-3 w-3 text-[#3F3F46]" />
                            <span className="text-[11px] font-bold text-[#A1A1AA]">{conn.tools.length} Tools</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <ShieldCheck className={cn("h-3 w-3", conn.hasPing ? "text-[#10B981]" : "text-[#3F3F46]")} />
                            <span className="text-[11px] font-bold text-[#3F3F46]">{conn.hasPing ? "Healthy" : "Unknown"}</span>
                         </div>
                      </div>

                      <div className="flex items-center gap-2">
                         <button className="h-8 w-8 rounded-md border border-[#27272A] flex items-center justify-center text-[#3F3F46] hover:text-[#FAFAFA] hover:bg-[#27272A] transition-all">
                            <Settings className="h-3.5 w-3.5" />
                         </button>
                         <button className="h-8 w-8 rounded-md border border-[#27272A] flex items-center justify-center text-[#3F3F46] hover:text-[#FAFAFA] hover:bg-[#27272A] transition-all">
                            <ExternalLink className="h-3.5 w-3.5" />
                         </button>
                      </div>
                    </div>
                  </div>
                ))}
                {/* Filler cells to maintain grid borders */}
                {Array.from({ length: (4 - (connections.length % 4)) % 4 }).map((_, i) => (
                  <div key={`filler-${i}`} className="hidden xl:block border-r border-b border-[#27272A] bg-[#09090B]/50" />
                ))}
                {Array.from({ length: (3 - (connections.length % 3)) % 3 }).map((_, i) => (
                  <div key={`filler-lg-${i}`} className="hidden lg:block xl:hidden border-r border-b border-[#27272A] bg-[#09090B]/50" />
                ))}
                {Array.from({ length: (2 - (connections.length % 2)) % 2 }).map((_, i) => (
                  <div key={`filler-md-${i}`} className="hidden md:block lg:hidden border-r border-b border-[#27272A] bg-[#09090B]/50" />
                ))}
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 bg-[#09090B] border-t border-l border-[#27272A] rounded-[16px] overflow-hidden shadow-sm">
             {mcpServers.map((server) => (
                <div 
                  key={server.id} 
                  className="group relative p-6 bg-[#09090B] hover:bg-[#121214] flex flex-col gap-4 cursor-pointer transition-colors border-r border-b border-[#27272A]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-8 w-8 flex items-center justify-center bg-[#000] rounded-lg border border-[#27272A] shrink-0 group-hover:border-[#3F3F46] transition-all">
                        <Server className="h-4 w-4 text-[#FF4A00]" />
                      </div>
                      <h3 className="text-[15px] font-semibold text-[#FAFAFA] truncate group-hover:text-[#FF4A00] transition-colors leading-tight">
                        {server.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                       <span className={cn(
                         "px-2 py-1 rounded border text-[9px] uppercase font-bold tracking-wider",
                         server.status === "connected" ? "border-[#10B981]/20 text-[#10B981] bg-[#10B981]/5" : "border-[#27272A] text-[#3F3F46] bg-[#000000]"
                       )}>
                         {server.status}
                       </span>
                    </div>
                  </div>

                  <div className="flex-1 min-h-[44px]">
                     <p className="text-[12px] text-[#52525B] line-clamp-2 leading-relaxed font-normal group-hover:text-[#A1A1AA] transition-colors">
                       {server.description}
                     </p>
                  </div>

                  <div className="flex justify-between items-end mt-4 pt-4 border-t border-[#27272A]">
                    <div className="flex flex-col gap-2">
                       <div className="flex items-center gap-2">
                          <Terminal className="h-3 w-3 text-[#3F3F46]" />
                          <span className="text-[11px] font-bold text-[#A1A1AA] capitalize">{server.type} protocol</span>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <button className="h-8 w-8 rounded-md border border-[#27272A] flex items-center justify-center text-[#3F3F46] hover:text-[#FAFAFA] hover:bg-[#27272A] transition-all">
                          <Settings className="h-3.5 w-3.5" />
                       </button>
                    </div>
                  </div>
                </div>
             ))}
             {/* Filler cells to maintain grid borders for MCP */}
             {Array.from({ length: (4 - (mcpServers.length % 4)) % 4 }).map((_, i) => (
               <div key={`filler-mcp-${i}`} className="hidden xl:block border-r border-b border-[#27272A] bg-[#09090B]/50" />
             ))}
             {Array.from({ length: (3 - (mcpServers.length % 3)) % 3 }).map((_, i) => (
               <div key={`filler-mcp-lg-${i}`} className="hidden lg:block xl:hidden border-r border-b border-[#27272A] bg-[#09090B]/50" />
             ))}
             {Array.from({ length: (2 - (mcpServers.length % 2)) % 2 }).map((_, i) => (
               <div key={`filler-mcp-md-${i}`} className="hidden md:block lg:hidden border-r border-b border-[#27272A] bg-[#09090B]/50" />
             ))}
          </div>
        )}
      </div>
    </div>
  );
}
