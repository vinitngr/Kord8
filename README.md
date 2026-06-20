# Kord8

Kord8 is a local-first autonomous agent runtime with:
- a TypeScript core engine (`core/`)
- a React dashboard (`Web/`)
- docs for agent/tool/trigger setup (`docs/`)

## Repository layout

```text
Kord8/
├─ core/   # runtime, plugins, tools, triggers, HTTP interface
├─ Web/    # React + Vite UI for managing agents and tasks
└─ docs/   # setup and extension guides
```

## Prerequisites

- Node.js 20+ recommended
- npm
- One supported LLM API key (`OPENAI_API_KEY` or `GOOGLE_GENERATIVE_AI_API_KEY`)

## Quick start

### 1) Start the core engine

```bash
cd core
npm install
export OPENAI_API_KEY=your_key
npm run dev
```

If you use Google models, set `GOOGLE_GENERATIVE_AI_API_KEY` instead.

By default, the HTTP interface runs on port `4000`.

### 2) Start the web app

In a second terminal:

```bash
cd Web
npm install
npm run dev
```

Open the local Vite URL shown in the terminal.

## Common commands

### Core

```bash
cd core
npm run test
npm run build
```

### Web

```bash
cd Web
npm run lint
npm run build
```

## Useful docs

- `/docs/core-setup.md` - core engine setup
- `/docs/register-agent.md` - create and update agents
- `/docs/register-tools.md` - register tools/providers
- `/docs/trigger.md` - built-in trigger usage
- `/docs/create-trigger.md` - custom trigger guide

## Notes

- Runtime data is stored under `.agentTeam/` (created by the core).
- Agents can be registered and managed through the HTTP interface and Web UI.
