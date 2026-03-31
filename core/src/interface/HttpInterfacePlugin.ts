import express, { Express, Request, Response } from "express";
import { Server } from "http";
import { AgentTeam } from "../agent/AgentTeam";
import { AgentTeamPlugin } from "../plugin/AgentTeamPlugin";
import { AgentInterface } from "./AgentInterface";
import { Logger } from "../utils/logger";
import cors from "cors";
import fs from "fs";
import path from "path";
import { registerAgentRoutes } from "./routes/agents";
import { registerSessionRoutes } from "./routes/sessions";
import { registerConnectionRoutes } from "./routes/connections";

interface HttpInterfaceConfig {
  port: number;
}

export class HttpInterfacePlugin implements AgentTeamPlugin, AgentInterface {
  name = "http-interface";
  private app?: Express;
  private server?: Server;
  private engine?: AgentTeam;
  private logger = Logger.scope("http");

  constructor(private config: HttpInterfaceConfig) {}

  async setup(engine: AgentTeam): Promise<void> {
    this.engine = engine;
    this.app = express();
    this.app.use(cors());
    this.app.use(express.json({ limit: "10mb" }));
    this.setupRoutes();
  }

  private setupRoutes() {
    if (!this.app || !this.engine) return;
    const app = this.app;
    const engine = this.engine;

    app.get("/health", (req, res) => res.json({ status: "ok", engine: "AgentTeam" }));

    app.get("/models", async (req, res) => {
      try {
        res.json(engine.providers.list().map(p => ({ provider: p.name, models: p.getModels() })));
      } catch (err: any) { res.status(500).json({ error: err.message }); }
    });

    app.post("/tasks", async (req: Request, res: Response) => {
      const { agentId, instruction, metadata } = req.body;
      if (!agentId || !instruction) return res.status(400).json({ error: "Missing agentId or instruction" });
      try {
        await engine.runtime.enqueueTask({ agentId, instruction, metadata });
        res.json({ queued: true, agentId, instruction });
      } catch (err: any) { res.status(500).json({ error: err.message }); }
    });

    app.get("/tasks/queue", async (req, res) => {
      try {
        const queued = engine.runtime.getQueue().map(t => ({
          type: 'queued',
          agentId: t.agentId,
          instruction: t.instruction,
          metadata: t.metadata
        }));

        const upcoming = engine.triggers.getUpcomingTasks().map(t => ({
          type: 'upcoming',
          ...t
        }));

        res.json([...queued, ...upcoming]);
      } catch (err: any) { res.status(500).json({ error: err.message }); }
    });

    app.post("/trigger/:agentId", async (req: Request, res: Response) => {
      try {
        await engine.triggers.handleWebhook(req.params.agentId as string, req.body, req.headers as Record<string, string>);
        res.json({ ok: true });
      } catch (err: any) { res.status(500).json({ error: err.message }); }
    });

    app.get("/triggers/schemas", (req, res) => {
      try { res.json(engine.triggers.listSchemas()); }
      catch (err: any) { res.status(500).json({ error: err.message }); }
    });

    registerAgentRoutes(app, engine);
    registerSessionRoutes(app, engine);
    registerConnectionRoutes(app, engine);

    const distPath = path.resolve(__dirname, "../../../Web/dist");
    if (fs.existsSync(distPath)) {
      this.logger.info(`Serving frontend from ${distPath}`);
      app.use(express.static(distPath));
      app.use((req, res, next) => {
        if (req.method === "GET" && !req.path.startsWith("/api") && !res.headersSent) {
          res.sendFile(path.join(distPath, "index.html"));
        } else {
          next();
        }
      });
    }
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app?.listen(this.config.port, () => {
        this.logger.info(`HTTP Interface listening on port ${this.config.port}`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server?.close(() => {
        this.logger.info("HTTP Interface stopped");
        resolve();
      });
    });
  }
}
