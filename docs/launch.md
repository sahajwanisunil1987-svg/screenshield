# PurjiX Go-Live Checklist

## Smoke Testing Policy

- Live environment: read-only smoke only
  - Observe and verify only
  - No destructive actions
  - No bulk edits
  - No test cleanups directly on production data unless explicitly required
- Localhost environment: real smoke
  - Login, cart, checkout, payment, bulk upload, admin actions, and bug reproduction should be tested locally first
  - Reproduce and fix issues locally before touching live
- Working rule
  - Live = observe
  - Localhost = experiment

## Critical

- Confirm auth refresh works on Render
  - Login
  - Refresh page
  - Confirm the session stays active
- Run the latest Prisma sync on both databases when schema changed
  - Local: `cd /Users/apple/screenshield && npm run db:push`
  - Render backend shell: `npm run prisma:push`
  - Render backend shell: `npm run prisma:generate`
- Verify Razorpay end to end with production keys
  - Create order
  - Complete payment
  - Confirm payment status update
  - Confirm mismatched or duplicate payment verification does not mark the wrong order paid
- Verify COD flow end to end
- Verify invoice generation and history
  - Open `/admin/invoices`
  - Download PDF
  - Confirm `generatedAt`, `downloadCount`, and `lastDownloadedAt` update
- Verify review moderation flow
  - Customer submits review
  - Admin approves, hides, or deletes review
  - Public product page shows only approved reviews

## Security

- Set strong secrets on Render
  - `JWT_SECRET`
  - `JWT_REFRESH_SECRET`
- Confirm backend `FRONTEND_URL` matches the exact production frontend URL
- Confirm `SITE_URL` and `NEXT_PUBLIC_SITE_URL` are correct
- Confirm rate limiting is active on auth, search, order, payment, and upload endpoints
- Confirm abuse protection thresholds suit real traffic
  - Login throttling
  - Coupon validation throttling
  - Upload protection
- Review CORS config so only allowed origins are accepted
- Ensure Cloudinary credentials are production-only and valid

## Payments

- If live Razorpay credentials are not available yet, treat online payments as the final external verification blocker.
- Configure `RAZORPAY_WEBHOOK_SECRET`
- Point Razorpay webhook to `/api/payments/razorpay/webhook`
- Verify Razorpay webhook or equivalent reconciliation strategy
- Confirm no order is marked paid without verification
- Verify payment failure and retry behavior
- Verify duplicate payment callback safety

## Operations

- Confirm backend structured request and error logging is visible in Render logs
- Add monitoring and alerting
  - Payment failures
  - Order creation failures
- Add uptime and health monitoring for frontend and backend
- Confirm `/api/health` is returning DB-up status in production
- Add a database backup and recovery plan
- Add a deployment rollback plan
- Document Render environment variables and deployment steps
  - See [operations.md](/home/mistermobiletriveni/screen/screenshield/docs/operations.md)

## Data

- Confirm demo or seed data does not leak into real production unexpectedly
- Review product, stock, brand, model, coupon, and invoice data for correctness
- Verify low-stock and inventory updates after orders

## Admin

- Test all admin CRUD flows
  - Brands
  - Models
  - Categories
  - Products
  - Inventory
  - Coupons
  - Reviews
  - Users
  - Invoices
- Confirm admin-only routes are protected
- Confirm customers cannot access admin routes or admin APIs

## Storefront

- Verify homepage, catalog, product page, cart, checkout, wishlist, compare, orders, and tracking
- Test mobile layouts on key pages
- Hard refresh production and confirm there are no hydration errors
- Confirm search, sorting, filters, and autocomplete all behave correctly

## Content and Business

- Replace placeholder company details
  - GSTIN
  - Support email
  - Phone
  - Address
- Replace placeholder policy and support pages with real content
- Confirm footer contact and social links are real
- Confirm warranty and return copy matches the actual business policy

## SEO

- Verify the production domain is used in metadata and JSON-LD
- Check canonical and meta tags on homepage, catalog, and product pages
- Add or verify sitemap and robots strategy if SEO matters for launch

## Testing

- Run backend automated tests
  - `npm --workspace backend run test`
- Expand coverage beyond the current baseline
  - Auth
  - Admin analytics
  - Order creation
  - Payment verification
  - Review moderation
  - Invoice flow
  - Webhook handling
- Run a manual regression checklist before launch

## Final Launch Gate

- No production-breaking console errors
- No broken admin routes
- No broken checkout path
- Payment and COD both working
- Auth persists on refresh
- Local and Render production database schema both in sync
- Real environment variables set
- Monitoring in place

## Current Practical Status

- Implementation: complete
- Launch hardening: largely complete
- Final external dependency blocker: live Razorpay credential and webhook verification
## Launch Signoff

Mark each item `PASS` or `FAIL` during final release validation.

### Customer

- [ ] Customer login works
- [ ] Session persists after refresh
- [ ] Account page loads
- [ ] Profile update works
- [ ] Address add/edit/delete works
- [ ] Product search works
- [ ] Product page loads
- [ ] Cart works
- [ ] Checkout opens
- [ ] COD checkout works
- [ ] My Orders loads
- [ ] Notifications loads
- [ ] Track order works

### Admin

- [ ] Admin login works
- [ ] Admin orders page loads
- [ ] Order status update works
- [ ] Courier/AWB/ETA save works
- [ ] Admin inventory page loads
- [ ] Low-stock filters and summary work

### Platform

- [ ] Backend health returns `status: ok`
- [ ] Backend health returns `db: up`
- [ ] No CORS errors in browser console
- [ ] No network errors in browser console
- [ ] No production-breaking console errors
- [ ] Render production schema is in sync
- [ ] Render frontend is on latest deploy
- [ ] Render backend is on latest deploy

### Payments

- [ ] Razorpay flow verified if live keys are active
- [ ] Failed payment does not mark order paid
- [ ] Duplicate payment callback does not corrupt status
- [ ] COD restrictions behave as expected
