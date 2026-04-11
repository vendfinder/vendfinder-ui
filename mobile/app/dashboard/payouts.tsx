import { View, Text, FlatList, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, DollarSign } from "lucide-react-native";
import { payouts, formatPrice } from "@vendfinder/shared";
import { Badge } from "@/components/ui/Badge";

const statusVariant: Record<string, "default" | "primary" | "success" | "warning" | "error"> = {
  completed: "success",
  processing: "primary",
  pending: "warning",
  failed: "error",
};

export default function PayoutsScreen() {
  const router = useRouter();

  const totalEarned = payouts
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.net, 0);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center px-5 py-3 gap-3">
        <Pressable onPress={() => router.back()} className="w-10 h-10 bg-card rounded-full items-center justify-center">
          <ArrowLeft size={20} color="#EEEAE4" />
        </Pressable>
        <Text className="text-foreground text-xl" style={{ fontFamily: "Outfit-Bold" }}>
          Payouts
        </Text>
      </View>

      {/* Summary */}
      <View className="bg-card mx-5 rounded-2xl p-4 mb-4">
        <View className="flex-row items-center gap-2 mb-2">
          <DollarSign size={20} color="#00D68F" />
          <Text className="text-muted text-sm" style={{ fontFamily: "Outfit" }}>Total Earned</Text>
        </View>
        <Text className="text-foreground text-3xl" style={{ fontFamily: "Outfit-Bold" }}>
          {formatPrice(totalEarned)}
        </Text>
      </View>

      <FlatList
        data={payouts}
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
            <View className="flex-row justify-between mb-1">
              <Text className="text-muted text-sm" style={{ fontFamily: "Outfit" }}>Amount</Text>
              <Text className="text-foreground text-sm" style={{ fontFamily: "Outfit" }}>{formatPrice(item.amount)}</Text>
            </View>
            <View className="flex-row justify-between mb-1">
              <Text className="text-muted text-sm" style={{ fontFamily: "Outfit" }}>Fee</Text>
              <Text className="text-error text-sm" style={{ fontFamily: "Outfit" }}>-{formatPrice(item.fee)}</Text>
            </View>
            <View className="flex-row justify-between pt-2 border-t border-border mt-1">
              <Text className="text-foreground text-sm" style={{ fontFamily: "Outfit-SemiBold" }}>Net</Text>
              <Text className="text-success text-base" style={{ fontFamily: "Outfit-Bold" }}>
                {formatPrice(item.net)}
              </Text>
            </View>
            <Text className="text-muted text-xs mt-2" style={{ fontFamily: "Outfit" }}>
              {item.method} · {item.date}
            </Text>
            <Text className="text-muted text-xs mt-1" style={{ fontFamily: "Outfit" }}>
              {item.items.join(", ")}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
