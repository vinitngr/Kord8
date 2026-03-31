import { useState } from "react";
import { Modal } from "../shared/Modal";
import { Button } from "../shared/Button";
import { Server, Terminal, ShieldCheck } from "lucide-react";
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
      title="Install MCP Server"
      className="max-w-md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onClose}>Install Server</Button>
        </>
      }
    >
      <div className="space-y-6 text-left">
        <div className="space-y-3">
          <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider">Connection Protocol</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "sse", label: "SSE (Server-Sent Events)", icon: Server },
              { id: "stdio", label: "Stdio (Local Process)", icon: Terminal },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setMcpType(type.id as any)}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-lg border transition-all gap-2",
                  mcpType === type.id 
                    ? "border-[#111] bg-[#111]/5 text-[#111]" 
                    : "border-[#E5E5E5] bg-white text-[#999] hover:border-[#BBB]"
                )}
              >
                <type.icon className="h-4 w-4" />
                <span className="text-[10px] font-bold">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider">Server Name</label>
            <input className="w-full p-2.5 bg-white border border-[#E5E5E5] rounded-lg text-sm focus:outline-none" placeholder="e.g. Postgres MCP" />
          </div>

          {mcpType === "sse" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider">Endpoint URL</label>
                <input className="w-full p-2.5 bg-white border border-[#E5E5E5] rounded-lg text-sm font-mono focus:outline-none" placeholder="http://localhost:3001/sse" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider">Custom Headers (JSON)</label>
                <textarea className="w-full h-20 p-2.5 bg-white border border-[#E5E5E5] rounded-lg text-sm font-mono focus:outline-none resize-none" placeholder='{ "Authorization": "Bearer ..." }' />
              </div>
            </div>
          )}

          {mcpType === "stdio" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider">Executable Path</label>
                <input className="w-full p-2.5 bg-white border border-[#E5E5E5] rounded-lg text-sm font-mono focus:outline-none" placeholder="npx" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider">Working Directory / Folder</label>
                <input className="w-full p-2.5 bg-white border border-[#E5E5E5] rounded-lg text-sm focus:outline-none" placeholder="/path/to/server" />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider">Description</label>
            <textarea className="w-full h-20 p-2.5 bg-white border border-[#E5E5E5] rounded-lg text-sm focus:outline-none resize-none" placeholder="What tools does this server provide?" />
          </div>
        </div>

        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-3">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <p className="text-[10px] text-[#666] leading-relaxed">
            MCP Servers run in a secure sandbox. You may need to grant individual tool permissions after installation.
          </p>
        </div>
      </div>
    </Modal>
  );
}
