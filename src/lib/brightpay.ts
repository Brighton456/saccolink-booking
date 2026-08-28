/**
 * BrightPay M-Pesa Payment Configuration
 * ────────────────────────────────────────
 * API docs: POST /endpoint-pay, GET /endpoint-status
 */

export const BRIGHTPAY_BASE_URL =
  import.meta.env["VITE_BRIGHTPAY_BASE_URL"] || "https://lqlpgghortuhdxnfqavj.supabase.co";
export const BRIGHTPAY_API_KEY =
  import.meta.env["VITE_BRIGHTPAY_API_KEY"] || "bp_ep_a4b44886adb790fc";

/* ─── Types ─── */
export interface STKPushRequest {
  amount: number;
  phone_number: string;
  external_reference: string;
}

export interface STKPushResponse {
  success: boolean;
  transaction_id?: string;
  checkout_id?: string;
  message?: string;
  error?: string;
}

export interface StatusResponse {
  status: "PENDING" | "COMPLETED" | "FAILED";
  amount?: number;
  mpesa_receipt?: string;
  [key: string]: unknown;
}

/* ─── API Functions ─── */

/**
 * Initiate M-Pesa STK Push.
 * Returns { success, checkout_id, transaction_id } on success.
 */
export async function initiateSTKPush(req: STKPushRequest): Promise<STKPushResponse> {
  const res = await fetch(`${BRIGHTPAY_BASE_URL}/functions/v1/endpoint-pay`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": BRIGHTPAY_API_KEY,
    },
    body: JSON.stringify({
      amount: req.amount,
      phone_number: req.phone_number,
      external_reference: req.external_reference,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return {
      success: false,
      message: data.message || data.error || `HTTP ${res.status}: Payment request failed`,
    };
  }

  return data as STKPushResponse;
}

/**
 * Poll payment status. Returns the latest status object.
 */
export async function pollPaymentStatus(checkoutId: string): Promise<StatusResponse> {
  const res = await fetch(
    `${BRIGHTPAY_BASE_URL}/functions/v1/endpoint-status?checkout_id=${encodeURIComponent(checkoutId)}`,
    {
      headers: { "x-api-key": BRIGHTPAY_API_KEY },
    },
  );

  if (!res.ok) {
    throw new Error(`Status check failed: HTTP ${res.status}`);
  }

  return res.json() as Promise<StatusResponse>;
}

/**
 * Generate a unique external reference for each transaction.
 * Format: SCL-{timestamp_base36}-{random4}
 */
export function generateReference(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SCL-${ts}-${rand}`;
}

/**
 * Format a Kenyan phone number for M-Pesa.
 * Handles: 0712345678, 254712345678, +254712345678, 712345678
 */
export function formatMpesaPhone(raw: string): string {
  let cleaned = raw.replace(/[^0-9]/g, "");
  // Remove leading 0 or +254 prefix
  if (cleaned.startsWith("0")) cleaned = cleaned.substring(1);
  if (cleaned.startsWith("254")) cleaned = cleaned.substring(3);
  // Ensure it starts with 7 (Kenya mobile)
  return `254${cleaned}`;
}
