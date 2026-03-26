# PurjiX Development Workflow

Yeh document day-to-day feature work ko structured rakhne ke liye hai. Goal simple hai:

- random direct edits se bachna
- frontend/backend changes ko traceable rakhna
- deploy ke baad surprises kam karna

## 1. Golden Rules

1. `main` ko production-ready branch treat karo.
2. Har naya kaam feature branch par karo.
3. Ek branch = ek feature ya ek bugfix theme.
4. UI change karne se pehle data flow samjho.
5. Prisma schema change ho to usko alag se note karo.
6. Push se pehle local build/test mandatory hai.

## 2. Branch Naming

Use one of these:

- `feature/<short-name>`
- `fix/<short-name>`
- `refactor/<short-name>`
- `docs/<short-name>`

Examples:

- `feature/shipping-settings`
- `fix/login-api-url`
- `refactor/admin-orders-page`

## 3. Work Breakdown Pattern

Har new feature ko in 5 parts me socho:

1. `UI`
2. `state/data fetching`
3. `API/backend`
4. `database/schema`
5. `deploy impact`

Example:

- Shipping settings
- UI: admin settings form fields
- state/data: load and save settings
- API/backend: GET/PUT endpoints
- database: `AppSetting` fields
- deploy impact: Render `prisma:push`

## 4. Frontend Structure Rule

Frontend me same pattern follow karo:

- `app/.../page.tsx`
  Use as thin route wrapper only.
- `components/...`
  Put page UI and client logic here.
- `lib/...`
  Put pure helpers, API clients, formatting, pricing logic here.
- `store/...`
  Only shared client state.

Preferred pattern:

1. `page.tsx` keeps route-level wiring
2. heavy UI goes into a component like `*-page.tsx` or `*-form.tsx`
3. reusable logic goes into `lib/` or dedicated hooks

## 5. Backend Structure Rule

Backend me responsibilities split rakho:

- `routes/` for route registration
- `controllers/` for request/response handling
- `services/` for business logic
- `validation/` for zod schemas
- `prisma/schema.prisma` only for data model

Avoid:

- database logic directly inside routes
- validation logic mixed deep inside controllers
- pricing/shipping constants duplicated in multiple files

## 6. Feature Delivery Checklist

Har feature ke liye yeh flow follow karo:

1. branch banao
2. impacted files identify karo
3. frontend/backend/schema impact likho
4. implementation karo
5. local build/test chalao
6. deploy impact note karo
7. clean commit banao

## 7. Required Local Verification

Normal frontend/backend changes:

```bash
npm --workspace backend run build
npm --workspace frontend run build
```

Agar Prisma schema change hui:

```bash
npm --workspace backend run prisma:generate
npm --workspace backend run build
npm --workspace frontend run build
```

Optional full release verification:

```bash
npm run release:verify
```

## 8. Deploy Rules

### Vercel

- Root Directory: `frontend`
- Output Directory: blank
- Build Command: `npm run build`

### Render

If schema changed:

```bash
npm run prisma:push
npm run prisma:generate
```

Never run destructive schema commands blindly without checking warnings.

## 9. Commit Strategy

Keep commits small and meaningful.

Good:

- `Add configurable shipping settings`
- `Refactor admin orders page into client component`
- `Fix API base URL normalization`

Bad:

- `update`
- `changes`
- `fix stuff`

## 10. Safe Release Routine

Before pushing:

1. `git status`
2. run required builds
3. review changed files once
4. commit clearly
5. push

After deploy:

1. test `/login`
2. test changed page/feature
3. check browser console
4. check network for 404/500
5. if schema changed, verify backend shell steps are complete

## 11. When Production Looks Wrong

Before touching code again, check:

1. Vercel deployment commit SHA
2. Vercel root/output settings
3. browser cache/site data
4. live page source chunk hash
5. Render schema sync status

## 12. Recommended Working Model

Best routine:

1. build feature in branch
2. verify locally
3. push branch
4. review diff
5. merge to `main`
6. deploy
7. smoke test

Yeh process follow karoge to next time feature add karna zyada predictable hoga aur rollback ki need kaafi kam hogi.
