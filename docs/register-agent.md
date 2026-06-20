# Register Agent

Agent schema comes from `core/src/agent/AgentRegistry.ts`.

Required fields:

- `id`
- `instruction`
- `provider`
- `model`
- `tools` (array)

Common optional fields:

- `name`, `description`
- `temperature`, `maxTokens`, `maxIterations`
- `enabled`
- `triggers`
- `reasoningEffort` (`low`, `medium`, or `high`)

## Register in code
`engine.agents.register(config)` stores the validated agent and emits `registered`.

## Register via HTTP
From `core/src/interface/routes/agents.ts`:

- `POST /agents/deploy` (new agent + optional skill upload)
- `POST /agents/:id/update` (edit existing agent)
- `GET /agents` / `GET /agents/:id`
- `DELETE /agents/:id`

When an agent is registered/updated, trigger instances are reloaded automatically.
