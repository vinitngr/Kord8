import { createOpenAI } from "@ai-sdk/openai";
import { generateText, streamText, stepCountIs } from "ai";
import { ModelProvider, ModelResult } from "./ModelProvider";

export class OpenAIProvider extends ModelProvider {
  name = "openai";

  getModels(): string[] {
    return [
      "gpt-4o",
      "gpt-4o-mini",
      "gpt-4-turbo",
      "gpt-3.5-turbo",
      "o1-preview",
      "o1-mini"
    ];
  }

  async generate(options: {
    model: string;
    messages: any[];
    tools?: Record<string, any>;
    stream?: boolean;
    credentials?: any;
    maxSteps?: number;
    signal?: AbortSignal;
  }): Promise<ModelResult> {
    const openai = createOpenAI({
      apiKey: options.credentials?.apiKey,
    });
    const model = openai(options.model);

    const config = {
      model,
      messages: options.messages,
      tools: options.tools,
      toolChoice: "auto" as any,
      stopWhen: stepCountIs(options.maxSteps || 10),
      abortSignal: options.signal,
      maxRetries: 0,
    };

    if (options.stream) {
      const sdkResult = streamText(config);
      
      return {
        messages: (sdkResult as any).fullMessages ?? (sdkResult as any).responseMessages ?? Promise.resolve([]),
        text: sdkResult.text as any,
        usage: sdkResult.usage as any,
        steps: sdkResult.steps as any,
        stream: sdkResult.fullStream
      };
    }

    const sdkResult = await generateText(config) as any;
    return {
      messages: sdkResult.responseMessages || sdkResult.messages || [],
      text: sdkResult.text,
      usage: sdkResult.usage,
      steps: sdkResult.steps,
    };
  }
}
