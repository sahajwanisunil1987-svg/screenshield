# PurjiX

PurjiX is a production-structured single-vendor e-commerce platform for mobile spare parts. It ships as a TypeScript monorepo with a Next.js storefront/admin frontend and an Express + Prisma backend.

## Monorepo structure

```text
purjix/
  frontend/
  backend/
  docs/
  README.md
```

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Copy environment files:

```bash
cp .env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

3. Start PostgreSQL locally, then run:

```bash
npm run db:push
npm run db:seed
npm run dev
```

4. Before pushing a release, use:

```bash
npm run release:verify
npm run deploy:check
```

If the release changes Prisma schema, use:

```bash
npm run release:schema
```

Frontend runs at `http://localhost:3000`.
Backend runs at `http://localhost:4000`.

## Git setup

Initialize and commit the repo:

```bash
git init
git checkout -b main
git add .
git commit -m "Initial PurjiX monorepo"
```

Then add your remote and push:

```bash
git remote add origin <your-repo-url>
git push -u origin main
```

## Deployment

Recommended production setup:
- Frontend: Render
- Backend: Render
- Database: Render PostgreSQL

### Render

This repo includes [render.yaml](/Users/apple/screenshield/render.yaml) for full Render deployment:

- `purjix-frontend` as the Next.js frontend web service
- `purjix-backend` as a Node web service
- `purjix-postgres` as the managed PostgreSQL database

Set these env vars on Render before going live:

- Frontend
  - `NEXT_PUBLIC_API_BASE_URL=https://your-backend-service.onrender.com/api`
  - `NEXT_PUBLIC_SITE_URL=https://your-frontend-service.onrender.com`
  - `NEXT_PUBLIC_RAZORPAY_KEY_ID=...`
- Backend
  - `FRONTEND_URL=https://your-frontend-service.onrender.com`
  - `JWT_SECRET=...`
  - `RAZORPAY_KEY_ID=...`
  - `RAZORPAY_KEY_SECRET=...`
  - `CLOUDINARY_*`
  - `SMTP_*`

After a backend deploy that changes Prisma schema, open the Render backend shell and run:

```bash
npm run prisma:push
npm run prisma:generate
```

### Notes for production

- `NEXT_PUBLIC_API_BASE_URL` should point to the public backend base URL ending in `/api`.
- `FRONTEND_URL` should exactly match the public frontend domain used by customers.
- Frontend production is expected to run from Render alongside the Render backend and database.
- The current Render setup uses free plans as a starting point. Upgrade before production traffic.
- Email, Cloudinary, and Razorpay are wired but require real credentials.
- For rollout, rollback, and health checks, see [docs/operations.md](/home/mistermobiletriveni/screen/screenshield/docs/operations.md).
- For launch gating, see [docs/launch.md](/home/mistermobiletriveni/screen/screenshield/docs/launch.md).
- For day-to-day feature structure and workflow, see [docs/development-workflow.md](/Users/apple/screenshield/docs/development-workflow.md).

## Core features

- Brand -> model -> part type product discovery
- JWT customer/admin authentication
- Cart, wishlist, checkout, coupon validation
- Razorpay order creation and verification scaffolding
- Cloudinary upload integration
- GST-ready invoice generation
- Admin modules for brands, models, categories, products, orders, coupons, inventory, and users

## Sample accounts

After seeding:

- Admin: `admin@sparekart.in` / `Admin@123`
- Customer: `user@sparekart.in` / `User@1234`

## Notes

- Razorpay, SMTP, Cloudinary, and WhatsApp webhook integrations are wired for real credentials through environment variables.
- Invoice generation returns PDF metadata and a downloadable HTML invoice endpoint scaffold.
- The project uses Prisma with PostgreSQL and includes seed data for brands, models, categories, products, coupons, and users.
- The repo is prepared for Git and Render Blueprint deployment.

## Release Flow

Use these commands before shipping changes:

```bash
npm run release:verify
npm run deploy:check
```

If Prisma schema changed locally:

```bash
npm run release:schema
```

Production schema sync is separate from local sync. Run `npm run prisma:push && npm run prisma:generate` inside the Render backend shell after schema changes.
