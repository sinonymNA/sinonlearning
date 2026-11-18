# Arcade development notes

- Preserve the existing Next.js App Router, PostgreSQL helpers, Margins auth, and node-runtime room pattern used by `app/api/suspect/route.ts`.
- Prefer server-authoritative room state and polling when deployment does not provide durable WebSockets; never make local browser state the source of truth.
- Keep private game data out of public room state.
- Run `npm run build` after route or type changes.
- Continue toward the complete Classroom Arcade acceptance criteria; intermediate milestones are not final completion.
