import { EventEmitter } from "events";
import { ToolRegistry } from "../tools/ToolRegistry";
import { TriggerRegistry } from "../triggers/TriggerRegistry";
import { ProviderRegistry } from "../provider/ProviderRegistry";
import { Runtime } from "../runtime/Runtime";
import { Worker } from "../runtime/Worker";
import { StorageManager } from "../utils/storage";
import { AgentTeamPlugin } from "../plugin/AgentTeamPlugin";
import { AgentRegistry, AgentConfig } from "../agent/AgentRegistry";
import { AgentWatcher } from "../utils/watcher";
import { Logger } from "../utils/logger";
import AdmZip from "adm-zip";
import path from "path";
import fs from "fs";

export interface AgentTeamConfig {
  name: string;
  maxWorkers?: number;
  storagePath?: string;
  logLevel?: string | number;
}

export class AgentTeam extends EventEmitter {
  public tools = new ToolRegistry();
  public triggers = new TriggerRegistry();
  public providers = new ProviderRegistry();
  public storage: StorageManager;
  public runtime: Runtime;
  public worker: Worker;
  public agents = new AgentRegistry();
  private watcher: AgentWatcher;
  private logger = Logger.scope("engine");

  constructor(private config: AgentTeamConfig) {
    super();
    if (config.logLevel !== undefined) {
      Logger.setLevel(config.logLevel);
    }
    this.storage = new StorageManager(config.storagePath || ".agentTeam");
    this.worker = new Worker(this);
    this.watcher = new AgentWatcher(this);
    this.runtime = new Runtime(this, config.maxWorkers || 2);
  }

  async use(plugin: AgentTeamPlugin): Promise<void> {
    this.logger.debug(`Using plugin: ${plugin.name}`);
    await plugin.setup(this);
  }

  async init(): Promise<void> {
    this.logger.debug(`Initializing ${this.config.name}...`);
    await this.storage.ensureDirectoryStructure();
    
    await this.watcher.start();
    
    // Listen for agent updates to reload triggers
    this.agents.on("registered", async (config) => {
      this.logger.info(`Reloading triggers for agent ${config.id} due to registration/update`);
      await this.triggers.stopAgentTriggers(config.id);
      if (config.enabled !== false) {
        await this.triggers.startAgentTriggers(config, this.runtime);
      }
    });

    this.agents.on("unregistered", async (id) => {
      this.logger.info(`Stopping triggers for agent ${id} due to unregistration`);
      await this.triggers.stopAgentTriggers(id);
    });
    
    this.logger.debug(`Storage ready at ${this.storage.resolvePath()}`);
    await this.cleanupOrphanSessions();
  }

  private async cleanupOrphanSessions(): Promise<void> {
    this.logger.debug("Checking for orphan sessions...");
    const sessionsDir = this.storage.resolvePath("sessions");
    if (!fs.existsSync(sessionsDir)) return;

    try {
      const agentDirs = await fs.promises.readdir(sessionsDir);
      for (const agentId of agentDirs) {
        const agentPath = path.join(sessionsDir, agentId);
        if (!(await fs.promises.stat(agentPath)).isDirectory()) continue;

        const sessionDirs = await fs.promises.readdir(agentPath);
        for (const sessionId of sessionDirs) {
          const sessionPath = path.join(agentPath, sessionId);
          if (!(await fs.promises.stat(sessionPath)).isDirectory()) continue;

          const jsonPath = path.join(sessionPath, "session.json");
          if (!fs.existsSync(jsonPath)) continue;

          try {
            const session = JSON.parse(await fs.promises.readFile(jsonPath, "utf-8"));
            if (session.status === "running") {
              this.logger.info(`Cleaning up orphan session ${sessionId} for agent ${agentId}`);
              session.status = "failed";
              session.error = "System interrupted (server shutdown)";
              session.endedAt = new Date().toISOString();
              await fs.promises.writeFile(jsonPath, JSON.stringify(session, null, 2));
            }
          } catch (e) {
          }
        }
      }
    } catch (err: any) {
      this.logger.error(`Failed to cleanup orphan sessions: ${err.message}`);
    }
  }

  async boot(): Promise<void> {
    this.logger.debug(`Booting ${this.config.name}...`);
    this.logger.debug(`${this.config.name} is now online and ready.`);
  }

  async start(): Promise<void> {
    this.logger.info("Starting AgentTeam with triggers...");
    const agents = this.agents.list();
    for (const agent of agents) {
      if (agent.enabled !== false) {
        await this.triggers.startAgentTriggers(agent, this.runtime);
      }
    }
  }

  async stop(): Promise<void> {
    this.logger.info("Stopping AgentTeam and cleaning up triggers...");
    await this.triggers.stopAll();
  }

  async getCredential(service: string): Promise<any> {
    const secrets = await this.storage.readJson<any>("credentials", "secrets.json") || {};
    return secrets[service];
  }

  async getAllCredentials(): Promise<any> {
    return (await this.storage.readJson<any>("credentials", "secrets.json")) || {};
  }

  /**
   * Saves or updates a structured credential object for a service.
   */
  async saveCredential(service: string, data: any): Promise<void> {
    const secrets = await this.storage.readJson<any>("credentials", "secrets.json") || {};
    secrets[service] = {
      ...(secrets[service] || {}),
      ...data
    };
    await this.storage.writeJson(secrets, "credentials", "secrets.json");
  }

  async deployAgent(config: AgentConfig, file?: Express.Multer.File): Promise<void> {
    const agentId = config.id;
    const agentDir = this.storage.resolvePath("agents", agentId);
    const configPath = path.join(agentDir, "agent.json");
    const skillsDir = path.join(agentDir, "skills");

    this.logger.info(`Deploying agent ${agentId} [${config.name || ""}]`);

    try {
      // 1. Ensure basics exist
      if (!fs.existsSync(agentDir)) {
        fs.mkdirSync(agentDir, { recursive: true });
      }
      if (!fs.existsSync(skillsDir)) {
        fs.mkdirSync(skillsDir, { recursive: true });
      }

      // 2. Handle uploaded file if provided
      if (file) {
        const isZip = file.originalname.endsWith('.zip');
        const isSkillMd = file.originalname === 'SKILL.md';

        if (isZip) {
          const zip = new AdmZip(file.path);
          this.logger.debug(`Extracting skills package to ${skillsDir}...`);
          zip.extractAllTo(skillsDir, true);
        } else {
          // Single file or other
          const dest = path.join(skillsDir, file.originalname);
          fs.copyFileSync(file.path, dest);
          this.logger.debug(`Saved skill file to ${dest}`);
        }
      }

      // 3. Write/Update agent.json
      this.logger.debug(`Writing agent metadata to ${configPath}...`);
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      
      this.logger.info(`Agent ${agentId} deployment complete.`);
      this.agents.register(config);
    } catch (err: any) {
      this.logger.error(`Deployment failed: ${err.message}`);
      throw err;
    }
  }
}
