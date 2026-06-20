import { generateText, stepCountIs, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import * as dotenv from "dotenv";

dotenv.config();

async function runTest() {
  const getWeather = tool({
    description: "Get the weather for a location",
    inputSchema: z.object({ location: z.string() }),
    execute: async ({ location }) => {
      console.log(`[Tool] Executing getWeather for ${location}`);
      return { weather: "Sunny", temp: 25 };
    }
  });

  const sendEmail = tool({
    description: "Send an email to a user",
    inputSchema: z.object({ email: z.string(), subject: z.string(), body: z.string() }),
    execute: async ({ email, subject, body }) => {
      console.log(`[Tool] Executing sendEmail to ${email} with subject: ${subject}`);
      return { status: "success", message: "Email sent" };
    }
  });

  console.log("Starting generateText...");
  try {
    const result = await generateText({
      model: openai("gpt-4o-mini"),
      messages: [
        { role: "user", content: "Check the weather in Tokyo and then send an email to test@example.com telling them what the weather is." }
      ],
      tools: {
        getWeather,
        sendEmail
      },
      stopWhen: stepCountIs(6),
      maxRetries: 0,
    });

    console.log("\n======================");
    console.log("Final text:", result.text);
    console.log("Steps taken:", result.steps.length);
    for (let i = 0; i < result.steps.length; i++) {
      const step = result.steps[i];
      console.log(`- Step ${i + 1} with ${step.toolCalls.length} tool calls`);
      for (const tc of step.toolCalls) {
        console.log(`  * Tool: ${tc.toolName}`);
      }
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

runTest();
