import { z } from "zod";
import { BaseTool, ToolContext, ConnectionManifest } from "./BaseTool";
import axios from "axios";

export class FirecrawlerFetchTool extends BaseTool {
  name = "firecrawler_fetch";
  description = "Fetch and extract the content of any website URL as clean markdown using the Firecrawl API.";

  connectionManifest: ConnectionManifest = {
    service: "firecrawler",
    label: "Firecrawl Web Scraper",
    description: "Extract clean content from any web page via Firecrawl API.",
    fields: [
      { name: "apiKey", label: "API Key", type: "password", placeholder: "Enter your Firecrawl API key", required: true },
    ],
    ping: async (creds) => {
      const resp = await axios.get("https://api.firecrawl.dev/v1/scrape", {
        headers: { Authorization: `Bearer ${creds.apiKey}` },
        params: { url: "https://example.com" },
        timeout: 10000,
        validateStatus: (s) => s < 500,
      });
      return resp.status === 200;
    },
  };

  schema = z.object({
    url: z.string().url().describe("The URL to fetch and extract content from"),
  });

  async execute(input: { url: string }, context: ToolContext) {
    const creds = this.requireCredential(context, "firecrawler");
    if (!creds.apiKey) {
      throw new Error(`[firecrawler_fetch] Missing "apiKey" in Firecrawl credentials.`);
    }

    const response = await axios.post(
      "https://api.firecrawl.dev/v1/scrape",
      {
        url: input.url,
        formats: ["markdown"],
      },
      {
        headers: {
          Authorization: `Bearer ${creds.apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    if (!response.data?.success) {
      throw new Error(`Firecrawl failed to scrape ${input.url}: ${response.data?.error || "Unknown error"}`);
    }

    const markdown = response.data.data?.markdown || "";
    return markdown.length > 4000 ? markdown.substring(0, 4000) + "\n\n...(truncated)" : markdown;
  }
}
