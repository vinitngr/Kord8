import { useState } from "react";
import { Modal } from "../shared/Modal";
import { Button } from "../shared/Button";
import { Server, Terminal, ShieldCheck, Zap, Globe, Github, Database } from "lucide-react";
import { cn } from "../../lib/utils";

interface InstallMCPModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstallMCPModal({ isOpen, onClose }: InstallMCPModalProps) {
  const [mcpType, setMcpType] = useState<"sse" | "stdio">("sse");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      dark={true}
      noPadding={true}
      title="Install MCP Infrastructure"
      className="max-w-2xl border-[#18181B] bg-[#000] overflow-hidden"
    >
      <div className="flex flex-col h-[520px]">
        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
           <div className="flex flex-col gap-8">
              {/* Protocol Header */}
              <div className="flex flex-col gap-3">
                 <label className="text-[10px] font-bold text-[#3F3F46] uppercase tracking-[0.2em] mb-1">Connection Protocol</label>
                 <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "sse", label: "SSE Interface", sub: "Server-Sent Events", icon: Server },
                      { id: "stdio", label: "Stdio Interface", sub: "Local Process Pipe", icon: Terminal },
                    ].map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setMcpType(type.id as any)}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-xl border transition-all text-left group",
                          mcpType === type.id 
                            ? "bg-[#FF4A00]/5 border-[#FF4A00]/40 shadow-sm" 
                            : "bg-[#09090B] border-[#18181B] hover:border-[#27272A] hover:bg-[#121214]"
                        )}
                      >
                        <div className={cn(
                          "h-10 w-10 shrink-0 rounded-lg flex items-center justify-center transition-all",
                          mcpType === type.id ? "bg-[#FF4A00] text-white shadow-lg shadow-[#FF4A00]/20" : "bg-[#000] border border-[#18181B] text-[#3F3F46] group-hover:border-[#3F3F46]"
                        )}>
                           <type.icon className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                           <span className={cn("text-[14px] font-bold tracking-tight", mcpType === type.id ? "text-[#FAFAFA]" : "text-[#A1A1AA]")}>{type.label}</span>
                           <span className="text-[9px] text-[#3F3F46] font-bold uppercase tracking-widest">{type.sub}</span>
                        </div>
                      </button>
                    ))}
                 </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                 <div className="space-y-3">
                   <label className="text-[10px] font-bold text-[#3F3F46] uppercase tracking-[0.2em]">Service Identity</label>
                   <input className="w-full bg-[#09090B] border border-[#18181B] rounded-xl py-3.5 px-4 text-[14px] text-[#FAFAFA] font-bold focus:outline-none focus:border-[#FF4A00]/40 shadow-sm" placeholder="e.g. Postgres MCP Server" />
                 </div>

                 {mcpType === "sse" ? (
                   <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="space-y-3">
                         <label className="text-[10px] font-bold text-[#3F3F46] uppercase tracking-[0.2em]">Remote Endpoint</label>
                         <div className="relative">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#3F3F46]" />
                            <input className="w-full bg-[#09090B] border border-[#18181B] rounded-xl py-3.5 pl-11 pr-4 text-[13px] text-[#FAFAFA] font-mono focus:outline-none focus:border-[#FF4A00]/40 shadow-sm" placeholder="http://localhost:3001/sse" />
                         </div>
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-bold text-[#3F3F46] uppercase tracking-[0.2em]">Authorization Headers</label>
                         <textarea className="w-full h-24 p-4 bg-[#09090B] border border-[#18181B] rounded-xl text-[12px] text-[#FAFAFA] font-mono focus:outline-none focus:border-[#FF4A00]/40 resize-none shadow-sm" placeholder='{ "Authorization": "Bearer ..." }' />
                      </div>
                   </div>
                 ) : (
                   <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="space-y-3">
                         <label className="text-[10px] font-bold text-[#3F3F46] uppercase tracking-[0.2em]">Subprocess Runtime</label>
                         <div className="relative">
                            <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#3F3F46]" />
                            <input className="w-full bg-[#09090B] border border-[#18181B] rounded-xl py-3.5 pl-11 pr-4 text-[13px] text-[#FAFAFA] font-mono focus:outline-none focus:border-[#FF4A00]/40 shadow-sm" placeholder="npx" />
                         </div>
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-bold text-[#3F3F46] uppercase tracking-[0.2em]">Argument Vectors</label>
                         <input className="w-full bg-[#09090B] border border-[#18181B] rounded-xl py-3.5 px-4 text-[13px] text-[#FAFAFA] font-mono focus:outline-none focus:border-[#FF4A00]/40 shadow-sm" placeholder="@modelcontextprotocol/server-postgres" />
                      </div>
                   </div>
                 )}

                 <div className="p-5 bg-[#09090B] border border-[#18181B] rounded-2xl flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-[#10B981]/10 flex items-center justify-center shrink-0">
                       <ShieldCheck className="h-5 w-5 text-[#10B981]" />
                    </div>
                    <p className="text-[11px] text-[#52525B] leading-relaxed font-medium">
                       MCP servers operate in a **secure sandbox**. You will need to explicitly grant capability access after the infrastructure is initialized.
                    </p>
                 </div>
              </div>
           </div>
        </div>

        <div className="p-6 border-t border-[#18181B] bg-[#09090B]/50 shrink-0 flex items-center gap-3">
           <Button variant="outline" onClick={onClose} className="flex-1 border-[#18181B] text-[#A1A1AA] font-bold h-12 rounded-xl">Cancel</Button>
           <Button onClick={onClose} className="flex-[2] bg-[#FF4A00] hover:bg-[#E64300] font-bold h-12 rounded-xl shadow-lg shadow-[#FF4A00]/20">Initialize Server</Button>
        </div>
      </div>
    </Modal>
  );
}
