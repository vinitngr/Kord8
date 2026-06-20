import { useState, useMemo } from "react";
import { Badge } from "../shared/Badge";
import { cn } from "../../lib/utils";
import { TerminalModal } from "./TerminalModal";
import { Play, Clock, CheckCircle2, TrendingUp, ChevronRight, ShieldCheck, Zap } from "lucide-react";
import { useAllSessions, useAgents, useTaskQueue } from "../../hooks/useStore";
import { motion } from "framer-motion";

export function InspectView() {
  const [activeSubTab, setActiveSubTab] = useState<"active" | "queued" | "ended">("active");
  const [selectedTask, setSelectedTask] = useState<{ id: string, name: string, agentId: string } | null>(null);
  
  const { agents } = useAgents();
  const { sessions, loading: sessionsLoading } = useAllSessions();
  const { queue, loading: queueLoading } = useTaskQueue();

  const loading = sessionsLoading || queueLoading;

  const getAgentName = (agentId: string | undefined) => {
    if (!agentId) return "Unknown";
    return agents.find(a => a.id === agentId)?.name || agentId;
  };

  const activeInstances = useMemo(() => {
    return sessions
      .filter(s => s.status === 'running')
      .map(s => ({
        id: s.id,
        agentId: s.agentId || 'unknown',
        name: getAgentName(s.agentId),
        status: 'Active',
        time: s.timestamp,
        instruction: s.summary
      }));
  }, [sessions, agents]);

  const queuedInstances = useMemo(() => {
    return queue.map((item, index) => ({
      id: `q_${index}`,
      agentId: item.agentId || 'queue',
      name: getAgentName(item.agentId),
      type: item.status === 'processing' ? 'active' : 'upcoming',
      instruction: item.id,
      time: item.createdAt ? new Date(item.createdAt).toLocaleTimeString() : 'Pending',
      triggerType: 'Manual'
    }));
  }, [queue, agents]);

  const endedInstances = useMemo(() => {
    return sessions
      .filter(s => s.status !== 'running')
      .map(s => ({
        id: s.id,
        agentId: s.agentId || 'history',
        name: getAgentName(s.agentId),
        status: s.status === 'completed' ? 'Success' : 'Error',
        time: s.timestamp,
        color: s.status === 'completed' ? 'text-emerald-500' : 'text-red-500',
        result: s.summary || (s.status === 'completed' ? 'Finished successfully' : 'Execution failed')
      }));
  }, [sessions, agents]);

  const subTabs = [
    { id: "active", label: "Active Sessions", count: activeInstances.length, icon: Play },
    { id: "queued", label: "Pending Queue", count: queuedInstances.length, icon: Clock },
    { id: "ended", label: "Execution History", count: endedInstances.length, icon: CheckCircle2 },
  ];

  // Mock Graph Data: 24 points, mostly green (success), few red (error), one big error spike
  const graphData = [
     { s: 40, e: 0 }, { s: 55, e: 2 }, { s: 30, e: 0 }, { s: 70, e: 5 }, 
     { s: 50, e: 0 }, { s: 85, e: 3 }, { s: 65, e: 0 }, { s: 80, e: 0 },
     { s: 45, e: 45 }, { s: 60, e: 0 }, { s: 90, e: 2 }, { s: 75, e: 0 },
     { s: 40, e: 0 }, { s: 55, e: 4 }, { s: 35, e: 0 }, { s: 75, e: 0 }, 
     { s: 95, e: 0 }, { s: 65, e: 0 }, { s: 45, e: 6 }, { s: 30, e: 0 },
     { s: 50, e: 0 }, { s: 80, e: 0 }, { s: 85, e: 2 }, { s: 95, e: 0 }
  ];

  const maxPoint = useMemo(() => {
    const max = Math.max(...graphData.map(d => d.s + d.e));
    return max > 0 ? max : 100;
  }, [graphData]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left pb-10">
      
      {/* Metrics Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-[20px] font-bold text-[#FAFAFA] flex items-center gap-3 tracking-tight">
            Activity Intelligence
          </h1>
          <p className="text-[12px] text-[#3F3F46] font-medium mt-1">Real-time telemetry and execution performance.</p>
        </div>
        <div className="flex items-center gap-6">
           <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold text-[#3F3F46] uppercase tracking-widest">Success Rate</span>
              <span className="text-[14px] font-bold text-emerald-500">98.4%</span>
           </div>
           <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold text-[#3F3F46] uppercase tracking-widest">Avg Runtime</span>
              <span className="text-[14px] font-bold text-[#FAFAFA]">3.2s</span>
           </div>
           <div className="h-8 w-[1px] bg-[#18181B] mx-2" />
           <div className="flex items-center gap-2 bg-[#09090B] border border-[#18181B] px-3 py-1.5 rounded-lg">
              <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Engine Online</span>
           </div>
        </div>
      </div>

      {/* Analytics Graph */}
      <div className="bg-[#09090B] border border-[#18181B] rounded-xl p-6 shadow-sm overflow-hidden group">
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-[#FF4A00]" />
              <h3 className="text-[12px] font-bold text-[#FAFAFA] uppercase tracking-wider">Execution Frequency</h3>
           </div>
           <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                 <div className="h-2 w-2 rounded-full bg-emerald-500/80" />
                 <span className="text-[10px] font-bold text-[#3F3F46] uppercase">Success</span>
              </div>
              <div className="flex items-center gap-1.5">
                 <div className="h-2 w-2 rounded-full bg-red-500/80" />
                 <span className="text-[10px] font-bold text-[#3F3F46] uppercase">Error</span>
              </div>
           </div>
        </div>
        
        <div className="h-[140px] w-full flex items-end gap-[3px]">
           {graphData.map((d, i) => (
             <div key={i} className="flex-1 flex flex-col-reverse items-center group/bar relative h-full">
                {/* Success Portion */}
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.s / maxPoint) * 100}%` }}
                  transition={{ delay: i * 0.015, duration: 0.6, ease: "easeOut" }}
                  className="w-full bg-emerald-500/30 group-hover/bar:bg-emerald-500/50 transition-colors rounded-t-[2px]"
                />
                {/* Error Portion */}
                {d.e > 0 && (
                   <motion.div 
                     initial={{ height: 0 }}
                     animate={{ height: `${(d.e / maxPoint) * 100}%` }}
                     transition={{ delay: i * 0.015 + 0.1, duration: 0.6, ease: "easeOut" }}
                     className="w-full bg-red-500/50 group-hover/bar:bg-red-500/70 transition-colors rounded-t-[2px] mb-[1px]"
                   />
                )}
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#FAFAFA] text-[#000] text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-all pointer-events-none z-20 whitespace-nowrap shadow-xl">
                   {d.s} sessions, {d.e} errors
                </div>
             </div>
           ))}
        </div>
        <div className="flex justify-between mt-4">
           {['00:00', '06:00', '12:00', '18:00', '23:59'].map(t => (
             <span key={t} className="text-[9px] font-bold text-[#3F3F46]">{t}</span>
           ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-10 border-b border-[#18181B]">
        {subTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={cn(
              "pb-4 text-[12px] font-bold transition-all relative flex items-center gap-2.5",
              activeSubTab === tab.id ? "text-[#FF4A00]" : "text-[#3F3F46] hover:text-[#A1A1AA]"
            )}
          >
            <tab.icon className={cn("h-3.5 w-3.5", activeSubTab === tab.id ? "text-[#FF4A00]" : "text-[#18181B]")} />
            {tab.label}
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-md border font-bold",
              activeSubTab === tab.id ? "border-[#FF4A00]/20 bg-[#FF4A00]/5" : "border-[#18181B] bg-[#09090B]"
            )}>
              {tab.count}
            </span>
            {activeSubTab === tab.id && <motion.div layoutId="activeSubTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FF4A00]" />}
          </button>
        ))}
      </div>

      {/* List Content */}
      <div className="min-h-[400px]">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
            <div className="h-8 w-8 rounded-full border-2 border-[#FF4A00] border-t-transparent animate-spin mb-4" />
            <p className="text-xs font-bold font-mono">SYNCING DATA...</p>
          </div>
        )}
        
        {activeSubTab === "active" && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
            {activeInstances.map(instance => (
              <div 
                key={instance.id} 
                className="group bg-[#09090B] border border-[#18181B] rounded-xl p-4 space-y-4 hover:border-[#27272A] transition-all cursor-pointer relative shadow-sm"
                onClick={() => setSelectedTask({ id: instance.id, name: instance.name, agentId: instance.agentId })}
              >
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-bold text-emerald-500 uppercase">Live Execution</span>
                   </div>
                   <Badge variant="outline" className="text-[9px] font-bold text-[#3F3F46] border-[#18181B] bg-[#000]">RUN_{instance.id.slice(-4)}</Badge>
                </div>
                <h3 className="text-[14px] font-bold text-[#FAFAFA] tracking-tight">{instance.name}</h3>
                <div className="flex items-center justify-between pt-4 border-t border-[#18181B]">
                   <span className="text-[10px] text-[#3F3F46] font-medium">{new Date(instance.time).toLocaleTimeString()}</span>
                   <ChevronRight className="h-4 w-4 text-[#18181B] group-hover:text-[#FAFAFA] group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
            {activeInstances.length === 0 && <EmptyState message="No active runs." icon={Play} />}
          </div>
        )}

        {/* History View */}
        {activeSubTab === "ended" && !loading && (
          <div className="bg-[#09090B] border border-[#18181B] rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#000]/50 text-[10px] text-[#3F3F46] uppercase font-bold tracking-widest border-b border-[#18181B]">
                  <th className="px-5 py-4">Session</th>
                  <th className="px-5 py-4">Agent</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#18181B]">
                {endedInstances.map(instance => (
                  <tr 
                    key={instance.id} 
                    className="group hover:bg-[#121214] transition-colors cursor-pointer"
                    onClick={() => setSelectedTask({ id: instance.id, name: instance.name, agentId: instance.agentId })}
                  >
                    <td className="px-5 py-4">
                      <span className="text-[11px] font-bold text-[#3F3F46] group-hover:text-[#FAFAFA]">#{instance.id.slice(-6)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                         <div className="h-6 w-6 rounded bg-[#FF4A00]/10 border border-[#FF4A00]/20 flex items-center justify-center">
                            <Zap className="h-3 w-3 text-[#FF4A00]" />
                         </div>
                         <span className="text-[12px] font-bold text-[#FAFAFA]">{instance.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn(
                        "text-[10px] font-bold uppercase",
                        instance.status === "Success" ? "text-emerald-500" : "text-red-500"
                      )}>
                        {instance.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-[11px] text-[#3F3F46] group-hover:text-[#A1A1AA]">
                       {new Date(instance.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {endedInstances.length === 0 && <EmptyState message="History clear." icon={CheckCircle2} />}
          </div>
        )}

        {/* Queued View */}
        {activeSubTab === "queued" && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
            {queuedInstances.map(instance => (
              <div key={instance.id} className="bg-[#09090B] border border-[#18181B] rounded-xl p-4 space-y-4 shadow-sm relative overflow-hidden group hover:border-[#27272A] transition-all">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <Clock className={cn("h-3 w-3", instance.type === 'active' ? "text-emerald-500" : "text-[#3F3F46]")} />
                      <span className={cn("text-[10px] font-bold uppercase", instance.type === 'active' ? "text-emerald-500" : "text-[#3F3F46]")}>
                         {instance.type === 'active' ? 'Syncing' : 'Queued'}
                      </span>
                   </div>
                   <span className="text-[10px] font-bold text-[#3F3F46] font-mono">{instance.time}</span>
                </div>
                <h3 className="text-[14px] font-bold text-[#FAFAFA]">{instance.name}</h3>
                <div className="pt-3 border-t border-[#18181B] flex items-center justify-between">
                   <span className="text-[9px] font-bold text-[#18181B] uppercase tracking-widest">Entry ID: {instance.instruction}</span>
                   <ShieldCheck className="h-3.5 w-3.5 text-[#18181B]" />
                </div>
              </div>
            ))}
            {queuedInstances.length === 0 && <EmptyState message="Queue empty." icon={Clock} />}
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

function EmptyState({ message, icon: Icon }: { message: string, icon?: any }) {
  return (
    <div className="col-span-full h-48 border border-dashed border-[#18181B] rounded-xl flex flex-col items-center justify-center opacity-30">
       <Icon className="h-6 w-6 mb-3 text-[#3F3F46]" />
       <p className="text-[12px] font-bold text-[#FAFAFA]">{message}</p>
    </div>
  );
}
