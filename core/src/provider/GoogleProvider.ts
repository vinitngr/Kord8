import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, streamText, stepCountIs } from "ai";
import { ModelProvider, ModelResult } from "./ModelProvider";

export class GoogleProvider extends ModelProvider {
  name = "google";

  getModels(): string[] {
    return [
      "gemini-2.0-flash",
      "gemini-2.5-pro",
      "gemini-flash-lite-latest",
      "gemini-3-flash"
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
    const google = createGoogleGenerativeAI({
      apiKey: options.credentials?.apiKey,
    });
    
    const modelId = options.model.startsWith("models/") ? options.model : `${options.model}`;
    const model = google(modelId);

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
      const sdkResult = streamText(config as any);
      
      return {
        messages: (sdkResult as any).fullMessages ?? (sdkResult as any).responseMessages ?? Promise.resolve([]),
        text: sdkResult.text as any,
        usage: sdkResult.usage as any,
        steps: sdkResult.steps as any,
        stream: sdkResult.fullStream
      };
    }

    const sdkResult = await generateText(config as any) as any;
    return {
      messages: sdkResult.responseMessages || sdkResult.messages || [],
      text: sdkResult.text,
      usage: sdkResult.usage,
      steps: sdkResult.steps,
    };
  }
}
