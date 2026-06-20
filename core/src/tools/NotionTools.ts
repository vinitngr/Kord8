import { z } from "zod";
import { BaseTool, ToolContext, ConnectionManifest } from "./BaseTool";
import axios, { AxiosInstance } from "axios";

const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

const NOTION_MANIFEST: ConnectionManifest = {
  service: "notion",
  label: "Notion",
  description: "Connect to your Notion workspace to search, read, and create pages.",
  fields: [
    {
      name: "apiKey",
      label: "Integration Token (PAT)",
      type: "password",
      placeholder: "ntn_xxxxxxxxxxxx or secret_xxxxxxxxxxxx",
      required: true,
    },
  ],
  ping: async (creds) => {
    const resp = await axios.get(`${NOTION_API}/users/me`, {
      headers: {
        Authorization: `Bearer ${creds.apiKey}`,
        "Notion-Version": NOTION_VERSION,
      },
      timeout: 8000,
      validateStatus: (s) => s < 500,
    });
    return resp.status === 200;
  },
};

function notionClient(apiKey: string): AxiosInstance {
  return axios.create({
    baseURL: NOTION_API,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    timeout: 15000,
  });
}

// ─── Tool 1: Search Pages ────────────────────────────────────────────────────

export class NotionSearchPagesTool extends BaseTool {
  name = "notion_search_pages";
  group = "notion";
  description = "Search for pages and databases in a connected Notion workspace.";
  connectionManifest = NOTION_MANIFEST;

  schema = z.object({
    query: z.string().describe("Search query to find pages or databases"),
  });

  async execute(input: { query: string }, context: ToolContext) {
    const creds = this.requireCredential(context, "notion");
    const client = notionClient(creds.apiKey);

    const resp = await client.post("/search", {
      query: input.query,
      page_size: 5,
    });

    const results = resp.data.results.map((r: any) => ({
      id: r.id,
      type: r.object, // "page" or "database"
      title:
        r.properties?.title?.title?.[0]?.plain_text ||
        r.properties?.Name?.title?.[0]?.plain_text ||
        r.title?.[0]?.plain_text ||
        "(Untitled)",
      url: r.url,
      lastEdited: r.last_edited_time,
    }));

    return JSON.stringify(results, null, 2);
  }
}

// ─── Tool 2: Get Page Content ────────────────────────────────────────────────

export class NotionGetPageTool extends BaseTool {
  name = "notion_get_page";
  group = "notion";
  description = "Retrieve the content blocks of a Notion page by its ID.";
  connectionManifest = NOTION_MANIFEST;

  schema = z.object({
    pageId: z.string().describe("The Notion page ID to retrieve"),
  });

  async execute(input: { pageId: string }, context: ToolContext) {
    const creds = this.requireCredential(context, "notion");
    const client = notionClient(creds.apiKey);

    // Get page properties
    const pageResp = await client.get(`/pages/${input.pageId}`);
    const title =
      pageResp.data.properties?.title?.title?.[0]?.plain_text ||
      pageResp.data.properties?.Name?.title?.[0]?.plain_text ||
      "(Untitled)";

    // Get page blocks (content)
    const blocksResp = await client.get(`/blocks/${input.pageId}/children`, {
      params: { page_size: 50 },
    });

    const blocks = blocksResp.data.results.map((b: any) => {
      const type = b.type;
      const content = b[type];
      let text = "";

      if (content?.rich_text) {
        text = content.rich_text.map((t: any) => t.plain_text).join("");
      } else if (content?.title) {
        text = content.title.map((t: any) => t.plain_text).join("");
      } else if (type === "image") {
        text = `[Image: ${content?.file?.url || content?.external?.url || ""}]`;
      } else if (type === "code") {
        text = `\`\`\`${content?.language || ""}\n${content?.rich_text?.map((t: any) => t.plain_text).join("") || ""}\n\`\`\``;
      }

      return { type, text };
    });

    return JSON.stringify({ title, blocks }, null, 2);
  }
}

// ─── Tool 3: Create Page ─────────────────────────────────────────────────────

export class NotionCreatePageTool extends BaseTool {
  name = "notion_create_page";
  group = "notion";
  description = "Create a new page in a Notion database or as a child of another page.";
  connectionManifest = NOTION_MANIFEST;

  schema = z.object({
    parentId: z.string().describe("The parent page ID or database ID"),
    parentType: z.enum(["page", "database"]).default("page").describe("Whether the parent is a page or database"),
    title: z.string().describe("Title of the new page"),
    content: z.string().optional().describe("Plain text content for the page body"),
  });

  async execute(
    input: { parentId: string; parentType: "page" | "database"; title: string; content?: string },
    context: ToolContext
  ) {
    const creds = this.requireCredential(context, "notion");
    const client = notionClient(creds.apiKey);

    const parent =
      input.parentType === "database"
        ? { database_id: input.parentId }
        : { page_id: input.parentId };

    const children: any[] = [];
    if (input.content) {
      children.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: input.content } }],
        },
      });
    }

    const resp = await client.post("/pages", {
      parent,
      properties: {
        title: { title: [{ text: { content: input.title } }] },
      },
      children,
    });

    return JSON.stringify({
      id: resp.data.id,
      url: resp.data.url,
      message: `Page "${input.title}" created successfully.`,
    });
  }
}

// ─── Tool 4: Update Page (Append Content) ─────────────────────────────────────

export class NotionUpdatePageTool extends BaseTool {
  name = "notion_update_page";
  group = "notion";
  description = "Append new content blocks to an existing Notion page.";
  connectionManifest = NOTION_MANIFEST;

  schema = z.object({
    pageId: z.string().describe("The Notion page ID to update"),
    content: z.string().describe("Text content to append to the page"),
  });

  async execute(input: { pageId: string; content: string }, context: ToolContext) {
    const creds = this.requireCredential(context, "notion");
    const client = notionClient(creds.apiKey);

    await client.patch(`/blocks/${input.pageId}/children`, {
      children: [
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", text: { content: input.content } }],
          },
        },
      ],
    });

    return `Content appended to page ${input.pageId} successfully.`;
  }
}

/** Helper to get all Notion tools at once */
export function getAllNotionTools(): BaseTool[] {
  return [
    new NotionSearchPagesTool(),
    new NotionGetPageTool(),
    new NotionCreatePageTool(),
    new NotionUpdatePageTool(),
  ];
}
