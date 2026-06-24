import { ShieldCheck, Link2 } from "lucide-react";
import { Button } from "../shared/Button";

interface MCPViewProps {
  onAdd: () => void;
}

export function MCPView({ onAdd }: MCPViewProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#FAFAFA]">MCP Infrastructure</h1>
        <Button variant="outline" size="sm" className="gap-2 bg-[#000000] border-[#27272A] text-[#FAFAFA] hover:bg-[#18181B] shadow-sm rounded-lg h-9" onClick={onAdd}>
          <Link2 className="h-3.5 w-3.5" />
          Install MCP Server
        </Button>
      </div>

      <div className="bg-[#0E0E10] border border-[#27272A] rounded-[16px] p-16 flex flex-col items-center justify-center text-center space-y-5 shadow-sm">
        <div className="h-16 w-16 bg-[#000000] border border-[#27272A] rounded-2xl flex items-center justify-center shadow-inner">
          <ShieldCheck className="h-8 w-8 text-[#A1A1AA]" />
        </div>
        <div className="max-w-md space-y-2">
          <h3 className="text-[16px] font-bold text-[#FAFAFA]">No MCP Servers configured</h3>
          <p className="text-[13px] text-[#A1A1AA] leading-relaxed">Model Context Protocol allows your agents to access local tools securely. Connect your first server to give them local context.</p>
        </div>
        <Button variant="primary" className="bg-[#FF4A00] hover:bg-[#E64300] border-[#FF4A00] mt-2 shadow-sm" onClick={onAdd}>Get Started with MCP</Button>
      </div>
    </div>
  );
}
