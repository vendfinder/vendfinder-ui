import { Listing, Bid, FavoriteItem } from "@/types";

const BASE = "/api/products";

function authHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// --- Listings (Asks) ---

export async function fetchMyListings(token: string): Promise<Listing[]> {
  const res = await fetch(`${BASE}/me/asks`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to fetch listings");
  const data = await res.json();
  return data.listings || [];
}

export async function createAsk(
  productId: string,
  data: { size?: string; condition?: string; ask_price: number; expires_at?: string },
  token: string
) {
  const res = await fetch(`${BASE}/${productId}/asks`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create listing");
  return res.json();
}

export async function updateAsk(
  askId: string,
  data: { ask_price?: number; expires_at?: string },
  token: string
) {
  const res = await fetch(`${BASE}/asks/${askId}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update listing");
  return res.json();
}

export async function deleteAsk(askId: string, token: string) {
  const res = await fetch(`${BASE}/asks/${askId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to cancel listing");
  return res.json();
}

// --- Bids ---

export async function fetchMyBids(token: string): Promise<Bid[]> {
  const res = await fetch(`${BASE}/me/bids`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to fetch bids");
  const data = await res.json();
  return data.bids || [];
}

export async function placeBid(
  productId: string,
  data: { size?: string; bid_amount: number; expires_at?: string },
  token: string
) {
  const res = await fetch(`${BASE}/${productId}/bids`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to place bid");
  return res.json();
}

export async function updateBid(
  bidId: string,
  data: { bid_amount?: number; expires_at?: string },
  token: string
) {
  const res = await fetch(`${BASE}/bids/${bidId}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update bid");
  return res.json();
}

export async function deleteBid(bidId: string, token: string) {
  const res = await fetch(`${BASE}/bids/${bidId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to cancel bid");
  return res.json();
}

// --- Favorites ---

export async function fetchMyFavorites(token: string): Promise<FavoriteItem[]> {
  const res = await fetch(`${BASE}/me/favorites`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to fetch favorites");
  const data = await res.json();
  return data.favorites || [];
}

export async function addFavorite(productId: string, token: string) {
  const res = await fetch(`${BASE}/me/favorites/${productId}`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to add favorite");
  return res.json();
}

export async function removeFavorite(productId: string, token: string) {
  const res = await fetch(`${BASE}/me/favorites/${productId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to remove favorite");
  return res.json();
}

// --- Image Upload ---

export async function uploadProductImages(
  files: File[],
  token: string
): Promise<string[]> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("images", file);
  }

  const res = await fetch("/api/uploads/product-images", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) throw new Error("Failed to upload images");
  const data = await res.json();
  return data.urls;
}

// --- Products CRUD ---

export async function createProduct(
  data: Record<string, unknown>,
  token: string
) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || `Failed to create product (${res.status})`);
  }
  return res.json();
}

export async function updateProduct(
  id: string,
  data: Record<string, unknown>,
  token: string
) {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update product");
  return res.json();
}

export async function deleteProduct(id: string, token: string) {
  const res = await fetch(`${BASE}/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to delete product");
  return res.json();
}

// --- Featured listings (paid homepage placement) ---

export async function createFeaturedCheckout(
  productId: string,
  durationDays: number,
  token: string
): Promise<{ checkoutUrl: string; sessionId: string }> {
  const res = await fetch(`${BASE}/featured/checkout`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ product_id: productId, duration_days: durationDays }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || "Failed to create checkout session");
  }
  return res.json();
}

export async function confirmFeaturedSlot(sessionId: string, token: string) {
  const res = await fetch(`${BASE}/featured/confirm`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (!res.ok) throw new Error("Failed to confirm featured slot");
  return res.json();
}

// --- Sponsored search/category placements ---

export async function createSponsoredCheckout(
  productId: string,
  targetType: "category" | "keyword",
  target: { category?: string; keyword?: string },
  durationDays: number,
  token: string
): Promise<{ checkoutUrl: string; sessionId: string }> {
  const res = await fetch(`${BASE}/sponsored/checkout`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({
      product_id: productId,
      target_type: targetType,
      category: target.category,
      keyword: target.keyword,
      duration_days: durationDays,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || "Failed to create checkout session");
  }
  return res.json();
}

export async function confirmSponsoredSlot(sessionId: string, token: string) {
  const res = await fetch(`${BASE}/sponsored/confirm`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (!res.ok) throw new Error("Failed to confirm sponsored slot");
  return res.json();
}

// --- Reviews ---

export interface ApiReview {
  id: string;
  vendor_id: string;
  user_id: string;
  product_id: string | null;
  rating: number;
  title: string | null;
  content: string | null;
  author_name: string | null;
  verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  author?: { id: string; username: string; role: string } | null;
  images?: { id: string; url: string; sort_order: number }[];
}

export async function fetchProductReviews(
  productId: string
): Promise<ApiReview[]> {
  const res = await fetch(
    `/api/reviews?product_id=${productId}&limit=50&sort=created_at&order=desc`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.reviews || [];
}

export async function createReview(
  data: {
    vendor_id: string;
    user_id: string;
    product_id: string;
    rating: number;
    title: string;
    content: string;
    author_name: string;
  },
  token: string
) {
  const res = await fetch("/api/reviews", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || "Failed to create review");
  }
  return res.json();
}
