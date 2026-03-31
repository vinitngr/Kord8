import { AgentTeam } from "./src/agent/AgentTeam";
import { LLMPlugin } from "./src/plugin/LLMPlugin";
import { HttpInterfacePlugin } from "./src/interface/HttpInterfacePlugin";
import { TriggerPlugin } from "./src/plugin/TriggerPlugin";
import path from "path";
import fs from "fs";

async function run() {
  const engine = new AgentTeam({
    name: "DevAgent",
    storagePath: ".agentTeam"
  });

  await engine.use(new LLMPlugin({ provider: "openai" }));
  await engine.use(new HttpInterfacePlugin({ port: 4001 }));
  await engine.use(new TriggerPlugin());

  await engine.init();

  const zipPath = "c:/Users/HP VICTUS/Desktop/Agent_Team/tavily-search-1.0.0.zip";
  
  // Calculate 1 minute from now
  const now = new Date();
  const targetTime = new Date(now.getTime() + 65000); // 65 seconds to be safe
  const dateStr = targetTime.toISOString().split('T')[0];
  const timeStr = targetTime.toTimeString().split(' ')[0].substring(0, 5);

  const agentConfig = {
    id: "vinit-tavily",
    name: "Vinit Tavily Agent",
    description: "Automated test agent with Tavily search",
    instruction: "Use the tavily tool to search for the latest news about AI Agents.",
    provider: "openai",
    model: "gpt-4o",
    tools: ["tavily_search"],
    enabled: true,
    triggers: [
        {
            type: "scheduled",
            config: {
                date: dateStr,
                time: timeStr,
                instruction: "Perform a search for 'AI Agent trends 2026' and summarize."
            }
        }
    ]
  };

  console.log(`Deploying agent with schedule: ${dateStr} ${timeStr}...`);
  
  const mockFile: any = {
    originalname: "tavily-search-1.0.0.zip",
    path: zipPath
  };

  await engine.deployAgent(agentConfig as any, mockFile);
  
  console.log("Agent deployed. Keeping engine alive for trigger...");
  console.log("WAITING for trigger execution (this takes ~1 min)...");

  // Don't exit, let the timer run
  // process.exit(0);
}

run().catch(console.error);
