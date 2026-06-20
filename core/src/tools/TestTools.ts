import { BaseTool, ToolContext } from "./BaseTool";
import { z } from "zod";

export class EchoTool extends BaseTool<{ text: string }> {
  name = "test_echo";
  group = "test";
  groupLabel = "Test";
  groupDescription = "Tools for testing and development.";
  description = "Echos back the input text. Useful for testing tool calls.";
  schema = z.object({
    text: z.string().describe("The text to echo"),
  });

  async execute(input: { text: string }, context: ToolContext) {
    return `Echo: ${input.text}`;
  }
}

export function getAllTestTools(): BaseTool<any>[] {
  return [new EchoTool()];
}
