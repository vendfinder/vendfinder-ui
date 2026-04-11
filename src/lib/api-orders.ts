import { Purchase, Payout, SellerStats, PortfolioItem, PayoutMethod, PayoutMethodType } from "@/types";

const BASE = "/api/orders";

function authHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// --- Checkout ---

export interface CheckoutData {
  product_id: string;
  ask_id?: string;
  product_name: string;
  product_image?: string;
  product_category?: string;
  size?: string;
  item_price: number;
  seller_id: string;
  shipping_name: string;
  shipping_address_line1: string;
  shipping_address_line2?: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  shipping_country?: string;
  seller_name?: string;
}

export interface CheckoutResponse {
  orderId: string;
  orderNumber: string;
  clientSecret: string;
  total: number;
  breakdown: {
    itemPrice: number;
    shippingFee: number;
    taxAmount: number;
    platformFee: number;
    sellerPayout: number;
  };
}

export async function createCheckout(
  data: CheckoutData,
  token: string
): Promise<CheckoutResponse> {
  const res = await fetch(`${BASE}/checkout`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Checkout failed" }));
    throw new Error(err.error || "Checkout failed");
  }
  return res.json();
}

// --- PayPal Checkout ---

export interface PayPalCheckoutResponse {
  orderId: string;
  orderNumber: string;
  paypalOrderId: string;
  total: number;
  breakdown: {
    itemPrice: number;
    shippingFee: number;
    taxAmount: number;
    platformFee: number;
    sellerPayout: number;
  };
}

export async function createPayPalCheckout(
  data: CheckoutData,
  token: string
): Promise<PayPalCheckoutResponse> {
  const res = await fetch(`${BASE}/checkout/paypal`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "PayPal checkout failed" }));
    throw new Error(err.error || "PayPal checkout failed");
  }
  return res.json();
}

export async function capturePayPalPayment(
  paypalOrderId: string,
  token: string
): Promise<{ orderId: string; orderNumber: string; status: string }> {
  const res = await fetch(`${BASE}/checkout/paypal/capture`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ paypalOrderId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "PayPal capture failed" }));
    throw new Error(err.error || "PayPal capture failed");
  }
  return res.json();
}

// --- Orders ---

export async function fetchMyOrders(token: string, role: "buyer" | "seller" = "buyer") {
  const res = await fetch(`${BASE}?role=${role}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
}

export async function fetchMyPurchases(token: string): Promise<Purchase[]> {
  const res = await fetch(`${BASE}/me/purchases`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to fetch purchases");
  const data = await res.json();
  return data.purchases || [];
}

export async function fetchMySales(token: string) {
  const res = await fetch(`${BASE}/me/sales`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to fetch sales");
  const data = await res.json();
  return data.sales || [];
}

export async function fetchMyPayouts(token: string): Promise<Payout[]> {
  const res = await fetch(`${BASE}/me/payouts`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to fetch payouts");
  const data = await res.json();
  return data.payouts || [];
}

export async function fetchSellerStats(token: string): Promise<SellerStats> {
  const res = await fetch(`${BASE}/me/stats`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to fetch stats");
  const data = await res.json();
  return data.stats;
}

export async function fetchPublicSellerStats(userId: string): Promise<{
  totalSales: number;
  pendingSales: number;
  avgShipTime: string;
  completionRate: number;
  sellerRating: number;
  verification?: { verified: boolean; proSeller: boolean; topRated: boolean; kycVerified: boolean };
} | null> {
  try {
    const res = await fetch(`${BASE}/sellers/${userId}/stats`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.stats;
  } catch {
    return null;
  }
}

export async function fetchPortfolio(token: string): Promise<PortfolioItem[]> {
  // Portfolio is derived from completed purchases
  const purchases = await fetchMyPurchases(token);
  return purchases
    .filter((p) => p.status === "delivered" || p.status === "authenticated")
    .map((p) => ({
      id: p.id,
      productId: p.id,
      productName: p.productName,
      productImage: p.productImage,
      category: p.category,
      size: p.size,
      purchasePrice: p.price,
      currentValue: p.price, // Would need real-time market data
      gainLoss: 0,
      gainLossPercent: 0,
      purchaseDate: p.date,
      condition: "new",
    }));
}

// --- Payout Methods ---

export async function fetchPayoutMethods(token: string): Promise<PayoutMethod[]> {
  const res = await fetch(`${BASE}/me/payout-methods`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to fetch payout methods");
  const data = await res.json();
  return data.methods || [];
}

export async function createPayoutMethod(
  data: {
    method_type: PayoutMethodType;
    account_id: string;
    label?: string;
    account_name?: string;
    national_id?: string;
    date_of_birth?: string;
    address?: string;
  },
  token: string
): Promise<PayoutMethod> {
  const res = await fetch(`${BASE}/me/payout-methods`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to add payout method" }));
    throw new Error(err.error || "Failed to add payout method");
  }
  const json = await res.json();
  return json.method;
}

export async function updatePayoutMethod(
  id: string,
  data: { label?: string; account_id?: string; account_name?: string; national_id?: string; date_of_birth?: string; address?: string },
  token: string
): Promise<PayoutMethod> {
  const res = await fetch(`${BASE}/me/payout-methods/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update payout method");
  const json = await res.json();
  return json.method;
}

export async function setPrimaryPayoutMethod(id: string, token: string): Promise<PayoutMethod> {
  const res = await fetch(`${BASE}/me/payout-methods/${id}/primary`, {
    method: "PUT",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to set primary payout method");
  const json = await res.json();
  return json.method;
}

export async function deletePayoutMethod(id: string, token: string): Promise<void> {
  const res = await fetch(`${BASE}/me/payout-methods/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to delete payout method");
}

// --- Order Lifecycle ---

export async function shipOrder(
  orderId: string,
  data: { trackingNumber: string; carrier: string },
  token: string
) {
  const res = await fetch(`${BASE}/${orderId}/ship`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to ship order" }));
    throw new Error(err.error || "Failed to ship order");
  }
  return res.json();
}

export async function confirmDelivery(orderId: string, token: string) {
  const res = await fetch(`${BASE}/${orderId}/confirm-delivery`, {
    method: "PATCH",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to confirm delivery");
  return res.json();
}

export async function cancelOrder(orderId: string, token: string) {
  const res = await fetch(`${BASE}/${orderId}/cancel`, {
    method: "PATCH",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to cancel order");
  return res.json();
}
