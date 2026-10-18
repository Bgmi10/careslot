# CareSlot: health service booking (Next.js + Prisma + Tailwind + S3)

Patients browse services, pick a slot and confirm a booking. Admins manage services, slots, users and download reports.

## Stack
- Next.js 14 (App Router, TypeScript), REST route handlers under `src/app/api`
- Prisma + PostgreSQL
- Tailwind CSS
- Auth: email/password (bcrypt), JWT in an httpOnly cookie, password reset by one-hour token emailed via Brevo
- Server-side S3 uploads for service images (admin-only API route, no bucket CORS needed)
- Reports: CSV and PDF (`pdf-lib`)

## Project layout
```
prisma/schema.prisma      database schema (User, Service, Slot, Booking, PasswordReset)
prisma/seed.ts            admin account + 4 sample services with 7 days of slots
src/lib/                  auth, api helpers, s3, mail, zod schemas
src/middleware.ts         guards /admin (admin only) and /bookings (signed in)
src/app/api/              REST endpoints (see table below)
src/app/                  pages: home, service detail + slot picker, auth, my bookings, admin
```

## Run locally
```bash
cp .env.example .env          # fill DATABASE_URL, AUTH_SECRET (openssl rand -base64 32), AWS_*/S3_*, BREVO_*
npm install
npx prisma db push            # creates tables from schema.prisma
npm run db:seed               # admin + sample data
npm run dev                   # http://localhost:3000
```
Seed admin: `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env` (defaults `admin@example.com` / `Admin123!`). **Change it.**
If `BREVO_API_KEY` is empty, password-reset links are printed to the server console.

## Acceptance scenario
1. Sign in as admin, go to `/admin` → **Services** → create a service (optionally upload an image).
2. **Slots** → choose the service, set date and 09:00–17:00, **Generate slots**.
3. Sign out, **Create account**, then open the new service on the home page.
4. Pick a time → **Confirm booking** → lands on *My bookings* with a confirmation.
5. As admin: **Bookings** shows it; **Reports** downloads CSV/PDF.

## S3 setup
1. Create a bucket in your `AWS_REGION`. Allow public read for the `uploads/*` prefix (bucket policy), or front it with CloudFront and set `S3_PUBLIC_BASE_URL` to that URL.
2. Create an IAM user with `s3:PutObject` on `arn:aws:s3:::BUCKET/uploads/*` and put its keys in `.env` as `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`. Never commit them.
3. Uploads go browser → `/api/admin/upload` → S3 (JPG/PNG/WebP, max 5 MB), so no CORS rules are required.

## Brevo email setup
Create an API key in Brevo and verify your sender address or domain. Set `BREVO_API_KEY` and `BREVO_SENDER_EMAIL`. Unverified senders are rejected by Brevo.

## REST API
| Method | Path | Access |
|---|---|---|
| POST | `/api/auth/register`, `/login`, `/logout`, `/forgot`, `/reset` | public |
| GET | `/api/auth/me` | public (null if signed out) |
| GET | `/api/services`, `/api/services/:id/slots` | public |
| GET/POST | `/api/bookings` | user |
| PATCH | `/api/bookings/:id` (cancel) | owner |
| GET/POST | `/api/admin/services` · PATCH `/api/admin/services/:id` (edit, `active` toggle) | admin |
| GET/POST | `/api/admin/slots` · DELETE `/api/admin/slots/:id` | admin |
| GET | `/api/admin/bookings` | admin |
| GET | `/api/admin/users?q=` · PATCH/DELETE `/api/admin/users/:id` | admin |
| GET | `/api/admin/reports?range=daily\|weekly&from=ISO&format=csv\|pdf` | admin |
| POST | `/api/admin/upload` (multipart image → S3) | admin |

Double-booking is prevented by a serializable transaction that checks slot capacity before inserting.

## Deploy on a Linux VPS (Ubuntu 22.04/24.04)
```bash
# 1. Packages
sudo apt update && sudo apt install -y nginx postgresql git certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs
sudo npm i -g pm2

# 2. Database
sudo -u postgres psql -c "CREATE USER careslot WITH PASSWORD 'strong-password';"
sudo -u postgres psql -c "CREATE DATABASE careslot OWNER careslot;"

# 3. App
sudo mkdir -p /srv/careslot && sudo chown $USER /srv/careslot
unzip careslot.zip -d /srv && cd /srv/careslot
cp .env.example .env && nano .env      # set DATABASE_URL, AUTH_SECRET, APP_URL=https://your-domain.com, AWS_*, S3_*, BREVO_*
npm ci && npx prisma db push && npm run db:seed && npm run build
pm2 start npm --name careslot -- start && pm2 save && pm2 startup

# 4. Nginx reverse proxy: /etc/nginx/sites-available/careslot
#    server { server_name your-domain.com; location / { proxy_pass http://127.0.0.1:3000;
#      client_max_body_size 6m;   # allow 5 MB image uploads
#      proxy_set_header Host $host; proxy_set_header X-Forwarded-For $remote_addr; proxy_set_header X-Forwarded-Proto $scheme; } }
sudo ln -s /etc/nginx/sites-available/careslot /etc/nginx/sites-enabled/ && sudo nginx -t && sudo systemctl reload nginx

# 5. HTTPS (required: the session cookie is `secure` in production)
sudo certbot --nginx -d your-domain.com
```
Updating: `git pull` (or upload new code) → `npm ci && npx prisma db push && npm run build && pm2 restart careslot`.

## Extending
- New entity: add a model in `schema.prisma`, a zod schema in `src/lib/schemas.ts`, a route using `handler()` + `requireAdmin()`/`requireUser()`.
- For versioned migrations later, run `npx prisma migrate dev --name init` once and switch deploys to `prisma migrate deploy`.
- Add rate limiting on `/api/auth/*` (e.g. at Nginx) before going public.

## Known limits
- Slots are generated from the admin's browser time zone; reports use `REPORT_TZ`.
- PDF reports use a built-in font, so non-Latin characters print as `?` (CSV is unaffected).
- Payments are not included; prices are display-only.
