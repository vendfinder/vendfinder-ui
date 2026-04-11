import Link from "next/link";
import { Layers } from "lucide-react";
import { fetchCategories, getProductsByCategory } from "@/lib/api";
import CategoryPageClient from "./CategoryPageClient";
import { getTranslations } from "next-intl/server";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const categories = await fetchCategories();
  const category = categories.find((c) => c.slug === slug);

  if (!category) {
    const t = await getTranslations("categories");
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
          <Layers size={32} className="text-muted/30" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">{t("notFound")}</h1>
        <p className="text-sm text-muted mb-6">{t("notFoundDesc")}</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-all"
        >
          {t("browseAll")}
        </Link>
      </div>
    );
  }

  const products = await getProductsByCategory(slug);

  return <CategoryPageClient category={category} products={products} />;
}
