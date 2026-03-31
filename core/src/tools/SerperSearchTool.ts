import { z } from "zod";
import { BaseTool, ToolContext, ConnectionManifest } from "./BaseTool";
import axios from "axios";

export class SerperSearchTool extends BaseTool {
  name = "serper_search";
  description = "Search the web using Serper.dev API to get real-time search results.";

  connectionManifest: ConnectionManifest = {
    service: "serper",
    label: "Serper Web Search",
    description: "Real-time Google search results via Serper.dev API.",
    fields: [
      { name: "apiKey", label: "API Key", type: "password", placeholder: "Enter your Serper API key", required: true },
    ],
    ping: async (creds) => {
      const resp = await axios.post(
        "https://google.serper.dev/search",
        { q: "test" },
        { headers: { "X-API-KEY": creds.apiKey, "Content-Type": "application/json" }, timeout: 8000 }
      );
      return resp.status === 200;
    },
  };

  schema = z.object({
    query: z.string().describe("The search query to perform"),
  });

  async execute(input: { query: string }, context: ToolContext) {
    const creds = this.requireCredential(context, "serper");
    if (!creds.apiKey) {
      throw new Error(`[serper_search] Missing "apiKey" in Serper credentials.`);
    }

    const response = await axios.post(
      "https://google.serper.dev/search",
      { q: input.query },
      {
        headers: {
          "X-API-KEY": creds.apiKey,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    const results = response.data.organic || [];
    const formatted = results.slice(0, 5).map((r: any) => ({
      title: r.title,
      link: r.link,
      snippet: r.snippet,
    }));

    return JSON.stringify(formatted, null, 2);
  }
}
