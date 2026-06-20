import { Database, Plus, ExternalLink, Trash2, Filter, Search } from "lucide-react";
import { Button } from "../shared/Button";
import type { KnowledgeBase } from "../../types";
import { Logo } from "../shared/Logo";
import { cn } from "../../lib/utils";

interface KBViewProps {
  kbs: KnowledgeBase[];
  onAdd: () => void;
}

export function KBView({ kbs, onAdd }: KBViewProps) {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090B] overflow-y-auto custom-scrollbar animate-in fade-in duration-500">
      <div className="px-10 py-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-3">
             <Database className="h-6 w-6 text-[#A1A1AA]" />
             Knowledge Base
          </h2>
          <Button 
            variant="primary" 
            size="sm" 
            className="h-10 px-5 rounded-lg bg-[#FF4A00] hover:bg-[#E64300] text-white font-semibold text-[14px] transition-colors flex items-center gap-2 shadow-sm"
            onClick={onAdd}
          >
            + Add Collection
          </Button>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div className="relative flex-1 max-w-[320px]">
             <Search className="absolute left-3.5 top-2.5 h-[18px] w-[18px] text-[#A1A1AA]" />
             <input 
               className="w-full h-10 bg-[#000000] border border-[#27272A] hover:border-[#3F3F46] rounded-lg pl-10 pr-4 text-sm focus:outline-none focus:border-[#FF4A00] transition-all text-[#FAFAFA] placeholder:text-[#A1A1AA] shadow-sm"
               placeholder="Search collections..."
             />
          </div>
          <button className="h-10 px-4 bg-[#000000] border border-[#27272A] rounded-lg text-[13px] font-medium flex items-center gap-2 hover:bg-[#18181B] transition-colors text-[#FAFAFA] shadow-sm">
            <Filter className="h-3.5 w-3.5" /> Filter <span className="text-[10px] ml-1 opacity-60">▼</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 bg-[#09090B] border-t border-l border-[#27272A] rounded-[16px] overflow-hidden shadow-sm">
          {kbs.length === 0 ? (
            <div className="col-span-full py-24 text-center border-r border-b border-[#27272A]">
               <p className="text-[#A1A1AA] text-[15px] font-medium">No collections defined yet.</p>
            </div>
          ) : (
            <>
              {kbs.map((kb) => (
                <div 
                  key={kb.id} 
                  className="group relative p-6 bg-[#09090B] hover:bg-[#121214] flex flex-col gap-4 cursor-pointer transition-colors border-r border-b border-[#27272A]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-8 w-8 flex items-center justify-center bg-[#000] rounded-lg border border-[#27272A] shrink-0 group-hover:border-[#3F3F46] transition-all">
                        {kb.service ? <Logo service={kb.service} size="xs" /> : <Database className="h-4 w-4 text-[#FF4A00]" />}
                      </div>
                      <h3 className="text-[15px] font-semibold text-[#FAFAFA] truncate group-hover:text-[#FF4A00] transition-colors leading-tight">
                        {kb.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                       <span className="px-2 py-1 rounded border border-[#27272A] text-[9px] uppercase font-bold tracking-wider text-[#A1A1AA] bg-[#000000]">
                         {kb.type}
                       </span>
                    </div>
                  </div>

                  <div className="flex-1 min-h-[44px]">
                     <p className="text-[12px] text-[#52525B] line-clamp-2 leading-relaxed font-normal group-hover:text-[#A1A1AA] transition-colors">
                       {kb.description || "Enterprise intelligence collection for high-performance agent logic."}
                     </p>
                  </div>

                  <div className="flex justify-between items-end mt-4 pt-4 border-t border-[#27272A]">
                    <div className="flex flex-col gap-1.5">
                       <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#3F3F46] font-bold uppercase tracking-widest">Items</span>
                          <span className="text-[11px] font-bold text-[#A1A1AA]">128 docs</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#3F3F46] font-bold uppercase tracking-widest">Status</span>
                          <span className="text-[11px] font-bold text-[#10B981]">Synced</span>
                       </div>
                    </div>

                    <div className="flex items-center gap-2">
                       <button className="h-8 w-8 rounded-md border border-[#27272A] flex items-center justify-center text-[#3F3F46] hover:text-[#EF4444] hover:bg-[#EF4444]/5 transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 className="h-3.5 w-3.5" />
                       </button>
                       <button className="h-8 w-8 rounded-md border border-[#27272A] flex items-center justify-center text-[#3F3F46] hover:text-[#FAFAFA] hover:bg-[#27272A] transition-all">
                          <ExternalLink className="h-3.5 w-3.5" />
                       </button>
                    </div>
                  </div>
                </div>
              ))}
              {/* Filler cells to maintain grid borders */}
              {Array.from({ length: (4 - (kbs.length % 4)) % 4 }).map((_, i) => (
                <div key={`filler-${i}`} className="hidden xl:block border-r border-b border-[#27272A] bg-[#09090B]/50" />
              ))}
              {Array.from({ length: (3 - (kbs.length % 3)) % 3 }).map((_, i) => (
                <div key={`filler-lg-${i}`} className="hidden lg:block xl:hidden border-r border-b border-[#27272A] bg-[#09090B]/50" />
              ))}
              {Array.from({ length: (2 - (kbs.length % 2)) % 2 }).map((_, i) => (
                <div key={`filler-md-${i}`} className="hidden md:block lg:hidden border-r border-b border-[#27272A] bg-[#09090B]/50" />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
