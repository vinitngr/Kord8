import { useState, useEffect, useRef } from "react";
import { 
  Sparkles, RotateCcw, Rocket, Pencil, Bot, Boxes, Wrench, 
  Clock, Webhook, GitBranch, Share2, Shield, ArrowRight, Check,
  ChevronRight
} from "lucide-react";
import { Button } from "../shared/Button";
import { cn } from "../../lib/utils";
import { useAgents, usePods } from "../../hooks/useStore";

/* ═══════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════ */

interface BlueprintAgent {
  id: string;
  name: string;
  description: string;
  instruction: string;
  tools: string[];
  triggers: { type: string; config: any }[];
  model: string;
}

interface BlueprintPod {
  name: string;
  goal: string;
  routingMode: 'swarm' | 'pipeline' | 'coordinated';
}

interface Blueprint {
  type: 'agent' | 'pod';
  prompt: string;
  agents: BlueprintAgent[];
  pod?: BlueprintPod;
}

type StudioStatus = 'idle' | 'generating' | 'ready' | 'deployed';

/* ═══════════════════════════════════════════════
   MOCK AI — Replace with real LLM call later
   ═══════════════════════════════════════════════ */

const EXAMPLE_PROMPTS = [
  "Monitor my website and email me if it goes down",
  "Every morning, summarize Slack messages and post to Notion",
  "Research competitors weekly and create a report",
  "When a GitHub issue is created, analyze it and assign priority",
];

function mockGenerateBlueprint(prompt: string): Promise<Blueprint> {
  const lower = prompt.toLowerCase();
  
  // Multi-agent scenarios
  const isComplex = lower.includes("and") || lower.includes("then") || 
                    lower.includes("every") || lower.includes("research") ||
                    lower.includes("monitor") || lower.includes("workflow");

  return new Promise((resolve) => {
    setTimeout(() => {
      if (isComplex) {
        // Generate a Pod with multiple agents
        const agents: BlueprintAgent[] = [];
        
        if (lower.includes("monitor") || lower.includes("website") || lower.includes("down")) {
          agents.push({
            id: 'bp-1',
            name: 'Site Monitor',
            description: 'Periodically checks website health and uptime.',
            instruction: `Monitor the target URL. If the site returns a non-200 status code or takes longer than 5 seconds to respond, flag it as "down" and pass the alert to the next agent.`,
            tools: ['network_curl'],
            triggers: [{ type: 'cron', config: { schedule: '*/5 * * * *' } }],
            model: 'gpt-4o',
          });
          agents.push({
            id: 'bp-2',
            name: 'Alert Notifier',
            description: 'Sends email/Slack notifications when issues are detected.',
            instruction: `When you receive a "down" alert from the Site Monitor, immediately send an email notification with the site URL, status code, and timestamp.`,
            tools: ['send_email'],
            triggers: [],
            model: 'gpt-4o-mini',
          });
        } else if (lower.includes("slack") || lower.includes("notion") || lower.includes("summarize")) {
          agents.push({
            id: 'bp-1',
            name: 'Message Collector',
            description: 'Gathers messages from Slack channels.',
            instruction: 'Collect all unread messages from the specified Slack channels since the last run. Group them by channel and thread.',
            tools: ['slack_read'],
            triggers: [{ type: 'cron', config: { schedule: '0 9 * * 1-5' } }],
            model: 'gpt-4o',
          });
          agents.push({
            id: 'bp-2',
            name: 'Summarizer',
            description: 'Creates concise summaries from raw messages.',
            instruction: 'Take the collected messages and create a concise daily digest. Highlight action items, decisions, and open questions.',
            tools: ['search'],
            triggers: [],
            model: 'gpt-4o',
          });
          agents.push({
            id: 'bp-3',
            name: 'Publisher',
            description: 'Posts formatted summaries to Notion.',
            instruction: 'Take the daily digest and create a new Notion page under the "Daily Standups" database with today\'s date as the title.',
            tools: ['notion_create'],
            triggers: [],
            model: 'gpt-4o-mini',
          });
        } else {
          // Generic multi-agent
          agents.push({
            id: 'bp-1',
            name: 'Data Gatherer',
            description: 'Collects and organizes information from various sources.',
            instruction: `Based on the objective: "${prompt}". Gather relevant data from available sources and structure it for analysis.`,
            tools: ['search', 'network_curl'],
            triggers: [{ type: 'cron', config: { schedule: '0 9 * * 1' } }],
            model: 'gpt-4o',
          });
          agents.push({
            id: 'bp-2',
            name: 'Analyst',
            description: 'Analyzes gathered data and produces actionable insights.',
            instruction: `Analyze the data received from Data Gatherer. Produce a structured report with findings and recommendations.`,
            tools: ['search'],
            triggers: [],
            model: 'gpt-4o',
          });
        }

        resolve({
          type: 'pod',
          prompt,
          agents,
          pod: {
            name: generatePodName(prompt),
            goal: prompt,
            routingMode: 'pipeline',
          }
        });
      } else {
        // Simple single-agent
        const tools: string[] = [];
        const triggers: { type: string; config: any }[] = [];
        
        if (lower.includes("email")) tools.push('send_email');
        if (lower.includes("search") || lower.includes("find")) tools.push('search');
        if (lower.includes("github") || lower.includes("issue")) tools.push('create_issue');
        if (tools.length === 0) tools.push('search');
        
        if (lower.includes("when") || lower.includes("webhook")) {
          triggers.push({ type: 'webhook', config: { path: '/studio-trigger' } });
        }
        
        resolve({
          type: 'agent',
          prompt,
          agents: [{
            id: 'bp-1',
            name: generateAgentName(prompt),
            description: prompt.slice(0, 80),
            instruction: `Your task: ${prompt}. Execute this autonomously using the tools available to you.`,
            tools,
            triggers,
            model: 'gpt-4o',
          }],
        });
      }
    }, 2200);
  });
}

function generatePodName(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes("monitor")) return "Site Monitor Pipeline";
  if (lower.includes("slack") || lower.includes("summarize")) return "Daily Digest Pipeline";
  if (lower.includes("research") || lower.includes("competitor")) return "Research & Report Team";
  return "Auto-Generated Pod";
}

function generateAgentName(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes("email")) return "Email Agent";
  if (lower.includes("search")) return "Search Agent";
  if (lower.includes("github")) return "GitHub Agent";
  return "Custom Agent";
}

/* ═══════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════ */

export function StudioView() {
  const { addAgent } = useAgents();
  const { addPod } = usePods();
  
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<StudioStatus>('idle');
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [generatingPhase, setGeneratingPhase] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const phases = [
    "Analyzing your request...",
    "Designing agents...",
    "Configuring tools & triggers...",
    "Building blueprint...",
  ];

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [prompt]);

  // Phase animation during generation
  useEffect(() => {
    if (status !== 'generating') return;
    const interval = setInterval(() => {
      setGeneratingPhase(p => (p + 1) % phases.length);
    }, 600);
    return () => clearInterval(interval);
  }, [status]);

  const handleGenerate = async () => {
    if (!prompt.trim() || status === 'generating') return;
    setStatus('generating');
    setGeneratingPhase(0);
    
    try {
      const result = await mockGenerateBlueprint(prompt);
      setBlueprint(result);
      setStatus('ready');
    } catch {
      setStatus('idle');
    }
  };

  const handleDeploy = async () => {
    if (!blueprint) return;
    
    const agentIds: string[] = [];
    
    for (const bpAgent of blueprint.agents) {
      const newId = await addAgent({
        name: bpAgent.name,
        description: bpAgent.description,
        instruction: bpAgent.instruction,
        tools: bpAgent.tools,
        triggers: bpAgent.triggers.map((t, i) => ({ id: `studio-t-${i}`, ...t })),
        model: bpAgent.model,
        temperature: 0.7,
        maxIterations: 10,
      });
      if (newId) agentIds.push(newId);
    }
    
    if (blueprint.type === 'pod' && blueprint.pod && agentIds.length > 0) {
      await addPod({
        name: blueprint.pod.name,
        goal: blueprint.pod.goal,
        agentIds,
        routingMode: blueprint.pod.routingMode,
        maxRounds: 10,
      });
    }
    
    setStatus('deployed');
  };

  const handleReset = () => {
    setPrompt("");
    setBlueprint(null);
    setStatus('idle');
    setGeneratingPhase(0);
  };

  const routingModeIcons: Record<string, any> = {
    swarm: Share2, pipeline: GitBranch, coordinated: Shield,
  };
  const routingModeLabels: Record<string, string> = {
    swarm: 'Swarm (Decentralized)', pipeline: 'Pipeline (Sequential)', coordinated: 'Coordinated (Centralized)',
  };

  /* ─── RENDER ─── */
  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090B] overflow-y-auto custom-scrollbar">
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 max-w-[800px] w-full mx-auto">
        
        {/* ═══ IDLE STATE — Prompt Input ═══ */}
        {(status === 'idle' || status === 'generating') && (
          <div className="w-full flex flex-col items-center gap-8">
            
            {/* Hero */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#FF4A00]/10 to-[#8B5CF6]/10 border border-[#FF4A00]/20 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-[#FF4A00]" />
                <span className="text-[11px] font-bold text-[#FF4A00] uppercase tracking-wider">AI Studio</span>
              </div>
              <h1 className="text-[28px] font-bold text-[#FAFAFA] leading-tight">
                Describe it. We'll build it.
              </h1>
              <p className="text-[14px] text-[#52525B] max-w-md mx-auto leading-relaxed">
                Tell us what you want to automate in plain English. The AI will create the agents, tools, triggers, and team structure for you.
              </p>
            </div>

            {/* Prompt Area */}
            <div className={cn(
              "w-full rounded-2xl border transition-all duration-300 relative overflow-hidden",
              status === 'generating' 
                ? "border-[#FF4A00]/40 shadow-[0_0_40px_rgba(255,74,0,0.08)]" 
                : "border-[#27272A] hover:border-[#3F3F46] focus-within:border-[#FF4A00]/40 focus-within:shadow-[0_0_40px_rgba(255,74,0,0.08)]"
            )}>
              {/* Gradient accent line */}
              <div className="h-[2px] w-full bg-gradient-to-r from-[#FF4A00] via-[#8B5CF6] to-[#FF4A00] opacity-30" />
              
              <div className="p-5 bg-[#000]">
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
                  placeholder="e.g. Monitor my website and email me if it goes down..."
                  disabled={status === 'generating'}
                  rows={1}
                  className="w-full bg-transparent text-[15px] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:outline-none resize-none leading-relaxed disabled:opacity-50"
                />
              </div>
              
              <div className="px-5 py-3 bg-[#09090B] border-t border-[#18181B] flex items-center justify-between">
                {status === 'generating' ? (
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full border-2 border-[#3F3F46] border-t-[#FF4A00] animate-spin" />
                    <span className="text-[12px] text-[#FF4A00] font-medium animate-pulse">{phases[generatingPhase]}</span>
                  </div>
                ) : (
                  <span className="text-[11px] text-[#27272A]">Press Enter to generate • Shift+Enter for new line</span>
                )}
                <button 
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || status === 'generating'}
                  className={cn(
                    "h-9 px-5 rounded-xl font-semibold text-[13px] flex items-center gap-2 transition-all",
                    prompt.trim() && status !== 'generating'
                      ? "bg-[#FF4A00] hover:bg-[#E64300] text-white shadow-lg shadow-[#FF4A00]/20"
                      : "bg-[#18181B] text-[#3F3F46] cursor-not-allowed"
                  )}
                >
                  <Sparkles className="h-3.5 w-3.5" /> Generate
                </button>
              </div>
            </div>

            {/* Example prompts */}
            {status === 'idle' && (
              <div className="w-full space-y-2">
                <p className="text-[10px] font-bold text-[#27272A] uppercase tracking-wider text-center">Try an example</p>
                <div className="grid grid-cols-2 gap-2">
                  {EXAMPLE_PROMPTS.map((ex, i) => (
                    <button 
                      key={i}
                      onClick={() => setPrompt(ex)}
                      className="p-3 bg-[#000] border border-[#18181B] rounded-xl text-left text-[12px] text-[#52525B] hover:text-[#A1A1AA] hover:border-[#27272A] transition-all leading-relaxed"
                    >
                      <ChevronRight className="h-3 w-3 inline mr-1.5 text-[#FF4A00] opacity-50" />
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ READY STATE — Blueprint Preview ═══ */}
        {status === 'ready' && blueprint && (
          <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#FF4A00]" />
                  <h2 className="text-[18px] font-bold text-[#FAFAFA]">Blueprint Ready</h2>
                </div>
                <p className="text-[12px] text-[#52525B] max-w-lg truncate">"{blueprint.prompt}"</p>
              </div>
              <button onClick={handleReset} className="text-[12px] text-[#52525B] hover:text-[#A1A1AA] flex items-center gap-1.5 transition-colors">
                <RotateCcw className="h-3 w-3" /> Start over
              </button>
            </div>

            {/* System type badge */}
            <div className={cn(
              "p-4 rounded-xl border flex items-center gap-4",
              blueprint.type === 'pod' 
                ? "bg-[#8B5CF6]/5 border-[#8B5CF6]/20" 
                : "bg-[#FF4A00]/5 border-[#FF4A00]/20"
            )}>
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center",
                blueprint.type === 'pod' ? "bg-[#8B5CF6] text-white" : "bg-[#FF4A00] text-white"
              )}>
                {blueprint.type === 'pod' ? <Boxes className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-[#FAFAFA]">
                  {blueprint.type === 'pod' 
                    ? `Creating Pod: ${blueprint.pod?.name}` 
                    : `Creating Agent: ${blueprint.agents[0]?.name}`}
                </p>
                <p className="text-[11px] text-[#52525B]">
                  {blueprint.type === 'pod' 
                    ? `${blueprint.agents.length} agents • ${routingModeLabels[blueprint.pod?.routingMode || 'pipeline']}` 
                    : `${blueprint.agents[0]?.tools.length} tools • ${blueprint.agents[0]?.triggers.length} triggers`}
                </p>
              </div>
              {blueprint.type === 'pod' && blueprint.pod && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#000] border border-[#18181B]">
                  {(() => { const Icon = routingModeIcons[blueprint.pod.routingMode] || GitBranch; return <Icon className="h-3 w-3 text-[#8B5CF6]" />; })()}
                  <span className="text-[10px] font-semibold text-[#A1A1AA] capitalize">{blueprint.pod.routingMode}</span>
                </div>
              )}
            </div>

            {/* Agent cards */}
            <div className="space-y-3">
              <label className="text-[11px] font-bold text-[#52525B] uppercase tracking-wider">
                {blueprint.type === 'pod' ? 'Team Members' : 'Agent Configuration'}
              </label>
              
              {blueprint.agents.map((agent, idx) => (
                <div key={agent.id} className="bg-[#000] border border-[#18181B] rounded-xl overflow-hidden hover:border-[#27272A] transition-colors">
                  <div className="p-5 space-y-3">
                    {/* Agent header */}
                    <div className="flex items-start gap-3">
                      {blueprint.type === 'pod' && (
                        <span className="h-7 w-7 rounded-lg bg-[#FF4A00] text-white flex items-center justify-center text-[12px] font-bold shrink-0">
                          {idx + 1}
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-[#FAFAFA]">{agent.name}</p>
                        <p className="text-[12px] text-[#52525B] mt-0.5">{agent.description}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-[#09090B] border border-[#18181B] text-[10px] font-medium text-[#3F3F46] shrink-0">{agent.model}</span>
                    </div>

                    {/* Instruction preview */}
                    <div className="p-3 bg-[#09090B] rounded-lg border border-[#18181B]">
                      <p className="text-[11px] text-[#71717A] leading-relaxed line-clamp-2 font-mono">{agent.instruction}</p>
                    </div>

                    {/* Tools & Triggers */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {agent.tools.map(tool => (
                        <span key={tool} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#09090B] border border-[#18181B] text-[10px] font-semibold text-[#A1A1AA]">
                          <Wrench className="h-2.5 w-2.5 text-[#52525B]" /> {tool}
                        </span>
                      ))}
                      {agent.triggers.map((trigger, ti) => (
                        <span key={ti} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#FF4A00]/5 border border-[#FF4A00]/10 text-[10px] font-semibold text-[#FF4A00]">
                          {trigger.type === 'cron' ? <Clock className="h-2.5 w-2.5" /> : <Webhook className="h-2.5 w-2.5" />}
                          {trigger.type === 'cron' ? trigger.config.schedule : trigger.type}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Arrow between agents in pipeline */}
                  {blueprint.type === 'pod' && idx < blueprint.agents.length - 1 && (
                    <div className="flex justify-center -mb-3 relative z-10">
                      <div className="h-6 w-6 rounded-full bg-[#18181B] border border-[#27272A] flex items-center justify-center">
                        <ArrowRight className="h-3 w-3 text-[#52525B] rotate-90" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4">
              <Button 
                onClick={handleDeploy}
                className="flex-[2] h-12 bg-gradient-to-r from-[#FF4A00] to-[#E64300] hover:from-[#E64300] hover:to-[#CC3B00] text-white font-bold rounded-xl shadow-lg shadow-[#FF4A00]/20 text-[14px] flex items-center justify-center gap-2"
              >
                <Rocket className="h-4 w-4" /> Deploy System
              </Button>
              <Button 
                variant="outline"
                className="flex-1 h-12 border-[#27272A] text-[#71717A] font-semibold rounded-xl hover:text-[#FAFAFA] hover:bg-[#18181B] text-[13px] flex items-center justify-center gap-2"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit First
              </Button>
            </div>
          </div>
        )}

        {/* ═══ DEPLOYED STATE — Success ═══ */}
        {status === 'deployed' && blueprint && (
          <div className="w-full flex flex-col items-center gap-6 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="h-16 w-16 rounded-2xl bg-[#10B981] flex items-center justify-center shadow-lg shadow-[#10B981]/20">
              <Check className="h-8 w-8 text-white" strokeWidth={3} />
            </div>
            <div className="space-y-2">
              <h2 className="text-[22px] font-bold text-[#FAFAFA]">System Deployed!</h2>
              <p className="text-[14px] text-[#52525B] max-w-md">
                {blueprint.type === 'pod' 
                  ? `Created ${blueprint.agents.length} agents and 1 pod. Your team is ready to run.`
                  : `Created "${blueprint.agents[0]?.name}". It's ready to go.`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleReset}
                className="h-10 px-6 bg-[#18181B] hover:bg-[#27272A] text-[#FAFAFA] font-semibold rounded-xl text-[13px] flex items-center gap-2 border border-[#27272A]"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#FF4A00]" /> Build Another
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
