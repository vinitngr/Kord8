import { X, Clipboard, Search, Terminal as TerminalIcon, RefreshCw } from "lucide-react";
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
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-4xl h-[80vh] rounded-2xl border border-[#DDD] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Compact Header */}
        <div className="h-14 px-6 border-b border-[#F5F5F5] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-[#FAFAFA] rounded-xl flex items-center justify-center border border-[#EEE]">
              <TerminalIcon className="h-4 w-4 text-[#111]" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold text-[#111]">{instanceName}</h3>
                <Badge variant="outline" className="bg-[#F9F9FB] border-[#EEE] text-[#999] font-mono text-[10px] py-0 px-2 select-all">
                  {instanceId}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-[#F5F5F5] p-0.5 rounded-lg mr-4 border border-[#EEE]">
              <button 
                onClick={() => setActiveTab("logs")}
                className={cn(
                  "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                  activeTab === "logs" ? "bg-white text-[#111] shadow-sm" : "text-[#777] hover:text-[#111]"
                )}
              >
                Logs
              </button>
              <button 
                onClick={() => setActiveTab("raw")}
                className={cn(
                  "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                  activeTab === "raw" ? "bg-white text-[#111] shadow-sm" : "text-[#777] hover:text-[#111]"
                )}
              >
                Data
              </button>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-[#999] hover:text-[#111] hover:bg-[#F5F5F5]" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="h-12 px-6 border-b border-[#F5F5F5] flex items-center justify-between bg-[#FCFCFC]">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#AAA]" />
              <input 
                className="h-8 w-48 bg-white border border-[#EEE] rounded-lg px-8 text-[11px] text-[#111] placeholder:text-[#BBB] focus:outline-none focus:ring-1 focus:ring-[#111]/10"
                placeholder="Search logs..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            <span className="text-[10px] font-medium text-[#BBB]">
               {loading ? "Syncing..." : `${filteredLogs.length} events`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 border-[#EEE] text-[#666] text-[10px] font-bold gap-1.5 bg-white hover:bg-[#FAFAFA] rounded-lg"
              onClick={copyToClipboard}
            >
              <Clipboard className="h-3.5 w-3.5" /> Copy
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab === "logs" ? (
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 bg-white"
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-[#BBB]">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 opacity-30">
                  <TerminalIcon className="h-10 w-10" />
                  <p className="text-xs font-medium text-[#111]">No events found</p>
                </div>
              ) : (
                <div className="space-y-4 max-w-4xl mx-auto pb-10">
                  {/* Task Instruction */}
                  {session?.instruction && (
                    <div className="bg-[#FAFAFA] border border-[#EEE] rounded-xl p-4 mb-6">
                      <p className="text-[9px] font-bold text-[#999] uppercase tracking-widest mb-1">Instruction</p>
                      <p className="text-[12px] font-medium text-[#444] leading-relaxed italic">
                        "{session.instruction}"
                      </p>
                    </div>
                  )}

                  {filteredLogs.map((log, i) => {
                    const isSuccess = log.type === 'SUCCESS';
                    const isError = log.type === 'ERROR' || log.type.toUpperCase() === 'ERROR';
                    const isTool = log.type.toUpperCase().includes('TOOL');

                    return (
                      <div key={i} className={cn(
                        "flex gap-4 rounded-xl p-3 transition-all border border-transparent",
                        isSuccess ? "bg-emerald-50/50 border-emerald-100/50" : 
                        isError ? "bg-red-50/50 border-red-100/50" : "hover:bg-[#FAFAFA] hover:border-[#EEE]"
                      )}>
                        <div className="shrink-0 w-16 text-[10px] font-mono text-[#BBB] pt-1">
                          {log.time}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-[9px] font-bold uppercase tracking-wider",
                              isSuccess ? "text-emerald-600" :
                              isError ? "text-red-600" :
                              isTool ? "text-blue-600" : "text-[#999]"
                            )}>
                              {log.type}
                            </span>
                            <div className="flex-1 h-px bg-[#F5F5F5]" />
                          </div>
                          <p className={cn(
                            "text-[12px] leading-relaxed break-words font-medium",
                            isSuccess || isError ? "text-[#111]" : "text-[#444]"
                          )}>
                            {log.content}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {/* Final Output */}
                  {session?.result && (
                    <div className="mt-8 p-4 border border-[#EEE] rounded-xl bg-[#FAFAFA]">
                      <p className="text-[9px] font-bold text-[#999] uppercase tracking-widest mb-2">Outcome</p>
                      <div className="text-[12px] font-bold text-[#111] leading-relaxed whitespace-pre-wrap">
                        {typeof session.result === 'object' ? JSON.stringify(session.result, null, 2) : session.result}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-hidden p-6 bg-[#FAFAFA]">
              <div className="w-full h-full bg-white border border-[#EEE] rounded-xl overflow-hidden shadow-sm flex flex-col">
                <div className="h-10 px-4 border-b border-[#EEE] flex items-center justify-between bg-white text-[9px] font-bold text-[#999] uppercase tracking-widest">
                  session.json
                </div>
                <div className="flex-1 overflow-auto p-6 font-mono text-[11px] leading-relaxed text-[#555]">
                  <pre className="whitespace-pre-wrap select-text">
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
