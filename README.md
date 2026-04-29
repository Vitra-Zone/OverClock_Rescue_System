# Hackdays Assist

Emergency response system for hospitality venues.

Current architecture is Firebase-first:
- Firestore for incident persistence and realtime dashboard updates.
- Firebase Auth for staff login and protected staff actions.
- Local rule-based triage engine for deterministic incident classification.
- Human-in-the-loop approval before critical escalation.

## What Is Included

- Guest SOS flow with location capture.
- Staff dashboard with realtime incident updates.
- Incident detail view with triage, orchestration, timeline, and status control.
- Offline guidance page and fallback simulation endpoints.
- Escalation scheduler for unattended incidents.

## Quick Start

### 1) Backend

```bash
cd backend
npm install
cp .env.example .env
```

Set values in backend .env:

```env
PORT=3001
NODE_ENV=development
STAFF_AUTH_REQUIRED=true
FIREBASE_SERVICE_ACCOUNT_JSON={...one-line-service-account-json...}
```

Then run:

```bash
npm run dev
```

### 2) Frontend

```bash
cd frontend
npm install
cp .env.example .env
```

Set values in frontend .env:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=
```

Then run:

```bash
npm run dev
```

### 3) Open App

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Health: http://localhost:3001/health

Expected health flags:
- aiMode = rule_based
- firebaseMode = enabled

## Deployment Status

Recommended deployment split:
1. Backend on Render free tier.
2. Frontend on Firebase Hosting.
3. Firebase still handles Auth/Firestore for the app runtime.

Render blueprint is included in `render.yaml`.

Backend deployment flow:
1. Create a Render Web Service from `render.yaml` or import the repo.
2. The backend package now keeps `typescript` and the `@types/*` packages in normal dependencies so Render can compile even if dev deps are skipped.
3. Set `FIREBASE_SERVICE_ACCOUNT_JSON` in Render as a secret env var.
4. Set `CORS_ORIGINS` to your Firebase Hosting domains, for example `https://your-project.web.app,https://your-project.firebaseapp.com`.
5. Keep `GEMINI_API_KEY` empty if you want the local rule-based AI fallback.
6. Deploy with the default build and start commands from the blueprint.

Frontend deployment flow:
1. Set `VITE_BACKEND_URL` to your Render backend URL before building.
2. Run `npm run build` in `frontend`.
3. Deploy `frontend/dist` to Firebase Hosting.

Current focus:
1. Configure Firebase project settings and credentials in env files.
2. Refresh Firestore rules and indexes.
3. Validate Firebase Auth and Firestore from local app runtime.

## Firebase Console Setup

1. Enable Firestore Database.
2. Enable Authentication with Email/Password.
3. Create at least one staff test user in Auth.
4. Generate Firebase service account key for backend.
5. Configure Firestore Rules using firestore.rules in repo root.

## Firestore Rules And Indexes

- Rules file: firestore.rules
- Indexes file: firestore.indexes.json

Deploy with Firebase CLI:

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

## API Overview

- GET /health
- GET /api/incidents
- GET /api/incidents/:id
- POST /api/incidents
- PATCH /api/incidents/:id/status
- POST /api/incidents/:id/approve
- POST /api/incidents/:id/timeline
- POST /api/ai/triage
- POST /api/ai/orchestrate
- POST /api/fallback/sms
- POST /api/fallback/voice
- POST /api/fallback/video
- POST /api/notifications/register-token

## Operator Walkthrough (2-3 Minutes)

1. Show guest creates SOS from Guest Portal.
2. Show incident appears instantly on Staff Dashboard.
3. Open incident detail and run triage.
4. Approve triage as staff and update status.
5. Show timeline + escalation metadata.
6. Close incident.

## Security Notes

- Never commit backend .env or service account JSON.
- Rotate service-account keys if exposed.
- Keep frontend Firebase web keys in frontend .env only.
- Store the Render Firebase service account as a secret env var, not in the repo.

## Current Limitations

- SMS, voice, and video fallback routes are wired and require provider integration for live delivery.
- Staff role is based on auth gating; custom claims can be added later.
- Local development only unless deployed.

## Stack

- Frontend: React, Vite, TypeScript, Tailwind.
- Backend: Node.js, Express, TypeScript.
- Realtime/Data/Auth: Firebase (Firestore + Auth + optional Messaging).
- Triage: local rule-based engine.
