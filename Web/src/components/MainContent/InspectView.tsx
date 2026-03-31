import { useState, useMemo } from "react";
import { Badge } from "../shared/Badge";
import { cn } from "../../lib/utils";
import { TerminalModal } from "./TerminalModal";
import { Play, Clock, CheckCircle2, AlertCircle, Calendar, Timer } from "lucide-react";
import { useAllSessions, useAgents, useTaskQueue } from "../../hooks/useStore";

export function InspectView() {
  const [activeSubTab, setActiveSubTab] = useState<"active" | "queued" | "ended">("active");
  const [selectedTask, setSelectedTask] = useState<{ id: string, name: string, agentId: string } | null>(null);
  
  const { agents } = useAgents();
  const { sessions, loading: sessionsLoading } = useAllSessions();
  const { queue, loading: queueLoading } = useTaskQueue();

  const loading = sessionsLoading || queueLoading;

  const getAgentName = (agentId: string) => {
    return agents.find(a => a.id === agentId)?.name || agentId;
  };

  const activeInstances = useMemo(() => {
    return sessions
      .filter(s => s.status === 'running')
      .map(s => ({
        id: s.id,
        agentId: s.agentId,
        name: getAgentName(s.agentId),
        status: 'Active',
        time: s.timestamp,
        instruction: s.summary
      }));
  }, [sessions, agents]);

  const queuedInstances = useMemo(() => {
    return queue.map((item, index) => ({
      id: `q_${index}`,
      agentId: item.agentId,
      name: getAgentName(item.agentId),
      type: item.type, // 'queued' or 'upcoming'
      instruction: item.instruction,
      time: item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Waiting for slot',
      triggerType: item.triggerType
    }));
  }, [queue, agents]);

  const endedInstances = useMemo(() => {
    return sessions
      .filter(s => s.status !== 'running')
      .map(s => ({
        id: s.id,
        agentId: s.agentId,
        name: getAgentName(s.agentId),
        status: s.status === 'completed' ? 'Success' : 'Error',
        time: s.timestamp,
        color: s.status === 'completed' ? 'text-emerald-500' : 'text-red-500',
        result: s.summary || (s.status === 'completed' ? 'Finished successfully' : 'Execution failed')
      }));
  }, [sessions, agents]);

  const subTabs = [
    { id: "active", label: "Active", count: activeInstances.length, icon: Play },
    { id: "queued", label: "Queue", count: queuedInstances.length, icon: Clock },
    { id: "ended", label: "Completed", count: endedInstances.length, icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#111]">Task Inspector</h1>
        <div className="flex items-center gap-2">
           <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
           <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Worker Engine Live</span>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-8 border-b border-[#F0F0F0]">
        {subTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={cn(
              "pb-4 text-[11px] font-bold uppercase tracking-widest transition-all relative flex items-center gap-2",
              activeSubTab === tab.id ? "text-[#111]" : "text-[#AAA] hover:text-[#666]"
            )}
          >
            <tab.icon className={cn("h-3.5 w-3.5", activeSubTab === tab.id ? "text-[#111]" : "text-[#CCC]")} />
            {tab.label}
            <span className={cn(
              "text-[10px] ml-1 font-mono",
              activeSubTab === tab.id ? "text-[#111]" : "text-[#AAA]"
            )}>
              ({tab.count})
            </span>
            {activeSubTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#111]" />}
          </button>
        ))}
      </div>

      <div className="min-h-[500px]">
        {loading && <div className="text-center py-10 text-xs text-[#AAA]">Loading sessions...</div>}
        
        {activeSubTab === "active" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in duration-200">
            {activeInstances.map(instance => (
              <div 
                key={instance.id} 
                className="group bg-white border border-[#E5E5E5] rounded-xl p-5 space-y-4 hover:border-[#111] hover:shadow-xl transition-all duration-300 cursor-pointer relative"
                onClick={() => setSelectedTask({ id: instance.id, name: instance.name, agentId: instance.agentId })}
              >
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="font-mono text-[9px] bg-[#F5F5F5] group-hover:bg-[#111] group-hover:text-white transition-colors">
                    RID-{instance.id.split('_')[1]?.slice(-6) || instance.id.slice(-6)}
                  </Badge>
                  <span className="text-[10px] text-[#BBB] font-medium tracking-tighter">{instance.time}</span>
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#111] group-hover:translate-x-1 transition-transform">{instance.name}</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1 w-1 bg-emerald-500 rounded-full" />
                    <p className="text-[11px] text-[#666] font-medium">{instance.status}</p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#AAA]">Click to Inspect Live</span>
                  <div className="h-6 w-6 rounded-full bg-[#FAFAFA] flex items-center justify-center group-hover:bg-[#111] transition-colors">
                    <Play className="h-2.5 w-2.5 text-[#CCC] group-hover:text-white" />
                  </div>
                </div>
              </div>
            ))}
            {!loading && activeInstances.length === 0 && <EmptyState message="No active tasks" />}
          </div>
        )}

        {activeSubTab === "queued" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in duration-200">
            {queuedInstances.map(instance => (
              <div key={instance.id} className={cn(
                "bg-white border rounded-xl p-5 space-y-4 shadow-sm transition-all",
                instance.type === 'upcoming' ? "border-amber-100 bg-amber-50/20" : "border-[#E5E5E5]"
              )}>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[9px] border-[#EEE] text-[#AAA]">
                    {instance.type === 'upcoming' ? 'SCHEDULED' : 'QUEUED'}
                  </Badge>
                  <div className="flex items-center gap-1.5">
                    {instance.type === 'upcoming' ? <Calendar className="h-3 w-3 text-amber-500" /> : <Timer className="h-3 w-3 text-[#BBB]" />}
                    <span className="text-[10px] text-[#999] font-medium">{instance.time}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-[#111]">{instance.name}</h3>
                  <p className="text-[11px] text-[#666] line-clamp-2 italic">"{instance.instruction}"</p>
                </div>
                {instance.triggerType && (
                   <div className="pt-2 border-t border-dashed border-[#F0F0F0]">
                      <span className="text-[9px] font-bold text-[#AAA] uppercase tracking-widest">Trigger: {instance.triggerType}</span>
                   </div>
                )}
              </div>
            ))}
            {!loading && queuedInstances.length === 0 && <EmptyState message="Queue is empty" />}
          </div>
        )}

        {activeSubTab === "ended" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in duration-200">
            {endedInstances.map(instance => (
              <div 
                key={instance.id} 
                className="bg-white border border-[#F0F0F0] rounded-xl p-5 space-y-4 hover:border-[#E5E5E5] transition-all group cursor-pointer"
                onClick={() => setSelectedTask({ id: instance.id, name: instance.name, agentId: instance.agentId })}
              >
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[9px] bg-[#FAFAFA]">RID-{instance.id.split('_')[1]?.slice(-6) || instance.id.slice(-6)}</Badge>
                  <span className="text-[10px] text-[#BBB]">{instance.time}</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#444]">{instance.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {instance.status === "Success" ? (
                       <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    ) : (
                       <AlertCircle className="h-3 w-3 text-red-500" />
                    )}
                    <span className={cn("text-[10px] font-bold uppercase tracking-tight", instance.color)}>{instance.status}</span>
                  </div>
                </div>
                <div className="text-[11px] text-[#999] p-2 bg-[#FAFAFA] rounded-lg border border-[#F5F5F5] italic font-medium line-clamp-2">
                  {instance.result}
                </div>
              </div>
            ))}
            {!loading && endedInstances.length === 0 && <EmptyState message="No history" />}
          </div>
        )}
      </div>

      <TerminalModal 
        isOpen={!!selectedTask} 
        onClose={() => setSelectedTask(null)} 
        instanceId={selectedTask?.id || null}
        instanceName={selectedTask?.name || null}
        agentId={selectedTask?.agentId || null}
      />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="col-span-full h-48 border border-dashed border-[#E5E5E5] rounded-xl flex items-center justify-center bg-white shadow-sm">
      <div className="text-center">
        <p className="text-xs text-[#AAA] font-medium italic">{message}</p>
      </div>
    </div>
  );
}
