import { View, Text, FlatList, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react-native";
import { portfolio, formatPrice } from "@vendfinder/shared";

export default function PortfolioScreen() {
  const router = useRouter();

  const totalValue = portfolio.reduce((sum, item) => sum + item.currentValue, 0);
  const totalCost = portfolio.reduce((sum, item) => sum + item.purchasePrice, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPercent = ((totalGain / totalCost) * 100).toFixed(1);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center px-5 py-3 gap-3">
        <Pressable onPress={() => router.back()} className="w-10 h-10 bg-card rounded-full items-center justify-center">
          <ArrowLeft size={20} color="#EEEAE4" />
        </Pressable>
        <Text className="text-foreground text-xl" style={{ fontFamily: "Outfit-Bold" }}>
          Portfolio
        </Text>
      </View>

      {/* Summary */}
      <View className="bg-card mx-5 rounded-2xl p-4 mb-4">
        <Text className="text-muted text-sm" style={{ fontFamily: "Outfit" }}>Total Portfolio Value</Text>
        <Text className="text-foreground text-3xl mt-1" style={{ fontFamily: "Outfit-Bold" }}>
          {formatPrice(totalValue)}
        </Text>
        <View className="flex-row items-center mt-2">
          {totalGain >= 0 ? (
            <TrendingUp size={16} color="#00D68F" />
          ) : (
            <TrendingDown size={16} color="#FF4757" />
          )}
          <Text
            className={`text-base ml-1 ${totalGain >= 0 ? "text-success" : "text-error"}`}
            style={{ fontFamily: "Outfit-SemiBold" }}
          >
            {totalGain >= 0 ? "+" : ""}{formatPrice(totalGain)} ({totalGainPercent}%)
          </Text>
        </View>
      </View>

      <FlatList
        data={portfolio}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View className="bg-card rounded-2xl p-4 mb-3">
            <View className="flex-row">
              <View className="w-14 h-14 bg-surface rounded-xl items-center justify-center mr-3">
                <Text className="text-xl">
                  {item.category === "sneakers" ? "👟" : item.category === "electronics" ? "🎧" : item.category === "streetwear" ? "👕" : item.category === "collectibles" ? "🎨" : "📦"}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-foreground text-sm" numberOfLines={1} style={{ fontFamily: "Outfit-SemiBold" }}>
                  {item.productName}
                </Text>
                <Text className="text-muted text-xs" style={{ fontFamily: "Outfit" }}>
                  {item.condition}{item.size ? ` · ${item.size}` : ""}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-foreground text-sm" style={{ fontFamily: "Outfit-Bold" }}>
                  {formatPrice(item.currentValue)}
                </Text>
                <View className="flex-row items-center">
                  {item.gainLoss >= 0 ? (
                    <TrendingUp size={12} color="#00D68F" />
                  ) : (
                    <TrendingDown size={12} color="#FF4757" />
                  )}
                  <Text
                    className={`text-xs ml-1 ${item.gainLoss >= 0 ? "text-success" : "text-error"}`}
                    style={{ fontFamily: "Outfit-SemiBold" }}
                  >
                    {item.gainLoss >= 0 ? "+" : ""}{item.gainLossPercent}%
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
