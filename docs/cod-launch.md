# SpareKart COD Launch Checklist

## Before Launch

1. Open backend health:

```bash
https://sparekart-backend.onrender.com/api/health
```

Confirm:
- `status: "ok"`
- `db: "up"`

2. Test customer login:
- login
- refresh page
- confirm the session stays active

3. Test admin login:
- login at `/admin/login`
- refresh page
- confirm `/admin/dashboard` still opens

4. Place one real COD order:
- add a product to cart
- complete checkout with COD
- confirm order success page
- confirm it appears in `/my-orders`
- confirm it appears in `/admin/orders`

5. Test order tracking:
- open `/track-order`
- confirm the placed COD order is trackable

6. Test review moderation:
- submit a review from customer side
- approve it from `/admin/reviews`
- confirm it appears publicly

7. Test invoice history:
- open `/admin/invoices`
- download an invoice
- confirm `downloadCount` and `lastDownloadedAt` update

8. Check Render backend logs:
- confirm no repeated 5xx errors
- confirm no repeated auth-refresh failures

9. Check business content:
- support email
- phone
- address
- privacy policy
- terms
- returns
- contact page

## Launch Note

For this launch mode:

- COD is the verified payment path
- do not market live online payment as production-ready until Razorpay live credentials are tested
