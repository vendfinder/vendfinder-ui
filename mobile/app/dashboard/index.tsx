import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, TrendingUp, Package, DollarSign, ShoppingBag, Star, Clock } from "lucide-react-native";
import { sellerStats, formatPrice } from "@vendfinder/shared";
import { useAuth } from "@/context/AuthContext";

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const stats = [
    { label: "Total Sales", value: String(sellerStats.totalSales), icon: ShoppingBag, color: "#E8883A" },
    { label: "Revenue", value: formatPrice(sellerStats.totalRevenue), icon: DollarSign, color: "#00D68F" },
    { label: "Rating", value: String(sellerStats.sellerRating), icon: Star, color: "#FFB800" },
    { label: "Avg Ship Time", value: sellerStats.avgShipTime, icon: Clock, color: "#E8883A" },
    { label: "Active Listings", value: String(sellerStats.activeListings), icon: Package, color: "#00D68F" },
    { label: "Portfolio", value: formatPrice(sellerStats.portfolioValue), icon: TrendingUp, color: "#E8883A" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center px-5 py-3 gap-3">
        <Pressable onPress={() => router.back()} className="w-10 h-10 bg-card rounded-full items-center justify-center">
          <ArrowLeft size={20} color="#EEEAE4" />
        </Pressable>
        <Text className="text-foreground text-xl" style={{ fontFamily: "Outfit-Bold" }}>
          Dashboard
        </Text>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <Text className="text-muted text-sm mb-4" style={{ fontFamily: "Outfit" }}>
          Welcome back, {user?.name}
        </Text>

        <View className="flex-row flex-wrap gap-3">
          {stats.map((stat) => (
            <View key={stat.label} className="bg-card rounded-2xl p-4 w-[48%]">
              <stat.icon size={24} color={stat.color} />
              <Text className="text-foreground text-xl mt-2" style={{ fontFamily: "Outfit-Bold" }}>
                {stat.value}
              </Text>
              <Text className="text-muted text-sm" style={{ fontFamily: "Outfit" }}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
