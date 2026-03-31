import "dotenv/config";
import { AgentTeam } from "../src/agent/AgentTeam";
import { LLMPlugin } from "../src/plugin/LLMPlugin";
import { getAllBrevoTools } from "../src/tools/BrevoTool";
import fs from "fs";

const LOG_FILE = "logs.txt";

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + "\n");
}

async function main() {
  fs.writeFileSync(LOG_FILE, "");
  log("=== BREVO EMAIL TEST START ===");

  const app = new AgentTeam({
    name: "BrevoTest",
    maxWorkers: 1,
    storagePath: ".agentTeam",
    logLevel: "debug",
  });

  await app.use(new LLMPlugin({
    provider: "openai",
    apiKey: process.env.OPENAI_API_KEY || "",
  }));

  for (const tool of getAllBrevoTools()) {
    app.tools.register(tool);
    log(`Tool registered: ${tool.name}`);
  }

  app.on("task:start", (ev) => log(`[EVENT] task:start | session=${ev.sessionId}`));
  app.on("task:completed", (ev) => log(`[EVENT] task:completed | session=${ev.sessionId} | agent=${ev.agentId}`));
  app.on("task:failed", (ev) => log(`[EVENT] task:failed | session=${ev.sessionId} | error=${ev.error}`));
  app.on("tool:call", (ev) => log(`[EVENT] tool:call | tool=${ev.toolName} | args=${JSON.stringify(ev.args)}`));
  app.on("tool:result", (ev) => log(`[EVENT] tool:result | tool=${ev.toolName} | result=${ev.result}`));
  app.on("llm:chunk", (ev) => {
    process.stdout.write(ev.chunk);
    fs.appendFileSync(LOG_FILE, ev.chunk);
  });

  log("Registering test agent...");
  app.agents.register({
    id: "brevo-test-agent",
    name: "Brevo Tester",
    description: "Test agent for sending email via Brevo",
    instruction: "You are an email assistant. Use the brevo_send_email tool to send emails when asked.",
    provider: "openai",
    model: "gpt-4o-mini",
    tools: ["brevo_send_email"],
    maxIterations: 5,
    temperature: 0.3,
    enabled: true,
    reasoningEffort: "medium",
  });
  log("Agent registered: brevo-test-agent");

  log("Enqueuing task...");
  await app.runtime.enqueueTask({
    agentId: "brevo-test-agent",
    instruction: "Send an email to vinitnagar56@gmail.com with subject 'Hello from AgentTeam' and body 'Hi Vinit! This is a test email sent by AgentTeam AI agent. If you see this, the Brevo integration works!'",
  });

  log("Waiting for task to complete...");
  await new Promise((resolve) => {
    app.on("task:completed", () => resolve(true));
    app.on("task:failed", () => resolve(false));
    setTimeout(() => { log("TIMEOUT after 30s"); resolve(false); }, 30000);
  });

  log("=== BREVO EMAIL TEST END ===");
  log(`Full logs written to ${LOG_FILE}`);
  process.exit(0);
}

main().catch((err) => {
  log(`FATAL: ${err.message}\n${err.stack}`);
  process.exit(1);
});
