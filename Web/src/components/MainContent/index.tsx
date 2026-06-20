import { HomeView } from "./HomeView";
import { AgentEditor } from "./AgentEditor";
import { useAgents } from "../../hooks/useStore";
import type { Agent } from "../../types";

interface MainAreaProps {
  currentView: "home" | "create" | "edit";
  agentId?: string | null;
  onGoHome: () => void;
  onSeeDetails: (agent: Agent) => void;
  onAssignTask: (agent: Agent) => void;
}

export function MainArea({ currentView, agentId, onGoHome, onSeeDetails, onAssignTask }: MainAreaProps) {
  const { agents } = useAgents();

  if (currentView === "create" || currentView === "edit") {
    return <AgentEditor agentId={agentId} onClose={onGoHome} />;
  }

  // Fallback to home view
  return (
    <HomeView 
      agents={agents} 
      onSeeDetails={onSeeDetails}
      onAssignTask={onAssignTask}
    />
  );
}
