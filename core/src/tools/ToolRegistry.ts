import { BaseTool, ConnectionManifest } from "./BaseTool";

export class ToolRegistry {
  private tools: Map<string, BaseTool> = new Map();

  register(tool: BaseTool): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): BaseTool | undefined {
    return this.tools.get(name);
  }

  list(): BaseTool[] {
    return Array.from(this.tools.values());
  }

  listManifests(): ConnectionManifest[] {
    const seen = new Map<string, ConnectionManifest>();
    for (const tool of this.tools.values()) {
      if (tool.connectionManifest && !seen.has(tool.connectionManifest.service)) {
        seen.set(tool.connectionManifest.service, tool.connectionManifest);
      }
    }
    return Array.from(seen.values());
  }

  listToolInfo(): { name: string; description: string; group?: string; service?: string }[] {
    return Array.from(this.tools.values())
      .filter((t) => !t.hidden)
      .map((t) => ({
        name: t.name,
        description: t.description,
        group: t.group,
        service: t.connectionManifest?.service,
      }));
  }
}
