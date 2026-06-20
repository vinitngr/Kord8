import { useLocation } from "react-router-dom";
import { Plus, LayoutDashboard, Plug, Database, Boxes, Sparkles } from "lucide-react";
import { cn } from "../../lib/utils";

interface SidebarProps {
  onGoHome: () => void;
  onGoConnectors: () => void;
  onGoKnowledge: () => void;
  onGoPods: () => void;
  onGoStudio: () => void;
  onCreateAgent: () => void;
}

export function Sidebar({ onGoHome, onCreateAgent, onGoConnectors, onGoKnowledge, onGoPods, onGoStudio }: SidebarProps) {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isConnectors = location.pathname === "/connectors";
  const isKnowledge = location.pathname === "/knowledge";
  const isPods = location.pathname === "/pods";
  const isStudio = location.pathname === "/studio";

  return (
    <aside 
      className="w-[260px] h-full bg-[#09090B] rounded-[16px] border border-[#27272A] text-[#FAFAFA] flex flex-col transition-all overflow-hidden shadow-2xl relative font-sans"
    >
      {/* Header / Logo */}
      <div className="pt-8 px-8 pb-5 flex items-center gap-2.5">
        <div className="flex flex-wrap w-[22px] h-[22px] gap-[2px]">
           <div className="w-[10px] h-[10px] bg-[#FF4A00] rounded-[2px]" />
           <div className="w-[10px] h-[10px] bg-[#FF4A00]/80 rounded-[2px]" />
           <div className="w-[10px] h-[10px] bg-[#FF4A00]/80 rounded-[2px]" />
           <div className="w-[10px] h-[10px] bg-[#FF4A00]/80 rounded-[2px]" />
        </div>
        <h1 className="text-[20px] font-semibold tracking-normal text-white mb-0.5">
           Kord8
        </h1>
      </div>

      <div className="px-5 mt-2 mb-6">
        <button 
          className="w-full flex items-center justify-center gap-2 bg-[#18181B] text-[#FAFAFA] hover:bg-[#27272A] hover:text-white rounded-lg text-[14px] h-[40px] transition-colors border border-[#27272A]"
          onClick={onCreateAgent}
        >
          <Plus className="h-[18px] w-[18px] opacity-70" strokeWidth={1.5} />
          New agent
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        <button
          onClick={onGoStudio}
          className={cn(
            "w-full flex items-center gap-3.5 px-4 py-2.5 rounded-[10px] text-[14px] transition-colors focus:outline-none",
            isStudio 
              ? "bg-gradient-to-r from-[#FF4A00]/10 to-[#8B5CF6]/10 text-[#FF4A00] font-medium" 
              : "text-[#A1A1AA] font-normal hover:bg-[#18181B] hover:text-[#FAFAFA]"
          )}
        >
          <Sparkles className="h-[18px] w-[18px] opacity-90" strokeWidth={1.5} />
          Studio
        </button>

        <div className="h-px bg-[#18181B] mx-2 my-2" />

        <button
          onClick={onGoHome}
          className={cn(
            "w-full flex items-center gap-3.5 px-4 py-2.5 rounded-[10px] text-[14px] transition-colors focus:outline-none",
            isHome 
              ? "bg-[#FF4A00]/10 text-[#FF4A00] font-medium" 
              : "text-[#A1A1AA] font-normal hover:bg-[#18181B] hover:text-[#FAFAFA]"
          )}
        >
          <LayoutDashboard className="h-[18px] w-[18px] opacity-90" strokeWidth={1.5} />
          My agents
        </button>
        <button
          onClick={onGoPods}
          className={cn(
            "w-full flex items-center gap-3.5 px-4 py-2.5 rounded-[10px] text-[14px] transition-colors focus:outline-none",
            isPods 
              ? "bg-[#FF4A00]/10 text-[#FF4A00] font-medium" 
              : "text-[#A1A1AA] font-normal hover:bg-[#18181B] hover:text-[#FAFAFA]"
          )}
        >
          <Boxes className="h-[18px] w-[18px] opacity-90" strokeWidth={1.5} />
          Agent Pods
        </button>
        <button
          onClick={onGoConnectors}
          className={cn(
            "w-full flex items-center gap-3.5 px-4 py-2.5 rounded-[10px] text-[14px] transition-colors focus:outline-none",
            isConnectors 
              ? "bg-[#FF4A00]/10 text-[#FF4A00] font-medium" 
              : "text-[#A1A1AA] font-normal hover:bg-[#18181B] hover:text-[#FAFAFA]"
          )}
        >
          <Plug className="h-[18px] w-[18px] opacity-90" strokeWidth={1.5} />
          Connectors
        </button>
        <button
          onClick={onGoKnowledge}
          className={cn(
            "w-full flex items-center gap-3.5 px-4 py-2.5 rounded-[10px] text-[14px] transition-colors focus:outline-none",
            isKnowledge 
              ? "bg-[#FF4A00]/10 text-[#FF4A00] font-medium" 
              : "text-[#A1A1AA] font-normal hover:bg-[#18181B] hover:text-[#FAFAFA]"
          )}
        >
          <Database className="h-[18px] w-[18px] opacity-90" strokeWidth={1.5} />
          Knowledge Base
        </button>
      </nav>

    </aside>
  );
}
