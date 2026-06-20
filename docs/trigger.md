# Trigger Guide

Built-in trigger types are registered by `TriggerPlugin`:

- `manual`
- `cron`
- `webhook`
- `scheduled` (one-time date/time run)
- `github` (GitHub-specific webhook trigger)

## Trigger config shape
Each trigger entry in `agent.json` uses:

```json
{
  "type": "cron",
  "config": {
    "expression": "*/5 * * * *",
    "instruction": "Check latest updates"
  }
}
```

## Webhook trigger
- Use `type: webhook` for generic POST payloads
- Use `type: github` for GitHub event payloads + optional signature check
- Send POST to: `POST /trigger/:agentId`
- Payload is passed into the trigger and queued as a task

## Queue visibility
`GET /tasks/queue` returns:

- queued runtime tasks
- upcoming scheduled trigger tasks
