import { useState } from "react";
import { Modal } from "../shared/Modal";
import { Button } from "../shared/Button";
import { Logo } from "../shared/Logo";
import { useConnections } from "../../hooks/useStore";
import { cn } from "../../lib/utils";
import { Search, Check, Cpu, Plus } from "lucide-react";

interface AddToolToAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTools: string[];
  onToggleTool: (toolName: string) => void;
}

export function AddToolToAgentModal({ isOpen, onClose, activeTools, onToggleTool }: AddToolToAgentModalProps) {
  const { connections } = useConnections();
  const connected = connections.filter(c => c.isConnected);
  
  const [selectedService, setSelectedService] = useState<string>(connected[0]?.service || "");
  const [searchQuery, setSearchQuery] = useState("");

  const currentService = connected.find(c => c.service === selectedService);
  const tools = currentService?.tools.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      dark={true}
      noPadding={true}
      className="max-w-4xl max-h-[80vh] border-[#18181B] bg-[#000]"
    >
      <div className="flex h-[600px] divide-x divide-[#18181B]">
        {/* Sidebar */}
        <div className="w-[220px] bg-[#09090B] flex flex-col shrink-0">
          <div className="p-6 border-b border-[#18181B]">
            <h2 className="text-[14px] font-bold text-[#FAFAFA]">Connectors</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
            {connected.map(service => (
              <button
                key={service.service}
                onClick={() => setSelectedService(service.service)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all text-[12px] font-medium",
                  selectedService === service.service 
                    ? "bg-[#18181B] text-[#FAFAFA]" 
                    : "text-[#71717A] hover:bg-[#121214] hover:text-[#A1A1AA]"
                )}
              >
                <Logo service={service.service} size="xs" className={selectedService === service.service ? "" : "grayscale opacity-50"} />
                <span className="truncate">{service.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col bg-[#000]">
          <div className="p-6 border-b border-[#18181B] flex items-center justify-between gap-4">
             <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#3F3F46]" />
                <input 
                  className="w-full bg-[#09090B] border border-[#18181B] rounded-lg py-2 pl-9 pr-4 text-[12px] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:outline-none focus:border-[#FF4A00]/40 transition-all font-medium"
                  placeholder={`Search ${currentService?.label} tools...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             <div className="text-[10px] text-[#3F3F46] font-bold uppercase tracking-wider">{tools.length} Tools Available</div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-[#000] custom-scrollbar">
             <div className="grid grid-cols-1 gap-2">
                {tools.length === 0 ? (
                   <div className="flex flex-col items-center justify-center py-20 opacity-20">
                      <Cpu className="h-10 w-10 mb-4" />
                      <p className="text-[13px] font-bold">No tools found</p>
                   </div>
                ) : (
                  tools.map(tool => {
                    const isAdded = activeTools.includes(tool.name);
                    return (
                      <div 
                        key={tool.name}
                        onClick={() => onToggleTool(tool.name)}
                        className={cn(
                          "group p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between",
                          isAdded 
                            ? "bg-[#FF4A00]/5 border-[#FF4A00]/20" 
                            : "bg-[#09090B] border-[#18181B] hover:border-[#27272A] hover:bg-[#121214]"
                        )}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={cn(
                            "h-9 w-9 rounded-lg flex items-center justify-center transition-all",
                            isAdded ? "bg-[#FF4A00] text-white shadow-lg shadow-[#FF4A00]/20" : "bg-[#000] text-[#3F3F46] group-hover:text-[#FAFAFA]"
                          )}>
                            <Cpu className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className={cn("text-[13px] font-bold tracking-tight truncate", isAdded ? "text-[#FAFAFA]" : "text-[#A1A1AA] group-hover:text-[#FAFAFA]")}>
                              {tool.name.replace(`${currentService?.service}_`, '')}
                            </span>
                            <span className="text-[11px] text-[#52525B] truncate mt-0.5 font-medium">{tool.description}</span>
                          </div>
                        </div>
                        <Button 
                          variant={isAdded ? "primary" : "ghost"}
                          size="sm"
                          className={cn(
                            "h-8 px-4 text-[11px] font-bold rounded-lg transition-all",
                            isAdded ? "bg-[#FF4A00] hover:bg-[#E64300]" : "text-[#3F3F46] hover:text-[#FAFAFA] hover:bg-[#18181B]"
                          )}
                        >
                          {isAdded ? <><Check className="h-3.5 w-3.5 mr-2" /> Linked</> : <><Plus className="h-3.5 w-3.5 mr-2" /> Add</>}
                        </Button>
                      </div>
                    );
                  })
                )}
             </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
