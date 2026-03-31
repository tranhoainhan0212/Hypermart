import { api } from "./api";

export interface PaymentInitResponse {
  payUrl: string;
  requestId: string;
  transactionId: string;
  message: string;
}

export interface PaymentStatusResponse {
  orderId: string;
  paymentStatus: "unpaid" | "paid" | "refunded";
  paymentMethod: "COD" | "PAYPAL" | "MOMO" | "VNPAY";
  amount: number;
  orderStatus: string;
}

/**
 * Initiate Momo payment for an order
 */
export async function initiateMomoPayment(
  orderId: string,
  returnUrl?: string
): Promise<PaymentInitResponse> {
  const response = await api.post("/api/payments/momo/initiate", {
    orderId,
    returnUrl,
  });
  return response.data;
}

/**
 * Initiate VNPay payment for an order
 */
export async function initiateVnPayPayment(
  orderId: string,
  returnUrl?: string
): Promise<PaymentInitResponse> {
  const response = await api.post("/api/payments/vnpay/initiate", {
    orderId,
    returnUrl,
  });
  return response.data;
}

/**
 * Check payment status
 */
export async function checkPaymentStatus(orderId: string): Promise<PaymentStatusResponse> {
  const response = await api.get(`/api/payments/${orderId}/status`);
  return response.data;
}

/**
 * Handle Momo payment completion
 * Call this after user returns from Momo payment page
 */
export async function handleMomoReturn(orderId: string) {
  try {
    const status = await checkPaymentStatus(orderId);
    return {
      success: status.paymentStatus === "paid",
      status: status.paymentStatus,
      orderStatus: status.orderStatus,
    };
  } catch (error) {
    console.error("Error checking payment status:", error);
    return {
      success: false,
      status: "unknown",
      orderStatus: "pending",
    };
  }
}

/**
 * Cancel Momo payment (user closes window or explicitly cancels)
 * This doesn't actually cancel the payment, just marks it for user
 */
export function handleMomoCancel(orderId: string) {
  console.log(`Payment cancelled for order: ${orderId}`);
  return {
    success: false,
    status: "cancelled",
  };
}
