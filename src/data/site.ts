// Structural data only — translatable labels come from i18n/messages/*.json via t()

export const navItemHrefs = [
  { key: "home", href: "/" },
  { key: "products", href: "/products" },
  { key: "sneakers", href: "/categories/sneakers" },
  { key: "electronics", href: "/categories/electronics" },
  { key: "apparel", href: "/categories/apparel" },
  { key: "accessories", href: "/categories/accessories" },
  { key: "collectibles", href: "/categories/collectibles" },
] as const;

export const footerLinkHrefs = {
  shop: [
    { key: "allProducts", href: "/products" },
    { key: "sneakers", href: "/categories/sneakers" },
    { key: "electronics", href: "/categories/electronics" },
    { key: "apparel", href: "/categories/apparel" },
    { key: "accessories", href: "/categories/accessories" },
  ],
  company: [
    { key: "aboutUs", href: "/about" },
    { key: "careers", href: "/careers" },
    { key: "press", href: "/press" },
    { key: "blog", href: "/blog" },
  ],
  support: [
    { key: "helpCenter", href: "/help" },
    { key: "shippingInfo", href: "/shipping" },
    { key: "returns", href: "/returns" },
    { key: "contactUs", href: "/contact" },
  ],
} as const;

export const valuePropKeys = [
  { icon: "BadgeCheck", titleKey: "verifiedSellers", descKey: "verifiedSellersDesc" },
  { icon: "Lock", titleKey: "escrowProtected", descKey: "escrowProtectedDesc" },
  { icon: "ShieldCheck", titleKey: "buyerProtection", descKey: "buyerProtectionDesc" },
] as const;

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
