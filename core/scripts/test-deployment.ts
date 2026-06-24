import axios from "axios";
import path from "path";

async function testDeployment() {
  const zipPath = "c:/Users/HP VICTUS/Desktop/Agent_Team/tavily-search-1.0.0.zip";
  const agentId = "tavily-search";
  
  const payload = {
    config: {
      id: agentId,
      name: "Tavily Search Agent",
      description: "Autonomous researcher powered by Tavily",
      instruction: "You are an expert researcher. Use tools to find information.",
      provider: "openai",
      model: "gpt-4o-mini",
      tools: ["echo"], // Example tool
      maxIterations: 15,
      temperature: 0.5
    },
    zipPath: zipPath
  };

  console.log(`🚀 Testing native deployment for agent: ${agentId}...`);

  try {
    const response = await axios.post("http://localhost:4000/agents/deploy", payload);
    console.log("✅ API Response:", response.data);

    // Verify in registry
    console.log("🔍 Verifying registry...");
    const agentsResponse = await axios.get("http://localhost:4000/agents");
    const agents = agentsResponse.data;
    
    if (agents.includes(agentId)) {
      console.log("✨ Success! Agent found in registry.");
      
      // Get detail
      const detail = await axios.get(`http://localhost:4000/agents/${agentId}`);
      console.log("📜 Agent Config:", JSON.stringify(detail.data, null, 2));
    } else {
      console.error("❌ Error: Agent not found in registry after deployment.");
    }

  } catch (err: any) {
    console.error("❌ Test failed:", err.response?.data || err.message);
  }
}

testDeployment();
