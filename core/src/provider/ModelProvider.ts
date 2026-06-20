export interface ModelResult {
  text: string | Promise<string>;
  messages: any[] | Promise<any[]>;
  usage: any | Promise<any>;
  steps: any[] | Promise<any[]>;
  stream?: AsyncIterable<any>;
}

export abstract class ModelProvider {
  abstract name: string;
  abstract getModels(): string[];

  abstract generate(options: {
    model: string;
    messages: any[];
    tools?: Record<string, any>;
    stream?: boolean;
    credentials?: any;
    maxSteps?: number;
    signal?: AbortSignal;
  }): Promise<ModelResult>;
}
