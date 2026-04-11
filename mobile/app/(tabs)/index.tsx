import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowRight, Flame, TrendingUp, Sparkles, Tag } from "lucide-react-native";
import { siteConfig } from "@vendfinder/shared";
import type { Product, Category } from "@vendfinder/shared";
import {
  getFeaturedProducts,
  getNewArrivals,
  getTopRated,
  getSaleProducts,
  fetchCategories,
} from "@/lib/api-products";
import { ProductCard } from "@/components/ProductCard";
import { useHaptics } from "@/hooks/useHaptics";

export default function HomeScreen() {
  const router = useRouter();
  const haptics = useHaptics();

  const [featured, setFeatured] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [topRated, setTopRated] = useState<Product[]>([]);
  const [sales, setSales] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [f, n, t, s, c] = await Promise.all([
        getFeaturedProducts(),
        getNewArrivals(),
        getTopRated(),
        getSaleProducts(),
        fetchCategories(),
      ]);
      setFeatured(f);
      setNewArrivals(n);
      setTopRated(t);
      setSales(s);
      setCats(c);
    } catch (err) {
      console.warn("Failed to load home data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const categoryEmojis: Record<string, string> = {
    sneakers: "👟",
    electronics: "🎧",
    apparel: "👕",
    "home-living": "🏠",
    accessories: "⌚",
    collectibles: "🎨",
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center" edges={["top"]}>
        <ActivityIndicator size="large" color="#E8883A" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E8883A" />
        }
      >
        {/* Hero */}
        <View className="px-5 pt-4 pb-6">
          <Text
            className="text-primary text-sm tracking-widest uppercase"
            style={{ fontFamily: "Outfit-SemiBold" }}
          >
            {siteConfig.name}
          </Text>
          <Text
            className="text-foreground text-3xl mt-1"
            style={{ fontFamily: "PlayfairDisplay" }}
          >
            {siteConfig.tagline}
          </Text>
          <Text
            className="text-muted text-base mt-2"
            style={{ fontFamily: "Outfit" }}
          >
            Discover trending products from top brands
          </Text>
        </View>

        {/* Categories */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between px-5 mb-3">
            <Text
              className="text-foreground text-lg"
              style={{ fontFamily: "Outfit-SemiBold" }}
            >
              Shop by Category
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
          >
            {cats.map((cat) => (
              <Pressable
                key={cat.slug}
                onPress={() => {
                  haptics.light();
                  router.push(`/categories/${cat.slug}`);
                }}
                className="items-center w-[72px]"
              >
                <View className="w-16 h-16 bg-card rounded-2xl items-center justify-center mb-2 active:bg-card-hover">
                  <Text className="text-2xl">{categoryEmojis[cat.slug] || "📦"}</Text>
                </View>
                <Text
                  className="text-foreground text-xs text-center"
                  numberOfLines={1}
                  style={{ fontFamily: "Outfit-Medium" }}
                >
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Featured Products */}
        <SectionHeader
          title="Featured"
          icon={<Flame size={18} color="#E8883A" />}
          onSeeAll={() => router.push("/browse")}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        >
          {featured.map((item) => (
            <ProductCard key={item.id} product={item} compact />
          ))}
        </ScrollView>

        {/* Hot Deals */}
        {sales.length > 0 && (
          <>
            <SectionHeader
              title="Hot Deals"
              icon={<Tag size={18} color="#FF4757" />}
              onSeeAll={() => router.push("/browse")}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              {sales.map((item) => (
                <ProductCard key={item.id} product={item} compact />
              ))}
            </ScrollView>
          </>
        )}

        {/* New Arrivals */}
        <SectionHeader
          title="New Arrivals"
          icon={<Sparkles size={18} color="#E8883A" />}
          onSeeAll={() => router.push("/browse")}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        >
          {newArrivals.map((item) => (
            <ProductCard key={item.id} product={item} compact />
          ))}
        </ScrollView>

        {/* Top Rated */}
        <SectionHeader
          title="Top Rated"
          icon={<TrendingUp size={18} color="#00D68F" />}
          onSeeAll={() => router.push("/browse")}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        >
          {topRated.map((item) => (
            <ProductCard key={item.id} product={item} compact />
          ))}
        </ScrollView>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({
  title,
  icon,
  onSeeAll,
}: {
  title: string;
  icon: React.ReactNode;
  onSeeAll: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between px-5 mt-6 mb-3">
      <View className="flex-row items-center gap-2">
        {icon}
        <Text
          className="text-foreground text-lg"
          style={{ fontFamily: "Outfit-SemiBold" }}
        >
          {title}
        </Text>
      </View>
      <Pressable onPress={onSeeAll} className="flex-row items-center">
        <Text
          className="text-primary text-sm mr-1"
          style={{ fontFamily: "Outfit-Medium" }}
        >
          See All
        </Text>
        <ArrowRight size={14} color="#E8883A" />
      </Pressable>
    </View>
  );
}
