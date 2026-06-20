import { BaseTrigger, TriggerContext } from "./BaseTrigger";
import * as crypto from "crypto";

export class GitHubTrigger extends BaseTrigger {
  type = "github";

  getFormSchema() {
    return {
      title: "GitHub Webhook",
      description: "Trigger tasks from GitHub events (Issues, PRs, Push).",
      isWebhook: true,
      fields: [
        {
          name: "instruction",
          label: "Agent Instruction",
          type: "text",
          placeholder: "e.g. Analyze the new issue and suggest a fix",
          required: true,
          description: "What the agent should do when it receives a GitHub event."
        },
        {
          name: "webhookSecret",
          label: "Webhook Secret (Optional)",
          type: "text",
          placeholder: "Secret from GitHub settings",
          required: false,
          description: "If provided, used to verify the X-Hub-Signature-256 header."
        }
      ]
    };
  }

  validate(config: any) {
    if (!config.instruction) {
      throw new Error("Instruction is required for GitHub trigger");
    }
  }

  private context?: TriggerContext;
  private config?: any;

  async start(config: any, context: TriggerContext) {
    this.config = config;
    this.context = context;
  }

  async stop() {
    this.context = undefined;
    this.config = undefined;
  }

  async handleRequest(payload: any, headers?: Record<string, any>) {
    if (!this.context || !this.config) return;

    // Optional: HMAC Verification
    if (this.config.webhookSecret && headers) {
      const signature = headers["x-hub-signature-256"];
      if (signature) {
        const hmac = crypto.createHmac("sha256", this.config.webhookSecret);
        const digest = "sha256=" + hmac.update(JSON.stringify(payload)).digest("hex");
        if (signature !== digest) {
          console.warn("[GitHubTrigger] Invalid signature received");
          return;
        }
      }
    }

    const event = headers?.["x-github-event"] || "unknown event";
    const action = payload.action ? ` (${payload.action})` : "";
    
    // Smart Extraction
    let smartSummary = `### GitHub Event: ${event}${action}\n`;
    smartSummary += `**Repository**: ${payload.repository?.full_name || "N/A"}\n`;
    smartSummary += `**Sender**: ${payload.sender?.login || "N/A"}\n\n`;

    if (event === "issues") {
      smartSummary += `**Issue Title**: ${payload.issue?.title}\n`;
      smartSummary += `**Issue Body**:\n${payload.issue?.body}\n`;
    } else if (event === "pull_request") {
      smartSummary += `**PR Title**: ${payload.pull_request?.title}\n`;
      smartSummary += `**PR Description**:\n${payload.pull_request?.body}\n`;
      smartSummary += `**Changes**: ${payload.pull_request?.commits} commits, ${payload.pull_request?.changed_files} files changed.\n`;
    } else if (event === "push") {
      smartSummary += `**Ref**: ${payload.ref}\n`;
      smartSummary += `**Latest Commit**: ${payload.head_commit?.message} (by ${payload.head_commit?.author?.name})\n`;
    } else if (event === "issue_comment") {
      smartSummary += `**In Issue**: ${payload.issue?.title}\n`;
      smartSummary += `**Comment**:\n${payload.comment?.body}\n`;
    } else {
      // Fallback for unknown events
      smartSummary += `**Payload Details**:\n${JSON.stringify(payload, null, 2).substring(0, 1000)}...\n`;
    }

    const fullInstruction = `${this.config.instruction}\n\n${smartSummary}`;
    
    await this.context.enqueueTask({
      agentId: this.context.agentId,
      instruction: fullInstruction,
      metadata: { trigger: 'github', event, payload }
    });
  }
}
