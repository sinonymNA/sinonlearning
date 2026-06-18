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

No database, no authentication, and no payment integration are used.

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
