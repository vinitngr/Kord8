import { describe, it, expect } from 'vitest';
import { ToolRegistry } from '../src/tools/ToolRegistry';
import { BaseTool, ToolContext } from '../src/tools/BaseTool';
import { z } from 'zod';

class MockTool extends BaseTool {
  name = 'mock';
  description = 'desc';
  schema = z.object({});
  async execute() { return 'ok'; }
}

describe('Registries', () => {
  it('should register and retrieve tools', () => {
    const registry = new ToolRegistry();
    const tool = new MockTool();
    registry.register(tool);
    expect(registry.get('mock')).toBe(tool);
    expect(registry.list()).toContain(tool);
  });

  it('should return undefined for unregistered tools', () => {
    const registry = new ToolRegistry();
    expect(registry.get('unknown')).toBeUndefined();
  });
});
