import { apiFetch } from "./api";
import type { Purchase, Payout, SellerStats, PortfolioItem } from "@vendfinder/shared";

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
  return apiFetch<CheckoutResponse>("/orders/checkout", {
    method: "POST",
    token,
    body: JSON.stringify(data),
  });
}

// --- Orders ---

export async function fetchMyOrders(token: string, role: "buyer" | "seller" = "buyer") {
  return apiFetch(`/orders?role=${role}`, { token });
}

export async function fetchMyPurchases(token: string): Promise<Purchase[]> {
  const data = await apiFetch<{ purchases: Purchase[] }>("/orders/me/purchases", { token });
  return data.purchases || [];
}

export async function fetchMySales(token: string) {
  const data = await apiFetch<{ sales: unknown[] }>("/orders/me/sales", { token });
  return data.sales || [];
}

export async function fetchMyPayouts(token: string): Promise<Payout[]> {
  const data = await apiFetch<{ payouts: Payout[] }>("/orders/me/payouts", { token });
  return data.payouts || [];
}

export async function fetchSellerStats(token: string): Promise<SellerStats> {
  const data = await apiFetch<{ stats: SellerStats }>("/orders/me/stats", { token });
  return data.stats;
}

export async function fetchPortfolio(token: string): Promise<PortfolioItem[]> {
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
      currentValue: p.price,
      gainLoss: 0,
      gainLossPercent: 0,
      purchaseDate: p.date,
      condition: "new" as const,
    }));
}

// --- Order Lifecycle ---

export async function shipOrder(
  orderId: string,
  data: { trackingNumber?: string; carrier?: string },
  token: string
) {
  return apiFetch(`/orders/${orderId}/ship`, {
    method: "PATCH",
    token,
    body: JSON.stringify(data),
  });
}

export async function confirmDelivery(orderId: string, token: string) {
  return apiFetch(`/orders/${orderId}/confirm-delivery`, { method: "PATCH", token });
}

export async function cancelOrder(orderId: string, token: string) {
  return apiFetch(`/orders/${orderId}/cancel`, { method: "PATCH", token });
}
