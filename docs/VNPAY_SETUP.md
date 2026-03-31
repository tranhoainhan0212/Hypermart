VNPay Integration — IPN / Webhook Setup

Overview
- This document explains how to configure VNPay server-to-server notifications (IPN) and test them locally.

Environment variables
- VNPAY_TMN_CODE: Terminal / merchant code provided by VNPay
- VNPAY_HASH_SECRET: Hash secret used to sign/verify requests
- VNPAY_PAYMENT_URL: Optional (sandbox URL used by default)

Endpoints
- Return (user redirect): GET /api/payments/vnpay/return
  - Purpose: User is redirected back to this URL after payment.
  - Our handler verifies vnp_SecureHash and redirects user to frontend order page.

- IPN / Webhook (server-to-server): POST /api/payments/vnpay/ipn
  - Purpose: VNPay server calls this to confirm transaction status reliably.
  - This endpoint does NOT require authentication or CSRF protection.
  - Response: JSON object with `RspCode` and `Message` (e.g. { RspCode: "00", Message: "Confirm Success" }).

How it works
1. Client creates an order and selects `VNPAY` as `paymentMethod`.
2. Frontend calls POST /api/payments/vnpay/initiate to get a VNPay payment URL.
3. User is redirected to VNPay and completes payment.
4. VNPay redirects the user back to /api/payments/vnpay/return with query params.
   - Our `vnpayReturnHandler` verifies the signature and updates the order accordingly, then redirects the user to frontend order page.
5. VNPay (optionally) calls the IPN URL (server-to-server) configured in their merchant dashboard.
   - Our `vnpayIpnHandler` verifies signature and updates order status reliably.

Testing locally (recommended)
1. Start your backend locally (e.g., http://localhost:3000).
2. Expose your backend to the internet using ngrok:

```bash
ngrok http 3000
```

3. In VNPay merchant sandbox settings, set the Return URL and IPN/Notification URL to the ngrok address, for example:

- Return URL: `https://<your-ngrok>.ngrok.io/api/payments/vnpay/return`
- IPN URL: `https://<your-ngrok>.ngrok.io/api/payments/vnpay/ipn`

4. Create an order in the app, choose VNPay, and click Pay Now. Use VNPay sandbox flow to complete payment.
5. Observe backend logs and order record updates. VNPay will call the IPN endpoint with signed parameters.

Quick local simulation (no ngrok required)
- You can simulate an IPN locally (useful for initial verification) by running the helper script included in the repo:

```bash
# set env vars in your shell or in .env
export VNPAY_TMN_CODE=YOUR_TMN
export VNPAY_HASH_SECRET=YOUR_SECRET
# then run the test sender (defaults to http://localhost:3000)
npm run test:vnpay-ipn -- txnRef=test123 amount=100000 host=http://localhost:3000
```

The script `scripts/send_vnpay_ipn.js` computes the correct `vnp_SecureHash` and POSTs a JSON body to `/api/payments/vnpay/ipn` so you can verify the backend updates the `orders` record.

Manual IPN test (curl)
- You can simulate an IPN call with a signed payload. Ensure you compute `vnp_SecureHash` using your `VNPAY_HASH_SECRET`.

Example response expectations
- Successful confirmation: `{ "RspCode": "00", "Message": "Confirm Success" }`
- Invalid signature: `{ "RspCode": "97", "Message": "Invalid signature" }`

Notes & security
- Always verify `vnp_SecureHash` before trusting any IPN data.
- Record VNPay tx fields (`vnp_TxnRef`, `vnp_TransactionNo`, `vnp_ResponseCode`) to the `Order` for auditing.
- Consider additional verification steps (amount match, currency, merchant code) before marking an order paid.

If you want, I can also:
- Add automated unit tests for the signature verification helper.
- Add a small admin webhook viewer to inspect incoming IPN payloads.
- Configure the exact VNPay expected response body if you need strict compliance with their spec.
