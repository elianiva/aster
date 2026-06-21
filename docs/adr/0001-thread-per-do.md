# 0001 — One Durable Object per thread

Date: 2026-06-21

## Context

Aster's `TeacherAgent extends Think`, and Think keeps a single `this.messages`
transcript per Durable Object instance. The first implementation passed
`name: workspaceId` (one DO per workspace) and `id: selectedThreadId` to
`useAgentChat`. The client `id` only keys the client-side chat store — the
server DO does not fork history per `id` — so switching "threads" client-side
left the server with one shared workspace transcript. Threads were cosmetic.

## Decision

One Durable Object instance per thread, keyed `${workspaceId}::${threadId}`.
Each thread gets an isolated `this.messages`, its own context blocks, and its
own hibernation lifecycle. A workspace starts with no threads; the first
message from the empty state creates the thread (UI RPC inserts the row, the
client connects to the new DO, then sends). The agent can also create threads
contextually via the `createThread` tool — it inserts the row, announces the
thread in chat, and stays in the current thread (no mid-turn DO transfer).

Workspace-level state (mission, topic, current knowledge) does **not** live in
the per-thread DO's context blocks, because it belongs to the workspace and
would drift across threads. It lives in the `workspaces` D1 row, is read in
`beforeTurn` and injected into the system prompt, and is written back via the
`updateMission` / `updateKnowledge` agent tools. The DO's own session context
blocks remain free for thread-local state.

Thread metadata (name, timestamps) lives in a `threads` D1 table. Thread titles
are generated server-side in `onChatResponse` (post-turn, after the assistant
message is persisted and the turn lock released) via a short `generateText`
call against the first user/assistant pair, then written to the `threads` row.
The sidebar refetches the thread list when the chat `status` transitions to
`ready`, so titles and contextually-created threads appear with no perceived
latency and no custom WebSocket event protocol.

The client connects via `useAgent({ agent: "teacher", prefix: "api/agents",
name: \`${workspaceId}::${threadId}\` })`. The `prefix` matches the
`@cloudflare/think` Vite plugin's `routePrefix` ("/api/agents"); omitting it
was the original "nothing happens on send" bug — `useAgent`'s default
`prefix: "agents"` pointed at a path nothing served.

## Consequences

- N DO instances per workspace instead of 1. Acceptable for a single-user app.
- No shared workspace-level conversation memory across threads by default;
  cross-thread continuity comes from the D1 workspace context, not message
  history.
- Title generation costs one extra small model call per first turn per thread.
- The `General` thread concept is removed (see CONTEXT.md). A workspace starts
  empty.

## Alternatives considered

- **One DO per workspace with multi-session inside.** Would require
  reimplementing session multiplexing around Think's single-`this.messages`
  model (`saveMessages`, `onChatMessage`, recovery all assume one transcript).
  Rejected — fights the framework.
- **One DO per workspace, single thread.** Cleanest but abandons the Thread
  concept the product needs.
- **KV for workspace context.** Rejected — mission/topic/knowledge are 1:1
  relational facts about a workspace, not ephemeral blobs; D1 fits better.
