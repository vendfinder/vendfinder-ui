"use client";

import { Product } from "@/types";
import ProductCard from "./ProductCard";
import { StaggerContainer, StaggerItem } from "@/components/motion/MotionWrapper";

interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-lg font-medium text-foreground">No products found</p>
        <p className="text-sm text-muted mt-1">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <StaggerContainer className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
      {products.map((product) => (
        <StaggerItem key={product.id}>
          <ProductCard product={product} />
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
