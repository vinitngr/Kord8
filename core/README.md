# AgentTeam Core Engine

The foundational runtime for the AgentTeam autonomous framework.

## Architecture

- **AgentTeam**: Orchestrator and entry point.
- **Runtime**: Queue managed concurrency controller.
- **Worker**: LLM execution engine powered by Vercel AI SDK.
- **Storage**: Local-first filesystem management in `.agentTeam/`.
- **Plugin System**: Modular registration of tools, triggers, and providers.

## Getting Started

1. **Install Dependencies**
   ```bash
   cd core
   npm install
   ```

2. **Run Example**
   ```bash
   # Set your API key
   export OPENAI_API_KEY=sk-...
   
   # Run the dev script
   npm run dev
   ```

## Local Storage (.agentTeam/)

- `agents/`: Agent configuration files (`agent.json`).
- `sessions/`: Execution logs and results.
- `credentials/`: Local secrets (unencrypted for dev).
- `runtime/`: Internal state.

## Usage Contract

```typescript
import { AgentTeam, LLMPlugin } from "./src";

const app = new AgentTeam({ name: "MyEngine" });

await app.use(new LLMPlugin({
  provider: "openai",
  apiKey: process.env.OPENAI_API_KEY
}));

await app.start();

await app.runtime.enqueueTask({
  agentId: "my-agent",
  instruction: "Help me with X"
});
```
