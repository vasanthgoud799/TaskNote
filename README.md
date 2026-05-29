# TaskNote

TaskNote is a full-stack productivity workspace with a premium AMOLED dark/gold interface. It combines notes, tasks, kanban planning, calendar scheduling, focus sessions, habits, reminders, analytics, projects, reviews, templates, smart inbox capture, import/export, and PWA support in one protected workspace.

The public landing page is separate from the authenticated app. The workspace is designed to work on desktop, mobile, and installed PWA layouts.

## Features

- Protected workspace with signup, login, logout, and session restore
- Premium dark/gold responsive UI with dashboard, sidebar, bottom mobile navigation, quick add, and command palette
- Notes with pinning, markdown-oriented content, templates, reminders, backlinks, knowledge graph, and version history
- Tasks with priorities, status, due dates, subtasks, dependencies, recurring options, reminders, and Eisenhower matrix
- Kanban board with todo, doing, and done columns
- Calendar with scheduled tasks, reminders, habits, focus sessions, and selected-day details
- Focus timer with Pomodoro, Deep 50, Quick 15, task linking, focus sessions, and analytics
- Habits with colors, completion tracking, streaks, reminders, and heatmap-style progress
- Tags and projects for organizing notes, tasks, habits, and time blocks
- Smart inbox for universal capture and converting items into notes, tasks, habits, or reminders
- Planner/time blocking with project/task linking and conflict-aware scheduling
- Reviews for daily, weekly, and monthly productivity reflection
- Reminder center with email and PWA push notification structure
- Advanced global search across workspace entities
- Settings for appearance, reminders, notifications, sync/offline status, and data portability
- Import/export for user data, notes, tasks, and backup workflows
- PWA manifest, service worker, offline fallback, app shell caching, and push notification handlers
- IndexedDB offline write queue for supported productivity writes

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, React Router, Zustand, Axios
- Backend: Node.js, Express, MongoDB, Mongoose
- Auth: backend session/JWT flow with protected API routes
- Notifications: Nodemailer/SMTP and Web Push with VAPID keys
- PWA: Vite PWA/service worker structure
- Offline queue: IndexedDB-based client queue with runtime sync

## Repository Structure

```text
TaskNote/
  frontend/          React + Vite app
  backend/           Express API, models, services, workers
  README.md
```

## Prerequisites

- Node.js 20 or newer
- npm
- MongoDB local instance or MongoDB Atlas
- Optional SMTP account for email reminders
- Optional VAPID keys for PWA push notifications

## Environment Setup

Create local env files from the examples:

```powershell
Copy-Item frontend\.env.example frontend\.env
Copy-Item backend\.env.example backend\.env
```

Frontend variables:

```env
VITE_API_URL=http://localhost:3001
VITE_AUTH_API_URL=http://localhost:3001
VITE_CLERK_PUBLISHABLE_KEY=pk_test_optional_if_clerk_ui_is_enabled
```

Backend variables:

```env
PORT=3001
DATABASE_URL=mongodb://127.0.0.1:27017/tasknote
MONGODB_URI=mongodb://127.0.0.1:27017/tasknote
JWT_KEY=replace-with-a-long-random-secret
JWT_ACCESS_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173,http://127.0.0.1:5173
NODE_ENV=development
```

Email reminder variables:

```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM="TaskNote <no-reply@example.com>"
```

PWA push variables:

```env
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:you@example.com
```

Generate VAPID keys from the backend folder:

```bash
cd backend
npx web-push generate-vapid-keys
```

Do not commit `.env` files. Commit only `.env.example` files.

## Local Development

Start the backend:

```bash
cd backend
npm install
npm start
```

Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

## Main Routes

Public:

- `/`
- `/sign-in`
- `/sign-up`

Protected workspace:

- `/dashboard`
- `/notes`
- `/tasks`
- `/board`
- `/calendar`
- `/focus`
- `/analytics`
- `/habits`
- `/tags`
- `/settings`
- `/inbox`
- `/projects`
- `/planner`
- `/reviews`
- `/templates`
- `/reminders`

## Backend APIs

The backend uses a consistent response shape.

Success:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "..."
}
```

API areas:

- `/api/auth`
- `/api/notes`
- `/api/tasks`
- `/api/habits`
- `/api/tags`
- `/api/focus-sessions`
- `/api/reminders`
- `/api/push`
- `/api/settings`
- `/api/inbox`
- `/api/projects`
- `/api/time-blocks`
- `/api/templates`
- `/api/reviews`
- `/api/search`
- `/api/export`
- `/api/import`

All private data must be scoped to the authenticated user on the backend. Never trust user IDs sent from the frontend.

## Offline Write Queue

TaskNote includes an IndexedDB-based offline write queue. It is for productivity data only and does not store auth tokens or sensitive session data.

Supported offline operations:

- Create, update, and delete notes
- Create, update, complete, and delete tasks
- Create, update, complete, and delete habits
- Create, update, archive, and delete inbox items
- Create and update time blocks when the API is available

Unsupported offline operations:

- Login, signup, logout
- Import/export
- Push subscription changes
- Email or push test actions
- Security-sensitive settings
- Destructive bulk operations
- Inbox conversion when the backend is required

When offline, supported changes are queued locally and marked with a pending sync state. When the browser comes back online, the app runtime processes the queue in order, retries transient failures, and exposes failed/conflict states in the UI.

## PWA Notes

TaskNote includes:

- Web app manifest
- Service worker
- Offline fallback
- App shell caching
- Push notification event handling
- Notification click routing

The service worker should not blindly cache authenticated API responses. If a stale UI appears during local development, unregister the service worker and clear site data from the browser.

## Notifications

Email reminders use SMTP through the backend notification service. If SMTP variables are missing, development should fail gracefully or log a disabled provider message.

Push notifications require:

- VAPID keys in backend env
- Browser support
- User permission granted from the app settings
- Active service worker registration

If notification permission is denied or repeatedly dismissed, reset it from the browser site settings.

## Production Build

Frontend:

```bash
cd frontend
npm run build
```

Backend:

```bash
cd backend
npm start
```

Optional frontend lint:

```bash
cd frontend
npm run lint
```

Optional backend syntax check:

```bash
cd backend
node --check server.js
```

## Deployment

### Backend on Render

Recommended settings:

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`

Set these environment variables in Render:

- `MONGODB_URI`
- `DATABASE_URL`
- `JWT_KEY`
- `JWT_ACCESS_SECRET`
- `JWT_EXPIRES_IN`
- `CLIENT_URL`
- SMTP variables if email reminders are enabled
- VAPID variables if push notifications are enabled

`CLIENT_URL` must include the exact frontend domain, for example:

```env
CLIENT_URL=https://tasknote-dev.vercel.app
```

For MongoDB Atlas, verify the SRV URI is correct and that Render can access the cluster network.

### Frontend on Vercel

Recommended settings:

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`

Set:

```env
VITE_API_URL=https://your-backend.onrender.com
VITE_AUTH_API_URL=https://your-backend.onrender.com
```

For direct route refreshes such as `/dashboard` or `/settings`, add an SPA rewrite to serve `index.html`.

Example `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## Troubleshooting

### CORS blocked

Set `CLIENT_URL` on the backend to the exact frontend origin and redeploy the backend.

### `/api/auth/me` returns 401

The user is not authenticated, the session cookie/token is missing, or frontend API URLs point to the wrong backend. Verify `VITE_API_URL`, `VITE_AUTH_API_URL`, cookie settings, and deployed origins.

### Refreshing `/dashboard` returns 404 on Vercel

Add the SPA rewrite shown above and redeploy the frontend.

### MongoDB `ENOTFOUND` or connection failed

Check `MONGODB_URI` for typos, Atlas cluster hostname, username/password, and network access settings.

### Push test says VAPID is not configured

Add `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` to the backend environment and redeploy.

### Browser blocks notification permission

Open browser site settings for the app domain and reset notification permission.

### Service worker fetch errors

Clear site data or unregister the old service worker, then reload the deployed app. Make sure the service worker does not cache private API responses.

## Security Checklist

- Keep `.env` files out of Git
- Keep backend secrets only on the backend
- Do not store auth tokens in IndexedDB or localStorage
- Scope every database query by authenticated user
- Validate request bodies and IDs on backend routes
- Rate-limit sensitive notification test endpoints
- Sanitize rendered note markdown
- Do not cache private authenticated API responses in the service worker

## Manual Test Checklist

- Signup, login, logout, and refresh session restore
- Dashboard loads real stats
- Notes create, edit, delete, pin, version history, backlinks
- Tasks create, edit, complete, recur, reminders, subtasks, dependencies
- Board columns and task status updates
- Calendar selected day and scheduled items
- Focus timer and focus session save
- Habits create, complete, streaks
- Tags create, color selection, counts
- Inbox capture and conversion
- Projects and project detail views
- Planner/time block create and conflict warning
- Reviews create and save reflection
- Global search and command palette
- Reminder center, snooze, cancel, retry
- Email test when SMTP is configured
- Push subscribe/test when VAPID and browser permission are configured
- Export/import data
- Offline create/update queue and sync after reconnect
- Mobile layout with no horizontal overflow
- Frontend production build
- Backend start

## Current Notes

TaskNote is feature-rich and evolving. Keep future work incremental: preserve the working UI, reuse existing models/routes/components, and expose only features that work end to end.
