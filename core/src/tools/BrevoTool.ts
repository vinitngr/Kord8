import { BaseTool, ToolContext, ConnectionManifest } from "./BaseTool";
import { z } from "zod";
import axios from "axios";

const BREVO_MANIFEST: ConnectionManifest = {
  service: "brevo",
  label: "Brevo",
  description: "Brevo (formerly Sendinblue) transactional email service.",
  fields: [
    { name: "apiKey", label: "API Key", type: "password", placeholder: "xkeysib-...", required: true },
    { name: "senderEmail", label: "Sender Email", type: "text", placeholder: "you@example.com", required: true },
    { name: "senderName", label: "Sender Name", type: "text", placeholder: "My App", required: true },
  ],
  ping: async (creds) => {
    const res = await axios.get("https://api.brevo.com/v3/account", {
      headers: { "api-key": creds.apiKey },
    });
    return res.status === 200;
  },
};

export class BrevoSendEmailTool extends BaseTool<{
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent?: string;
  textContent?: string;
}> {
  name = "brevo_send_email";
  group = "brevo";
  groupLabel = "Brevo";
  groupDescription = "Email tools powered by Brevo.";
  description = "Send a transactional email via Brevo.";
  connectionManifest = BREVO_MANIFEST;
  schema = z.object({
    to: z.array(z.object({
      email: z.string().describe("Recipient email"),
      name: z.string().optional().describe("Recipient name"),
    })).describe("List of recipients"),
    subject: z.string().describe("Email subject line"),
    htmlContent: z.string().optional().describe("HTML body"),
    textContent: z.string().optional().describe("Plain text body"),
  });

  async execute(input: { to: { email: string; name?: string }[]; subject: string; htmlContent?: string; textContent?: string }, context: ToolContext) {
    const creds = this.requireCredential(context, "brevo");

    const payload: any = {
      sender: { email: creds.senderEmail, name: creds.senderName },
      to: input.to,
      subject: input.subject,
    };
    if (input.htmlContent) payload.htmlContent = input.htmlContent;
    if (input.textContent) payload.textContent = input.textContent;
    if (!input.htmlContent && !input.textContent) payload.textContent = "(empty)";

    const res = await axios.post("https://api.brevo.com/v3/smtp/email", payload, {
      headers: { "api-key": creds.apiKey, "Content-Type": "application/json" },
    });

    return JSON.stringify({ success: true, messageId: res.data.messageId });
  }
}

export function getAllBrevoTools(): BaseTool<any>[] {
  return [new BrevoSendEmailTool()];
}
