import HeroSection from "@/components/home/HeroSection";
import BrandMarquee from "@/components/home/BrandMarquee";
import ValueProps from "@/components/home/ValueProps";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import CategoryShowcase from "@/components/home/CategoryShowcase";
import HotDeals from "@/components/home/HotDeals";
import NewArrivals from "@/components/home/NewArrivals";
import TopRated from "@/components/home/TopRated";
import Testimonials from "@/components/home/Testimonials";
import Newsletter from "@/components/home/Newsletter";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <BrandMarquee />
      <ValueProps />
      <FeaturedProducts />
      <CategoryShowcase />
      <HotDeals />
      <NewArrivals />
      <TopRated />
      <Testimonials />
      <Newsletter />
    </>
  );
}
