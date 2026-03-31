# Database Schema (MongoDB + Mongoose)

Các collection chính:

## `users`
Mô hình: `src/models/User.js`

Field quan trọng:
- `email`: unique, lowercase
- `passwordHash`: bcrypt hash (không trả về trực tiếp vì `select: false`)
- `role`: `"user" | "admin"` (default: `"user"`)
- `refreshTokenHash`: hash của refresh token (không select)
- `resetPasswordTokenHash`, `resetPasswordExpiresAt`: reset token lưu dạng hash

Giỏ hàng:
- `cart.items[]`:
  - `product`: ref `Product`
  - `quantity`: number (min 1)
- `cart.updatedAt`: tự set khi cập nhật cart

## `categories`
Mô hình: `src/models/Category.js`
- `name`: string
- `slug`: unique + lowercase

## `products`
Mô hình: `src/models/Product.js`
- `name`, `slug`: unique
- `description`: string
- `images[]`: `{ url, alt }`
- `price`: number >= 0
- `stock`: number >= 0
- `category`: ref `Category`

Đánh giá:
- `ratingAverage`: number (0..5)
- `ratingCount`: number

Indexes (quan trọng):
- text index: search theo `name` và `description`
- index: `{ category, price, ratingAverage }`

## `reviews`
Mô hình: `src/models/Review.js`
- `product`: ref `Product`
- `user`: ref `User`
- `rating`: number (1..5)
- `comment`: string

Indexes (quan trọng):
- unique index `{ product, user }` (1 user chỉ 1 review cho 1 product)

## `orders`
Mô hình: `src/models/Order.js`
- `user`: ref `User`
- `items[]`:
  - `product`: ref (để tham chiếu)
  - `name`, `price`, `quantity`, `imageUrl`: snapshot tại thời điểm tạo đơn

Giao hàng:
- `shippingAddress`: fullName/phone/address/city/province/postalCode...

Thanh toán & trạng thái:
- `paymentMethod`: `COD | PAYPAL | MOMO | VNPAY`
- `paymentStatus`: `unpaid | paid | refunded`
- `orderStatus`: `pending | confirmed | shipping | completed | cancelled`

Tính tiền:
- `subtotal`, `shippingFee`, `total`

