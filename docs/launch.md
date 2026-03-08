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
- Add rate limiting on auth, search, order, and payment endpoints
- Add basic abuse protection
  - Login throttling
  - Coupon validation throttling
  - Upload protection
- Review CORS config so only allowed origins are accepted
- Ensure Cloudinary credentials are production-only and valid

## Payments

- Verify Razorpay webhook or equivalent reconciliation strategy
- Confirm no order is marked paid without verification
- Verify payment failure and retry behavior
- Verify duplicate payment callback safety

## Operations

- Add logging and monitoring
  - Backend errors
  - Payment failures
  - Order creation failures
- Add uptime and health monitoring for frontend and backend
- Add a database backup and recovery plan
- Add a deployment rollback plan
- Document Render environment variables and deployment steps

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

- Add at least a minimal test suite for
  - Auth
  - Order creation
  - Payment verification
  - Review moderation
  - Invoice flow
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
