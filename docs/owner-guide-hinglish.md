# SpareKart Owner Guide (Hinglish)

## 1. Introduction
Yeh guide SpareKart app ke owner ke liye hai. Isme aapko website chalane, products manage karne, orders process karne, COD track karne, invoice dekhne, accounting samajhne, aur basic admin operations karne ka simple Hinglish flow diya gaya hai.

Current live setup:
- Frontend: Vercel
- Backend: Render
- Database: Render PostgreSQL

Useful links:
- Website: `https://sparekart-gamma.vercel.app`
- Backend health: `https://sparekart-backend.onrender.com/api/health`
- Admin login: `https://sparekart-gamma.vercel.app/admin/login`

## 2. App Mein Kya-Kya Hai
App ke 2 main parts hain:

1. Customer side
- product dekhna
- brand > model > part ke through search karna
- cart aur checkout
- COD order place karna
- order track karna
- invoice download karna

2. Admin side
- products manage karna
- brands/models/categories manage karna
- orders process karna
- shipment details fill karna
- invoices dekhna
- accounting aur purchases dekhna
- support tickets dekhna

## 3. Owner Daily Login Flow
1. Browser mein admin login open karo:
- `https://sparekart-gamma.vercel.app/admin/login`

2. Apne admin credentials se login karo.

3. Daily sabse pehle ye pages check karo:
- `/admin/dashboard`
- `/admin/orders`
- `/admin/inventory`
- `/admin/accounting`
- `/admin/purchases`
- `/admin/support`

## 4. Product Ka Flow
### Brand aur Model Structure
Customer ka main discovery flow ye hai:
- Brand
- Model
- Part Type

Example:
- Vivo
- Vivo Y21
- Battery

### New Product Add Karna
Admin panel mein:
- `/admin/products`
- `New Product`

Product add karte time ye cheezein sahi bharni hain:
- Product name
- SKU
- Brand
- Model
- Category
- Price
- Compare price (optional)
- Stock
- Warranty months
- GST rate
- HSN code
- Product images
- Compatibility models

### Product Images
Best practice:
- 1 clear primary image
- 3 to 6 support images
- optional video URL agar zarurat ho

Note:
- Brand logos alag hote hain, product images alag
- Brand page par logo dikhega
- Product page par product images dikhenge

## 5. Brand aur Model Management
### Brand Add/Edit
Admin panel:
- `/admin/brands`

Brand ke liye:
- brand name
- slug
- optional logo URL
- active/inactive status

### Model Add/Edit
Admin panel:
- `/admin/models`

Model ke liye:
- model name
- slug
- brand mapping
- optional model image URL
- active/inactive status

## 6. Order Processing Flow
Admin panel:
- `/admin/orders`

Order lifecycle normally:
- `PENDING`
- `CONFIRMED`
- `PACKED`
- `SHIPPED`
- `DELIVERED`

Agar order cancel hota hai:
- `CANCELLED`

Agar return approve hota hai:
- return request approved hoti hai aur order returned flow accounting mein reflect hota hai

### Order Process Karne Ka Practical Flow
1. New order aaya
- status `PENDING`

2. Order verify kiya
- `CONFIRMED`

3. Packing ho gayi
- `PACKED`

4. Courier diya
- `SHIPPED`
- courier naam fill karo
- AWB fill karo
- ETA fill karo

5. Delivery ho gayi
- `DELIVERED`

### Internal Notes vs Customer Notes
Order page par 2 tarah ke notes ho sakte hain:
- Customer-visible note
- Internal note (sirf admin ke liye)

Internal note use karo agar team ko yaad rakhna ho:
- urgent call required
- address confusion
- COD hold
- fragile item

## 7. COD Orders Kaise Track Karein
COD mein 2 alag cheezein hoti hain:
- parcel deliver hua ya nahi
- paisa receive hua ya nahi

### Important Logic
- `status = DELIVERED` means parcel pahunch gaya
- `paymentStatus = PAID` means paisa confirm ho gaya

### COD Labels Ka Matlab
- `COD Pending Collection`
  - COD order placed hai, but collection complete nahi hui

- `COD Reconciliation`
  - order delivered ho gaya, but payment abhi verify/settle karna hai

- `COD Collected`
  - order delivered ho gaya aur payment receive mark ho gayi

### COD Reconciliation Ka Practical Use
Har delivered COD order ke baad check karo:
- kya customer ne cash diya?
- kya courier ne settlement diya?
- kya admin panel mein `paymentStatus = PAID` mark hua?

## 8. Cancel aur Return Requests
### Customer Cancel Request
Customer `My Orders` se cancel request bhej sakta hai.

Admin action:
- approve ya reject

### Customer Return Request
Customer delivered order ke liye return request bhej sakta hai.

Admin action:
- approve ya reject

Approved return ka effect:
- stock restore ho sakta hai
- accounting aur refund analytics mein reflect hota hai

## 9. Shipment Tracking
Customer side:
- `/track-order`

Customer dekh sakta hai:
- order placed
- confirmed
- packed
- shipped
- delivered
- cancelled

Admin ko hamesha shipment details fill karni chahiye:
- Courier
- AWB
- ETA

## 10. Invoice Kaise Kaam Karta Hai
Admin panel:
- `/admin/invoices`

Invoice mein included hota hai:
- company details
- customer details
- line items
- SKU
- quantity
- taxable value
- GST
- HSN
- total amount

Customer bhi invoice download kar sakta hai from:
- `My Orders`
- order success flow

## 11. Accounting Page Kaise Use Karein
Admin panel:
- `/admin/accounting`

Yahan aap dekh sakte ho:
- gross sales
- net sales
- GST summary
- discounts
- shipping collected
- COD / prepaid mix
- refunded amount
- refund outflow
- margin summary
- daily breakdown
- order-wise accounting report
- CSV export

### Important Meaning
- Gross sales = total before business deductions
- Net sales = cleaner sales view after cancelled/returned impact logic
- Refund outflow = actual refund amount
- Prepaid attempts = prepaid try hue orders, not always settled orders

## 12. Purchases Page Kaise Use Karein
Admin panel:
- `/admin/purchases`

Yahan aap:
- vendor add kar sakte ho
- purchase entry kar sakte ho
- stock inward track kar sakte ho
- spend dekh sakte ho
- inventory value dekh sakte ho
- dead stock / slow moving stock dekh sakte ho
- top vendors by spend dekh sakte ho

## 13. Inventory Page Kaise Use Karein
Admin panel:
- `/admin/inventory`

Inventory page use karo to:
- stock update
- low-stock items dekhna
- restock recommendation dekhna
- impacted active orders dekhna

Useful terms:
- Critical stock
- Low stock
- Healthy stock
- Suggested reorder

## 14. Support Inbox
Public side:
- `/support`

Admin side:
- `/admin/support`

Support tickets types ho sakte hain:
- product inquiry
- order issue
- payment issue
- return issue

Status:
- `NEW`
- `IN_PROGRESS`
- `RESOLVED`

## 15. Customer Side Basic Flow
Customer normally ye steps follow karega:
1. website open karega
2. brand choose karega
3. model choose karega
4. part type choose karega
5. product page dekhega
6. cart mein add karega
7. checkout karega
8. COD ya available payment method choose karega
9. order place karega
10. `My Orders` aur `Track Order` se status dekhega

## 16. Owner Daily Checklist
Roz ka kaam:
- `/admin/orders` check karo
- pending orders ko process karo
- shipped orders mein courier/AWB verify karo
- delivered COD orders ka payment reconcile karo
- low-stock items dekho
- support tickets check karo
- accounting page pe refund ya abnormal numbers dekho

## 17. Weekly Checklist
Har week:
- slow moving stock dekho
- dead stock dekho
- top vendors by spend dekho
- top margin products aur low margin orders dekho
- return-prone products check karo
- invoice sample verify karo

## 18. Important Pages Quick Reference
Customer side:
- `/`
- `/brands`
- `/products`
- `/cart`
- `/checkout`
- `/my-orders`
- `/track-order`
- `/notifications`
- `/support`

Admin side:
- `/admin/dashboard`
- `/admin/orders`
- `/admin/products`
- `/admin/invoices`
- `/admin/inventory`
- `/admin/accounting`
- `/admin/purchases`
- `/admin/support`
- `/admin/brands`
- `/admin/models`
- `/admin/categories`

## 19. Agar Kuch Galat Dikhe To Kya Karein
### Case 1: Website open nahi ho rahi
Check:
- frontend live URL open ho raha hai ya nahi
- backend health open ho raha hai ya nahi

### Case 2: Product ya order data galat hai
Check:
- admin panel mein product/order details
- stock
- GST/HSN
- notes

### Case 3: Invoice issue
Check:
- order details
- company details env
- GST rate per product
- HSN code per product

### Case 4: COD confusion
Check:
- `status`
- `paymentStatus`
- delivered order ka cash settled hai ya nahi

## 20. Deployment Basics
### Frontend
Platform: Vercel

Agar frontend update push hua hai aur live par nahi dikh raha:
- Vercel latest deployment check karo
- zarurat ho to manual production deploy karo

### Backend
Platform: Render

Agar backend code update hua hai:
- latest deploy confirm karo
- health check dekho

Agar Prisma schema change hui hai, Render shell mein run karo:
```bash
cd /opt/render/project/src/backend
npm run prisma:push
npm run prisma:generate
```

## 21. Very Important Warnings
- Admin password safe rakho
- real secrets kisi ke saath share mat karo
- `DATABASE_URL`, JWT secrets, Cloudinary secret, SMTP password public mat hone do
- COD delivered orders ko timely reconcile karo
- invoice aur accounting reports business decision ke liye use karo, but legal filing se pehle accountant se confirm karna best rahega

## 22. Handover Summary
Owner ko minimum ye cheezein aani chahiye:
- admin login
- product add/edit
- order status update
- COD collection reconcile karna
- invoice download karna
- accounting page samajhna
- purchases entry karna
- support tickets dekhna

Agar yeh sab aa gaya, to app daily business operations ke liye smoothly chal sakti hai.
