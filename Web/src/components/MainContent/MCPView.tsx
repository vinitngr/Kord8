import { ShieldCheck, Link2 } from "lucide-react";
import { Button } from "../shared/Button";

interface MCPViewProps {
  onAdd: () => void;
}

export function MCPView({ onAdd }: MCPViewProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#111]">MCP Infrastructure</h1>
        <Button variant="outline" size="sm" className="gap-2" onClick={onAdd}>
          <Link2 className="h-3.5 w-3.5" />
          Install MCP Server
        </Button>
      </div>

      <div className="bg-white border border-dashed border-[#E5E5E5] rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-4">
        <div className="h-16 w-16 bg-[#FAFAFA] rounded-2xl flex items-center justify-center">
          <ShieldCheck className="h-8 w-8 text-[#CCC]" />
        </div>
        <div className="max-w-sm space-y-2">
          <h3 className="text-base font-bold text-[#111]">No MCP Servers configured</h3>
          <p className="text-sm text-[#999]">Model Context Protocol allows your agents to access local tools securely. Connect your first server to get started.</p>
        </div>
        <Button variant="primary" onClick={onAdd}>Get Started with MCP</Button>
      </div>
    </div>
  );
}
