import { useState } from "react";
import { MainLayout } from "./layouts/MainLayout";
import { Sidebar } from "./components/Sidebar";
import { MainArea } from "./components/MainContent";
import { AssignTaskModal } from "./components/Sidebar/AssignTaskModal";
import { CreateAgentModal } from "./components/Sidebar/CreateAgentModal";
import { AgentDetailsModal } from "./components/Sidebar/AgentDetailsModal";
import { useAgents } from "./hooks/useStore";
import type { Agent } from "./types";
import "./App.css";

function App() {
  const { agents, refresh: refreshAgents } = useAgents();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const selectedAgent = agents.find(a => a.id === selectedAgentId) || null;

  const handleSeeDetails = (agent: Agent) => {
    setSelectedAgentId(agent.id);
    setIsDetailsModalOpen(true);
  };

  const handleAssignTask = (agent: Agent) => {
    setSelectedAgentId(agent.id);
    setIsAssignModalOpen(true);
  };

  const handleCreateAgent = () => {
    setIsCreateModalOpen(true);
  };

  return (
    <MainLayout>
      <Sidebar
        agents={agents}
        onSeeDetails={handleSeeDetails}
        onAssignTask={handleAssignTask}
        onCreateAgent={handleCreateAgent}
      />
      <MainArea />

      <CreateAgentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <AssignTaskModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        agent={selectedAgent}
      />

      <AgentDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        agent={selectedAgent}
        onRefresh={refreshAgents}
      />
    </MainLayout>
  );
}

export default App;
