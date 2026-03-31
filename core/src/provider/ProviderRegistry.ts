import { ModelProvider } from "./ModelProvider";

export class ProviderRegistry {
  private providers: Map<string, ModelProvider> = new Map();

  register(provider: ModelProvider): void {
    this.providers.set(provider.name, provider);
  }

  get(name: string): ModelProvider | undefined {
    return this.providers.get(name);
  }

  list(): ModelProvider[] {
    return Array.from(this.providers.values());
  }
}
