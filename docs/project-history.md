# Project History

## Overview
- Project: PurjiX
- Type: Mobile spare parts ecommerce platform with admin operations
- Frontend: Next.js
- Backend: Node.js/Express + Prisma/PostgreSQL
- Deployments:
  - Frontend: Vercel
  - Backend: Render

## Deployment and Hosting
- Frontend was moved to Vercel and backend kept on Render.
- Render frontend was deprecated after Vercel stabilized.
- Live frontend URL set to `https://www.purjix.com`
- Live backend URL set to `https://sparekart-backend.onrender.com`
- CORS and production env alignment were fixed for the Vercel frontend origin.

## Major Fixes
- Fixed malformed JSX in footer.
- Fixed nested form hydration issues in navbar/search flows.
- Fixed admin reference-data authentication for brands, models, and categories.
- Fixed stale product image visibility by changing fetch/caching behavior.
- Fixed authenticated invoice downloads for both admin and users.
- Fixed duplicate cancel notifications on unchanged order status.
- Fixed public catalog routes accidentally blocked by admin/account auth middleware.

## Auth and User Flows
- Added email verification flow.
- Added forgot password and reset password flow.
- Added stricter registration behavior: rollback if verification email cannot be sent.
- Added register confirm-password and password show/hide UX.
- Added login redirect improvements and verification-related UX polishing.
- Added dev-friendly email fallback/log behavior for localhost when SMTP is not configured.
- Added development rate-limit bypass to reduce local auth friction.

## Customer Features
- Account management page added.
- Saved addresses and profile management added.
- My Orders improvements:
  - cancel request flow
  - return request flow
  - authenticated invoice download
- Notifications center added with read/unread handling.
- Track order page improved with shipment timeline and better cancelled-order treatment.

## Admin and Operations
- Shipment fields added:
  - courier
  - AWB
  - ETA
  - admin notes
- Cancel/return request approval workflow added.
- Admin customer detail view added.
- Low-stock alerts and reorder suggestions added.
- COD restrictions by order value and pincode added.
- Support inbox workflow added.
- Admin dashboard improved with operations-focused metrics.
- Admin orders page improved with ops filters and shipment warnings.
- Admin products page improved with readiness/media/stock workflow.
- Inventory and orders cross-linking added.

## Accounting and Business Features
- Accounting dashboard added.
- Accounting report table and CSV export added.
- GST summary and daily breakdown added.
- Margin tracking added:
  - estimated cost
  - gross profit
  - margin percentage
- Vendor purchases and stock inward tracking added.
- Refund and return analytics added to accounting.
- Invoice PDF upgraded with improved layout and tax details.
- Accounting sanity fixes applied for refund semantics and prepaid wording.

## Catalog and Discovery
- Homepage was simplified multiple times to reduce clutter.
- Hero content was rewritten to focus on brand > model > part discovery.
- Popular/featured/trust sections were removed from homepage for cleaner discovery.
- Brand-first model navigation added:
  - `/brands`
  - `/brands/[slug]`
  - `/brands/[slug]/models/[modelSlug]`
- Model landing pages were redesigned in a Maxbhi-style direction.
- Brand logos and model image support were added locally for admin/public surfaces.
- Per-product GST and HSN support were added locally:
  - manual GST rate per product
  - HSN code per product
  - order tax calculation moved from flat 18% to product-level rate

## Mobile and Responsive Work
- Mobile homepage top fold simplified.
- Storefront navbar optimized for mobile.
- Admin mobile navigation and overflow handling improved.
- Checkout mobile layout improved.
- Product gallery mobile touch behavior improved.
- Product, cart, and product detail pages received mobile-polish passes.

## Production Data and Cleanup
- Demo login UI references were removed.
- Production env validation was tightened.
- Demo seeding was gated behind explicit env flags.
- Production data cleanup scripts and one-off DB cleanup steps were prepared and used.
- Existing sample orders/customers/coupons were cleaned while preserving catalog/admin where needed.
- Admin credentials were updated from demo to real values.

## Proposal and Sales Material
- Client proposal template created.
- WhatsApp proposal templates created:
  - English short version
  - Hindi-English mixed version

## Local Development Notes
- Localhost issues encountered included:
  - env strictness failures
  - hydration mismatches
  - stale `.next` cache
  - duplicate dev processes
- Local setup was stabilized through env loading fixes, auth-flow adjustments, and dev-only fallbacks.

## Current Notable Docs
- `docs/client-proposal.md`
- `docs/whatsapp-proposal.md`
- `docs/launch.md`
- `docs/operations.md`
- `docs/status.md`

## Notes
- This file is a concise project/chat-derived history, not a verbatim transcript.
- It is intended to preserve the major technical, deployment, business, and UX decisions made during development.
