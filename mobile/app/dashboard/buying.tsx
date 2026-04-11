import { View, Text, FlatList, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { purchases, formatPrice } from "@vendfinder/shared";
import { Badge } from "@/components/ui/Badge";

const statusVariant: Record<string, "default" | "primary" | "success" | "warning" | "error"> = {
  pending_shipment: "warning",
  shipped: "primary",
  delivered: "success",
  authenticated: "success",
  cancelled: "error",
};

const statusLabels: Record<string, string> = {
  pending_shipment: "Pending",
  shipped: "Shipped",
  delivered: "Delivered",
  authenticated: "Authenticated",
  cancelled: "Cancelled",
};

export default function BuyingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center px-5 py-3 gap-3">
        <Pressable onPress={() => router.back()} className="w-10 h-10 bg-card rounded-full items-center justify-center">
          <ArrowLeft size={20} color="#EEEAE4" />
        </Pressable>
        <Text className="text-foreground text-xl" style={{ fontFamily: "Outfit-Bold" }}>
          Purchase History
        </Text>
      </View>

      <FlatList
        data={purchases}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View className="bg-card rounded-2xl p-4 mb-3">
            <View className="flex-row">
              <View className="w-16 h-16 bg-surface rounded-xl items-center justify-center mr-3">
                <Text className="text-2xl">📦</Text>
              </View>
              <View className="flex-1">
                <Text className="text-foreground text-sm" numberOfLines={1} style={{ fontFamily: "Outfit-SemiBold" }}>
                  {item.productName}
                </Text>
                <Text className="text-muted text-xs mt-0.5" style={{ fontFamily: "Outfit" }}>
                  {item.size ? `Size: ${item.size} · ` : ""}{item.date}
                </Text>
                <View className="flex-row items-center justify-between mt-2">
                  <Text className="text-primary text-base" style={{ fontFamily: "Outfit-Bold" }}>
                    {formatPrice(item.price)}
                  </Text>
                  <Badge variant={statusVariant[item.status]}>
                    {statusLabels[item.status]}
                  </Badge>
                </View>
                <Text className="text-muted text-xs mt-1" style={{ fontFamily: "Outfit" }}>
                  Seller: {item.sellerName}
                </Text>
              </View>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
