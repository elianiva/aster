# Workspace Architecture: DO + D1 + R2 with OpenUI

Each learning workspace is a Durable Object running Project Think's SessionManager, with metadata in D1 for cross-workspace queries, artifacts in R2 rendered via OpenUI, and a guided onboarding form replacing the teach skill's nondeterministic LLM questioning.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  D1 (queryable metadata)                            │
│  - workspace id, topic, mission, current_knowledge  │
│  - cross-workspace queries, listing, search         │
└─────────────────────────────────────────────────────┘
                      │
                      │ sync on create/update
                      ▼
┌─────────────────────────────────────────────────────┐
│  Workspace DO (one per workspace)                   │
│  └─ SessionManager                                  │
│     ├─ Session "chat-1" (conversation)              │
│     ├─ Session "chat-2" (conversation)              │
│     └─ Context blocks:                              │
│        ├─ "soul" → teacher agent system prompt      │
│        ├─ "mission" → why user is learning          │
│        ├─ "knowledge" → what they know              │
│        └─ "resources" → searchable resource index   │
└─────────────────────────────────────────────────────┘
                      │
                      │ R2SkillProvider
                      ▼
┌─────────────────────────────────────────────────────┐
│  R2 (artifacts)                                     │
│  - lessons/*.openui                                 │
│  - reference/*.openui                               │
│  - learning-records/*.md                            │
└─────────────────────────────────────────────────────┘
```

- **D1**: Workspace metadata (topic, mission, current knowledge) — queryable across workspaces for listing, search, analytics. Uses default IDs.
- **Durable Object (Project Think)**: Agent state, sessions, context blocks. One DO per workspace. SessionManager handles multiple conversations with cross-session search. Lazily initialized on "start learning session", torn down on exit to save resources.
- **R2**: Artifacts only — lessons, reference docs, learning records. Stored as OpenUI Lang, rendered interactively on the frontend.

## Why not DO-only

DOs provide isolation and real-time, but querying across them is unsupported. D1 gives us SQL for cross-workspace operations without external dependencies.

## Why not D1-only

D1 can't run the agent, maintain WebSocket connections, or provide the Session/compaction/context block abstractions that Project Think offers.

## OpenUI everywhere

Agent outputs OpenUI Lang, not raw MDX/HTML. This means:

- **Chat responses**: Streamed OpenUI Lang, rendered via `<Renderer>` — interactive from the start.
- **Lessons**: Stored OpenUI Lang in R2 — quizzes, code playgrounds, diagrams are interactive components, not static markup.
- **Reference docs**: Same format — compressed, beautiful, interactive.

The teach skill's "lessons as HTML" becomes "lessons as OpenUI Lang components." Interactivity is structural, not bolted on.

## Alternatives considered

- **Raw MDX for artifacts**: Simpler, but no interactivity without custom component wiring. OpenUI gives us a protocol with a growing ecosystem.
- **Postgres via Hyperdrive**: Better cross-entity queries, but adds a dependency. D1 is sufficient for our single-user, workspace-scoped model.
- **One DO per session**: Breaks the teach skill's model where a workspace contains multiple sessions sharing context.
