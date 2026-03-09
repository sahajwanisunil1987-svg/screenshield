# SpareKart Go-Live Checklist

## Critical

- Confirm auth refresh works on Render
  - Login
  - Refresh page
  - Confirm the session stays active
- Run the latest Prisma sync on the production database
  - `npm run prisma:push`
  - `npm run prisma:generate`
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
- Confirm backend `FRONTEND_URL` matches the exact frontend Render URL
- Confirm `SITE_URL` and `NEXT_PUBLIC_SITE_URL` are correct
- Confirm rate limiting is active on auth, search, order, payment, and upload endpoints
- Confirm abuse protection thresholds suit real traffic
  - Login throttling
  - Coupon validation throttling
  - Upload protection
- Review CORS config so only allowed origins are accepted
- Ensure Cloudinary credentials are production-only and valid

## Payments

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
- Database schema fully in sync
- Real environment variables set
- Monitoring in place
