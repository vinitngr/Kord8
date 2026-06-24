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
      dark
      footer={
        status === 'success' ? null : (
          <div className="flex gap-3 w-full">
            <Button variant="ghost" onClick={handleClose} disabled={loading} className="flex-1 text-[#52525B] hover:text-[#FAFAFA] hover:bg-[#18181B]">Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading || !message} className="flex-[2] bg-[#FF4A00] hover:bg-[#E64300] text-white shadow-lg shadow-[#FF4A00]/10">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Sending...</> : "Send Task"}
            </Button>
          </div>
        )
      }
    >
      <div className="space-y-6">
        {status === 'success' ? (
          <div className="py-12 text-center animate-in zoom-in duration-300">
            <div className="h-16 w-16 bg-[#10B981]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#10B981]/20">
              <CheckCircle2 className="h-8 w-8 text-[#10B981]" />
            </div>
            <h3 className="text-lg font-bold text-[#FAFAFA]">Task Assigned!</h3>
            <p className="text-sm text-[#52525B] mt-2">
              {executionType === "immediate" 
                ? "The agent has started working on your request." 
                : `Task scheduled for ${new Date(scheduledTime).toLocaleString()}`}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#52525B] uppercase tracking-wider">Mission Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={loading}
                className="w-full h-32 p-4 bg-[#000] border border-[#18181B] rounded-xl text-[14px] text-[#FAFAFA] focus:outline-none focus:border-[#FF4A00]/40 placeholder:text-[#27272A] resize-none disabled:opacity-50 transition-all font-medium"
                placeholder="Describe the task you want the agent to perform..."
              />
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-bold text-[#52525B] uppercase tracking-wider">Execution Timing</label>
              <div className="flex bg-[#000] p-1 rounded-xl border border-[#18181B]">
                <button
                  disabled={loading}
                  onClick={() => setExecutionType("immediate")}
                  className={cn(
                    "flex-1 py-2 text-[12px] font-bold rounded-lg transition-all",
                    executionType === "immediate" 
                      ? "bg-[#18181B] text-[#FAFAFA] shadow-sm" 
                      : "text-[#52525B] hover:text-[#A1A1AA]"
                  )}
                >
                  Run Now
                </button>
                <button
                  disabled={loading}
                  onClick={() => setExecutionType("scheduled")}
                  className={cn(
                    "flex-1 py-2 text-[12px] font-bold rounded-lg transition-all",
                    executionType === "scheduled" 
                      ? "bg-[#18181B] text-[#FAFAFA] shadow-sm" 
                      : "text-[#52525B] hover:text-[#A1A1AA]"
                  )}
                >
                  Schedule
                </button>
              </div>

              {executionType === "scheduled" && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <input
                    type="datetime-local"
                    value={scheduledTime}
                    disabled={loading}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full p-3 bg-[#000] border border-[#18181B] rounded-xl text-sm text-[#FAFAFA] focus:outline-none focus:border-[#FF4A00]/40 accent-[#FF4A00]"
                  />
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="flex items-start gap-3 p-4 bg-red-500/5 border border-red-500/20 rounded-xl animate-in fade-in">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-red-400 font-medium leading-relaxed">{errorMsg}</p>
              </div>
            )}

            <div className="p-4 bg-[#09090B] rounded-xl border border-[#18181B] flex gap-3">
              <div className="h-2 w-2 rounded-full bg-[#FF4A00]/20 animate-pulse mt-1.5 shrink-0" />
              <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                {executionType === "immediate" 
                  ? "Standard Operation: The agent will initialize a runtime instance and begin processing immediately."
                  : "Queued Operation: The mission parameters will be stored and triggered at the specific time signature."}
              </p>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
