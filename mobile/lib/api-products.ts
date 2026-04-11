import type { Product, Category } from "@vendfinder/shared";
import { apiFetch, ApiProduct, transformProduct } from "./api";

interface ApiProductsResponse {
  products: ApiProduct[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// --- Products ---

export async function fetchProducts(params?: {
  category?: string;
  search?: string;
  limit?: number;
}): Promise<Product[]> {
  const searchParams = new URLSearchParams();
  searchParams.set("limit", String(params?.limit || 100));
  if (params?.category) {
    const capitalized =
      params.category.charAt(0).toUpperCase() +
      params.category.slice(1).replace(/-/g, " ");
    searchParams.set("category", capitalized);
  }
  if (params?.search) {
    searchParams.set("search", params.search);
  }

  const data = await apiFetch<ApiProductsResponse>(
    `/products?${searchParams.toString()}`
  );
  return data.products.map(transformProduct);
}

export async function fetchProductById(id: string): Promise<Product | null> {
  try {
    const api = await apiFetch<ApiProduct>(`/products/${id}`);
    return transformProduct(api);
  } catch {
    return null;
  }
}

// --- Helper functions matching web app ---

export async function getFeaturedProducts(): Promise<Product[]> {
  const products = await fetchProducts();
  return products.filter((p) => p.rating >= 4).slice(0, 8);
}

export async function getNewArrivals(): Promise<Product[]> {
  const products = await fetchProducts();
  return [...products]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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

// --- Categories ---

const CATEGORY_META: Record<string, { name: string; description: string; icon: string; image: string }> = {
  sneakers: { name: "Sneakers", description: "Premium kicks from top brands", icon: "👟", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=400&fit=crop" },
  electronics: { name: "Electronics", description: "Latest tech and gadgets", icon: "📱", image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=400&fit=crop" },
  apparel: { name: "Apparel", description: "Exclusive apparel collections", icon: "👕", image: "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=800&h=400&fit=crop" },
  "home-living": { name: "Home & Living", description: "Curated home essentials", icon: "🏠", image: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800&h=400&fit=crop" },
  accessories: { name: "Accessories", description: "Premium watches and accessories", icon: "⌚", image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&h=400&fit=crop" },
  collectibles: { name: "Collectibles", description: "Rare finds and collectible items", icon: "🎭", image: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&h=400&fit=crop" },
};

const DEFAULT_FALLBACK = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop";

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

// --- Listings (Asks) ---

export async function fetchMyListings(token: string) {
  const data = await apiFetch<{ listings: unknown[] }>("/products/me/asks", { token });
  return data.listings || [];
}

export async function createAsk(
  productId: string,
  data: { size?: string; condition?: string; ask_price: number },
  token: string
) {
  return apiFetch(`/products/${productId}/asks`, {
    method: "POST",
    token,
    body: JSON.stringify(data),
  });
}

// --- Bids ---

export async function fetchMyBids(token: string) {
  const data = await apiFetch<{ bids: unknown[] }>("/products/me/bids", { token });
  return data.bids || [];
}

export async function placeBid(
  productId: string,
  data: { size?: string; bid_amount: number },
  token: string
) {
  return apiFetch(`/products/${productId}/bids`, {
    method: "POST",
    token,
    body: JSON.stringify(data),
  });
}

// --- Favorites ---

export async function fetchMyFavorites(token: string) {
  const data = await apiFetch<{ favorites: unknown[] }>("/products/me/favorites", { token });
  return data.favorites || [];
}

export async function addFavorite(productId: string, token: string) {
  return apiFetch(`/products/me/favorites/${productId}`, { method: "POST", token });
}

export async function removeFavorite(productId: string, token: string) {
  return apiFetch(`/products/me/favorites/${productId}`, { method: "DELETE", token });
}

// --- Reviews ---

export async function fetchProductReviews(productId: string) {
  const data = await apiFetch<{ reviews: unknown[] }>(
    `/reviews?product_id=${productId}&limit=50&sort=created_at&order=desc`
  );
  return data.reviews || [];
}
