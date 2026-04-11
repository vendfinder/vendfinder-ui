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
  sellerId?: string;
  sellerName?: string;
  createdAt: string;
  translations?: Record<string, {
    name: string;
    description: string;
    longDescription: string;
    features: string[];
  }>;
  sourceLanguage?: string;
  isGlobalListing?: boolean;
  isSponsored?: boolean;
}

export interface Category {
  slug: string;
  name: string;
  description: string;
  image: string;
  icon: string;
  productCount?: number;
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
  banner?: string;
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

export type ListingStatus = "active" | "pending" | "sold" | "cancelled" | "expired";

export interface Listing {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  category: string;
  size?: string;
  condition: "new" | "used_like_new" | "used_good" | "used_fair";
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
  status: "active" | "pending" | "won" | "lost" | "expired" | "cancelled";
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
  status: "pending_shipment" | "shipped" | "delivered" | "authenticated" | "cancelled";
  date: string;
  trackingNumber?: string;
  carrier?: string;
  sellerId: string;
  sellerName: string;
}

export interface Payout {
  id: string;
  amount: number;
  fee: number;
  net: number;
  status: "pending" | "processing" | "completed" | "failed";
  method: string;
  date: string;
  items: string[];
}

export type PayoutMethodType = 'alipay' | 'paypal' | 'wechat';

export interface PayoutMethod {
  id: string;
  sellerId: string;
  methodType: PayoutMethodType;
  label?: string;
  accountId: string;
  accountName?: string;
  nationalId?: string;
  dateOfBirth?: string;
  address?: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
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
  status: "processing" | "shipped" | "delivered" | "cancelled";
  date: string;
  trackingNumber?: string;
}

export interface SaleOrder {
  id: string;
  order_number: string;
  product_name: string;
  product_image?: string;
  product_category?: string;
  size?: string;
  item_price: number;
  total_buyer_pays: number;
  seller_payout: number;
  platform_fee: number;
  status: string;
  created_at: string;
  tracking_number?: string;
  carrier?: string;
  shipped_at?: string;
  buyer_id: string;
  payment_method?: string;
  shipping_name?: string;
  shipping_address_line1?: string;
  shipping_address_line2?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_zip?: string;
  shipping_country?: string;
}

export interface NavItem {
  label: string;
  href: string;
}

// Chat / Messaging
export interface ChatParticipant {
  id: string;
  name: string;
  username: string;
  avatar?: string;
}

export interface Conversation {
  id: string;
  type?: "direct" | "product" | "order" | "support";
  participants: ChatParticipant[];
  product?: { id: string; name: string; image: string; price: number };
  lastMessage?: { content: string; senderId: string; timestamp: string };
  unreadCount: number;
  isMuted?: boolean;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: "text" | "image" | "system" | "offer";
  metadata?: ChatMessageMetadata;
  isEdited?: boolean;
  translations?: Record<string, string> | null;
  createdAt: string;
  readAt?: string;
}

export interface ChatMessageMetadata {
  offerId?: string;
  proposedPrice?: number;
  status?: string;
  expiresAt?: string;
  [key: string]: unknown;
}

export interface ChatOffer {
  id: string;
  conversationId: string;
  messageId: string;
  senderId: string;
  proposedPrice: number;
  status: "pending" | "accepted" | "declined" | "countered" | "expired" | "cancelled";
  expiresAt: string;
  createdAt: string;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  username: string;
}

// Stories
export interface Story {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  mediaUrl: string;
  mediaType: "image";
  textOverlay?: string;
  textPosition?: "top" | "center" | "bottom";
  createdAt: string;
  expiresAt: string;
  viewCount: number;
  viewed: boolean;
}

export interface UserStoryGroup {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  stories: Story[];
  hasUnviewed: boolean;
}
