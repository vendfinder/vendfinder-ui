import { fetchProducts } from '@/lib/api';
import ProductsPageClient from './ProductsPageClient';

export default async function ProductsPage() {
  const products = await fetchProducts();
  return <ProductsPageClient products={products} />;
}
