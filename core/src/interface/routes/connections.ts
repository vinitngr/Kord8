import { Express } from "express";
import { AgentTeam } from "../../agent/AgentTeam";
import { Logger } from "../../utils/logger";

const logger = Logger.scope("http");

export function registerConnectionRoutes(app: Express, engine: AgentTeam) {
  app.get("/tools", (req, res) => {
    try { res.json(engine.tools.listToolInfo()); }
    catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get("/connections", async (req, res) => {
    try {
      const manifests = engine.tools.listManifests();
      const secrets = await engine.getAllCredentials();
      const allTools = engine.tools.list();
      const connections: any[] = [];
      const handled = new Set<string>();

      for (const m of manifests) {
        handled.add(m.service);
        const tools = allTools
          .filter((t) => t.connectionManifest?.service === m.service && !t.hidden)
          .map((t) => ({ name: t.name, description: t.description }));

        connections.push({
          service: m.service,
          label: m.label,
          description: m.description,
          fields: m.fields.map((f) => ({
            name: f.name, label: f.label, type: f.type,
            placeholder: f.placeholder, required: f.required,
          })),
          tools,
          isConnected: !!secrets[m.service],
          hasPing: !!m.ping,
        });
      }

      const ungrouped = allTools.filter((t) => !t.connectionManifest);
      const groups = new Map<string, typeof ungrouped>();
      for (const t of ungrouped) {
        const g = t.group || t.name;
        if (!groups.has(g)) groups.set(g, []);
        groups.get(g)!.push(t);
      }

      for (const [groupName, tools] of groups) {
        if (handled.has(groupName)) continue;
        const first = tools[0];
        connections.push({
          service: groupName,
          label: first.groupLabel || groupName,
          description: first.groupDescription || "",
          fields: [],
          tools: tools.map((t) => ({ name: t.name, description: t.description })),
          isConnected: true,
          hasPing: false,
        });
      }

      res.json(connections);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/connections/:service", async (req, res) => {
    try {
      const { service } = req.params;
      const creds = req.body;
      if (!creds || Object.keys(creds).length === 0) {
        return res.status(400).json({ error: "No credentials provided." });
      }

      const manifest = engine.tools.listManifests().find((m) => m.service === service);
      if (!manifest) return res.status(404).json({ error: `Unknown service: ${service}` });

      for (const field of manifest.fields) {
        if (field.required && !creds[field.name]) {
          return res.status(400).json({ error: `Missing required field: ${field.label}` });
        }
      }

      if (manifest.ping) {
        try {
          const ok = await manifest.ping(creds);
          if (!ok) return res.status(401).json({ error: `Verification failed for ${manifest.label}. Check your credentials.` });
        } catch (pingErr: any) {
          const msg = pingErr.response?.status === 401 || pingErr.response?.status === 403
            ? "Invalid API key. Authorization failed."
            : `Connection test failed: ${pingErr.message}`;
          return res.status(401).json({ error: msg });
        }
      }

      await engine.saveCredential(service, creds);
      logger.info(`Connection saved: ${service}`);
      res.json({ success: true, message: `${manifest.label} connected successfully.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/connections/:service", async (req, res) => {
    try {
      const { service } = req.params;
      const secrets = await engine.getAllCredentials();
      if (!secrets[service]) return res.status(404).json({ error: `No credentials found for ${service}.` });

      delete secrets[service];
      await engine.storage.writeJson(secrets, "credentials", "secrets.json");
      logger.info(`Connection removed: ${service}`);
      res.json({ success: true, message: `${service} disconnected.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
