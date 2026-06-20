import { useState } from "react";
import { Modal } from "../shared/Modal";
import { Button } from "../shared/Button";
import { useKnowledgeBase } from "../../hooks/useStore";
import { cn } from "../../lib/utils";
import { Search, Database, Check, Plus, PlusCircle } from "lucide-react";

interface AddKBToAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeKbs: string[];
  onToggleKb: (kbId: string) => void;
  onAddNewSource?: () => void;
}

export function AddKBToAgentModal({ isOpen, onClose, activeKbs, onToggleKb, onAddNewSource }: AddKBToAgentModalProps) {
  const { knowledgeBases } = useKnowledgeBase();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredKbs = knowledgeBases.filter(kb => 
    kb.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    kb.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      dark={true}
      noPadding={false}
      title="Link Knowledge Source"
      className="max-w-2xl max-h-[70vh] border-[#18181B] bg-[#000]"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
           <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#3F3F46]" />
              <input 
                className="w-full bg-[#09090B] border border-[#18181B] rounded-lg py-2 pl-9 pr-4 text-[12px] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:outline-none focus:border-[#FF4A00]/40 transition-all font-medium"
                placeholder="Search collection name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
           <Button 
             variant="ghost" 
             size="sm" 
             onClick={onAddNewSource} 
             className="h-9 px-4 text-[11px] font-bold text-[#FF4A00] hover:bg-[#FF4A00]/10 border border-transparent hover:border-[#FF4A00]/20 rounded-lg group"
           >
              <PlusCircle className="h-3.5 w-3.5 mr-2 group-hover:rotate-90 transition-transform" /> Connect New
           </Button>
        </div>

        <div className="grid grid-cols-1 gap-2 overflow-y-auto max-h-[400px] custom-scrollbar pr-1">
          {filteredKbs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 opacity-20">
               <Database className="h-10 w-10 mb-4" />
               <p className="text-[13px] font-bold tracking-tight text-[#FAFAFA]">No active collections found</p>
            </div>
          ) : (
            filteredKbs.map(kb => {
              const isAdded = activeKbs.includes(kb.id);
              return (
                <div 
                  key={kb.id}
                  onClick={() => onToggleKb(kb.id)}
                  className={cn(
                    "p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group",
                    isAdded 
                      ? "bg-[#FF4A00]/5 border-[#FF4A00]/20 shadow-sm" 
                      : "bg-[#09090B] border-[#18181B] hover:border-[#27272A] hover:bg-[#121214]"
                  )}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={cn(
                      "h-9 w-9 rounded-lg flex items-center justify-center border transition-all",
                      isAdded 
                        ? "bg-[#FF4A00] border-[#FF4A00] text-white shadow-lg shadow-[#FF4A00]/20" 
                        : "bg-[#000] border-[#18181B] text-[#3F3F46] group-hover:text-[#FAFAFA] group-hover:border-[#3F3F46]"
                    )}>
                      {kb.type === 'notion' ? <span className="font-bold text-xs">N</span> : <Database className="h-4 w-4" />}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className={cn("text-[13px] font-bold tracking-tight truncate", isAdded ? "text-[#FAFAFA]" : "text-[#A1A1AA] group-hover:text-[#FAFAFA]")}>{kb.name}</span>
                      <span className="text-[11px] text-[#52525B] font-medium truncate mt-0.5">{kb.description}</span>
                    </div>
                  </div>
                  <Button 
                    variant={isAdded ? "primary" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-8 px-4 text-[11px] font-bold rounded-lg transition-all shrink-0",
                      isAdded ? "bg-[#FF4A00] hover:bg-[#E64300]" : "text-[#3F3F46] hover:text-[#FAFAFA] hover:bg-[#18181B]"
                    )}
                  >
                    {isAdded ? <><Check className="h-3.5 w-3.5 mr-2" /> Linked</> : <><Plus className="h-3.5 w-3.5 mr-2" /> Link</>}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}
