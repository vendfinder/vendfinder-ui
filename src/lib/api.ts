import type { Product, Category } from "@/types";

const API_BASE_URL =
  process.env.API_BASE_URL || "http://api-gateway:3000";

// --- Backend response types ---

interface ApiProduct {
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
  translations?: Record<string, {
    name: string;
    description: string;
    long_description: string;
    features: string[];
  }> | null;
  source_language?: string | null;
  is_global_listing?: boolean;
  is_sponsored?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ApiProductsResponse {
  products: ApiProduct[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// --- Fallback images by category ---

const FALLBACK_IMAGES: Record<string, string> = {
  sneakers:
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop",
  electronics:
    "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&h=600&fit=crop",
  apparel:
    "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=600&h=600&fit=crop",
  "home-living":
    "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600&h=600&fit=crop",
  accessories:
    "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600&h=600&fit=crop",
  collectibles:
    "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=600&h=600&fit=crop",
};

const DEFAULT_FALLBACK =
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop";

// --- Slug generation ---

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// --- Image URL resolution ---

const SPACES_CDN_URL = "https://vendfinder-uploads.sfo3.cdn.digitaloceanspaces.com";

function resolveImageUrl(url: string, category?: string): string {
  // Already a full URL — use as-is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  // Relative /uploads/ path from local dev — try to resolve via Spaces CDN
  if (url.startsWith("/uploads/")) {
    return `${SPACES_CDN_URL}${url.replace("/uploads/", "/")}`;
  }
  // Unrecognized path — use category fallback
  const categoryKey = category?.toLowerCase().replace(/\s+/g, "-") || "";
  return FALLBACK_IMAGES[categoryKey] || DEFAULT_FALLBACK;
}

// --- Transform backend product to frontend Product ---

export function transformProduct(api: ApiProduct): Product {
  const retailPrice = parseFloat(api.retail_price) || 0;
  const lowestAsk = api.current_lowest_ask
    ? parseFloat(api.current_lowest_ask)
    : null;

  // Price = lowest ask (what you'd actually pay), fallback to retail if no asks
  const price = lowestAsk && lowestAsk > 0 ? lowestAsk : retailPrice;
  // compareAtPrice = retail price, only shown when price is below retail (a deal)
  const compareAtPrice = retailPrice > 0 && price < retailPrice ? retailPrice : undefined;

  // Build images array from media, image_url, or fallback
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

  // Derive tags from category + brand
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
    sellerId: api.vendor_id || undefined,
    createdAt: api.created_at || new Date().toISOString(),
    translations: api.translations ? Object.fromEntries(
      Object.entries(api.translations).map(([locale, t]) => [locale, {
        name: t.name,
        description: t.description,
        longDescription: t.long_description,
        features: t.features || [],
      }])
    ) : undefined,
    sourceLanguage: api.source_language || undefined,
    isGlobalListing: api.is_global_listing || false,
    isSponsored: api.is_sponsored || false,
  };
}

// --- API fetch helpers ---

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${path}`);
  }
  return res.json();
}

export async function fetchProducts(): Promise<Product[]> {
  const data = await apiFetch<ApiProductsResponse>(
    "/api/products?limit=100"
  );
  return data.products.map(transformProduct);
}

export async function fetchProductById(id: string): Promise<Product | null> {
  try {
    const api = await apiFetch<ApiProduct>(`/api/products/${id}`);
    return transformProduct(api);
  } catch {
    return null;
  }
}

export async function fetchProductsByCategory(
  category: string
): Promise<Product[]> {
  // Backend uses capitalized category names (e.g. "Sneakers")
  const capitalizedCategory =
    category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, " ");
  const data = await apiFetch<ApiProductsResponse>(
    `/api/products?category=${encodeURIComponent(capitalizedCategory)}&limit=100`
  );
  return data.products.map(transformProduct);
}

// Slug-to-product lookup: fetch all, find by generated slug.
// Also supports direct UUID lookup (e.g. from seller listing "View Product" links).
export async function fetchProductBySlug(
  slug: string
): Promise<Product | null> {
  // UUID pattern — try direct ID lookup first
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)) {
    const byId = await fetchProductById(slug);
    if (byId) return byId;
  }
  const products = await fetchProducts();
  return products.find((p) => p.slug === slug) || null;
}

// Helper functions matching mock data helpers
export async function getFeaturedProducts(): Promise<Product[]> {
  const products = await fetchProducts();
  return products.filter((p) => p.rating >= 4).slice(0, 8);
}

export async function getTrendingProducts(): Promise<Product[]> {
  const products = await fetchProducts();
  return products.slice(0, 8);
}

export async function getNewArrivals(): Promise<Product[]> {
  const products = await fetchProducts();
  return [...products]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 8);
}

export async function getSaleProducts(): Promise<Product[]> {
  const products = await fetchProducts();
  return products.filter((p) => p.compareAtPrice).slice(0, 8);
}

export async function getTopRated(): Promise<Product[]> {
  const products = await fetchProducts();
  return [...products].sort((a, b) => b.rating - a.rating).slice(0, 8);
}

export async function getProductsByCategory(
  category: string
): Promise<Product[]> {
  return fetchProductsByCategory(category);
}

// Categories — derive from available products since backend has no categories endpoint
const CATEGORY_META: Record<
  string,
  { name: string; description: string; icon: string; image: string }
> = {
  sneakers: {
    name: "Sneakers",
    description: "Premium kicks from top brands",
    icon: "👟",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=400&fit=crop",
  },
  electronics: {
    name: "Electronics",
    description: "Latest tech and gadgets",
    icon: "📱",
    image:
      "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=400&fit=crop",
  },
  apparel: {
    name: "Apparel",
    description: "Exclusive apparel collections",
    icon: "👕",
    image:
      "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=800&h=400&fit=crop",
  },
  "home-living": {
    name: "Home & Living",
    description: "Curated home essentials",
    icon: "🏠",
    image:
      "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800&h=400&fit=crop",
  },
  accessories: {
    name: "Accessories",
    description: "Premium watches and accessories",
    icon: "⌚",
    image:
      "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&h=400&fit=crop",
  },
  collectibles: {
    name: "Collectibles",
    description: "Rare finds and collectible items",
    icon: "🎭",
    image:
      "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&h=400&fit=crop",
  },
};

export async function fetchCategories(): Promise<Category[]> {
  const products = await fetchProducts();
  const categoryCounts: Record<string, number> = {};
  for (const p of products) {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  }

  return Object.entries(categoryCounts).map(([slug, count]) => {
    const meta = CATEGORY_META[slug] || {
      name: slug.charAt(0).toUpperCase() + slug.slice(1),
      description: `Browse ${slug} products`,
      icon: "📦",
      image: DEFAULT_FALLBACK,
    };
    return {
      slug,
      name: meta.name,
      description: meta.description,
      image: meta.image,
      icon: meta.icon,
      productCount: count,
    };
  });
}
