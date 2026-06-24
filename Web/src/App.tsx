import { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { Sidebar } from "./components/Sidebar";
import { HomeView } from "./components/MainContent/HomeView";
import { AgentEditor } from "./components/MainContent/AgentEditor";
import { ConnectorsView } from "./components/MainContent/ConnectorsView";
import { KBView } from "./components/MainContent/KBView";
import { PodsView } from "./components/MainContent/PodsView";
import { PodEditor } from "./components/MainContent/PodEditor.tsx";
import { StudioView } from "./components/MainContent/StudioView";
import { AssignTaskModal } from "./components/Sidebar/AssignTaskModal";
import { AddToolModal } from "./components/MainContent/AddToolModal";
import { AddSourceModal } from "./components/MainContent/AddSourceModal";
import { InstallMCPModal } from "./components/MainContent/InstallMCPModal";
import { CreatePodModal } from "./components/MainContent/CreatePodModal.tsx";
import { useAgents, useKnowledgeBase } from "./hooks/useStore";
import type { Agent } from "./types";
import "./App.css";

function App() {
  const { agents } = useAgents();
  const { knowledgeBases } = useKnowledgeBase();
  const navigate = useNavigate();
  
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isAddToolModalOpen, setIsAddToolModalOpen] = useState(false);
  const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);
  const [isInstallMCPModalOpen, setIsInstallMCPModalOpen] = useState(false);
  const [isCreatePodModalOpen, setIsCreatePodModalOpen] = useState(false);

  const selectedAgent = agents.find(a => a.id === selectedAgentId) || null;

  const handleSeeDetails = (agent: Agent) => {
    if (!agent || !agent.id) {
       navigate("/agents/new");
    } else {
       navigate(`/agents/${agent.id}`);
    }
  };

  const handleAssignTask = (agent: Agent) => {
    setSelectedAgentId(agent.id);
    setIsAssignModalOpen(true);
  };

  const handleCreateAgent = () => { navigate("/agents/new"); };
  const handleGoHome = () => { navigate("/"); };
  const handleGoConnectors = () => { navigate("/connectors"); };
  const handleGoKnowledge = () => { navigate("/knowledge"); };
  const handleGoPods = () => { navigate("/pods"); };
  const handleGoStudio = () => { navigate("/studio"); };

  return (
    <MainLayout>
      <Sidebar
        onGoHome={handleGoHome}
        onGoConnectors={handleGoConnectors}
        onGoKnowledge={handleGoKnowledge}
        onGoPods={handleGoPods}
        onGoStudio={handleGoStudio}
        onCreateAgent={handleCreateAgent}
      />
      
      {/* Main Content Area - flex-1 for full width expansion */}
      <main className="flex-1 h-full overflow-hidden bg-[#000] rounded-xl border border-[#18181B] relative">
        <Routes>
          <Route path="/" element={
            <HomeView agents={agents} onSeeDetails={handleSeeDetails} onAssignTask={handleAssignTask} />
          } />
          <Route path="/agents/new" element={<AgentEditor onClose={handleGoHome} />} />
          <Route path="/agents/:id" element={<AgentEditor onClose={handleGoHome} />} />
          <Route path="/connectors" element={<ConnectorsView onAdd={() => setIsAddToolModalOpen(true)} onAddMCP={() => setIsInstallMCPModalOpen(true)} />} />
          <Route path="/knowledge" element={<KBView kbs={knowledgeBases} onAdd={() => setIsAddSourceModalOpen(true)} />} />
          <Route path="/pods" element={<PodsView onAdd={() => setIsCreatePodModalOpen(true)} />} />
          <Route path="/pods/:id" element={<PodEditor onClose={handleGoPods} />} />
          <Route path="/studio" element={<StudioView />} />
        </Routes>
      </main>

      {/* Global Modals */}
      <AssignTaskModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        agent={selectedAgent}
      />
      
      <AddToolModal 
        isOpen={isAddToolModalOpen} 
        onClose={() => setIsAddToolModalOpen(false)} 
      />
      
      <AddSourceModal 
        isOpen={isAddSourceModalOpen} 
        onClose={() => setIsAddSourceModalOpen(false)} 
      />

      <InstallMCPModal
        isOpen={isInstallMCPModalOpen}
        onClose={() => setIsInstallMCPModalOpen(false)}
      />

      <CreatePodModal
        isOpen={isCreatePodModalOpen}
        onClose={() => setIsCreatePodModalOpen(false)}
      />
    </MainLayout>
  );
}

export default App;
