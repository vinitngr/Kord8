import { BaseTool, ToolContext } from "./BaseTool";
import { z } from "zod";

export class CurlTool extends BaseTool<{ url: string; method?: string; headers?: Record<string, string>; timeout?: number }> {
  name = "network_curl";
  group = "network";
  groupLabel = "Network";
  groupDescription = "HTTP request tools for monitoring and diagnostics.";
  description = "Performs an HTTP request and returns status code, headers, latency, and redirect info. Does NOT return page content.";
  schema = z.object({
    url: z.string().describe("The URL to request"),
    method: z.string().optional().describe("HTTP method (GET, HEAD, POST, etc). Defaults to HEAD"),
    headers: z.record(z.string()).optional().describe("Optional request headers"),
    timeout: z.number().optional().describe("Timeout in ms. Defaults to 10000"),
  });

  async execute(input: { url: string; method?: string; headers?: Record<string, string>; timeout?: number }) {
    const method = (input.method || "HEAD").toUpperCase();
    const timeout = input.timeout || 10000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const start = Date.now();
    try {
      const res = await fetch(input.url, {
        method,
        headers: input.headers,
        redirect: "follow",
        signal: controller.signal,
      });

      const latency = Date.now() - start;
      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => { responseHeaders[k] = v; });

      return JSON.stringify({
        url: input.url,
        status: res.status,
        statusText: res.statusText,
        latency: `${latency}ms`,
        redirected: res.redirected,
        finalUrl: res.url,
        contentType: res.headers.get("content-type") || "unknown",
        contentLength: res.headers.get("content-length") || "unknown",
        server: res.headers.get("server") || "unknown",
        headers: responseHeaders,
      }, null, 2);
    } catch (err: any) {
      const latency = Date.now() - start;
      return JSON.stringify({
        url: input.url,
        status: 0,
        statusText: "Unreachable",
        details: err.name === "AbortError" ? `Timeout after ${timeout}ms` : err.message,
        latency: `${latency}ms`,
      }, null, 2);
    } finally {
      clearTimeout(timer);
    }
  }
}

export function getAllNetworkTools(): BaseTool<any>[] {
  return [new CurlTool()];
}
