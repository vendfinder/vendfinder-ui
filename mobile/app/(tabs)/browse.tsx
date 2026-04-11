import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, FlatList, Pressable, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Product, Category } from "@vendfinder/shared";
import { fetchProducts, fetchCategories } from "@/lib/api-products";
import { ProductCard } from "@/components/ProductCard";
import { SearchBar } from "@/components/ui/SearchBar";
import { useHaptics } from "@/hooks/useHaptics";

export default function BrowseScreen() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const haptics = useHaptics();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadProducts = useCallback(async (search?: string, category?: string | null) => {
    try {
      const results = await fetchProducts({
        search: search || undefined,
        category: category || undefined,
      });
      setProducts(results);
    } catch (err) {
      console.warn("Failed to load products:", err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    Promise.all([
      fetchProducts(),
      fetchCategories(),
    ]).then(([prods, cats]) => {
      setProducts(prods);
      setCategories(cats);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadProducts(query, selectedCategory);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selectedCategory, loadProducts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProducts(query, selectedCategory).finally(() => setRefreshing(false));
  }, [query, selectedCategory, loadProducts]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center" edges={["top"]}>
        <ActivityIndicator size="large" color="#E8883A" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="px-5 pt-4 pb-3">
        <Text
          className="text-foreground text-2xl mb-4"
          style={{ fontFamily: "Outfit-Bold" }}
        >
          Browse
        </Text>
        <SearchBar value={query} onChangeText={setQuery} />

        {/* Category Filters */}
        <FlatList
          horizontal
          data={[{ slug: null as string | null, name: "All" } as Category, ...categories]}
          keyExtractor={(item) => item.slug || "all"}
          showsHorizontalScrollIndicator={false}
          className="mt-3"
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                haptics.selection();
                setSelectedCategory(item.slug);
              }}
              className={`px-4 py-2 rounded-full mr-2 ${
                selectedCategory === item.slug
                  ? "bg-primary"
                  : "bg-card border border-border"
              }`}
            >
              <Text
                className={
                  selectedCategory === item.slug
                    ? "text-background text-sm"
                    : "text-foreground text-sm"
                }
                style={{ fontFamily: "Outfit-Medium" }}
              >
                {item.name}
              </Text>
            </Pressable>
          )}
        />
      </View>

      <View className="flex-row items-center justify-between px-5 py-2">
        <Text className="text-muted text-sm" style={{ fontFamily: "Outfit" }}>
          {products.length} products
        </Text>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 20 }}
        contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View className="flex-1">
            <ProductCard product={item} />
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E8883A" />
        }
        ListEmptyComponent={
          <View className="items-center py-20">
            <Text className="text-muted text-lg" style={{ fontFamily: "Outfit-Medium" }}>
              No products found
            </Text>
            <Text className="text-muted text-sm mt-2" style={{ fontFamily: "Outfit" }}>
              Try a different search or category
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
