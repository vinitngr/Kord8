import { AgentTeam } from "../agent/AgentTeam";
import { SessionLogger, Logger, LogLevel } from "../utils/logger";
import { ToolContext } from "../tools/BaseTool";
import { buildSystemPrompt } from "../prompt/system";
import { getDirectoryStructure, getFormattedDate } from "../utils/prompt-utils";
import fs from "fs/promises";
import path from "path";

export interface ExecutionTask {
  agentId: string;
  instruction: string;
  metadata?: any;
  streaming?: boolean;
}

export interface AgentConfig {
  id: string;
  name?: string;
  description?: string;
  instruction: string;
  provider: string;
  model: string;
  tools: string[];
  maxIterations?: number;
}

const DEFAULT_TASK_TIMEOUT = 120_000;
const DEFAULT_TOOL_TIMEOUT = 30_000;
const DEFAULT_MAX_STEPS = 10;
const STREAM_IDLE_TIMEOUT = 30_000;
const TIMEOUT_SYMBOL = Symbol("timeout");

export class Worker {
  private logger = Logger.scope("worker");

  constructor(private app: AgentTeam) {}

  async execute(task: ExecutionTask): Promise<void> {
    const sessionId = `sess_${Date.now()}`;
    const sessionLogger = new SessionLogger(
      this.app.storage,
      task.agentId,
      sessionId
    );

    this.app.emit("task:start", {
      agentId: task.agentId,
      sessionId,
      metadata: task.metadata,
    });
    await sessionLogger.log("agent_init", `Initializing agent: ${task.agentId}`, { metadata: task.metadata });

    if (task.metadata?.trigger) {
      await sessionLogger.log("trigger_activated", `Task triggered by: ${task.metadata.trigger}`, task.metadata);
    }

    const agentConfig = this.app.agents.get(task.agentId);
    if (!agentConfig) {
      throw new Error(`Agent not found: ${task.agentId}`);
    }

    if (agentConfig.enabled === false) {
      throw new Error(`Agent ${task.agentId} is currently disabled/paused.`);
    }

    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout | undefined;
    let isTaskTimeout = false;

    try {
      const result = await Promise.race([
        this.runTask(task, sessionId, sessionLogger, agentConfig, controller),
        new Promise((resolve) => {
          timeoutId = setTimeout(() => {
            isTaskTimeout = true;
            controller.abort();
            this.app.emit("task:timeout", {
              agentId: task.agentId,
              sessionId,
            });
            resolve(TIMEOUT_SYMBOL);
          }, DEFAULT_TASK_TIMEOUT);
        }),
      ]);

      if (result === TIMEOUT_SYMBOL) {
        throw new Error("Task execution timed out");
      }
    } catch (err: any) {
      const errorToHandle = isTaskTimeout ? new Error("Task execution timed out") : err;
      await this.handleExecutionError(task, sessionId, sessionLogger, errorToHandle);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  private async runTask(
    task: ExecutionTask,
    sessionId: string,
    sessionLogger: SessionLogger,
    agentConfig: AgentConfig,
    controller: AbortController
  ) {
    const signal = controller.signal;
    const sessionPath = ["sessions", task.agentId, sessionId];

    const sessionData = {
      id: sessionId,
      agentId: task.agentId,
      status: "running",
      startedAt: new Date().toISOString(),
      instruction: task.instruction,
      metadata: task.metadata || {},
      messages: [],
    };

    await this.app.storage.writeJson(
      sessionData,
      ...sessionPath,
      "session.json"
    );

    const provider = this.app.providers.get(agentConfig.provider);
    if (!provider) {
      throw new Error(`Provider not found: ${agentConfig.provider}`);
    }

    const secrets = await this.app.getAllCredentials();
    const providerCreds = secrets[agentConfig.provider] || {};

    let toolCallCount = 0;
    const maxSteps = agentConfig.maxIterations || DEFAULT_MAX_STEPS;

    const activeTools: Record<string, any> = {};

    for (const toolName of agentConfig.tools) {
      const toolInstance = this.app.tools.get(toolName);
      if (!toolInstance) continue;

      activeTools[toolName] = {
        description: toolInstance.description,
        inputSchema: toolInstance.schema,
        execute: async (input: any) => {
          toolCallCount++;

          if (toolCallCount > maxSteps) {
            throw new Error(`Max tool calls exceeded (${maxSteps})`);
          }

          this.app.emit("tool:start", {
            agentId: task.agentId,
            sessionId,
            toolName,
            input
          });
          await sessionLogger.log("tool_call", `Calling tool: ${toolName}`, input, LogLevel.DEBUG);

          const toolController = new AbortController();
          const onAbort = () => toolController.abort();
          signal.addEventListener("abort", onAbort);

          let timeoutId: NodeJS.Timeout | undefined;
          let isToolTimeout = false;

          try {
            const result = await Promise.race([
              toolInstance.execute(input, {
                sessionId,
                agentId: task.agentId,
                logger: sessionLogger,
                agentConfig,
                metadata: task.metadata,
                getCredential: (name: string) => secrets[name],
                app: this.app,
                signal: toolController.signal,
              } as ToolContext),
              new Promise((resolve) => {
                timeoutId = setTimeout(() => {
                  isToolTimeout = true;
                  toolController.abort();
                  resolve(TIMEOUT_SYMBOL);
                }, DEFAULT_TOOL_TIMEOUT);
              }),
            ]);

            if (result === TIMEOUT_SYMBOL) {
              const timeoutErr = new Error(`Tool ${toolName} timed out after ${DEFAULT_TOOL_TIMEOUT}ms`);
              this.app.emit("tool:error", {
                agentId: task.agentId,
                sessionId,
                toolName,
                error: timeoutErr.message,
              });
              throw timeoutErr;
            }

            this.app.emit("tool:completed", {
              agentId: task.agentId,
              sessionId,
              toolName,
              result
            });
            await sessionLogger.log("tool_result", `Result from ${toolName}:`, result, LogLevel.DEBUG);

            return result;
          } catch (err: any) {
            this.app.emit("tool:error", {
              agentId: task.agentId,
              sessionId,
              toolName,
              error: err.message
            });
            await sessionLogger.log("error", `Tool ${toolName} failed: ${err.message}`, { error: err.message });
            throw err;
          } finally {
            if (timeoutId) clearTimeout(timeoutId);
            signal.removeEventListener("abort", onAbort);
          }
        },
      };
    }
    await sessionLogger.log("agent_init", `Session started for ${task.agentId}`, { metadata: task.metadata });
    await sessionLogger.log("tools_loaded", `Loaded ${Object.keys(activeTools).length} tools`, { tools: Object.keys(activeTools) });

    const skillPath = path.join(
      this.app.storage.resolvePath("agents"),
      task.agentId,
      "skills",
      "SKILL.md"
    );

    const agentPath = this.app.storage.resolvePath("agents", task.agentId);
    const [skillContent, directoryStructure] = await Promise.all([
      fs.readFile(skillPath, "utf-8").catch(() => ""),
      getDirectoryStructure(agentPath)
    ]);

    const systemPrompt = buildSystemPrompt({
      agentName: agentConfig.name || task.agentId,
      agentDescription: agentConfig.description || "A task-oriented autonomous agent.",
      agentInstruction: agentConfig.instruction,
      skills: skillContent,
      maxSteps: maxSteps,
      todayDate: getFormattedDate(),
      sessionId: sessionId,
      agentPath: agentPath,
      directoryStructure: directoryStructure
    });

    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: task.instruction,
      },
    ];

    this.app.emit("llm:start", { agentId: task.agentId, sessionId });
    await sessionLogger.log("llm_request", "Starting streaming LLM flow...");

    const result = await provider.generate({
      model: agentConfig.model,
      messages,
      tools: activeTools,
      stream: !!task.streaming,
      credentials: providerCreds,
      maxSteps,
      signal,
    });

    if (task.streaming && result.stream) {
      let idleTimer: NodeJS.Timeout | undefined;

      const resetTimer = () => {
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
          controller.abort();
        }, STREAM_IDLE_TIMEOUT);
      };

      resetTimer();

      try {
        for await (const chunk of result.stream) {
          if (signal.aborted) {
            throw new Error("Stream aborted");
          }

          if (chunk.type === 'text-delta') {
            this.app.emit("llm:chunk", {
              agentId: task.agentId,
              sessionId,
              chunk: chunk.textDelta
            });
          } else if (chunk.type === 'error') {
            this.app.emit("llm:error", {
              agentId: task.agentId,
              sessionId,
              error: (chunk as any).error
            });
            await sessionLogger.log("error", `Stream error encountered: ${String((chunk as any).error)}`, { error: (chunk as any).error });
            throw new Error(`LLM Stream Error: ${String((chunk as any).error)}`);
          }

          resetTimer();
        }
      } finally {
        if (idleTimer) clearTimeout(idleTimer);
      }
    }

    this.app.emit("llm:completed", {
      agentId: task.agentId,
      sessionId,
    });

    // Resolve final data (might be promises from provider)
    const [finalMessages, finalText, finalUsage, finalSteps] = await Promise.all([
      Promise.resolve(result.messages),
      Promise.resolve(result.text),
      Promise.resolve(result.usage),
      Promise.resolve(result.steps),
    ]);

    const finalSession = {
      ...sessionData,
      status: "completed",
      endedAt: new Date().toISOString(),
      messages: finalMessages,
      result: finalText,
      usage: finalUsage,
      toolCalls: toolCallCount,
      steps: Math.max(toolCallCount, finalSteps.length),
      instruction: task.instruction,
      events: sessionLogger.getEvents(),
    };

    await this.app.storage.writeJson(
      finalSession,
      ...sessionPath,
      "session.json"
    );

    await sessionLogger.log("task_completed", "Task execution finished successfully.");

    this.app.emit("task:completed", {
      agentId: task.agentId,
      sessionId,
      instruction: task.instruction,
      usage: result.usage,
    });

    this.logger.info(
      `Task completed: ${sessionId} (Agent: ${task.agentId})`
    );
  }

  private async handleExecutionError(
    task: ExecutionTask,
    sessionId: string,
    sessionLogger: SessionLogger,
    error: any
  ) {
    const sessionPath = ["sessions", task.agentId, sessionId];

    const isAbort = error.name === "AbortError" || 
                    error.message?.toLowerCase().includes("timed out") || 
                    error.message?.toLowerCase().includes("aborted");

    const failedSession = {
      id: sessionId,
      agentId: task.agentId,
      status: "failed",
      error: isAbort ? "Task aborted" : (error?.message || "Unknown error"),
      endedAt: new Date().toISOString(),
      events: sessionLogger.getEvents(),
    };

    await this.app.storage.writeJson(
      failedSession,
      ...sessionPath,
      "session.json"
    );

    this.app.emit("task:failed", {
      agentId: task.agentId,
      sessionId,
      instruction: task.instruction,
      error: error?.message,
    });

    this.logger.error(`Task failed: ${sessionId}`, error);
  }
}