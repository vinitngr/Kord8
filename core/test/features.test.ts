import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentTeam } from '../src/agent/AgentTeam';
import { HttpInterfacePlugin } from '../src/interface/HttpInterfacePlugin';
import { OpenAIProvider } from '../src/provider/OpenAIProvider';
import { BaseTool } from '../src/tools/BaseTool';
import { ModelResult } from '../src/provider/ModelProvider';
import { z } from 'zod';

class MockProvider extends OpenAIProvider {
  name = "mock";
  getModels(): string[] {
    return ["test-model"];
  }
  async generate(options: any): Promise<ModelResult> {
    return {
      text: "Mocked Response",
      messages: [{ role: "assistant", content: "Mocked Response" }],
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      steps: []
    };
  }
}

class MockTool extends BaseTool<{ text: string }> {
  name = "mock_tool";
  description = "Mock tool";
  schema = z.object({ text: z.string() });
  async execute(input: { text: string }) {
    return `Mock result: ${input.text}`;
  }
}

describe('AgentTeam Features', () => {
  let app: AgentTeam;

  beforeEach(async () => {
    app = new AgentTeam({ name: 'TestAgent', logLevel: 'silent' });
    await app.init();
  });

  describe('Event System', () => {
    it('should emit events during task execution', async () => {
      const events: string[] = [];
      app.on('task:start', () => events.push('task:start'));
      app.on('llm:start', () => events.push('llm:start'));
      app.on('tool:start', () => events.push('tool:start'));
      app.on('llm:completed', () => events.push('llm:completed'));
      app.on('task:completed', () => events.push('task:completed'));

      const provider = new MockProvider();
      const generateSpy = vi.spyOn(provider, 'generate');
      app.providers.register(provider);
      app.tools.register(new MockTool());

      const config = {
        id: 'test-agent',
        instruction: 'Assume role of tester',
        skills: 'Testing skills',
        provider: 'mock',
        model: 'test-model',
        tools: ['mock_tool']
      };

      vi.spyOn(app.storage, 'readJson').mockImplementation(async (type, ...path) => {
        if (path.includes('agent.json')) {
          return config;
        }
        return {};
      });

      app.agents.register(config as any);

      await app.worker.execute({
        agentId: 'test-agent',
        instruction: 'Run test',
      });

      // Verify event order
      expect(events).toEqual([
        'task:start',
        'llm:start',
        'llm:completed',
        'task:completed'
      ]);

      // Verify messages built correctly
      expect(generateSpy).toHaveBeenCalledWith(expect.objectContaining({
        messages: [
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining('Assume role of tester')
          }),
          { role: 'user', content: 'Run test' }
        ]
      }));
    });
  });

  describe('HTTP Interface', () => {
    it('should be able to join the app as a plugin', async () => {
      const httpPlugin = new HttpInterfacePlugin({ port: 4001 });
      await app.use(httpPlugin);
      expect(httpPlugin.name).toBe('http-interface');
    });
  });
});
