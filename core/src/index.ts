import "dotenv/config";
import { AgentTeam } from "./agent/AgentTeam";
import { LLMPlugin } from "./plugin/LLMPlugin";
import { HttpInterfacePlugin } from "./interface/HttpInterfacePlugin";
import { TriggerPlugin } from "./plugin/TriggerPlugin";
import { SerperSearchTool } from "./tools/SerperSearchTool";
import { FirecrawlerFetchTool } from "./tools/FirecrawlerFetchTool";
import { getAllNotionTools } from "./tools/NotionTools";
import { getAllTestTools } from "./tools/TestTools";
import { getAllNetworkTools } from "./tools/CurlTool";
import { getAllBrevoTools } from "./tools/BrevoTool";
import { GoogleConnector } from "./tools/GoogleConnector";
import { OpenAIConnector } from "./tools/OpenAIConnector";
import { Logger } from "./utils/logger";

async function main() {
  const app = new AgentTeam({
    name: "DevAgent",
    maxWorkers: 2,
    storagePath: ".agentTeam",
    logLevel: "debug"
  });

  await app.use(new LLMPlugin({
    provider: "openai",
    apiKey: process.env.OPENAI_API_KEY || "sk-...",
  }));

  const http = new HttpInterfacePlugin({ port: 4000 });
  await app.use(http);
  await app.use(new TriggerPlugin());

  app.tools.register(new SerperSearchTool());
  app.tools.register(new FirecrawlerFetchTool());
  for (const tool of getAllNotionTools()) app.tools.register(tool);
  for (const tool of getAllTestTools()) app.tools.register(tool);
  for (const tool of getAllNetworkTools()) app.tools.register(tool);
  for (const tool of getAllBrevoTools()) app.tools.register(tool);
  app.tools.register(new GoogleConnector());
  app.tools.register(new OpenAIConnector());

  app.on("task:start", (ev) => Logger.info(`[Event] Task Started: ${ev.sessionId}`));
  
  app.on("llm:chunk", (ev) => {
    process.stdout.write(ev.chunk);
  });

  app.on("task:completed", (ev) => {
    console.log("\n\n--- TASK COMPLETED ---");
    console.log(`Agent: ${ev.agentId}`);
    console.log(`Session: ${ev.sessionId}`);
    console.log(`Task: ${ev.instruction}`);
    console.log("----------------------\n");
  });

  app.on("task:failed", (ev) => {
    console.error(`\n\n--- TASK FAILED: ${ev.error} ---`);
    console.error(`Agent: ${ev.agentId}`);
    console.error(`Session: ${ev.sessionId}`);
    console.error(`Task: ${ev.instruction}`);
    console.error("----------------------\n");
  });

  await app.init();
  await app.boot();
  await app.start();
  
  await http.start();

  Logger.info("--- ENGINE READY ---");

  const shutdown = async () => {
    Logger.info("Shutting down engine...");
    await app.stop();
    await http.stop();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);


  // await app.runtime.enqueueTask({
  //   agentId: "example-agent",
  //   instruction: "Hello! Can you echo 'AgentTeam logic is robust' using the echo tool? Also, tell me what metadata you see.",
  //   metadata: { user_preference: "concise" },
  //   streaming: true // Testing the new streaming flow
  // });
}

if (require.main === module) {
  main().catch(err => {
    Logger.error("Critical Error:", err);
  });
}

export { AgentTeam } from "./agent/AgentTeam";
export { LLMPlugin } from "./plugin/LLMPlugin";
export { BaseTool } from "./tools/BaseTool";
export { BaseTrigger } from "./triggers/BaseTrigger";
