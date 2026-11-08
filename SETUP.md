> **This is a copy** of adventure-buddha-website, made on 8 Nov 2026. It has its own Cloudflare project and its own database. Changes here do not affect the original.

# Adventure Buddha website: setup guide

This repository is the complete website: public trip pages, booking, and the team dashboard at `/admin/`.
It runs on **Cloudflare Workers** (settings in `wrangler.jsonc`) with a **Cloudflare D1** database. Every push to `main` deploys automatically. No coding is needed to set it up.

## 1. Create the database (2 minutes)
1. Log in to dash.cloudflare.com.
2. Left menu: **Storage & Databases → D1 SQL Database → Create**.
3. Name: `adventure-buddha-db` → **Create**. (Leave it empty. The website creates its own tables.)

## 2. Connect this GitHub repository to Cloudflare
1. **Workers & Pages → Create → Import a repository → GitHub**, allow access to **adventure-buddha-copy-08-nov-2026**, and deploy.
   The settings come from `wrangler.jsonc` (worker name, database binding `DB`, `SITE_MODE`).
2. If you use a new database, put its ID in `wrangler.jsonc` under `database_id`.

## 3. Add the setup code
Worker **adventure-buddha-copy-08-nov-2026 → Settings → Variables and secrets → Add variable**:
`SETUP_CODE` = a code only you know, tick **Secret**, then **Add variable and deploy**.
(`SITE_MODE` lives in `wrangler.jsonc`: change it to `live` on launch day.)

## 4. Create your owner login
Open `https://adventure-buddha-copy-08-nov-2026.adventurebuddhacanva.workers.dev/admin/`, enter the setup code, your name, email and a password.
Then click **Load starter trips** on the Overview (8 trips copied from the current site).

## 5. Add your team
Dashboard → **Team & logins** → add each person with a role (Owner, Manager, Sales, Trip lead) and a temporary password.

## Later: online payments (Razorpay)
In Razorpay Dashboard → **Account & Settings → API Keys**, generate keys (use **Test mode** first).
In the Worker → **Settings → Variables and secrets**, add as **Secrets**:
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET` (any long random text; use the same text when adding the webhook below)

In Razorpay → **Webhooks → Add**: URL `https://YOUR-SITE/api/razorpay/webhook`, events `payment.captured` and `order.paid`, secret = the same `RAZORPAY_WEBHOOK_SECRET`.
They take effect immediately. "Pay 50% now" and "Pay in full" then appear in the booking form.

## Later: new.adventurebuddha.com (trial address)
Worker → **Domains → Add custom domain** → `new.adventurebuddha.com` (the domain must be added to Cloudflare first; Claude will guide you).

## Launch day (switch from TravStack)
1. Dashboard → Website settings → **Copy photos into my website** (so nothing depends on TravStack).
2. Change `SITE_MODE` to `live` in `wrangler.jsonc` (Claude does this).
3. Worker → Domains → add `adventurebuddha.com` and `www.adventurebuddha.com`.
4. Submit `https://adventurebuddha.com/sitemap.xml` in Google Search Console.

## How the code is organised
- `public/` – static files: site styles and scripts, the dashboard (`public/admin/`)
- `src/worker.js` – entry point that routes requests
- `functions/` – server pages and the API
- `lib/` – shared code: database, page templates, logins, pricing
- Old TravStack addresses keep working: `/tour/<name>`, `/tours/?categories=…`, `/p/about-us`
