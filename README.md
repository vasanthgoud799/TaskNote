# TaskNote

TaskNote is a React + Vite productivity workspace with a public landing page, Clerk-protected app routes, a dark/gold dashboard UI, notes, tasks, board, calendar, focus, analytics, habits, tags, settings, and PWA support.

## Current Stack

- Frontend: React + Vite + Tailwind CSS classes
- Auth: Clerk (`@clerk/clerk-react`)
- Backend: Express + MongoDB + Mongoose
- Backend auth: Clerk Express middleware (`@clerk/express`)
- Charts/UI: custom SVG chart components and reusable React UI primitives

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Create or update `frontend/.env`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
VITE_API_URL=http://localhost:3001
```

Routes:

- `/` public landing page
- `/sign-in` Clerk sign in
- `/sign-up` Clerk sign up
- `/dashboard`, `/notes`, `/tasks`, `/board`, `/calendar`, `/focus`, `/analytics`, `/habits`, `/tags`, `/settings` protected app routes

## Backend Setup

```bash
cd backend
npm install
npm start
```

Create or update `backend/.env`:

```env
PORT=3001
DATABASE_URL=mongodb://127.0.0.1:27017/tasknote
MONGODB_URI=mongodb://127.0.0.1:27017/tasknote
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLIENT_URL=http://localhost:5173,http://127.0.0.1:5173
NODE_ENV=development
EMAIL_PROVIDER=dev
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:you@example.com
```

The protected API middleware reads the Clerk session from cookies/Authorization headers and scopes records with Clerk `userId`.

Smart reminders use the backend as the source of truth. SMTP and VAPID settings are optional in development: when they are missing, TaskNote keeps the UI enabled but reports a graceful disabled/configuration message instead of crashing.

## Production Build

```bash
cd frontend
npm run build
```

```bash
cd backend
npm start
```

## PWA

The app keeps the existing manifest/service worker files. In local development, the install hook unregisters old service workers and clears local caches to avoid stale Vite bundles.
