# SpareKart Project History

## Overview

This document captures the major implementation history for SpareKart across the planning, build, polish, and go-live-hardening phases completed in this workspace.

It is not a literal chat export. It is a structured project record intended for handoff, future maintenance, and release tracking.

## Original Build Brief

The project was built against a detailed SpareKart prompt for a single-vendor mobile spare-parts platform with:

- Next.js 14 frontend
- Express + Prisma backend
- PostgreSQL
- Razorpay payments
- Cloudinary uploads
- customer and admin flows
- Brand -> Model -> Part Type discovery

## Implementation Phases

### P1

Core stabilization and must-have product behavior:

- aligned cart and checkout totals with backend GST handling
- added persistent wishlist APIs and frontend sync
- made navbar search functional
- added route-level loading, error, and not-found states
- hardened auth with refresh-session handling instead of only long-lived client token use

### P2

Search, SEO, admin UX, storefront polish, and operational product depth:

- live autocomplete search
- stronger search ranking
- product and catalog SEO metadata
- product JSON-LD and breadcrumb structured data
- catalog sorting, pagination, and richer filter UX
- homepage and mobile search polish
- admin search, filtering, and backend-driven pagination
- admin dashboard polish
- admin theme reuse
- product-page and review-panel polish
- checkout, order-success, my-orders, and tracking UX polish
- product compatibility support
- improved GST invoice layout

### P3

Recommended deeper functionality:

- review moderation workflow
- range-based admin analytics
- invoice persistence and invoice history
- product comparison flow

## Additional Launch Hardening

After P1, P2, and P3, go-live-focused backend and operational work was added:

- request ID and structured request logging
- structured error logging
- rate limiting for auth, search, order, payment, and upload endpoints
- DB-aware health endpoint
- graceful shutdown hooks
- uncaught exception and unhandled rejection logging
- Razorpay webhook verification and reconciliation handling
- baseline backend automated tests
- operations runbook and launch checklist documentation

## Major Documentation Added

- [launch.md](/home/mistermobiletriveni/screen/screenshield/docs/launch.md)
- [status.md](/home/mistermobiletriveni/screen/screenshield/docs/status.md)
- [operations.md](/home/mistermobiletriveni/screen/screenshield/docs/operations.md)

## Key Render / Deployment Notes

- Backend Render service root is `backend`
- Frontend Render service root is `frontend`
- From a Render backend shell inside `/opt/render/project/src/backend`, use:

```bash
npm run prisma:push
npm run prisma:generate
```

- Do not use:

```bash
npm run db:push
```

inside the `backend` directory, because that root-level script does not exist there.

- Production auth persistence depends on:
  - exact `FRONTEND_URL`
  - secure refresh cookie handling
  - `SameSite=None` in production

- Razorpay webhook verification now depends on:
  - `RAZORPAY_WEBHOOK_SECRET`

## Important Production Environment Variables

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

## Current Project Status

The planned implementation sequence is complete:

- `P1`: complete
- `P2`: complete
- `P3`: complete

The current remaining work is go-live verification and operational confirmation, not missing product scope.

## Remaining Go-Live Focus

- verify auth refresh persistence on Render
- verify live Razorpay payment flow
- verify webhook delivery and reconciliation
- confirm production logs and health checks
- expand automated coverage beyond the current backend baseline
- finalize backups, alerts, and rollback process
- replace any placeholder business or policy content still present

## Notable Commits

This is a partial milestone list, not every single commit:

- `e958dcf` complete P1 storefront, wishlist, and auth hardening
- `ed1fd90` richer catalog UX
- `bc7e0a4` search relevance scoring
- `2954c55` mobile catalog filters
- `cc57913` product detail polish
- `5d0ca92` review panel polish
- `f7743ca` admin search and filtering
- `3dbc616` admin dashboard polish
- `4ae8c6b` backend-driven admin filtering and pagination
- `41f0cee` refresh-session cleanup and mobile web app meta fix
- `05713ad` product compatibility support
- `3cd275d` upgraded GST invoice output
- `3ce90b0` admin login theme toggle
- `42612aa` persisted-store hydration mismatch fix
- `92accd7` deterministic client date formatting for hydration
- `b0bd89f` auth-form hydration guard
- `0ebde6d` Render cross-origin refresh-cookie fix
- `08a10ed` review moderation workflow
- `8e35079` range-based admin analytics
- `1a34f49` invoice persistence history
- `8bd736a` product compare
- `e32c3b3` go-live checklist doc
- `dbbcbf7` project status doc
- `a1799e0` go-live hardening and operations runbook

## How To Use This File

Use this file as a quick reference for:

- what has already been implemented
- how the project evolved
- what still needs production verification
- which docs to read next before launch
