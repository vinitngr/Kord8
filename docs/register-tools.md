# Register Tools & Providers

## Register providers
`LLMPlugin` currently registers:

- `OpenAIProvider`
- `GoogleProvider`

If `apiKey` is passed, it is saved to credentials storage.

## Register tools
From `core/src/index.ts`:

```ts
app.tools.register(new SerperSearchTool())
```

`ToolRegistry` methods:

- `register(tool)`
- `get(name)`
- `list()`
- `listToolInfo()`
- `listManifests()`

## Add your own tool
Create a class extending `BaseTool` with:

- `name`
- `description`
- `schema` (zod)
- `execute(input, context)`

Then register it using `app.tools.register(new YourTool())`.
