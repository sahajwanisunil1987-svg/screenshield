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

Current production split:
- Frontend: Vercel
- Backend: Render
- Database: Render PostgreSQL

### Render

This repo includes [render.yaml](/Users/apple/screenshield/render.yaml) for backend and database setup:

- `purjix-backend` as a Node web service
- `purjix-postgres` as the managed PostgreSQL database

After a backend deploy that changes Prisma schema, open the Render backend shell and run:

```bash
npm run prisma:push
npm run prisma:generate
```

### Vercel

Frontend should be deployed from the `frontend` root directory with:

- Framework: `Next.js`
- Root Directory: `frontend`
- Build Command: `npm run build`
- Install Command: `npm install`

Required frontend env vars:
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`

### Notes for production

- `NEXT_PUBLIC_API_BASE_URL` should point to the public backend base URL ending in `/api`.
- The current Render setup uses free plans as a starting point. Upgrade before production traffic.
- Email, Cloudinary, and Razorpay are wired but require real credentials.
- If you want a single-platform deploy elsewhere, split frontend and backend envs the same way as the included Render blueprint.
- For rollout, rollback, and health checks, see [docs/operations.md](/home/mistermobiletriveni/screen/screenshield/docs/operations.md).
- For launch gating, see [docs/launch.md](/home/mistermobiletriveni/screen/screenshield/docs/launch.md).

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
