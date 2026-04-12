export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  longDescription: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  category: string;
  tags: string[];
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stockCount?: number;
  sku: string;
  features: string[];
  specifications: Record<string, string>;
  sizes?: string[];
  createdAt: string;
}

export interface Category {
  slug: string;
  name: string;
  description: string;
  image: string;
  icon: string;
  productCount: number;
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  verified: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  size?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  joinedDate: string;
  username?: string;
  bio?: string;
  location?: string;
  sellerLevel?: number;
  verified?: boolean;
  following?: number;
  followers?: number;
  profileViews?: number;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    website?: string;
  };
}

export interface SellerStats {
  totalSales: number;
  totalRevenue: number;
  avgShipTime: string;
  completionRate: number;
  sellerRating: number;
  totalListings: number;
  activeListings: number;
  pendingSales: number;
  totalPurchases: number;
  activeBids: number;
  portfolioValue: number;
  totalFavorites: number;
}

export type ListingStatus =
  | 'active'
  | 'pending'
  | 'sold'
  | 'cancelled'
  | 'expired';

export interface Listing {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  category: string;
  size?: string;
  condition: 'new' | 'used_like_new' | 'used_good' | 'used_fair';
  askPrice: number;
  lowestAsk?: number;
  highestBid?: number;
  lastSale?: number;
  status: ListingStatus;
  createdAt: string;
  soldAt?: string;
  expiresAt?: string;
  views: number;
}

export interface Bid {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  category: string;
  size?: string;
  bidAmount: number;
  lowestAsk?: number;
  highestBid?: number;
  lastSale?: number;
  status: 'active' | 'pending' | 'won' | 'lost' | 'expired' | 'cancelled';
  createdAt: string;
  expiresAt: string;
}

export interface Purchase {
  id: string;
  productName: string;
  productImage: string;
  category: string;
  size?: string;
  price: number;
  status:
    | 'pending_shipment'
    | 'shipped'
    | 'delivered'
    | 'authenticated'
    | 'cancelled';
  date: string;
  trackingNumber?: string;
  sellerId: string;
  sellerName: string;
}

export interface Payout {
  id: string;
  amount: number;
  fee: number;
  net: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  method: string;
  date: string;
  items: string[];
}

export interface FavoriteItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  category: string;
  lowestAsk: number;
  highestBid: number;
  lastSale: number;
  priceChange: number;
  addedAt: string;
}

export interface PortfolioItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  category: string;
  size?: string;
  purchasePrice: number;
  currentValue: number;
  gainLoss: number;
  gainLossPercent: number;
  purchaseDate: string;
  condition: string;
}

export interface Order {
  id: string;
  userId: string;
  items: { productName: string; quantity: number; price: number }[];
  total: number;
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  date: string;
  trackingNumber?: string;
}

export interface NavItem {
  label: string;
  href: string;
}
