import { Express, Request, Response } from "express";
import { AgentTeam } from "../../agent/AgentTeam";
import fs from "fs";
import path from "path";
import multer from "multer";
import { getRecursiveStructure, getFileContent } from "../../utils/file-utils";

const upload = multer({ dest: "uploads/" });

export function registerAgentRoutes(app: Express, engine: AgentTeam) {
  app.get("/agents", async (req, res) => {
    try { res.json(engine.agents.list()); }
    catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get("/agents/:id", async (req, res) => {
    try {
      const config = engine.agents.get(req.params.id);
      if (!config) return res.status(404).json({ error: "Agent not found" });
      res.json(config);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/agents/deploy", upload.single("file"), async (req: any, res: Response) => {
    let config;
    try { config = JSON.parse(req.body.config); }
    catch (e) { return res.status(400).json({ error: "Invalid agent config JSON" }); }

    const file = req.file;
    if (!config?.id || !config?.instruction) {
      return res.status(400).json({ error: "Missing agent config (id and instruction required)" });
    }

    try {
      await engine.deployAgent(config, file);
      res.json({ success: true, agentId: config.id, message: `Agent ${config.id} deployed and registered.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    } finally {
      if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    }
  });

  app.post("/agents/:id/update", async (req, res) => {
    try {
      const agentId = req.params.id;
      const body = req.body;
      const agentDir = engine.storage.resolvePath("agents", agentId);
      if (!fs.existsSync(agentDir)) return res.status(404).json({ error: "Agent not found" });

      const configPath = path.join(agentDir, "agent.json");
      const existing = JSON.parse(fs.readFileSync(configPath, "utf-8"));

      const updatedConfig = {
        ...existing,
        name: body.name ?? existing.name,
        description: body.description ?? existing.description,
        instruction: body.instruction ?? existing.instruction,
        model: body.model ?? existing.model,
        provider: body.provider ?? existing.provider ?? "openai",
        tools: body.tools ?? existing.tools ?? [],
        mcpTools: body.mcpTools ?? existing.mcpTools ?? [],
        maxIterations: body.maxIterations !== undefined ? Number(body.maxIterations) : existing.maxIterations,
        temperature: body.temperature !== undefined ? Number(body.temperature) : existing.temperature,
        maxTokens: body.maxTokens !== undefined ? Number(body.maxTokens) : existing.maxTokens,
        enabled: body.enabled !== undefined ? Boolean(body.enabled) : existing.enabled ?? true,
        triggers: body.triggers ?? existing.triggers ?? [],
        reasoningEffort: body.reasoningEffort ?? existing.reasoningEffort ?? "medium",
      };

      fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2));
      engine.agents.register(updatedConfig);
      res.json({ success: true, message: `Agent ${agentId} configuration updated.`, config: updatedConfig });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/agents/:id", async (req, res) => {
    try {
      const agentId = req.params.id;
      const agentDir = engine.storage.resolvePath("agents", agentId);
      if (fs.existsSync(agentDir)) fs.rmSync(agentDir, { recursive: true, force: true });
      engine.agents.unregister(agentId);
      res.json({ success: true, message: `Agent ${agentId} deleted successfully.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/agents/:id/files", async (req, res) => {
    try {
      const agentDir = engine.storage.resolvePath("agents", req.params.id);
      if (!fs.existsSync(agentDir)) return res.status(404).json({ error: "Agent not found" });
      res.json(await getRecursiveStructure(agentDir));
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get("/agents/:id/files/content", async (req, res) => {
    try {
      const agentDir = engine.storage.resolvePath("agents", req.params.id);
      const filePath = req.query.path as string;
      if (!filePath) return res.status(400).json({ error: "Missing file path" });

      const fullPath = path.join(agentDir, filePath);
      const resolved = path.resolve(fullPath);
      if (!resolved.startsWith(path.resolve(agentDir))) return res.status(403).json({ error: "Access denied" });
      if (!fs.existsSync(fullPath)) return res.status(404).json({ error: "File not found" });

      res.send(await getFileContent(fullPath));
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/agents/:id/files/update", async (req, res) => {
    try {
      const agentDir = engine.storage.resolvePath("agents", req.params.id);
      const { path: filePath, content } = req.body;
      if (!filePath) return res.status(400).json({ error: "Missing file path" });
      if (content === undefined) return res.status(400).json({ error: "Missing content" });

      const fullPath = path.join(agentDir, filePath);
      const resolved = path.resolve(fullPath);
      if (!resolved.startsWith(path.resolve(agentDir))) return res.status(403).json({ error: "Access denied" });

      if (filePath === "agent.json") {
        try { engine.agents.register(JSON.parse(content)); }
        catch (e: any) { return res.status(400).json({ error: `Invalid agent.json: ${e.message}` }); }
      }

      await fs.promises.writeFile(fullPath, content, "utf-8");
      res.json({ success: true, message: `File ${filePath} updated.` });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });
}
