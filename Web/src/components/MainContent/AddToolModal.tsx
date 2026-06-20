import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "../shared/Modal";
import { Logo } from "../shared/Logo";
import { useConnections } from "../../hooks/useStore";
import { Search, ChevronRight, Info } from "lucide-react";
import { ConnectionForm } from "./ConnectionForm";
import { Button } from "../shared/Button";

interface AddToolModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddToolModal({ isOpen, onClose }: AddToolModalProps) {
  const { connections, saveConnection } = useConnections();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const currentService = connections.find(c => c.service === selectedService);
  const disconnected = connections.filter(c => 
    !c.isConnected && 
    c.service !== 'core' && 
    c.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClose = () => {
    setSelectedService(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      dark={true}
      noPadding={true}
      title={selectedService ? `Connect ${currentService?.label}` : "Integrations Library"}
      className="max-w-2xl border-[#18181B] bg-[#000] overflow-hidden"
    >
      <div className="flex flex-col h-[500px]">
        <AnimatePresence mode="wait">
          {!selectedService ? (
             <motion.div 
               key="list"
               initial={{ opacity: 0, y: 10 }} 
               animate={{ opacity: 1, y: 0 }} 
               exit={{ opacity: 0, y: -10 }} 
               className="flex flex-col h-full overflow-hidden"
             >
                {/* Search Header */}
                <div className="p-6 border-b border-[#18181B] bg-[#09090B]/50 shrink-0">
                   <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#3F3F46]" />
                      <input 
                        className="w-full bg-[#000] border border-[#18181B] rounded-xl py-3 pl-11 pr-4 text-[13px] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:outline-none focus:border-[#FF4A00]/40 transition-all font-bold tracking-tight"
                        placeholder="Search for Notion, Slack, GitHub..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                      />
                   </div>
                </div>

                {/* Grid Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                   <div className="grid grid-cols-2 gap-3">
                      {disconnected.map(conn => (
                        <button 
                           key={conn.service} 
                           onClick={() => setSelectedService(conn.service)}
                           className="flex items-center justify-between p-4 bg-[#09090B] border border-[#18181B] rounded-xl hover:border-[#27272A] hover:bg-[#121214] transition-all group text-left shadow-sm"
                        >
                           <div className="flex items-center gap-4 min-w-0">
                              <div className="h-10 w-10 shrink-0 rounded-lg bg-[#000] border border-[#18181B] flex items-center justify-center transition-all group-hover:border-[#3F3F46]">
                                <Logo service={conn.service} size="xs" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                 <p className="text-[14px] font-bold text-[#FAFAFA] truncate tracking-tight">{conn.label}</p>
                                 <p className="text-[9px] text-[#3F3F46] font-bold uppercase tracking-widest truncate">Integration</p>
                              </div>
                           </div>
                           <ChevronRight className="h-4 w-4 text-[#18181B] group-hover:text-[#3F3F46] transition-colors shrink-0" />
                        </button>
                      ))}
                      {disconnected.length === 0 && (
                        <div className="col-span-2 py-20 flex flex-col items-center justify-center text-center opacity-30">
                           <Plug className="h-8 w-8 mb-4 text-[#3F3F46]" />
                           <p className="text-[13px] font-bold text-[#FAFAFA]">No integrations found</p>
                        </div>
                      )}
                   </div>
                </div>

                {/* Footer Info */}
                <div className="p-5 border-t border-[#18181B] bg-[#09090B]/30 shrink-0 flex items-center gap-3">
                   <div className="h-6 w-6 rounded-full bg-[#18181B] flex items-center justify-center">
                      <Info className="h-3 w-3 text-[#3F3F46]" />
                   </div>
                   <p className="text-[11px] text-[#3F3F46] font-medium leading-tight">
                      Manage existing connections in the standalone **Connectors** view.
                   </p>
                </div>
             </motion.div>
          ) : (
             <motion.div 
               key="form"
               initial={{ opacity: 0, x: 20 }} 
               animate={{ opacity: 1, x: 0 }} 
               exit={{ opacity: 0, x: -20 }} 
               className="flex flex-col h-full"
             >
                <div className="p-8 flex flex-col gap-8 flex-1 overflow-y-auto">
                   <div className="flex items-center gap-5 p-5 bg-[#09090B] border border-[#18181B] rounded-2xl">
                      <div className="h-14 w-14 bg-[#000] border border-[#18181B] rounded-xl flex items-center justify-center shadow-lg">
                        <Logo service={selectedService} size="sm" />
                      </div>
                      <div className="flex-1">
                         <h3 className="text-[16px] font-bold text-[#FAFAFA] tracking-tight">{currentService?.label}</h3>
                         <p className="text-[12px] text-[#52525B] leading-relaxed font-medium mt-1">{currentService?.description}</p>
                      </div>
                   </div>
                   
                   <div className="space-y-6">
                      <ConnectionForm connection={currentService!} onSuccess={handleClose} saveConnection={saveConnection} />
                   </div>
                </div>

                <div className="p-6 border-t border-[#18181B] bg-[#09090B]/50 shrink-0 flex items-center gap-3">
                   <Button 
                     onClick={() => setSelectedService(null)} 
                     variant="outline"
                     className="flex-1 border-[#18181B] text-[#A1A1AA] font-bold h-11"
                   >
                     Go Back
                   </Button>
                </div>
             </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}

function Plug({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 2v8"/><path d="m16 4-1 1"/><path d="m17 9 1 1"/><path d="M7 10h10a2 2 0 0 1 2 2v1a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-1a2 2 0 0 1 2-2Z"/><path d="M9 20v2"/><path d="M15 20v2"/><path d="M10 16v4"/><path d="M14 16v4"/>
    </svg>
  );
}
