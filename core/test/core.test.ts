import { describe, it, expect, vi } from 'vitest';
import { AgentTeam } from '../src/agent/AgentTeam';
import { LLMPlugin } from '../src/plugin/LLMPlugin';

describe('AgentTeam', () => {
  it('should initialize with correct configuration', () => {
    const app = new AgentTeam({ name: 'TestApp', storagePath: '.agentTeam_temp' });
    expect(app.tools).toBeDefined();
    expect(app.providers).toBeDefined();
  });

  it('should use plugins correctly', async () => {
    const app = new AgentTeam({ name: 'TestApp' });
    const mockPlugin = {
      name: 'mock',
      setup: vi.fn()
    };
    await app.use(mockPlugin);
    expect(mockPlugin.setup).toHaveBeenCalledWith(app);
  });
});
