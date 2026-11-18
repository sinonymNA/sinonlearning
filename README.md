# Sinon Learning

Free, beautiful, useful curriculum and classroom tools for teachers and students.

Sinon Learning is built on the idea that great learning should not be locked behind a
paywall. This repository is the first real version of the Sinon Learning website: a
homepage, an Everyday Curriculum page, and a Classroom Tools page.

## Tech stack

- [Next.js](https://nextjs.org) (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React icons

Margins includes authenticated classes, assignments, submissions, and Learning Lab progress backed by PostgreSQL. Set `DATABASE_URL` in the deployment environment before using `/margins`; without it, authenticated Margins routes cannot initialize.

## Project structure

```
app/
  page.tsx              Home
  curriculum/page.tsx    Everyday Curriculum
  tools/page.tsx          Classroom Tools
  layout.tsx              Shared layout (Navbar + Footer)
  globals.css
components/
  Navbar.tsx
  Footer.tsx
  Button.tsx
  Badge.tsx
  Card.tsx
  SectionHeader.tsx
  HeroDashboard.tsx
  CourseCard.tsx
  ToolCard.tsx
  EmailSignup.tsx
  ClassroomScreenMockup.tsx
  FadeIn.tsx
data/
  courses.ts
  tools.ts
```

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site. The app
auto-updates as you edit files.

Other scripts:

```bash
npm run build   # production build
npm run start   # run the production build locally
npm run lint    # run ESLint
```

## Pushing to GitHub

```bash
git add .
git commit -m "Initial Sinon Learning website"
git push -u origin <branch-name>
```

## Deploying to Railway

1. Push this repository to GitHub.
2. In [Railway](https://railway.app), create a new project and choose
   **Deploy from GitHub repo**, selecting this repository.
3. Railway auto-detects the Next.js app. Confirm the build and start commands:
   - Build command: `npm run build`
   - Start command: `npm run start`
4. Railway sets the `PORT` environment variable automatically; Next.js respects it
   out of the box, so no extra configuration is required.
5. Deploy. Railway will give you a public URL once the build finishes.

### Margins database configuration

Create a PostgreSQL service and expose its connection string as `DATABASE_URL` to the web service. The Margins schema is created lazily on the first authenticated request. For a production deployment, use a managed PostgreSQL database with backups and restrict access to the web service; do not commit credentials to the repository.

### Reel render worker (second Railway service)

**Reel** (`/reel`) lets teachers script a short explainer video with KORA, add
images, record a voice-over with a synced teleprompter, and export a finished
MP4. The web app enqueues render jobs in Postgres; a **separate Python worker**
renders the animations with [Manim](https://www.manim.community/) + ffmpeg and
writes the MP4 back. That worker lives in [`reel_worker/`](reel_worker/) and must
be deployed as a **second service** in the same Railway project, sharing the same
`DATABASE_URL`. See [`reel_worker/README.md`](reel_worker/README.md) for the
step-by-step deploy (set the service root to `reel_worker`, share `DATABASE_URL`,
no public port, one instance). Until that service is running, the rest of Reel
works but the **Render preview** / **Produce** steps stay queued.


## Classroom Arcade (`/arcade`)

Five original multiplayer party games (Hot Potato, Quick Draw, Last One Standing, Telephone, Imposter) for up to 40 students, plus Arcade Party playlists, a teacher dashboard/projector, coins and collectible characters, teacher content sets, and a private developer test lab.

- **Student accounts**: `/arcade/account` makes a free username + password account (no email, no real name, no class info; the database stores only a username, a scrypt password hash, coins and collected characters). Nicknames typed when joining a game are never linked to the account. Passwords cannot be recovered. Margins accounts still work, and teachers must use them to host.
- **Solo practice**: `/arcade/solo` runs any game against bot opponents in a private room (easy/medium/hard). Signed-in players earn coins by finishing place, capped at 150 coins/day; guests can play but earn nothing. Ideas for true solo modes: `ARCADE_SOLO_IDEAS.md`.
- **Hosting**: sign in with a Margins *teacher* account → `/arcade/host`. Students (guests or signed in) join at `/arcade/join` with the six-character code.
- **Transport**: authoritative HTTP polling (`POST /api/arcade`, 650–1000 ms) rather than WebSockets. Next.js route handlers cannot upgrade connections, and Railway runs `next start`, so WebSockets would require replacing the server with a custom one. Polling is simple, works through school proxies, reconnects by itself (player id + token in `localStorage`), and handled 35 concurrent clients with p95 ≈ 18 ms. Trade-offs: up to ~1 s latency for other players' changes, and rooms live in one Node process (a restart ends live sessions; coins/collections/content live in PostgreSQL).
- **Environment**: `DATABASE_URL` (required for coins, collections, content sets; without it the arcade still runs with in-memory stores), No variable is needed for `/arcade/test-lab`: any signed-in teacher account can use it. `ARCADE_DEV_AUTH=1` enables a cookie identity for local tests **only when `NODE_ENV` is not `production`**.
- **Tests**: `npm run arcade:test` (unit/integration), `npm run arcade:load -- --url http://localhost:3100` (35 independent HTTP clients), `node scripts/arcade-e2e.mjs`, `node scripts/arcade-e2e-sync.mjs`, `node scripts/arcade-e2e-accounts.mjs` (see `ARCADE_TESTS.md`).
- **Safety**: guests need no account; no chat or direct messages; nicknames are filtered; typed text is moderated and personal info is blocked; rooms are deleted after 4 h idle (30 min after ending); signed-in players can delete their arcade data. This is not a compliance certification - have your school review it.
