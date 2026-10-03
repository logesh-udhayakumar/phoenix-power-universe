# Phoenix Power Universe

Company website and project portfolio for an electrical and plumbing contractor,
with a simple admin panel so the owner can publish new projects without a
developer.

The portfolio is the point: the site is built so the owner can open it in front
of a client and show photographs of finished work.

- **Public site** — home, services, project portfolio with filters and search,
  project case studies with a photo/video lightbox, about, contact.
- **Admin** (`/admin`) — projects with multi-file photo and video upload,
  categories, services, testimonials, enquiries, and contact settings.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, React 19, TypeScript strict) |
| Styling | Tailwind CSS v4 |
| Database / Auth / Storage | Supabase (free tier is enough) |
| Hosting | Vercel |

No separate backend and no paid services. Media goes to Supabase Storage behind
a small provider interface (`src/lib/storage/provider.ts`), so it can be moved
to Cloudinary or S3 later without a database or UI change.

## Setup

### 1. Install

```bash
npm install
```

### 2. Create a Supabase project

Create a free project at [supabase.com](https://supabase.com), then copy
`.env.example` to `.env.local` and fill in the values from
**Project Settings → API**:

```bash
cp .env.example .env.local
```

| Variable | Where it comes from |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → service_role key |
| `NEXT_PUBLIC_SITE_URL` | Your final domain, e.g. `https://phoenixpower.example` |

The `service_role` key bypasses every security rule. It is server-only, is
never sent to the browser, and must not be committed.

Until Supabase is configured the site still runs — it renders its empty states,
so you can see the design before setting anything up.

### 3. Create the database

In the Supabase dashboard open **SQL Editor** and run these three files in
order:

1. `supabase/migrations/0001_schema.sql` — tables, indexes, triggers
2. `supabase/migrations/0002_rls.sql` — row level security policies
3. `supabase/migrations/0003_storage.sql` — storage buckets and policies

### 4. Create the owner's login

```bash
npm run create-admin -- owner@example.com "a-strong-password"
```

There is no signup page anywhere in the app. An admin exists only because
someone with the service-role key created one. Run the same command again to
add another admin later.

### 5. Run it

```bash
npm run dev
```

Public site at `http://localhost:3000`, admin at `http://localhost:3000/admin`.

### 6. Optional: demo content

```bash
npm run seed          # add demo projects, categories and services
npm run seed:clean    # remove them again
```

Every demo row is flagged `is_demo` and every demo project title starts with
`[DEMO]`, so it can never be mistaken for real work. The owner can also remove
all of it from **Admin → Settings → Demo data**.

## Everyday use (for the owner)

1. Go to `/admin` and sign in.
2. **Projects → Add project** — enter the name, category, type and location.
3. Save, then add photos and videos. Upload several at once; progress shows per
   file. Reorder them with the arrows, and mark one photo as the **Cover** —
   that is the picture clients see in listings.
4. Set the status to **Published** and save. It appears on the site immediately.

Nothing in the admin asks for a slug, an ID or any code. Web addresses are
generated from the project name.

**Changing the order things appear in:** every list — projects, categories,
services, testimonials — has up/down arrows on each row. Pressing one saves
immediately and the website updates straight away. There is no "display order"
number to type anywhere; the arrows are the only control, so the two can never
disagree.

## Branding and hero images

- **Logo** — `src/components/public/phoenix-logo.tsx`. Inline SVG, so it inherits
  its colour and works on both the light header and dark footer with no second
  asset. The browser-tab icon is `src/app/icon.svg`; if you change the mark,
  change both.
- **Hero backdrop** — `src/config/hero.ts` lists the homepage images. They are
  Pexels stock ([licence](https://www.pexels.com/license/): free for commercial
  use, no attribution required), self-hosted in `public/hero` so the homepage
  does not depend on an external CDN. To swap one for your own photography,
  drop the file into `public/hero` and change the path in that file — nothing
  else needs touching. Wide, evenly-lit landscape shots work best, since the
  headline sits on top of them.

## Security

- **Row Level Security is on for every table.** The public can read published
  projects, active categories and services, and published testimonials — nothing
  else. Draft projects and their photos are invisible until published.
- **Writes require an admin.** Every policy checks `public.is_admin()`, which
  looks the user up in `admin_users`. Being signed in is not enough.
- **Three independent layers guard `/admin`**: `src/proxy.ts` redirects signed-out
  visitors, every admin page and server action calls `requireAdmin()`, and RLS
  refuses the write even if both were bypassed.
- **Uploads are limited server-side.** File type and size limits are set on the
  Supabase buckets, so they hold even if the browser check is bypassed.
- **Enquiries are write-only for the public.** Visitors can submit the contact
  form but can never read what anyone else submitted.
- The contact form is validated again on the server; client validation is
  treated as a convenience, not a control.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run verify` | Check the Supabase setup: migrations, RLS behaviour, storage buckets |
| `npm run typecheck` | TypeScript, no emit |
| `npm run lint` | ESLint |
| `npm run seed` / `npm run seed:clean` | Add / remove demo content |
| `npm run create-admin -- <email> <password>` | Create an admin login |

## Deploying to Vercel

1. Push the repository to GitHub and import it at
   [vercel.com/new](https://vercel.com/new).
2. Add every variable from `.env.example` in **Settings → Environment
   Variables**. Set `NEXT_PUBLIC_SITE_URL` to the real domain — SEO metadata,
   `sitemap.xml` and Open Graph images all derive from it.
3. Deploy. No build configuration is needed.

After the first deploy, add the production domain to Supabase under
**Authentication → URL Configuration**.

## Notes for developers

- Public pages are Server Components and render dynamically
  (`export const dynamic = 'force-dynamic'`). That is deliberate: when the owner
  publishes a project before a client meeting, it must be live immediately
  rather than after a revalidation window.
- This is Next.js **16**: `params`, `searchParams` and `cookies()` are Promises
  and must be awaited, route protection lives in `proxy.ts` (not
  `middleware.ts`), and `<Image priority>` is now `preload`.
- `typedRoutes` is on, so a link to a route that does not exist is a build
  error.
- Company contact details resolve in this order: the `settings` table (editable
  by the owner), then environment variables, then blank. Nothing invents a
  phone number or address.
