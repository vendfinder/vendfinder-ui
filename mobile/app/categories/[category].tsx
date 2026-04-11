import { View, Text, FlatList, RefreshControl } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { getProductsByCategory, getCategoryBySlug } from "@vendfinder/shared";
import { ProductCard } from "@/components/ProductCard";
import { useRefresh } from "@/hooks/useRefresh";

export default function CategoryScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const router = useRouter();
  const { refreshing, onRefresh } = useRefresh();

  const categoryData = getCategoryBySlug(category);
  const categoryProducts = getProductsByCategory(category);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center px-5 py-3 gap-3">
        <Pressable onPress={() => router.back()} className="w-10 h-10 bg-card rounded-full items-center justify-center">
          <ArrowLeft size={20} color="#EEEAE4" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-foreground text-xl" style={{ fontFamily: "Outfit-Bold" }}>
            {categoryData?.name || category}
          </Text>
          <Text className="text-muted text-sm" style={{ fontFamily: "Outfit" }}>
            {categoryProducts.length} products
          </Text>
        </View>
      </View>

      {categoryData?.description && (
        <Text className="text-muted text-sm px-5 mb-4" style={{ fontFamily: "Outfit" }}>
          {categoryData.description}
        </Text>
      )}

      <FlatList
        data={categoryProducts}
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
      />
    </SafeAreaView>
  );
}
