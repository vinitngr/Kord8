# Create Custom Trigger

## 1) Create trigger class
Add a new file in `core/src/triggers/` extending `BaseTrigger`.

Implement required methods:

- `type`
- `getFormSchema()`
- `validate(config)`
- `start(config, context)`
- `stop()`

Use `context.enqueueTask({ agentId, instruction, metadata })` to queue work.

## 2) Register trigger type
In `core/src/plugin/TriggerPlugin.ts`, add:

```ts
app.triggers.register(YourTrigger)
```

## 3) Use in agent config
Add to the agent `triggers` array:

```json
{
  "type": "your-trigger-type",
  "config": { "any": "value" }
}
```

## 4) Runtime behavior
At startup, `AgentTeam.start()` calls `startAgentTriggers()` for enabled agents.
On agent update/unregister, old trigger instances are stopped automatically.
