import Link from "next/link";
import { Package } from "lucide-react";
import { fetchProductBySlug, getProductsByCategory } from "@/lib/api";
import ProductDetailClient from "./ProductDetailClient";
import type { Review } from "@/types";

const API_BASE_URL = process.env.API_BASE_URL || "http://api-gateway:3000";

interface Ask {
  id: string;
  size: string | null;
  ask_price: string;
  condition?: string;
  status: string;
}

async function fetchAsksForProduct(productId: string): Promise<Ask[]> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/products/${productId}/asks?status=active`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.asks || [];
  } catch {
    return [];
  }
}

async function fetchReviewsForProduct(productId: string): Promise<Review[]> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/reviews?product_id=${productId}&limit=50&sort=created_at&order=desc`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.reviews || []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      productId: (r.product_id as string) || productId,
      userName: (r.author as { username?: string })?.username || (r.author_name as string) || "Anonymous",
      rating: r.rating as number,
      title: (r.title as string) || "",
      body: (r.content as string) || "",
      date: new Date(r.created_at as string).toLocaleDateString(),
      verified: (r.verified_purchase as boolean) || false,
    }));
  } catch {
    return [];
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
          <Package size={32} className="text-muted/30" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Product not found
        </h1>
        <p className="text-muted mb-6">
          The product you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-all"
        >
          Back to Products
        </Link>
      </div>
    );
  }

  const relatedProducts = (await getProductsByCategory(product.category))
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  const [reviews, asks] = await Promise.all([
    fetchReviewsForProduct(product.id),
    fetchAsksForProduct(product.id),
  ]);

  // Build a map of size → lowest ask price for available sizes
  const sizeAvailability: Record<string, number> = {};
  for (const ask of asks) {
    const size = ask.size || "one-size";
    const price = parseFloat(ask.ask_price);
    if (!sizeAvailability[size] || price < sizeAvailability[size]) {
      sizeAvailability[size] = price;
    }
  }

  // Collect unique conditions from active asks
  const askConditions: string[] = [];
  for (const ask of asks) {
    const cond = ask.condition || "new";
    if (!askConditions.includes(cond)) {
      askConditions.push(cond);
    }
  }

  return (
    <ProductDetailClient
      product={product}
      reviews={reviews}
      relatedProducts={relatedProducts}
      sizeAvailability={sizeAvailability}
      askConditions={askConditions}
    />
  );
}
