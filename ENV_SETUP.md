# Environment Configuration Guide

## Backend Environment Variables (.env)

### Core Configuration
```
NODE_ENV=development|production
PORT=3000
```

### Database
```
MONGO_URI=mongodb://localhost:27017/ecommerce
```

### JWT
```
JWT_ACCESS_SECRET=your-random-secret-key-here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-random-refresh-secret-key-here
JWT_REFRESH_EXPIRES_IN=7d
```

### CORS & Security
```
CLIENT_ORIGIN=http://localhost:5173,http://localhost:3000
```

### Email (Optional - for password reset)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@yourdomain.com
```

### Momo Payment Gateway (Vietnam)
```
# Get these from https://business.momo.vn/
MOMO_PARTNER_CODE=MOMOXXXXXXXX
MOMO_ACCESS_KEY=XXXXXXXXXXXXXXXX
MOMO_SECRET_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
MOMO_STORE_ID=MomoStore

# Your server's public webhook URL
# This must be accessible from the internet (not localhost)
# Format: https://yourdomain.com/api/payments/momo/webhook
MOMO_WEBHOOK_URL=https://your-domain.com/api/payments/momo/webhook
```

## Frontend Environment Variables (.env)

### API
```
VITE_API_BASE_URL=http://localhost:3000
```

## Setting Up Momo Payment

### 1. Register Momo Business Account
- Visit: https://business.momo.vn/
- Register and complete KYC verification
- Create a store/application

### 2. Get API Credentials
- Dashboard → Development → API Keys
- Copy: Partner Code, Access Key, Secret Key
- Add to `.env` file

### 3. Configure Webhook URL
- Dashboard → IPN Settings
- Set IPN URL to: `https://your-domain.com/api/payments/momo/webhook`
- This URL must be publicly accessible and handle POST requests

### 4. Test in Development
- Momo provides test credentials for development environment
- Use test cards: 9704198526191432198 (test card)
- OTP: 123456

### 5. Deploy to Production
- Switch to production credentials
- Update `MOMO_WEBHOOK_URL` to production domain
- Ensure HTTPS on all payment endpoints

## Quick Start with Docker

```bash
# Backend
docker run -e MONGO_URI=mongodb://mongo:27017/ecommerce \\
           -e MOMO_PARTNER_CODE=MOMOXXXXXXXX \\
           -e MOMO_ACCESS_KEY=XXXXXXXX \\
           -e MOMO_SECRET_KEY=XXXXXXXX \\
           -e MOMO_WEBHOOK_URL=https://yourdomain.com/api/payments/momo/webhook \\
           -p 3000:3000 \\
           your-backend-image

# Frontend
docker run -e VITE_API_BASE_URL=https://api.yourdomain.com \\
           -p 5173:5173 \\
           your-frontend-image
```
