# Field Service Pro — PWA

A production-ready Progressive Web App for pest control and lawn care field technicians. Allows technicians to quickly capture upsell or new service opportunities in the field using AI-powered photo analysis.

## Overview

Technicians open the app on their phone, take photos of a pest issue, get an AI-generated summary, select the customer site, and submit. Office staff then review and manage the pipeline.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth (email/password) |
| Storage | Supabase Storage |
| AI | OpenAI GPT-4o Vision |
| PWA | Web Manifest + Service Worker |
| Deployment | Vercel |
| Testing | Jest |

## Quick Start

### Prerequisites

- Node.js 18+
- A Supabase project
- An OpenAI API key (optional for development — returns mock responses without it)

### 1. Clone and install

```bash
git clone <repo>
cd techlead
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set up the database

In the Supabase SQL editor, run:

```sql
-- Run the migration
\i supabase/migrations/001_schema.sql
```

Or paste the contents of `supabase/migrations/001_schema.sql` into the Supabase SQL editor.

### 4. Create the storage bucket

In the Supabase dashboard:
1. Go to Storage
2. Create a new bucket called `opportunity-photos`
3. Set it to **private** (not public)
4. Add storage policies (see migration file comments)

### 5. Create seed users

In the Supabase Auth dashboard, create these users:

| Email | Password | Role |
|---|---|---|
| sarah.office@fieldpro.dev | Password123! | office |
| mike.office@fieldpro.dev | Password123! | office |
| john.tech@fieldpro.dev | Password123! | technician |
| maria.tech@fieldpro.dev | Password123! | technician |
| carlos.tech@fieldpro.dev | Password123! | technician |

Then update their profiles:

```sql
UPDATE profiles SET role = 'office', name = 'Sarah Johnson' WHERE email = 'sarah.office@fieldpro.dev';
UPDATE profiles SET role = 'office', name = 'Mike Peters' WHERE email = 'mike.office@fieldpro.dev';
UPDATE profiles SET name = 'John Smith' WHERE email = 'john.tech@fieldpro.dev';
UPDATE profiles SET name = 'Maria Garcia' WHERE email = 'maria.tech@fieldpro.dev';
UPDATE profiles SET name = 'Carlos Rivera' WHERE email = 'carlos.tech@fieldpro.dev';
```

### 6. Seed customer sites

Run the contents of `supabase/seed.sql` in the Supabase SQL editor.

### 7. Generate PWA icons

```bash
# Using Sharp (already in dependencies)
node -e "
const sharp = require('sharp');
const fs = require('fs');
const svg = fs.readFileSync('./public/icons/icon.svg');
sharp(svg).resize(192).png().toFile('./public/icons/icon-192.png', () => console.log('192 done'));
sharp(svg).resize(512).png().toFile('./public/icons/icon-512.png', () => console.log('512 done'));
"
```

### 8. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in.

## How Authentication Works

- Supabase Auth handles email/password login
- On signup, a database trigger automatically creates a `profiles` row
- Profiles have a `role` field: `technician` or `office`
- Middleware (`middleware.ts`) protects all routes, redirecting unauthenticated users to `/login`
- Row-level security (RLS) in Postgres enforces data access:
  - Technicians can only see their own opportunities
  - Office users can see and edit all opportunities

## How AI Analysis Works

1. Technician takes 1-5 photos
2. Photos are compressed client-side (max 1200px wide, JPEG 82% quality)
3. Images are sent as base64 to `POST /api/analyze`
4. The route calls GPT-4o with a constrained system prompt
5. GPT-4o returns structured JSON with: `issue_detected`, `suggested_service_category`, `confidence`, `short_summary`, `priority`
6. The result is validated/sanitized before returning to the client
7. Technician can edit any field before submitting

**Without `OPENAI_API_KEY`:** Returns a mock "Inspection Recommended" response so you can test the rest of the flow.

## How Nearby Site Lookup Works

1. App requests GPS permission on the "Select Site" step
2. Coordinates are sent to `GET /api/sites?lat=XX&lng=YY`
3. The API applies a bounding-box pre-filter (50-mile radius) in Postgres
4. Results are sorted by Haversine distance in application code
5. Returns nearest 30 sites with distance labels

**Without GPS:** All sites are shown alphabetically. Technician can search by name, address, or location number.

**CRM Integration Note:** The `/api/sites` route has a clear comment showing where to swap in an external CRM API call (e.g., ServiceTitan, FieldRoutes). Replace the Supabase query with an HTTP call to your CRM and map the response to the `CustomerSite` type.

## Database Schema Overview

```
profiles             — extends auth.users, stores role + company
customer_sites       — properties to service (lat/lng indexed)
opportunities        — core table: photos → AI → site → status
opportunity_photos   — photo URLs and storage paths
opportunity_status_history — audit trail for status changes
```

Full schema with RLS policies: `supabase/migrations/001_schema.sql`

## App Screens

| Screen | Route | Access |
|---|---|---|
| Login | `/login` | Public |
| Dashboard | `/dashboard` | All |
| New Opportunity | `/opportunities/new` | Technician |
| My Opportunities | `/opportunities` | Technician |
| Opportunity Detail | `/opportunities/[id]` | Owner or Office |
| Office Pipeline | `/office` | Office only |
| Office Detail/Edit | `/office/[id]` | Office only |

## API Routes

| Method | Route | Description |
|---|---|---|
| POST | `/api/analyze` | AI image analysis |
| GET | `/api/sites` | Nearby/search customer sites |
| POST | `/api/opportunities` | Create opportunity |
| GET | `/api/opportunities/[id]` | Get opportunity |
| PATCH | `/api/opportunities/[id]` | Update status/notes (office) |

## Deployment (Vercel)

1. Connect your GitHub repo to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy — Next.js App Router works out of the box on Vercel

**Supabase URL rewrite:** Make sure your Supabase project allows the Vercel domain in Auth settings under "Site URL" and "Redirect URLs".

## Running Tests

```bash
npm test
npm run test:watch
```

Tests cover:
- AI result sanitization and validation
- Distance calculation (Haversine formula)
- Nearby site filtering logic
- Utility function correctness

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-only) |
| `OPENAI_API_KEY` | No* | OpenAI key for image analysis |
| `NEXT_PUBLIC_APP_URL` | No | Full URL for callbacks |

*Without `OPENAI_API_KEY`, analysis returns a mock "Inspection Recommended" response.

## Project Structure

```
/
├── app/
│   ├── (auth)/login/        — Login page
│   ├── (app)/
│   │   ├── dashboard/       — Home/dashboard
│   │   ├── opportunities/   — List, detail, new flow
│   │   └── office/          — Office pipeline + edit
│   └── api/
│       ├── analyze/         — AI image analysis
│       ├── sites/           — Customer site lookup
│       └── opportunities/   — CRUD for opportunities
├── components/              — TopBar, BottomNav
├── lib/supabase/            — Supabase client (browser + server)
├── lib/utils.ts             — Utilities, distance calc, formatting
├── types/index.ts           — TypeScript types
├── hooks/                   — Custom React hooks
├── __tests__/               — Jest tests
├── supabase/
│   ├── migrations/001_schema.sql
│   └── seed.sql
└── public/
    ├── manifest.json        — PWA manifest
    ├── sw.js                — Service worker
    └── icons/               — PWA icons
```

## PWA Features

- Installable on iOS and Android home screens
- Service worker with stale-while-revalidate for static assets
- Network-first for navigation, cache fallback
- Manifest with shortcuts to "New Opportunity"
- Touch-optimized UI (large tap targets, no zoom on input)
- Safe area insets for notched phones

## Contributing / Extending

**Adding a CRM integration:**
- Replace the Supabase query in `/app/api/sites/route.ts` with your CRM API call
- Map the CRM response to the `CustomerSite` type in `types/index.ts`

**Adding push notifications:**
- Integrate the Web Push API
- Store subscription objects in a new `push_subscriptions` table
- Trigger pushes from a server function when opportunity status changes

**Adding voice-to-text for technician notes:**
- Use the Web Speech API (`SpeechRecognition`) in the `StepAiSummary` component
- Append recognized text to `technicianNotes`
