# PurjiX Operations Runbook

## Render Service Setup

### Backend

- Root directory: `backend`
- Build command:

```bash
npm install && npm run prisma:generate && npm run prisma:push && npm run build
```

- Start command:

```bash
npm start
```

### Frontend

- Root directory: `frontend`
- Build command:

```bash
npm install && npm run build
```

- Start command:

```bash
npm start
```

## Required Production Environment Variables

### Backend

- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `FRONTEND_URL`
- `SITE_URL`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `COMPANY_NAME`
- `COMPANY_LEGAL_NAME`
- `COMPANY_GSTIN`
- `COMPANY_PHONE`
- `COMPANY_EMAIL`
- `COMPANY_ADDRESS_LINE1`
- `COMPANY_ADDRESS_LINE2`

### Frontend

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `NEXT_PUBLIC_SITE_URL`

## Post-Deploy Checks

1. Open backend health:

```bash
https://<backend-domain>/api/health
```

Expected:
- `status: "ok"`
- `db: "up"`

2. Open frontend and verify:
- homepage loads
- catalog loads
- login works
- refresh keeps the session

3. In backend shell, only if the deploy changed Prisma schema:

```bash
npm run prisma:push
npm run prisma:generate
```

## Local Uploads For Migrated Images

Cloudinary remains configured for new uploads, but migrated catalog images can be served from VPS local storage. Nginx should expose `/uploads` from `/var/www/purjix-uploads`:

```nginx
location /uploads/ {
    alias /var/www/purjix-uploads/;
    access_log off;
    expires 30d;
    add_header Cache-Control "public, max-age=2592000";
}
```

Run the Cloudinary image audit before applying any migration:

```bash
node backend/scripts/audit-cloudinary-images.js
node backend/scripts/migrate-cloudinary-images.js --dry-run
node backend/scripts/migrate-cloudinary-images.js --apply
```

## Prisma Schema Rollout

When a change touches `backend/prisma/schema.prisma`, do not stop after local sync. The local command only updates the local PostgreSQL instance.

1. Sync the local database:

```bash
cd /Users/apple/screenshield
npm run db:push
```

2. Verify the local app against the new schema:
- backend build passes
- frontend build passes if API types changed
- the changed feature works locally

3. Commit and push the schema change.

4. Sync the Render production database from the backend service shell:

```bash
npm run prisma:push
npm run prisma:generate
```

5. Redeploy the Render backend.

6. Redeploy the Vercel frontend if the release includes frontend changes.

7. Run production smoke checks:
- `https://<backend-domain>/api/health`
- login
- checkout
- the feature affected by the schema change

## Payment Operations

- Configure `RAZORPAY_WEBHOOK_SECRET`
- Point Razorpay webhook to:

```bash
https://<backend-domain>/api/payments/razorpay/webhook
```

- Supported webhook events currently handled:
  - `payment.captured`
  - `payment.failed`
  - `order.paid`

- After webhook setup, verify:
  - successful payment marks order `PAID`
  - failed payment marks order `FAILED`
  - duplicate webhook delivery does not break order state

## Monitoring Baseline

- Watch Render logs for:
  - structured request logs
  - structured error logs
  - startup failures
  - unhandled rejections
  - uncaught exceptions

- Minimum alerts to configure externally:
  - backend health check failing
  - frontend health/page availability failing
  - repeated payment verification failures
  - repeated 5xx bursts on backend

## Rollback Procedure

1. Identify the last healthy Render deploy.
2. Roll back backend first if the issue is API, auth, payment, or Prisma related.
3. Roll back frontend if the issue is UI-only.
4. Re-run backend `/api/health`.
5. Test login, checkout, and one admin page after rollback.

## Backup Notes

- Ensure Render PostgreSQL backups are enabled.
- Before risky schema changes, create an on-demand backup or snapshot.
- Avoid using destructive `prisma db push --accept-data-loss` in production unless the data loss is explicitly understood and accepted.
