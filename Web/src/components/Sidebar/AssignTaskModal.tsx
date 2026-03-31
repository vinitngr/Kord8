import { useState } from "react";
import { Modal } from "../shared/Modal";
import { Button } from "../shared/Button";
import { cn } from "../../lib/utils";
import { useAgents, updateAgentConfig } from "../../hooks/useStore";
import type { Agent } from "../../types";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface AssignTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent | null;
}

export function AssignTaskModal({ isOpen, onClose, agent }: AssignTaskModalProps) {
  const [message, setMessage] = useState("");
  const [executionType, setExecutionType] = useState<"immediate" | "scheduled">("immediate");
  const [scheduledTime, setScheduledTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState("");

  const { runTask, refresh } = useAgents();

  const handleSubmit = async () => {
    if (!agent || !message) return;
    
    setLoading(true);
    setStatus('idle');
    setErrorMsg("");

    try {
      if (executionType === "immediate") {
        await runTask(agent.id, message);
        setStatus('success');
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        if (!scheduledTime) {
          setErrorMsg("Please select a time");
          setLoading(false);
          return;
        }

        // Add a new scheduled trigger to the agent
        const [date, time] = scheduledTime.split('T');
        const newTrigger = {
          type: 'scheduled',
          config: {
            date,
            time,
            instruction: message
          }
        };

        const updatedTriggers = [...(agent.triggers || []), newTrigger];
        const result = await updateAgentConfig(agent.id, { triggers: updatedTriggers });
        
        if (result.success) {
          setStatus('success');
          refresh(); // Refresh agents list to get updated config
          setTimeout(() => {
            handleClose();
          }, 1500);
        } else {
          throw new Error(result.error || "Failed to schedule task");
        }
      }
    } catch (err: any) {
      console.error("Task assignment failed:", err);
      setStatus('error');
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset state after animation
    setTimeout(() => {
      setMessage("");
      setExecutionType("immediate");
      setScheduledTime("");
      setStatus('idle');
      setErrorMsg("");
    }, 300);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Assign Task to ${agent?.name}`}
      className="max-w-md"
      footer={
        status === 'success' ? null : (
          <>
            <Button variant="outline" onClick={handleClose} disabled={loading}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading || !message}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Sending...</> : "Send Task"}
            </Button>
          </>
        )
      }
    >
      <div className="space-y-6">
        {status === 'success' ? (
          <div className="py-12 text-center animate-in zoom-in duration-300">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[#111]">Task Assigned!</h3>
            <p className="text-sm text-[#999] mt-1">
              {executionType === "immediate" 
                ? "The agent has started working on your request." 
                : `Task scheduled for ${new Date(scheduledTime).toLocaleString()}`}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={loading}
                className="w-full h-32 p-3 bg-white border border-[#E5E5E5] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#111] placeholder:text-[#BBB] resize-none disabled:opacity-50"
                placeholder="Describe the task you want the agent to perform..."
              />
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider">Execution Timing</label>
              <div className="flex gap-2">
                <button
                  disabled={loading}
                  onClick={() => setExecutionType("immediate")}
                  className={cn(
                    "flex-1 p-2.5 text-xs font-medium rounded-lg border transition-all",
                    executionType === "immediate" 
                      ? "bg-[#111] text-white border-[#111]" 
                      : "bg-white text-[#666] border-[#E5E5E5] hover:border-[#BBB]"
                  )}
                >
                  Run Immediately
                </button>
                <button
                  disabled={loading}
                  onClick={() => setExecutionType("scheduled")}
                  className={cn(
                    "flex-1 p-2.5 text-xs font-medium rounded-lg border transition-all",
                    executionType === "scheduled" 
                      ? "bg-[#111] text-white border-[#111]" 
                      : "bg-white text-[#666] border-[#E5E5E5] hover:border-[#BBB]"
                  )}
                >
                  Schedule for later
                </button>
              </div>

              {executionType === "scheduled" && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <input
                    type="datetime-local"
                    value={scheduledTime}
                    disabled={loading}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full p-2.5 bg-white border border-[#E5E5E5] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#111]"
                  />
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg animate-in fade-in">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-600 font-medium">{errorMsg}</p>
              </div>
            )}

            <p className="text-[10px] text-[#999] bg-[#FAFAFA] p-3 rounded-lg border border-[#F0F0F0]">
              {executionType === "immediate" 
                ? "The agent will spin up a new instance to process this request immediately."
                : "The task will be queued and executed at the specified time."}
            </p>
          </>
        )}
      </div>
    </Modal>
  );
}
