import HeroSection from '@/components/home/HeroSection';
import BrandMarquee from '@/components/home/BrandMarquee';
import ValueProps from '@/components/home/ValueProps';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import CategoryShowcase from '@/components/home/CategoryShowcase';
import HotDeals from '@/components/home/HotDeals';
import NewArrivals from '@/components/home/NewArrivals';
import TopRated from '@/components/home/TopRated';
import Testimonials from '@/components/home/Testimonials';
import Newsletter from '@/components/home/Newsletter';
import StoriesBar from '@/components/stories/StoriesBar';
import {
  getNewArrivals,
  getSaleProducts,
  getTopRated,
  fetchCategories,
  getProductsByCategory,
} from '@/lib/api';

export default async function HomePage() {
  const [newArrivals, saleProducts, topRated, categories] = await Promise.all([
    getNewArrivals(),
    getSaleProducts(),
    getTopRated(),
    fetchCategories(),
  ]);

  // Build category products map
  const categoryProductEntries = await Promise.all(
    categories.map(
      async (c) => [c.slug, await getProductsByCategory(c.slug)] as const
    )
  );
  const categoryProducts = Object.fromEntries(categoryProductEntries);

  return (
    <>
      <HeroSection />
      <BrandMarquee />
      <ValueProps />
      <FeaturedProducts storiesBar={<StoriesBar />} />
      <CategoryShowcase
        categories={categories}
        categoryProducts={categoryProducts}
      />
      <HotDeals products={saleProducts} />
      <NewArrivals products={newArrivals} />
      <TopRated products={topRated} />
      <Testimonials />
      <Newsletter />
    </>
  );
}
