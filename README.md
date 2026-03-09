# SpareKart

SpareKart is a production-structured single-vendor e-commerce platform for mobile spare parts. It ships as a TypeScript monorepo with a Next.js 14 storefront/admin frontend and an Express + Prisma backend.

## Monorepo structure

```text
sparekart/
  frontend/
  backend/
  docs/
  docker-compose.yml
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

3. Start PostgreSQL locally or with Docker, then run:

```bash
npm run db:push
npm run db:seed
npm run dev
```

Frontend runs at `http://localhost:3000`.
Backend runs at `http://localhost:4000`.

## Docker

```bash
docker compose up --build
```

## Git setup

Initialize and commit the repo:

```bash
git init
git checkout -b main
git add .
git commit -m "Initial SpareKart monorepo"
```

Then add your remote and push:

```bash
git remote add origin <your-repo-url>
git push -u origin main
```

## Deployment

### Render Blueprint

This repo includes [render.yaml](/Users/apple/Desktop/ScreenSheild/render.yaml) for a two-service deployment:

- `sparekart-backend` as a Node web service
- `sparekart-frontend` as a Next.js web service
- `sparekart-postgres` as the managed PostgreSQL database

Before creating the Blueprint on Render:

1. Push this repo to GitHub, GitLab, or Bitbucket.
2. In Render, create a new Blueprint and point it at the repo.
3. Fill in the non-synced secrets:
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `SMTP_HOST`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `WHATSAPP_WEBHOOK_URL`
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID`
4. After the first backend deploy, run:

```bash
npx prisma db push
node --env-file=.env --import tsx prisma/seed.ts
```

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
- The repo is prepared for Git, Docker, and Render Blueprint deployment.
