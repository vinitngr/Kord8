import { Express } from "express";
import { AgentTeam } from "../../agent/AgentTeam";
import fs from "fs";
import path from "path";

export function registerSessionRoutes(app: Express, engine: AgentTeam) {
  app.get("/sessions", async (req, res) => {
    try {
      const sessionsBaseDir = engine.storage.resolvePath("sessions");
      if (!fs.existsSync(sessionsBaseDir)) return res.json([]);

      const agentDirs = fs.readdirSync(sessionsBaseDir).filter(f =>
        fs.statSync(path.join(sessionsBaseDir, f)).isDirectory()
      );

      const allSummaries: any[] = [];
      for (const agentId of agentDirs) {
        const sessDir = path.join(sessionsBaseDir, agentId);
        const sessionIds = fs.readdirSync(sessDir).filter(f =>
          fs.statSync(path.join(sessDir, f)).isDirectory()
        );

        for (const id of sessionIds) {
          try {
            const data = await engine.storage.readJson<any>("sessions", agentId, id, "session.json");
            if (data) {
              allSummaries.push({
                id: data.id,
                agentId: data.agentId,
                runCount: data.runCount || 1,
                timestamp: data.startedAt ? new Date(data.startedAt).toLocaleString() : "Unknown",
                status: data.status,
                summary: data.messages?.[1]?.content?.substring(0, 100) || data.instruction?.substring(0, 100),
                startTime: data.startedAt
              });
            }
          } catch (e) {}
        }
      }

      allSummaries.sort((a, b) => new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime());
      res.json(allSummaries.slice(0, 50));
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get("/sessions/:agentId", async (req, res) => {
    try {
      const sessDir = engine.storage.resolvePath("sessions", req.params.agentId);
      if (!fs.existsSync(sessDir)) return res.json([]);

      const sessionIds = fs.readdirSync(sessDir).filter(f =>
        fs.statSync(path.join(sessDir, f)).isDirectory()
      );

      const summaries = [];
      for (const id of sessionIds) {
        try {
          const data = await engine.storage.readJson<any>("sessions", req.params.agentId, id, "session.json");
          if (data) {
            summaries.push({
              id: data.id,
              agentId: data.agentId,
              runCount: data.runCount || 1,
              timestamp: data.startedAt ? new Date(data.startedAt).toLocaleString() : "Unknown",
              status: data.status,
              summary: data.messages?.[1]?.content?.substring(0, 100) || data.instruction?.substring(0, 100)
            });
          }
        } catch (e) {}
      }

      summaries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      res.json(summaries);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get("/sessions/:agentId/:sessionId", async (req, res) => {
    try {
      const { agentId, sessionId } = req.params;
      const data = await engine.storage.readJson<any>("sessions", agentId, sessionId, "session.json");
      if (!data) return res.status(404).json({ error: "Session not found" });
      res.json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });
}
