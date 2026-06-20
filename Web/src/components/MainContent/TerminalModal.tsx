import { X, Clipboard, Search, Terminal as TerminalIcon, Activity } from "lucide-react";
import { Button } from "../shared/Button";
import { Badge } from "../shared/Badge";
import { cn } from "../../lib/utils";
import { useState, useEffect, useRef, useMemo } from "react";
import { useSessionDetail } from "../../hooks/useStore";

interface TerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  instanceId: string | null;
  instanceName: string | null;
  agentId?: string | null;
}

export function TerminalModal({ isOpen, onClose, instanceId, instanceName, agentId }: TerminalModalProps) {
  const [activeTab, setActiveTab] = useState<"logs" | "raw">("logs");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { session, loading } = useSessionDetail(agentId || undefined, instanceId || undefined);

  const logs = useMemo(() => {
    if (!session) return [];
    
    const eventLogs = (session.events || []).map((ev: any) => {
      const time = new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      let content = ev.message;
      if (ev.data !== undefined && ev.data !== null) {
        const dataStr = typeof ev.data === 'object' ? JSON.stringify(ev.data) : String(ev.data);
        content += ` ${dataStr}`;
      }
      return { time, type: ev.type, content };
    });

    if (session.status === 'completed') {
      eventLogs.push({ 
        time: new Date(session.endedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
        type: 'SUCCESS', 
        content: 'Task completed successfully.' 
      });
    } else if (session.status === 'failed') {
      eventLogs.push({ 
        time: new Date(session.endedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
        type: 'ERROR', 
        content: session.error || 'Unknown error' 
      });
    }

    return eventLogs;
  }, [session]);

  const [searchText, setSearchText] = useState("");

  const filteredLogs = useMemo(() => {
    if (!searchText) return logs;
    return logs.filter(l => 
      l.content.toLowerCase().includes(searchText.toLowerCase()) || 
      l.type.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [logs, searchText]);

  useEffect(() => {
    if (scrollRef.current && activeTab === 'logs') {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredLogs, activeTab]);

  if (!isOpen) return null;

  const copyToClipboard = () => {
    if (session) {
      navigator.clipboard.writeText(JSON.stringify(session, null, 2));
      alert("Session JSON copied to clipboard!");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-[#09090B] w-full max-w-5xl h-[85vh] rounded-2xl border border-[#18181B] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Compact Header */}
        <div className="h-14 px-6 border-b border-[#18181B] flex items-center justify-between bg-[#000]">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-[#09090B] rounded-xl flex items-center justify-center border border-[#18181B]">
              <TerminalIcon className="h-4 w-4 text-[#FF4A00]" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold text-[#FAFAFA] tracking-tight">{instanceName}</h3>
                <Badge variant="outline" className="bg-[#09090B] border-[#18181B] text-[#3F3F46] font-mono text-[10px] py-0 px-2 select-all">
                  {instanceId}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-[#09090B] p-0.5 rounded-lg mr-4 border border-[#18181B]">
              <button 
                onClick={() => setActiveTab("logs")}
                className={cn(
                  "px-4 py-1 text-[10px] font-bold rounded-md transition-all",
                  activeTab === "logs" ? "bg-[#18181B] text-[#FAFAFA] shadow-lg" : "text-[#52525B] hover:text-[#A1A1AA]"
                )}
              >
                Logs
              </button>
              <button 
                onClick={() => setActiveTab("raw")}
                className={cn(
                  "px-4 py-1 text-[10px] font-bold rounded-md transition-all",
                  activeTab === "raw" ? "bg-[#18181B] text-[#FAFAFA] shadow-lg" : "text-[#52525B] hover:text-[#A1A1AA]"
                )}
              >
                Data
              </button>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-[#3F3F46] hover:text-[#FAFAFA] hover:bg-[#18181B]" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="h-12 px-6 border-b border-[#18181B] flex items-center justify-between bg-[#09090B]">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#3F3F46]" />
              <input 
                className="h-8 w-64 bg-[#000] border border-[#18181B] rounded-lg px-8 text-[11px] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:outline-none focus:border-[#FF4A00]/40 transition-colors"
                placeholder="Search telemetry..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            <span className="text-[10px] font-bold text-[#3F3F46] uppercase tracking-widest">
               {loading ? "Syncing..." : `${filteredLogs.length} events detected`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 border-[#18181B] text-[#A1A1AA] text-[10px] font-bold gap-1.5 bg-[#000] hover:bg-[#18181B] hover:text-[#FAFAFA] rounded-lg transition-all"
              onClick={copyToClipboard}
            >
              <Clipboard className="h-3.5 w-3.5 text-[#FF4A00]" /> Export JSON
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col bg-[#000]">
          {activeTab === "logs" ? (
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 bg-[#000] custom-scrollbar"
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-[#3F3F46]">
                   <div className="h-10 w-10 relative">
                     <div className="absolute inset-0 border-2 border-[#18181B] rounded-full" />
                     <div className="absolute inset-0 border-2 border-t-[#FF4A00] rounded-full animate-spin" />
                   </div>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-center mt-2">Connecting to Node...</p>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 opacity-20">
                  <TerminalIcon className="h-10 w-10 text-[#52525B]" />
                  <p className="text-[11px] font-bold text-[#FAFAFA] uppercase tracking-widest">No signals found</p>
                </div>
              ) : (
                <div className="space-y-3 max-w-5xl mx-auto pb-10">
                  {/* Task Instruction */}
                  {session?.instruction && (
                    <div className="bg-[#09090B] border border-[#18181B] rounded-xl p-4 mb-8 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-[2px] h-full bg-[#FF4A00]" />
                      <p className="text-[9px] font-bold text-[#3F3F46] uppercase tracking-widest mb-2">Primary Instruction</p>
                      <p className="text-[13px] font-medium text-[#FAFAFA] leading-relaxed italic">
                        "{session.instruction}"
                      </p>
                    </div>
                  )}

                  <div className="space-y-px border border-[#18181B] rounded-xl overflow-hidden bg-[#18181B]/30">
                    {filteredLogs.map((log, i) => {
                      const isSuccess = log.type === 'SUCCESS';
                      const isError = log.type === 'ERROR' || log.type.toUpperCase() === 'ERROR';
                      const isTool = log.type.toUpperCase().includes('TOOL');

                      return (
                        <div key={i} className={cn(
                          "flex gap-4 p-3.5 transition-all bg-[#000]/40 hover:bg-[#18181B]/40 group",
                          isSuccess ? "border-l-2 border-emerald-500/50 bg-emerald-500/5" : 
                          isError ? "border-l-2 border-red-500/50 bg-red-500/5" : ""
                        )}>
                          <div className="shrink-0 w-16 text-[10px] font-mono text-[#3F3F46] pt-1">
                            {log.time}
                          </div>
                          <div className="flex-1 space-y-1.5">
                            <div className="flex items-center gap-3">
                              <span className={cn(
                                "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                                isSuccess ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                isError ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                                isTool ? "bg-[#FF4A00]/10 text-[#FF4A00] border border-[#FF4A00]/20" : "bg-[#18181B] text-[#52525B]"
                              )}>
                                {log.type}
                              </span>
                              <div className="flex-1 h-px bg-[#18181B]/50" />
                            </div>
                            <p className={cn(
                              "text-[12px] leading-relaxed break-words font-medium",
                              isSuccess ? "text-emerald-50/80" : 
                              isError ? "text-red-50/80" : "text-[#A1A1AA] group-hover:text-[#FAFAFA]"
                            )}>
                              {log.content}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Final Output */}
                  {session?.result && (
                    <div className="mt-8 p-5 border border-[#18181B] rounded-xl bg-[#09090B] relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                         <Activity className="h-32 w-32 text-[#FF4A00]" />
                      </div>
                      <p className="text-[9px] font-bold text-[#FF4A00] uppercase tracking-widest mb-3">System Outcome</p>
                      <div className="text-[13px] font-bold text-[#FAFAFA] leading-relaxed whitespace-pre-wrap relative z-10">
                        {typeof session.result === 'object' ? JSON.stringify(session.result, null, 2) : session.result}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-hidden p-6 bg-[#000]">
              <div className="w-full h-full bg-[#09090B] border border-[#18181B] rounded-xl overflow-hidden shadow-sm flex flex-col">
                <div className="h-10 px-4 border-b border-[#18181B] flex items-center justify-between bg-[#000] text-[9px] font-bold text-[#3F3F46] uppercase tracking-widest">
                  session_manifest.json
                </div>
                <div className="flex-1 overflow-auto p-6 font-mono text-[11px] leading-relaxed text-[#52525B] custom-scrollbar">
                  <pre className="whitespace-pre-wrap select-text text-[#A1A1AA]">
                    {JSON.stringify(session, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
