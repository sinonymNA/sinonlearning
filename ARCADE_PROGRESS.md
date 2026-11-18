# Classroom Arcade progress

## Current phase

Repository inspection and shared multiplayer foundation.

## Completed and verified

- Existing Next.js App Router and PostgreSQL helpers inspected.
- Existing `app/api/suspect/route.ts` provides a reusable node-runtime, server-authoritative polling-room pattern with host actions, reconnect tokens, and private state.
- Existing game-show editor/play infrastructure inspected; it is not a multiplayer room engine.

## In progress

- Extracting a reusable arcade room foundation from the existing room pattern.
- Adding arcade routes and persistent progress documentation.

## Known blockers

- Current environment has no production database credentials or deployment runtime for a real 35-device network test.
- Durable WebSockets are not currently configured; the first implementation will use authoritative HTTP polling unless deployment support is added.

## Next exact action

Implement the shared arcade room service and host/join lobby routes, then build Hot Potato on top of it.
