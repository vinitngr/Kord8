import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "../shared/Modal";
import { Button } from "../shared/Button";
import { Logo } from "../shared/Logo";
import { useConnections } from "../../hooks/useStore";
import { cn } from "../../lib/utils";
import { 
  Globe, 
  FileText,
  Upload,
  ArrowRight,
  Cloud,
  Check,
  Hash
} from "lucide-react";
import { ConnectionForm } from "./ConnectionForm";

interface AddSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FlowStep = 'provider' | 'connect' | 'define' | 'name';

export function AddSourceModal({ isOpen, onClose }: AddSourceModalProps) {
  const { connections, saveConnection } = useConnections();
  const [step, setStep] = useState<FlowStep>('provider');
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [collectionName, setCollectionName] = useState("");

  const providers = [
    { id: 'file', label: 'Local Files', icon: FileText, type: 'standard' as const },
    { id: 'website', label: 'Web Crawler', icon: Globe, type: 'standard' as const },
    ...connections.filter(c => c.service !== 'core').map(c => ({ 
      id: c.service, 
      label: c.label, 
      icon: Cloud, 
      type: 'cloud' as const, 
      isConnected: c.isConnected 
    }))
  ];

  const currentService = connections.find(c => c.service === selectedProvider);

  const handleClose = () => {
    setStep('provider');
    setSelectedProvider(null);
    setCollectionName("");
    onClose();
  };

  const nextStep = () => {
     if (step === 'provider') {
        const p = providers.find(x => x.id === selectedProvider);
        if (p?.type === 'standard' || (p?.type === 'cloud' && p.isConnected)) setStep('define');
        else setStep('connect');
     } else if (step === 'connect') setStep('define');
     else if (step === 'define') setStep('name');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      dark={true}
      noPadding={false}
      title={step === 'provider' ? "New Knowledge" : step === 'connect' ? `Connect ${currentService?.label}` : step === 'define' ? "Configure Data" : "Finalize Connection"}
      className="max-w-xl border-[#18181B] bg-[#000]"
    >
      <AnimatePresence mode="wait">
        {step === 'provider' && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-4">
             <div className="grid grid-cols-2 gap-2">
                {providers.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProvider(p.id)}
                    className={cn(
                      "flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left group",
                      selectedProvider === p.id 
                        ? "bg-[#FF4A00]/5 border-[#FF4A00]/40 shadow-sm" 
                        : "bg-[#09090B] border-[#18181B] hover:border-[#27272A] hover:bg-[#121214]"
                    )}
                  >
                    <div className={cn(
                      "h-9 w-9 rounded-lg flex items-center justify-center transition-all",
                      selectedProvider === p.id ? "bg-[#FF4A00] text-white" : "bg-[#000] text-[#3F3F46] group-hover:text-[#A1A1AA]"
                    )}>
                       {p.type === 'standard' ? <p.icon className="h-4 w-4" /> : <Logo service={p.id} size="xs" />}
                    </div>
                    <div className="flex flex-col min-w-0">
                       <span className={cn("text-[13px] font-bold tracking-tight", selectedProvider === p.id ? "text-[#FAFAFA]" : "text-[#A1A1AA]")}>{p.label}</span>
                       <span className="text-[10px] text-[#3F3F46] font-medium uppercase tracking-widest">{p.type}</span>
                    </div>
                  </button>
                ))}
             </div>
             <Button 
               disabled={!selectedProvider} 
               onClick={nextStep} 
               className="w-full h-11 bg-[#FF4A00] hover:bg-[#E64300] font-bold rounded-xl mt-4"
             >
                Continue <ArrowRight className="h-4 w-4 ml-2" />
             </Button>
          </motion.div>
        )}

        {step === 'connect' && (
           <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6 py-4">
              <div className="p-6 bg-[#09090B] border border-[#18181B] rounded-xl">
                 <ConnectionForm connection={currentService!} onSuccess={nextStep} saveConnection={saveConnection} />
              </div>
           </motion.div>
        )}

        {step === 'define' && (
           <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
              {selectedProvider === 'file' ? (
                 <div className="w-full min-h-[120px] border-2 border-dashed border-[#18181B] rounded-xl flex flex-col items-center justify-center hover:bg-[#09090B] hover:border-[#27272A] transition-all cursor-pointer">
                    <Upload className="h-6 w-6 text-[#3F3F46] mb-3" />
                    <p className="text-[12px] font-bold text-[#A1A1AA]">Drop files to index</p>
                 </div>
              ) : selectedProvider === 'website' ? (
                 <div className="space-y-4">
                    <input className="w-full bg-[#09090B] border border-[#18181B] rounded-lg py-3 px-4 text-[13px] text-[#FAFAFA] focus:outline-none focus:border-[#FF4A00]/40" placeholder="https://docs.yoursite.com" />
                    <div className="p-4 bg-[#09090B] border border-[#18181B] rounded-xl flex items-center justify-between">
                       <span className="text-[12px] font-bold text-[#FAFAFA]">Crawl path depth</span>
                       <span className="text-[12px] font-mono text-[#3F3F46]">D3</span>
                    </div>
                 </div>
              ) : (
                 <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                    <div className="text-[10px] font-bold text-[#3F3F46] uppercase tracking-[0.2em] mb-4">Select {selectedProvider} data</div>
                    {[1,2,3,4].map(i => (
                       <div key={i} className="flex items-center justify-between p-3 bg-[#09090B] border border-[#18181B] rounded-xl group hover:border-[#27272A] cursor-pointer">
                          <div className="flex items-center gap-3">
                             <div className="h-7 w-7 bg-[#000] border border-[#18181B] rounded-lg flex items-center justify-center">
                                <Hash className="h-3.5 w-3.5 text-[#3F3F46]" />
                             </div>
                             <span className="text-[12px] font-bold text-[#A1A1AA] group-hover:text-[#FAFAFA]">Sample Channel {i}</span>
                          </div>
                          <div className="h-5 w-5 rounded-md border border-[#18181B] flex items-center justify-center group-hover:border-[#3F3F46]">
                             <Check className="h-3 w-3 text-transparent group-hover:text-[#3F3F46]" />
                          </div>
                       </div>
                    ))}
                 </div>
              )}
              <Button onClick={nextStep} className="w-full h-11 bg-[#FF4A00] hover:bg-[#E64300] font-bold rounded-xl mt-4">Next Step</Button>
           </motion.div>
        )}

        {step === 'name' && (
           <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
              <div className="space-y-4">
                 <label className="text-[11px] font-bold text-[#3F3F46] uppercase tracking-[0.2em]">Collection Name</label>
                 <input 
                   autoFocus
                   className="w-full bg-[#09090B] border border-[#18181B] rounded-lg py-3 px-4 text-[14px] text-[#FAFAFA] focus:outline-none focus:border-[#FF4A00]/40 font-bold" 
                   placeholder="e.g. Documentation, Team Slack" 
                   value={collectionName}
                   onChange={e => setCollectionName(e.target.value)}
                 />
                 <p className="text-[11px] text-[#52525B] leading-relaxed">This name will appear when linking sources to agents.</p>
              </div>
              <Button disabled={!collectionName} onClick={handleClose} className="w-full h-14 bg-[#FF4A00] hover:bg-[#E64300] font-bold rounded-xl text-[15px] shadow-lg shadow-[#FF4A00]/20">Save Collection</Button>
           </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
