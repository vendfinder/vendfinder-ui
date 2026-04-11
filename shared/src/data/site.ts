import { NavItem } from "../types";

export const siteConfig = {
  name: "VendFinder",
  description:
    "Discover trending products from top brands. Sneakers, electronics, apparel, and more — all in one marketplace.",
  tagline: "Find It. Love It. Own It.",
};

export const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
  { label: "Sneakers", href: "/categories/sneakers" },
  { label: "Electronics", href: "/categories/electronics" },
  { label: "Apparel", href: "/categories/apparel" },
  { label: "Accessories", href: "/categories/accessories" },
  { label: "Collectibles", href: "/categories/collectibles" },
];

export const footerLinks = {
  shop: [
    { label: "All Products", href: "/products" },
    { label: "Sneakers", href: "/categories/sneakers" },
    { label: "Electronics", href: "/categories/electronics" },
    { label: "Apparel", href: "/categories/apparel" },
    { label: "Accessories", href: "/categories/accessories" },
  ],
  company: [
    { label: "About Us", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Press", href: "#" },
    { label: "Blog", href: "#" },
  ],
  support: [
    { label: "Help Center", href: "#" },
    { label: "Shipping Info", href: "#" },
    { label: "Returns", href: "#" },
    { label: "Contact Us", href: "#" },
  ],
};

export const valueProps = [
  {
    icon: "Truck",
    title: "Free Shipping",
    description: "On orders over $50",
  },
  {
    icon: "Shield",
    title: "Secure Payment",
    description: "100% protected checkout",
  },
  {
    icon: "RotateCcw",
    title: "Easy Returns",
    description: "30-day return policy",
  },
  {
    icon: "Headphones",
    title: "24/7 Support",
    description: "We're always here to help",
  },
];

export const testimonials = [
  {
    name: "Marcus J.",
    rating: 5,
    quote:
      "VendFinder has the best selection of sneakers I've ever seen. Got my Jordan 4s at an amazing price!",
    avatar: "MJ",
  },
  {
    name: "Sarah L.",
    rating: 5,
    quote:
      "Super fast shipping and everything arrived in perfect condition. This is my go-to marketplace now.",
    avatar: "SL",
  },
  {
    name: "David K.",
    rating: 4,
    quote:
      "Great prices on electronics. Found a brand new tablet for way less than retail. Highly recommend!",
    avatar: "DK",
  },
];
