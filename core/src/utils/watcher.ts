import chokidar from "chokidar";
import path from "path";
import fs from "fs/promises";
import { AgentTeam } from "../agent/AgentTeam";
import { Logger } from "./logger";
import { AgentConfigSchema } from "../agent/AgentRegistry";

export class AgentWatcher {
  private watcher: chokidar.FSWatcher | null = null;
  private logger = Logger.scope("watcher");

  constructor(private app: AgentTeam) {}

  async start() {
    const agentsDir = this.app.storage.resolvePath("agents");
    
    // Ensure the directory exists before watching
    await fs.mkdir(agentsDir, { recursive: true });

    this.watcher = chokidar.watch(agentsDir, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      depth: 2, // agents/{id}/...
    });

    this.watcher
      .on("addDir", (dirPath) => this.handleFolderChange(dirPath))
      .on("add", (filePath) => this.handleFileChange(filePath))
      .on("change", (filePath) => this.handleFileChange(filePath))
      .on("unlinkDir", (dirPath) => this.handleFolderRemoval(dirPath));

    this.logger.debug(`Started watching agents at ${agentsDir}`);
    
    // Initial scan
    await this.scanAll();
  }

  private async scanAll() {
    const agentsDir = this.app.storage.resolvePath("agents");
    try {
      const folders = await fs.readdir(agentsDir);
      for (const folder of folders) {
        const fullPath = path.join(agentsDir, folder);
        const stats = await fs.stat(fullPath);
        if (stats.isDirectory()) {
          await this.loadAgentFromFolder(fullPath);
        }
      }
    } catch (err) {
      this.logger.error("Initial scan failed:", err);
    }
  }

  private async handleFolderChange(dirPath: string) {
    const relative = path.relative(this.app.storage.resolvePath("agents"), dirPath);
    if (relative && !relative.includes(path.sep)) {
      // It's an agent folder root
      await this.loadAgentFromFolder(dirPath);
    }
  }

  private async handleFileChange(filePath: string) {
    if (filePath.endsWith("agent.json")) {
      const agentDir = path.dirname(filePath);
      await this.loadAgentFromFolder(agentDir);
    }
  }

  private handleFolderRemoval(dirPath: string) {
    const agentId = path.basename(dirPath);
    this.app.agents.unregister(agentId);
  }

  private async loadAgentFromFolder(folderPath: string) {
    const agentId = path.basename(folderPath);
    const configPath = path.join(folderPath, "agent.json");
    const skillPath = path.join(folderPath, "skills", "SKILL.md");

    try {
      const configData = await fs.readFile(configPath, "utf-8");
      const config = JSON.parse(configData);

      // SKILL.md is no longer mandatory
      // await fs.access(skillPath);

      config.id = agentId;
      this.app.agents.register(config);
    } catch (err: any) {
      this.logger.error(`Validation failed for agent folder ${agentId}:`, err.message);
      this.app.agents.unregister(agentId);
    }
  }

  async stop() {
    if (this.watcher) {
      await this.watcher.close();
    }
  }
}
