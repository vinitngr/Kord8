# Core Setup

## 1) Install
```bash
cd core
npm install
```

## 2) Create app
`core/src/index.ts` shows the normal boot order:

1. `new AgentTeam({...})`
2. `app.use(new LLMPlugin(...))`
3. `app.use(new HttpInterfacePlugin({ port }))`
4. `app.use(new TriggerPlugin())`
5. register tools
6. `app.init()` -> `app.boot()` -> `app.start()`
7. `http.start()`

## 3) Minimal run
```bash
cd core
export OPENAI_API_KEY=your_key
npm run dev
```

## 4) Useful endpoints
From `HttpInterfacePlugin`:

- `GET /health`
- `GET /models`
- `POST /tasks`
- `GET /tasks/queue`
- `GET /triggers/schemas`
- `POST /trigger/:agentId`
