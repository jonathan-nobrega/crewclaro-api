# crewclaro-api

> **Hackathon demo repo.** Mock code for testing a multi-repo agent. Not affiliated with or endorsed by CrewClaro.

Core REST + WebSocket API for CrewClaro. Owns projects, messages, tasks and subcontractors. Message translation is done asynchronously by `crewclaro-translator` via Redis.

## Stack
- Node.js 22, NestJS 10, TypeScript
- PostgreSQL 16 via Prisma
- Redis 7: translation job queue + pub/sub for realtime fan-out
- Socket.IO gateway at `/realtime`
- Auth: JWT from Clerk (`Authorization: Bearer`)
- Contract: [`openapi.yaml`](./openapi.yaml), the source for `@crewclaro/api-types`

## Endpoints
| Method | Path | Purpose |
|---|---|---|
| GET | `/v1/projects` | List the user's projects |
| POST | `/v1/projects` | Create a project |
| GET | `/v1/projects/{id}/messages?lang=&cursor=` | Message history in the requested language |
| POST | `/v1/projects/{id}/messages` | Send a message (translation queued) |
| GET | `/v1/projects/{id}/tasks?trade=&status=` | List tasks |
| POST | `/v1/projects/{id}/tasks` | Create a task |
| PATCH | `/v1/tasks/{id}` | Update status / assignee / due date |
| GET | `/v1/subcontractors` | List subcontractors |
| POST | `/v1/subcontractors/invite` | Invite a sub by SMS or email |
| WS | `/realtime` | `message.created`, `message.translated`, `task.updated` |

## Translation flow
1. `POST /messages` stores the message with `translationStatus: "pending"`.
2. A job is pushed to Redis list `translation:jobs` (schema in `src/queue/translation.types.ts`).
3. `crewclaro-translator` writes translations back and publishes on `translation:done`.
4. This service updates the row and emits `message.translated` to the project room.

## Run
```bash
cp .env.example .env
docker compose up -d postgres redis
npx prisma migrate dev
npm run start:dev
npm run gen:types   # regenerates @crewclaro/api-types from openapi.yaml
```
