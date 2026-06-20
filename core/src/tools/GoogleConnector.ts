import { z } from "zod";
import { BaseTool, ConnectionManifest } from "./BaseTool";

const GOOGLE_MANIFEST: ConnectionManifest = {
  service: "google",
  label: "Google AI (Gemini)",
  description: "Connect to Google AI to use Gemini models like gemini-2.0-flash and gemini-1.5-pro.",
  fields: [
    {
      name: "apiKey",
      label: "API Key",
      type: "password",
      placeholder: "AIza...",
      required: true,
    },
  ],
};

export class GoogleConnector extends BaseTool {
  name = "google_connector";
  description = "Connector for Google AI credentials.";
  schema = z.object({});
  hidden = true;
  connectionManifest = GOOGLE_MANIFEST;

  async execute() {
    return "This tool is for connection management only.";
  }
}
