# Implementation Guide - Admin Dashboard, Product CRUD, Momo Payment

## Overview
This guide covers the implementation of three major features:
1. **Admin User Management** - List, ban, role management, delete users
2. **Enhanced Product CRUD** - Multiple image uploads with ordering, primary image selection
3. **Momo Payment Integration** - Complete payment flow with webhook handling

---

## 1. Admin User Management 👥

### Backend Implementation

#### Models (Updated)
**File:** `src/models/User.js`
- Added `isBanned` field (boolean, default: false, indexed)
- Added `bannedReason` field (string)
- Added `bannedAt` field (Date)

#### Controllers  
**File:** `src/controllers/admin.controller.js`
- `listUsers()` - List with search and role filtering
- `banUser()` - Ban user with reason
- `unbanUser()` - Restore banned user
- `changeUserRole()` - Promote/demote to admin
- `deleteUser()` - Delete user and related orders

#### Routes
**File:** `src/routes/admin.routes.js`
- `GET /api/admin/users` - List users
- `PUT /api/admin/users/:userId/ban` - Ban user
- `PUT /api/admin/users/:userId/unban` - Unban user
- `PUT /api/admin/users/:userId/role` - Change role
- `DELETE /api/admin/users/:userId` - Delete user

#### Middleware
**File:** `src/middlewares/auth.js` (Updated)
- Added ban check in `requireAuth()`
- Returns 403 if user is banned

### Frontend Implementation

#### Services
**File:** `frontend/src/services/admin.ts`
- `listUsers()` - Get users with pagination, search, role filter
- `banUser()` - Ban a user
- `unbanUser()` - Unban a user
- `changeUserRole()` - Change user role
- `deleteUser()` - Delete user account

#### UI Components
**File:** `frontend/src/pages/admin/AdminDashboardEnhanced.tsx`
- User management tab with:
  - Search by email/name
  - Filter by role
  - Inline role changing
  - Ban/Unban buttons
  - Delete with confirmation
  - Pagination support

---

## 2. Enhanced Product CRUD 🛍️

### Backend Implementation

#### Models (Updated)
**File:** `src/models/Product.js`
- Updated `images` array structure:
  ```javascript
  {
    url: String,
    alt: String,
    order: Number,     // Sort order
    isPrimary: Boolean // Primary/thumbnail image
  }
  ```

#### Controllers (Updated)
**File:** `src/controllers/product.controller.js`
- `createProduct()` - Normalized image handling
- `updateProduct()` - Image ordering and primary selection
- Automatic primary image assignment
- Image order validation

### Frontend Implementation

#### Services
**File:** `frontend/src/services/admin.ts`
- Product management through existing API endpoints

#### UI Components
**File:** `frontend/src/pages/admin/AdminDashboardEnhanced.tsx`
- Product creation tab with:
  - Multi-file image upload
  - Image preview grid
  - Drag to reorder (↑↓ buttons)
  - Set primary/thumbnail image
  - Remove individual images
  - Auto-mark first image as primary
  - Product details (name, description, price, stock, category)

#### Image Upload Features
- Upload multiple images at once
- Preview before save
- Reorder with up/down buttons
- Mark image as primary/thumbnail
- Remove images individually
- Automatic image ordering

---

## 3. Momo Payment Integration 💳

### Backend Implementation

#### Services
**File:** `src/services/momo.js`
- Complete Momo API integration
- Functions:
  - `createPaymentRequest()` - Initiate payment
  - `verifyWebhookSignature()` - Verify Momo callback
  - `checkPaymentStatus()` - Query transaction status
  - `generateRequestId()` - Generate unique request ID
  - `generateSignature()` - Create HMAC signature

#### Models (Updated)
**File:** `src/models/Order.js`
- Added `momoTransactionId` field (string)
- Added `momoRequestId` field (string)

#### Controllers
**File:** `src/controllers/payment.controller.js`
- `initiateMomoPayment()` - Create payment request and return pay URL
- `momoWebhookHandler()` - Handle Momo IPN callback
- `checkPaymentStatus()` - Get payment status for user

#### Routes
**File:** `src/routes/payment.routes.js`
- `POST /api/payments/momo/initiate` - Start payment flow
- `POST /api/payments/momo/webhook` - Momo webhook (no CSRF)
- `GET /api/payments/:orderId/status` - Check status

#### Webhook Flow
1. User initiates payment
2. System creates Momo payment request
3. User redirected to Momo payment page
4. After payment, Momo calls webhook endpoint
5. Webhook verifies signature and updates order status
6. User returns to app for confirmation

### Frontend Implementation

#### Services
**File:** `frontend/src/services/payment.ts`
- `initiateMomoPayment()` - Request payment
- `checkPaymentStatus()` - Poll status
- `handleMomoReturn()` - Handle success return
- `handleMomoCancel()` - Handle cancellation

#### UI Components
**File:** `frontend/src/pages/MomoPaymentPage.tsx`
- Payment flow page:
  - Display order details
  - Payment amount
  - "Pay Now" button
  - Cancel option
  - Auto-redirect to Momo
  - Return callback handling
  - Success/failure states
  - Auto-redirect on completion

---

## Environment Setup

### Backend .env Configuration
```bash
# Momo Payment Gateway (REQUIRED)
MOMO_PARTNER_CODE=MOMOXXXXXXXX
MOMO_ACCESS_KEY=XXXXXXXXXXXXXXXX
MOMO_SECRET_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
MOMO_STORE_ID=MomoStore
MOMO_WEBHOOK_URL=https://yourdomain.com/api/payments/momo/webhook

# Node Environment
NODE_ENV=development|production
PORT=3000

# Database
MONGO_URI=mongodb://localhost:27017/ecommerce

# JWT
JWT_ACCESS_SECRET=your-random-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-random-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CLIENT_ORIGIN=http://localhost:5173
```

### Frontend .env Configuration
```bash
VITE_API_BASE_URL=http://localhost:3000
```

---

## Momo Payment Setup Guide

### 1. Register on Momo
- Visit: https://business.momo.vn/
- Complete account registration
- Verify via email

### 2. Get API Credentials
- Login to Business Dashboard
- Go to: Developer → API Keys
- Copy: Partner Code, Access Key, Secret Key
- Save these in backend `.env`

### 3. Configure Webhook URL
- In Dashboard: Payment Settings → IPN/Webhook
- Set Webhook URL: `https://your-domain.com/api/payments/momo/webhook`
- **Must be publicly accessible (not localhost)**
- **Must support HTTPS in production**

### 4. Test in Development
- Momo provides test credentials
- Test gateway endpoint: https://test-payment.momo.vn
- Test cards provided in Momo docs
- Webhook won't work locally without ngrok or public URL

### 5. Production Deployment
- Switch to production credentials
- Update MOMO_WEBHOOK_URL to production domain
- Ensure HTTPS on all endpoints
- Test payment flow end-to-end

---

## API Endpoints Summary

### Admin User Management
```
GET    /api/admin/users?page=1&limit=20&search=&role=
PUT    /api/admin/users/:userId/ban
PUT    /api/admin/users/:userId/unban
PUT    /api/admin/users/:userId/role
DELETE /api/admin/users/:userId
```

### Product Management
```
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
GET    /api/products
GET    /api/products/:idOrSlug
```

### Payment Integration
```
POST   /api/payments/momo/initiate
POST   /api/payments/momo/webhook (no auth)
GET    /api/payments/:orderId/status
```

---

## Testing Checklist

### Admin User Management
- [ ] Search users by email/name  
- [ ] Filter by role
- [ ] Change user role to admin/user
- [ ] Ban user with reason
- [ ] Unban user
- [ ] Delete user (check related orders deleted)
- [ ] Pagination works
- [ ] Banned user can't login

### Product Management
- [ ] Upload single image
- [ ] Upload multiple images
- [ ] Reorder images with buttons
- [ ] Set primary/thumbnail image
- [ ] Remove individual images
- [ ] Create product with images
- [ ] Edit product images
- [ ] Delete images work correctly

### Momo Payment
- [ ] Initiate payment returns pay URL
- [ ] Redirect to Momo works
- [ ] Webhook signature verification works
- [ ] Payment status updates correctly
- [ ] Success page shows
- [ ] Failed payment handled
- [ ] Order status updated to "confirmed" on success
- [ ] Payment status shows as "paid"

---

## File Structure

```
backend/
├── src/
│   ├── models/
│   │   ├── User.js (updated with ban fields)
│   │   ├── Order.js (updated with Momo fields)
│   │   └── Product.js (updated image structure)
│   ├── controllers/
│   │   ├── admin.controller.js (user management)
│   │   ├── payment.controller.js (payments)
│   │   └── product.controller.js (updated)
│   ├── services/
│   │   └── momo.js (Momo payment service)
│   ├── routes/
│   │   ├── admin.routes.js (user management routes)
│   │   ├── payment.routes.js (payment routes)
│   │   └── product.routes.js (updated)
│   ├── middlewares/
│   │   ├── auth.js (ban check added)
│   │   └── csrf.js
│   └── app.js (payment routes mounted)
├── ENV_SETUP.md (configuration guide)

frontend/
├── src/
│   ├── services/
│   │   ├── admin.ts (user management API)
│   │   └── payment.ts (payment API)
│   └── pages/
│       ├── admin/
│       │   └── AdminDashboardEnhanced.tsx
│       └── MomoPaymentPage.tsx
```

---

## Security Considerations

- ✅ CSRF protection on all state-changing endpoints
- ✅ Ban check in auth middleware
- ✅ Signature verification for Momo webhooks
- ✅ Origin validation for sensitive operations
- ✅ Order ownership verification in payment controller
- ✅ Role-based access control for admin endpoints
- ✅ No CSRF required on webhook (Momo verification instead)

---

## Performance Notes

- User list pagination: 20 users per page
- Product images sorted by `order` field for consistent display
- Momo requests have 10s timeout
- Webhook signature verification in O(1) time
- Index on User.isBanned for faster queries

---

## Troubleshooting

### Momo Payment Issues
- **"Missing Momo credentials"**: Check `.env` file has all Momo variables
- **"Invalid signature"**: Ensure `MOMO_SECRET_KEY` is correct
- **Webhook not received**: 
  - Check webhook URL is publicly accessible
  - Verify HTTPS in production
  - Check firewall/security groups
  - Test with Momo test webhooks

### Image Upload Issues
- **Images not reordering**: Ensure `order` field is updated
- **Primary image not saved**: Check `isPrimary` boolean is set
- **Missing images**: Check CDN/upload path configuration

### User Management Issues
- **Can't change role**: Ensure user is not self-editing
- **Ban not working**: Check User model has `isBanned` field
- **Delete fails**: Ensure all related orders deleted first

---

## Next Steps

1. **Test locally** with Momo test credentials
2. **Deploy to staging** with public URL
3. **Test Momo webhook** with staging credentials
4. **Deploy to production** with production credentials
5. **Monitor payment flow** for errors
6. **Gather user feedback** on admin UI/UX

---

## Support & Documentation

- Momo Docs: https://developers.momo.vn/
- MongoDB: https://docs.mongodb.com/
- Express: https://expressjs.com/
- React: https://react.dev/

