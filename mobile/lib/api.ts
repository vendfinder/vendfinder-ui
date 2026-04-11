import { getItem, removeItem } from "./storage";

// Always use production API — localhost doesn't work on iOS simulator
// and the Next.js web server may not be running locally
const API_BASE = "https://vendfinder.com";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit & { token?: string }
): Promise<T> {
  const { token, ...fetchOptions } = options || {};

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/api${path}`, {
    ...fetchOptions,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new ApiError(res.status, body.error || `Request failed (${res.status})`);
  }

  return res.json();
}

/** Get saved token from storage */
export async function getToken(): Promise<string | null> {
  return getItem<string>("vendfinder-token");
}

/** Clear auth data (called on 401 or logout) */
export async function clearAuth(): Promise<void> {
  await removeItem("vendfinder-token");
  await removeItem("vendfinder-user");
}

// --- Product transform (mirrors web app's src/lib/api.ts) ---

import type { Product } from "@vendfinder/shared";

export interface ApiProduct {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  category: string;
  brand: string | null;
  retail_price: string;
  current_lowest_ask: string | null;
  image_url: string | null;
  badge: string | null;
  rating: string | null;
  review_count: number;
  quantity_available: number;
  sizes: string[] | null;
  media: { url: string; type: string }[] | null;
  market?: {
    highestBid: number | null;
    lowestAsk: number | null;
    spread: number | null;
    lastSale: number | null;
    activeBids: number;
    activeAsks: number;
  };
  created_at?: string;
  updated_at?: string;
}

const SPACES_CDN_URL = "https://vendfinder-uploads.sfo3.cdn.digitaloceanspaces.com";

const FALLBACK_IMAGES: Record<string, string> = {
  sneakers: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop",
  electronics: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&h=600&fit=crop",
  apparel: "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=600&h=600&fit=crop",
  "home-living": "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600&h=600&fit=crop",
  accessories: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600&h=600&fit=crop",
  collectibles: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=600&h=600&fit=crop",
};

const DEFAULT_FALLBACK = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop";

function resolveImageUrl(url: string, category?: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/uploads/")) return `${SPACES_CDN_URL}${url.replace("/uploads/", "/")}`;
  const categoryKey = category?.toLowerCase().replace(/\s+/g, "-") || "";
  return FALLBACK_IMAGES[categoryKey] || DEFAULT_FALLBACK;
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function transformProduct(api: ApiProduct): Product {
  const retailPrice = parseFloat(api.retail_price) || 0;
  const lowestAsk = api.current_lowest_ask ? parseFloat(api.current_lowest_ask) : null;
  const price = lowestAsk && lowestAsk > 0 ? lowestAsk : retailPrice;
  const compareAtPrice = retailPrice > 0 && price < retailPrice ? retailPrice : undefined;

  let images: string[] = [];
  if (api.media && api.media.length > 0) {
    images = api.media.map((m) => resolveImageUrl(m.url, api.category));
  } else if (api.image_url) {
    images = [resolveImageUrl(api.image_url, api.category)];
  }
  if (images.length === 0) {
    const categoryKey = api.category?.toLowerCase().replace(/\s+/g, "-") || "";
    images = [FALLBACK_IMAGES[categoryKey] || DEFAULT_FALLBACK];
  }

  const tags: string[] = [];
  if (api.category) tags.push(api.category.toLowerCase());
  if (api.brand) tags.push(api.brand.toLowerCase());
  if (api.badge) tags.push(api.badge.toLowerCase());

  return {
    id: api.id,
    slug: generateSlug(api.name),
    name: api.name,
    description: api.description || "",
    longDescription: api.description || "",
    price,
    compareAtPrice,
    images,
    category: api.category?.toLowerCase().replace(/\s+/g, "-") || "uncategorized",
    tags,
    rating: api.rating ? parseFloat(api.rating) : 0,
    reviewCount: api.review_count || 0,
    inStock: (api.quantity_available ?? 0) > 0 || !!api.current_lowest_ask,
    stockCount: api.quantity_available ?? 0,
    sku: api.id.slice(0, 8).toUpperCase(),
    features: [],
    specifications: {},
    sizes: api.sizes || undefined,
    createdAt: api.created_at || new Date().toISOString(),
  };
}
