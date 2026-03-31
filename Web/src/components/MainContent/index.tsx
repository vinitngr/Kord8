import { useState } from "react";
import { Search, Activity, Cpu, Database, ShieldCheck } from "lucide-react";
import { Button } from "../shared/Button";
import { cn } from "../../lib/utils";
import { useKnowledgeBase } from "../../hooks/useStore";
import { AddToolModal } from "./AddToolModal";
import { AddSourceModal } from "./AddSourceModal";
import { InstallMCPModal } from "./InstallMCPModal";

import { InspectView } from "./InspectView";
import { ToolsView } from "./ToolsView";
import { KBView } from "./KBView";
import { MCPView } from "./MCPView";

type TabType = "inspect" | "tools" | "kb" | "mcp";

export function MainArea() {
  const [activeTab, setActiveTab] = useState<TabType>("inspect");
  const { knowledgeBases } = useKnowledgeBase();

  const [isToolModalOpen, setIsToolModalOpen] = useState(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isMCPModalOpen, setIsMCPModalOpen] = useState(false);

  const tabs = [
    { id: "inspect", label: "Inspect", icon: Activity },
    { id: "tools", label: "Tools", icon: Cpu },
    { id: "kb", label: "Knowledge Base", icon: Database },
    { id: "mcp", label: "MCP", icon: ShieldCheck },
  ];

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-[#FAFAFA]">
      {/* Top Navigation */}
      <header className="h-14 border-b border-[#E5E5E5] bg-white px-6 flex items-center justify-between">
        <div className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={cn(
                "flex items-center gap-2 text-sm font-medium transition-colors relative h-14",
                activeTab === tab.id ? "text-[#111]" : "text-[#999] hover:text-[#666]"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#111]" />}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#BBB]" />
            <input 
              className="h-9 w-64 bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg pl-9 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-[#111] transition-all"
              placeholder="Search or jump to..."
            />
          </div>
          <Button variant="primary" size="sm" className="h-9">
            Quick Action
          </Button>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-[95%] mx-auto">
          {activeTab === "inspect" && <InspectView />}
          {activeTab === "tools" && <ToolsView onAdd={() => setIsToolModalOpen(true)} />}
          {activeTab === "kb" && <KBView kbs={knowledgeBases} onAdd={() => setIsSourceModalOpen(true)} />}
          {activeTab === "mcp" && <MCPView onAdd={() => setIsMCPModalOpen(true)} />}
        </div>
      </div>

      <AddToolModal isOpen={isToolModalOpen} onClose={() => setIsToolModalOpen(false)} />
      <AddSourceModal isOpen={isSourceModalOpen} onClose={() => setIsSourceModalOpen(false)} />
      <InstallMCPModal isOpen={isMCPModalOpen} onClose={() => setIsMCPModalOpen(false)} />
    </main>
  );
}
