# Aster

A self-hostable, single-user learning workspace where a teacher AI agent generates interactive lessons from structured components. Built with TanStack Start on Cloudflare Workers.

## Features

- **AI Teacher Agent** — An AI tutor that teaches you through conversation, generates lessons, creates reference docs, maintains a glossary, and tracks your learning progress.
- **Workspaces** — Topic-based containers with a mission, threads, and artifacts. Keep your learning organized.
- **Threads** — Named conversations within a workspace. Teaching mode can be toggled per thread.
- **Artifacts** — Generated outputs stored as OpenUI Lang and rendered interactively: lessons, learning records, reference docs, glossary entries.
- **Curated Resources** — High-trust sources the agent uses to ground its teaching. Two types: knowledge (books, articles, docs) and wisdom (communities, forums).
- **Glossary** — Canonical terminology compressed into single entries. Only added once you understand a term.
- **Cloudflare Access** — Zero Trust authentication. No login flows, no accounts.
- **Markdown + Components** — Rich chat rendering with Streamdown, syntax highlighting, math, mermaid diagrams, and interactive components.

## Architecture

| Layer | Technology |
|-------|-----------|
| Framework | TanStack Start (React 19) |
| Routing | TanStack Router (file-based) |
| Data Fetching | TanStack Query |
| State | TanStack Store |
| Styling | Tailwind CSS v4 |
| Deployment | Cloudflare Workers |
| Database | D1 (SQLite via Drizzle ORM) |
| File Storage | R2 |
| Settings | KV |
| AI Runtime | Cloudflare Think (Durable Objects) |
| AI SDK | @cloudflare/ai-chat, @tanstack/ai |
| Language | TypeScript + Effect (FP) |

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm
- A Cloudflare account with Workers, D1, R2, KV, and Access configured

### Environment

Copy `.env.example` to `.env` and configure your Cloudflare Access credentials:

```env
ACCESS_TEAM_DOMAIN=your-team.cloudflareaccess.com
ACCESS_AUD=your-access-aud
ADMIN_EMAIL=your-email@example.com
```

Set API keys via the Settings dialog in the app UI (stored in KV).

### Development

```bash
pnpm install
pnpm dev              # Start dev server on port 3000
```

### Database

```bash
pnpm db:generate       # Generate Drizzle migrations
pnpm db:migrate        # Apply migrations to D1
```

### Build & Deploy

```bash
pnpm build             # Production build
pnpm deploy            # Build and deploy to Cloudflare Workers
pnpm preview           # Preview production build locally
```

### Testing

```bash
pnpm test              # Run Vitest tests
```

## Project Structure

```
src/
├── server/            # Server-side code (Workers entry, D1 client, RPC, DB)
│   ├── db/            # Drizzle schema and D1 client
│   ├── features/      # Service-layer (Effect-based)
│   └── rpc/           # TanStack Start server functions (RPC layer)
├── features/          # Client-side feature modules
│   ├── workspace/     # Workspace pages, chat view, hooks
│   └── settings/      # Settings dialog and schema
├── components/        # Shared UI components
│   └── ai-elements/   # AI chat UI components (conversation, message, prompt-input)
├── routes/            # File-based routes (TanStack Router)
└── lib/               # Utilities, OpenUI integration
agents/                # Teacher agent (Cloudflare Think DO)
├── teacher.ts         # Agent implementation
└── prompts/           # System and format prompts
migrations/            # D1 migrations
```

## Routing

File-based routing via TanStack Router. Routes are in `src/routes/`.

```
/                                   Home — workspace list
/workspaces/$workspaceId/           Workspace overview
/workspaces/$workspaceId/threads/   Thread list with chat
/workspaces/$workspaceId/lessons/   Generated lessons
/workspaces/$workspaceId/records/   Learning records
/workspaces/$workspaceId/reference-docs/   Reference documents
/workspaces/$workspaceId/resources/ Curated resources
/workspaces/$workspaceId/glossary/  Terminology
/workspaces/$workspaceId/notes/     Agent's scratchpad
```

## License

MIT

## Credits

Built with [TanStack](https://tanstack.com/), [Cloudflare](https://cloudflare.com/), and the [Effect](https://effect.website/) ecosystem.
