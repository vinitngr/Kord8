import { useState } from "react";
import { Zap, X, Clock, Webhook, GitBranch, Terminal } from "lucide-react";
import { Button } from "../shared/Button";

interface TriggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (triggerType: string, config: any) => void;
  triggerSchemas: any[];
}

export function TriggerModal({ isOpen, onClose, onSave, triggerSchemas }: TriggerModalProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [config, setConfig] = useState<any>({});
  
  // Close handler to reset state
  const handleClose = () => {
    setSelectedType(null);
    setConfig({});
    onClose();
  };

  if (!isOpen) return null;

  // Mock icons for extended schemas
  const getIcon = (type: string) => {
    switch (type) {
      case "cron": return Clock;
      case "webhook": return Webhook;
      case "github": return GitBranch;
      case "notion": return Terminal; // Mock
      case "google_sheets": return Terminal; // Mock
      default: return Zap;
    }
  };

  const schema = selectedType ? triggerSchemas.find(s => s.type === selectedType) : null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-[8px] z-[200] flex items-center justify-center animate-in fade-in duration-200">
      <div className="bg-[#09090B] border border-[#18181B] rounded-xl w-full max-w-[600px] shadow-2xl overflow-hidden flex flex-col h-[70vh] md:h-auto md:max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#18181B] bg-[#0E0E10]">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[#FF4A00]/10 border border-[#FF4A00]/20 flex items-center justify-center">
              <Zap className="h-4 w-4 text-[#FF4A00]" />
            </div>
            <div>
              <h2 className="text-[14px] font-bold text-[#FAFAFA]">
                {selectedType ? `Configure ${selectedType}` : "Triggers"}
              </h2>
              <p className="text-[11px] text-[#A1A1AA] font-medium mt-0.5">
                {selectedType ? schema?.schema?.description : "Automation events for this agent."}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors p-1.5 rounded-lg hover:bg-[#18181B]">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {!selectedType ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {triggerSchemas.map(t => {
                  const TIcon = getIcon(t.type);
                  return (
                    <button
                      key={t.type}
                      onClick={() => {
                         setSelectedType(t.type);
                         const defaults: any = {};
                         t.schema?.fields?.forEach((f: any) => {
                           if (f.default !== undefined) defaults[f.name] = f.default;
                         });
                         setConfig(defaults);
                      }}
                      className="flex items-start gap-3 p-3 bg-[#09090B] border border-[#18181B] rounded-xl hover:bg-[#121214] hover:border-[#27272A] transition-all text-left group"
                    >
                      <div className="p-2 rounded-lg bg-[#000] border border-[#18181B] group-hover:border-[#FF4A00]/40 transition-colors">
                        <TIcon className="h-4 w-4 text-[#3F3F46] group-hover:text-[#FF4A00]" />
                      </div>
                      <div>
                        <div className="text-[12px] font-bold text-[#FAFAFA] capitalize">{t.type}</div>
                        <div className="text-[10px] text-[#52525B] font-medium line-clamp-1 mt-0.5">
                          {t.schema?.description || `Set up a ${t.type} event.`}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-5 animate-in slide-in-from-right-4 duration-200">
              {schema?.schema?.fields?.map((field: any) => (
                <div key={field.name} className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#3F3F46] uppercase tracking-wider">{field.label} {field.required && <span className="text-[#EF4444]">*</span>}</label>
                  
                  {field.type === 'select' ? (
                    <select
                      className="w-full px-3 py-2 bg-[#000] border border-[#18181B] rounded-lg text-[13px] font-medium text-[#FAFAFA] focus:outline-none focus:border-[#FF4A00]/40 appearance-none shadow-inner"
                      value={config[field.name] || field.default || ""}
                      onChange={e => setConfig({ ...config, [field.name]: e.target.value })}
                    >
                      {!field.required && <option value="">Select option...</option>}
                      {field.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <input 
                      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                      className="w-full px-3 py-2 bg-[#000] border border-[#18181B] rounded-lg text-[13px] font-medium text-[#FAFAFA] placeholder:text-[#3F3F46] focus:outline-none focus:border-[#FF4A00]/40 shadow-inner"
                      placeholder={field.placeholder || "Enter value..."}
                      value={config[field.name] || ''}
                      onChange={e => {
                        const val = field.type === 'number' ? parseFloat(e.target.value) : e.target.value;
                        setConfig({ ...config, [field.name]: val });
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#18181B] bg-[#0E0E10] flex justify-between items-center rounded-b-xl">
           {selectedType ? (
             <Button variant="ghost" size="sm" onClick={() => setSelectedType(null)} className="h-9 px-4 text-[11px] font-bold text-[#3F3F46] hover:text-[#FAFAFA]">Back</Button>
           ) : <div />}
           
           <div className="flex gap-2">
             <Button variant="outline" size="sm" onClick={handleClose} className="h-9 px-4 text-[11px] font-bold bg-[#000] border-[#18181B] text-[#A1A1AA] hover:text-[#FAFAFA] rounded-lg">Cancel</Button>
             {selectedType && (
               <Button 
                 variant="primary" 
                 size="sm" 
                 className="h-9 px-6 text-[11px] font-bold bg-[#FF4A00] hover:bg-[#E64300] border-[#FF4A00] text-white rounded-lg"
                 onClick={() => {
                   onSave(selectedType, config);
                   handleClose();
                 }}
               >
                 Save Trigger
               </Button>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
