# crewclaro-api onboarding

The core backend for CrewClaro. A NestJS REST + WebSocket API that owns projects, messages, tasks and subcontractors. Every other app talks to it. Message translation is not done here: it is handed off to `crewclaro-translator` through Redis.

## Where it fits
- **Called by:** `crewclaro-web` and `crewclaro-mobile` (REST `/v1/*`, WebSocket `/realtime`).
- **Talks to:** PostgreSQL (data), Redis (translation queue + realtime fan-out), `crewclaro-translator` (via Redis).
- **Publishes:** `openapi.yaml`, the source of the `@crewclaro/api-types` package used by web and mobile.
- **Deployed by:** `crewclaro-infra` (ECS Fargate, image `ghcr.io/jonathan-nobrega/crewclaro-api`).

## Stack
Node.js 22, NestJS 10, TypeScript, PostgreSQL 16 via Prisma, Redis 7, Socket.IO, Clerk JWT auth (`Authorization: Bearer`).

## Run locally
```bash
cp .env.example .env
docker compose up -d postgres redis
npx prisma migrate dev
npm run start:dev      # http://localhost:4000
```
Run `crewclaro-translator` too if you want messages to actually get translated.

## Code map
| Path | What's there |
|---|---|
| `src/messages/` | Send and list messages; sending queues a translation job |
| `src/projects/`, `src/tasks/`, `src/subcontractors/` | CRUD controllers |
| `src/queue/translation.queue.ts` | Pushes jobs to `translation:jobs`, listens on `translation:done` |
| `src/queue/translation.types.ts` | Job/result contract shared with the translator |
| `src/realtime/realtime.gateway.ts` | Socket.IO gateway: `message.created`, `message.translated`, `task.updated` |
| `prisma/schema.prisma` | Data model: User, Project, ProjectMember, Message, Task, Subcontractor |
| `openapi.yaml` | API contract |

## How a message gets translated
1. `POST /v1/projects/{id}/messages` stores the message with `translationStatus: "pending"`.
2. A job is pushed to the Redis list `translation:jobs`.
3. The translator publishes the result on the `translation:done` channel.
4. The API saves the translations and emits `message.translated` to the project room.

## Gotchas
- `translation.types.ts` must match `app/schemas.py` in `crewclaro-translator`. Change both together.
- After editing `openapi.yaml`, run `npm run gen:types`. It writes to `../packages/api-types`, so it expects a sibling `packages/` folder.
- `CORS_ORIGINS` defaults to `http://localhost:3000` (the web app in dev).
- CI (`.github/workflows/ci.yml`) runs migrations, `npm test` and `npm run build` against real Postgres and Redis containers.
