import { describe, it, expect, vi, beforeEach } from "vitest";
import { TriggerRegistry } from "../src/triggers/TriggerRegistry";
import { BaseTrigger, TriggerContext } from "../src/triggers/BaseTrigger";
import { Runtime } from "../src/runtime/Runtime";

class MockTrigger extends BaseTrigger {
  type = "mock";
  getFormSchema() { return {}; }
  validate(config: any) {}
  async start(config: any, context: TriggerContext) {}
  async stop() {}
}

describe("TriggerRegistry", () => {
  let registry: TriggerRegistry;
  let mockRuntime: any;

  beforeEach(() => {
    registry = new TriggerRegistry();
    mockRuntime = {
      enqueue: vi.fn().mockResolvedValue(undefined)
    };
  });

  it("should register a trigger class", () => {
    registry.register(MockTrigger);
    // Success if no error
  });

  it("should start triggers for an agent", async () => {
    registry.register(MockTrigger);
    
    const agentConfig = {
      id: "test-agent",
      triggers: [
        {
          type: "mock",
          config: { foo: "bar" }
        }
      ]
    };

    await registry.startAgentTriggers(agentConfig, mockRuntime as any);
    const running = registry.getRunning("test-agent");
    expect(running.length).toBe(1);
    expect(running[0].type).toBe("mock");
  });

  it("should not start triggers if type not registered", async () => {
    const agentConfig = {
      id: "test-agent",
      triggers: [
        {
          type: "unknown",
          config: {}
        }
      ]
    };

    await registry.startAgentTriggers(agentConfig, mockRuntime as any);
    const running = registry.getRunning("test-agent");
    expect(running.length).toBe(0);
  });
});
