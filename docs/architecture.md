# SpareKart Architecture

- `frontend`: Next.js 14 App Router storefront and admin UI.
- `backend`: Express API with Prisma/PostgreSQL.
- `search flow`: brand -> model -> category filters backed by query params.
- `payments`: Razorpay order creation and signature verification endpoints.
- `invoices`: GST-ready invoice service with HTML/PDF-friendly payloads.
