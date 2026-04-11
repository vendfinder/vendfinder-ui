import { View, Text, FlatList, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react-native";
import { favorites, formatPrice } from "@vendfinder/shared";

export default function FavoritesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center px-5 py-3 gap-3">
        <Pressable onPress={() => router.back()} className="w-10 h-10 bg-card rounded-full items-center justify-center">
          <ArrowLeft size={20} color="#EEEAE4" />
        </Pressable>
        <Text className="text-foreground text-xl" style={{ fontFamily: "Outfit-Bold" }}>
          Favorites ({favorites.length})
        </Text>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View className="bg-card rounded-2xl p-4 mb-3">
            <View className="flex-row">
              <View className="w-16 h-16 bg-surface rounded-xl items-center justify-center mr-3">
                <Text className="text-2xl">
                  {item.category === "sneakers" ? "👟" : item.category === "electronics" ? "🎧" : item.category === "collectibles" ? "🎨" : "📦"}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-foreground text-sm" numberOfLines={1} style={{ fontFamily: "Outfit-SemiBold" }}>
                  {item.productName}
                </Text>
                <View className="flex-row items-center gap-4 mt-2">
                  <View>
                    <Text className="text-muted text-xs" style={{ fontFamily: "Outfit" }}>Lowest Ask</Text>
                    <Text className="text-foreground text-sm" style={{ fontFamily: "Outfit-Bold" }}>
                      {formatPrice(item.lowestAsk)}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-muted text-xs" style={{ fontFamily: "Outfit" }}>Last Sale</Text>
                    <Text className="text-foreground text-sm" style={{ fontFamily: "Outfit-Bold" }}>
                      {formatPrice(item.lastSale)}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    {item.priceChange >= 0 ? (
                      <TrendingUp size={14} color="#00D68F" />
                    ) : (
                      <TrendingDown size={14} color="#FF4757" />
                    )}
                    <Text
                      className={`text-sm ml-1 ${item.priceChange >= 0 ? "text-success" : "text-error"}`}
                      style={{ fontFamily: "Outfit-SemiBold" }}
                    >
                      {item.priceChange > 0 ? "+" : ""}{item.priceChange}%
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
