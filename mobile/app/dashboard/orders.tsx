import { View, Text, FlatList, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { orders, formatPrice } from "@vendfinder/shared";
import { Badge } from "@/components/ui/Badge";

const statusVariant: Record<string, "default" | "primary" | "success" | "warning" | "error"> = {
  processing: "warning",
  shipped: "primary",
  delivered: "success",
  cancelled: "error",
};

export default function OrdersScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center px-5 py-3 gap-3">
        <Pressable onPress={() => router.back()} className="w-10 h-10 bg-card rounded-full items-center justify-center">
          <ArrowLeft size={20} color="#EEEAE4" />
        </Pressable>
        <Text className="text-foreground text-xl" style={{ fontFamily: "Outfit-Bold" }}>
          Orders
        </Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View className="bg-card rounded-2xl p-4 mb-3">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-foreground text-sm" style={{ fontFamily: "Outfit-SemiBold" }}>
                {item.id}
              </Text>
              <Badge variant={statusVariant[item.status]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Badge>
            </View>
            {item.items.map((orderItem, i) => (
              <View key={i} className="flex-row justify-between mb-1">
                <Text className="text-muted text-sm flex-1" style={{ fontFamily: "Outfit" }}>
                  {orderItem.productName} x{orderItem.quantity}
                </Text>
                <Text className="text-foreground text-sm" style={{ fontFamily: "Outfit" }}>
                  {formatPrice(orderItem.price)}
                </Text>
              </View>
            ))}
            <View className="flex-row justify-between mt-2 pt-2 border-t border-border">
              <Text className="text-muted text-sm" style={{ fontFamily: "Outfit" }}>
                {item.date}
              </Text>
              <Text className="text-primary text-base" style={{ fontFamily: "Outfit-Bold" }}>
                {formatPrice(item.total)}
              </Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
