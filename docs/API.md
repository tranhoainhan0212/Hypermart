# API Documentation

Base URL: `http://localhost:3000`

## Auth

### Register
`POST /api/auth/register`
Body:
```json
{ "email": "user@example.com", "password": "string(min 6)", "name": "optional" }
```
Response:
```json
{ "user": { "id": "...", "email": "...", "name": "...", "role": "user" }, "accessToken": "..." }
```

### Login
`POST /api/auth/login`
Body:
```json
{ "email": "user@example.com", "password": "..." }
```

### Refresh access token
`POST /api/auth/refresh`
Headers:
- Cookie: `refreshToken` (httpOnly)
- `X-CSRF-Token: <csrfTokenCookie>`
Response:
```json
{ "accessToken": "..." }
```

### Logout
`POST /api/auth/logout`
Headers:
- Cookie: `refreshToken` (httpOnly)
- `X-CSRF-Token: <csrfTokenCookie>`

### Me
`GET /api/auth/me`
Headers:
`Authorization: Bearer <accessToken>`
Response:
```json
{ "user": { "id": "...", "email": "...", "name": "...", "role": "user" } }
```

### Forgot password
`POST /api/auth/forgot-password`
Body:
```json
{ "email": "user@example.com" }
```
Response: `{ "ok": true }` (always ok to prevent account enumeration)

### Reset password
`POST /api/auth/reset-password`
Body:
```json
{ "email": "user@example.com", "token": "resetTokenFromEmail", "newPassword": "..." }
```
Response: `{ "ok": true }`

## Categories

### List
`GET /api/categories`
Response:
```json
{ "items": [ { "_id": "...", "name": "...", "slug": "..." } ] }
```

### Create (Admin)
`POST /api/categories`
Headers: `Authorization: Bearer <adminAccessToken>`
Body: `{ "name": "..." }`

### Update (Admin)
`PUT /api/categories/:id`
Body: `{ "name": "..." }`

### Delete (Admin)
`DELETE /api/categories/:id`

## Products

### List / Search / Filter / Pagination
`GET /api/products`
Query params:
- `q`: search by text (`name`/`description`)
- `category`: categoryId
- `minPrice`, `maxPrice`
- `minRating`
- `page` (default 1)
- `limit` (default 12)
- `sort`: `newest | price_asc | price_desc | rating_desc`

Response:
```json
{
  "items": [ { "id": "...", "name": "...", "price": 0, "stock": 0, "category": { "name": "..." } } ],
  "page": 1,
  "limit": 12,
  "total": 0,
  "totalPages": 0
}
```

### Product detail
`GET /api/products/:idOrSlug`
`:idOrSlug` có thể là ObjectId hoặc `slug`.

### Create (Admin)
`POST /api/products`
Body:
```json
{
  "name": "string",
  "description": "optional",
  "price": 0,
  "stock": 0,
  "categoryId": "categoryObjectId",
  "images": [ { "url": "/uploads/xxx.jpg", "alt": "optional" } ]
}
```

### Update (Admin)
`PUT /api/products/:id`
Partial fields giống create.

### Delete (Admin)
`DELETE /api/products/:id`

## Upload image

`POST /api/upload/image`
Admin only.
Content-Type: `multipart/form-data`
Field name: `image`
Response:
```json
{ "url": "/uploads/<filename>" }
```

## Reviews

### List
`GET /api/reviews?productId=<id>&page=1&limit=10`

### Create or update my review
`POST /api/reviews/me`
Headers: `Authorization: Bearer <accessToken>`
Body:
```json
{ "productId": "productId", "rating": 1, "comment": "optional" }
```

### Delete my review
`DELETE /api/reviews/me/:id`

### Delete review (Admin)
`DELETE /api/reviews/:id`

## Cart

Cart được lưu:
- Chưa login: localStorage (frontend)
- Đã login: DB trong `User.cart`

### Get my cart
`GET /api/cart/me`

### Set my cart items
`PUT /api/cart/me`
Body:
```json
{ "items": [ { "productId": "productId", "quantity": 2 } ] }
```

### Clear cart
`DELETE /api/cart/me`

## Orders

### Create order from cart
`POST /api/orders`
Headers: `Authorization: Bearer <accessToken>`
Body:
```json
{
  "shippingAddress": {
    "fullName": "string",
    "phone": "string",
    "addressLine1": "string",
    "addressLine2": "optional",
    "city": "string",
    "province": "string",
    "postalCode": "optional",
    "country": "optional"
  },
  "paymentMethod": "COD|PAYPAL|MOMO|VNPAY"
}
```

### My orders
`GET /api/orders/me?page=1&limit=10`
`GET /api/orders/me/:id`

### Admin orders
`GET /api/orders?status=pending&page=1&limit=10`
`PUT /api/orders/:id/status`
Body: `{ "orderStatus": "pending|confirmed|shipping|completed|cancelled" }`

## Admin

### Dashboard stats
`GET /api/admin/dashboard`
Admin only.
Response:
```json
{ "totalRevenue": 0, "totalOrders": 0, "totalUsers": 0 }
```

## Note về thanh toán online
Hiện tại backend chọn `paymentMethod` để lưu vào order, nhưng chưa tích hợp cổng thanh toán (VNPay/Momo/PayPal) theo luồng redirect/webhook.

