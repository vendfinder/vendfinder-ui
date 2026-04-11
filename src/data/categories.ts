import { Category } from "@/types";

export const categories: Category[] = [
  {
    slug: "sneakers",
    name: "Sneakers",
    description: "Exclusive drops and classic kicks from top brands",
    image: "/images/categories/sneakers.jpg",
    icon: "Footprints",
  },
  {
    slug: "electronics",
    name: "Electronics",
    description: "Latest gadgets, audio gear, and tech accessories",
    image: "/images/categories/electronics.jpg",
    icon: "Smartphone",
  },
  {
    slug: "apparel",
    name: "Apparel",
    description: "Trending hoodies, tees, and urban fashion",
    image: "/images/categories/apparel.jpg",
    icon: "Shirt",
  },
  {
    slug: "home-living",
    name: "Home & Living",
    description: "Elevate your space with modern home essentials",
    image: "/images/categories/home-living.jpg",
    icon: "Home",
  },
  {
    slug: "accessories",
    name: "Accessories",
    description: "Watches, bags, jewelry, and everyday carry",
    image: "/images/categories/accessories.jpg",
    icon: "Watch",
  },
  {
    slug: "collectibles",
    name: "Collectibles",
    description: "Limited edition figures, cards, and rare finds",
    image: "/images/categories/collectibles.jpg",
    icon: "Trophy",
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}
