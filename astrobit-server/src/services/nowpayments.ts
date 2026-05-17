import fetch from "node-fetch"; // или встроенный fetch, если Node 18+

const BASE = process.env.NOWPAYMENTS_BASE || "https://api.nowpayments.io";
const API_KEY = process.env.NOWPAYMENTS_API_KEY!;

export type CreateInvoiceBody = {
  price_amount: number;         // сумма в USD
  price_currency: "usd";
  order_id: string;
  order_description?: string;
  ipn_callback_url: string;

};

export interface NowPaymentsInvoiceResponse {
  id: number;
  invoice_url: string;
  order_id: string;
  price_amount: number;
  price_currency: string;
  created_at: string;
  updated_at: string;
}

export const nowpCreateInvoice = async (
  body: CreateInvoiceBody
): Promise<NowPaymentsInvoiceResponse> => {
  const res = await fetch(`${BASE}/v1/invoice`, {
    method: "POST",
    headers: {
      "x-api-key": API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NOWP create invoice failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<NowPaymentsInvoiceResponse>;
};
