'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  fetchMyListings,
  fetchMyBids,
  fetchMyFavorites,
} from '@/lib/api-products';
import {
  fetchMyPurchases,
  fetchMyPayouts,
  fetchSellerStats,
  fetchMyOrders,
  fetchMySales,
  fetchPortfolio,
} from '@/lib/api-orders';
import type {
  Listing,
  Bid,
  Purchase,
  Payout,
  SellerStats,
  FavoriteItem,
  PortfolioItem,
  Order,
  SaleOrder,
} from '@/types';

interface DashboardData {
  listings: Listing[];
  bids: Bid[];
  purchases: Purchase[];
  payouts: Payout[];
  sellerStats: SellerStats;
  orders: Order[];
  sellerOrders: SaleOrder[];
  favorites: FavoriteItem[];
  portfolio: PortfolioItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const emptyStats: SellerStats = {
  totalSales: 0,
  totalRevenue: 0,
  avgShipTime: 'N/A',
  completionRate: 100,
  sellerRating: 0,
  totalListings: 0,
  activeListings: 0,
  pendingSales: 0,
  totalPurchases: 0,
  activeBids: 0,
  portfolioValue: 0,
  totalFavorites: 0,
};

export function useDashboardData(): DashboardData {
  const { token, isAuthenticated } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [sellerStats, setSellerStats] = useState<SellerStats>(emptyStats);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sellerOrders, setSellerOrders] = useState<SaleOrder[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchCount, setFetchCount] = useState(0);

  const refetch = () => setFetchCount((c) => c + 1);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    async function loadData() {
      try {
        const results = await Promise.allSettled([
          fetchMyListings(token!),
          fetchMyBids(token!),
          fetchMyPurchases(token!),
          fetchMyPayouts(token!),
          fetchSellerStats(token!),
          fetchMyOrders(token!),
          fetchMyFavorites(token!),
          fetchPortfolio(token!),
          fetchMySales(token!),
        ]);

        if (cancelled) return;

        const [
          listingsRes,
          bidsRes,
          purchasesRes,
          payoutsRes,
          statsRes,
          ordersRes,
          favoritesRes,
          portfolioRes,
          sellerOrdersRes,
        ] = results;

        if (listingsRes.status === 'fulfilled') setListings(listingsRes.value);
        if (bidsRes.status === 'fulfilled') setBids(bidsRes.value);
        if (purchasesRes.status === 'fulfilled')
          setPurchases(purchasesRes.value);
        if (payoutsRes.status === 'fulfilled') setPayouts(payoutsRes.value);
        if (statsRes.status === 'fulfilled') setSellerStats(statsRes.value);
        if (ordersRes.status === 'fulfilled') {
          const data = ordersRes.value;
          setOrders(data.orders || []);
        }
        if (favoritesRes.status === 'fulfilled')
          setFavorites(favoritesRes.value);
        if (portfolioRes.status === 'fulfilled')
          setPortfolio(portfolioRes.value);
        if (sellerOrdersRes.status === 'fulfilled')
          setSellerOrders(sellerOrdersRes.value);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load dashboard data'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, token, fetchCount]);

  return {
    listings,
    bids,
    purchases,
    payouts,
    sellerStats,
    orders,
    sellerOrders,
    favorites,
    portfolio,
    loading,
    error,
    refetch,
  };
}
