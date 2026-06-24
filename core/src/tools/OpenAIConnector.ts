import { z } from "zod";
import { BaseTool, ConnectionManifest } from "./BaseTool";

const OPENAI_MANIFEST: ConnectionManifest = {
  service: "openai",
  label: "OpenAI",
  description: "Connect to OpenAI to use models like gpt-4o and gpt-4o-mini.",
  fields: [
    {
      name: "apiKey",
      label: "API Key",
      type: "password",
      placeholder: "sk-...",
      required: true,
    },
  ],
};

export class OpenAIConnector extends BaseTool {
  name = "openai_connector";
  description = "Connector for OpenAI credentials.";
  schema = z.object({});
  hidden = true;
  connectionManifest = OPENAI_MANIFEST;

  async execute() {
    return "This tool is for connection management only.";
  }
}
