import { useState } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Plus, Eye } from "lucide-react-native";
import { listings, formatPrice } from "@vendfinder/shared";
import { Badge } from "@/components/ui/Badge";
import { useHaptics } from "@/hooks/useHaptics";

const statusVariant: Record<string, "default" | "primary" | "success" | "warning" | "error"> = {
  active: "success",
  pending: "warning",
  sold: "primary",
  cancelled: "error",
  expired: "default",
};

export default function SellingScreen() {
  const router = useRouter();
  const haptics = useHaptics();
  const [filter, setFilter] = useState<string | null>(null);

  const filters = ["All", "Active", "Pending", "Sold"];
  const filteredListings = filter && filter !== "All"
    ? listings.filter((l) => l.status === filter.toLowerCase())
    : listings;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center px-5 py-3 gap-3">
        <Pressable onPress={() => router.back()} className="w-10 h-10 bg-card rounded-full items-center justify-center">
          <ArrowLeft size={20} color="#EEEAE4" />
        </Pressable>
        <Text className="text-foreground text-xl flex-1" style={{ fontFamily: "Outfit-Bold" }}>
          My Listings
        </Text>
        <Pressable
          onPress={() => {
            haptics.light();
            router.push("/dashboard/listings/new");
          }}
          className="bg-primary rounded-full w-10 h-10 items-center justify-center"
        >
          <Plus size={20} color="#0B0B0F" />
        </Pressable>
      </View>

      {/* Filters */}
      <View className="flex-row px-5 mb-3 gap-2">
        {filters.map((f) => (
          <Pressable
            key={f}
            onPress={() => {
              haptics.selection();
              setFilter(f === "All" ? null : f);
            }}
            className={`px-4 py-2 rounded-full ${
              (filter === null && f === "All") || filter === f
                ? "bg-primary"
                : "bg-card border border-border"
            }`}
          >
            <Text
              className={
                (filter === null && f === "All") || filter === f
                  ? "text-background text-sm"
                  : "text-foreground text-sm"
              }
              style={{ fontFamily: "Outfit-Medium" }}
            >
              {f}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filteredListings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View className="bg-card rounded-2xl p-4 mb-3">
            <View className="flex-row">
              <View className="w-16 h-16 bg-surface rounded-xl items-center justify-center mr-3">
                <Text className="text-2xl">
                  {item.category === "sneakers" ? "👟" : item.category === "electronics" ? "🎧" : item.category === "apparel" ? "👕" : "📦"}
                </Text>
              </View>
              <View className="flex-1">
                <View className="flex-row items-center justify-between">
                  <Text className="text-foreground text-sm flex-1 mr-2" numberOfLines={1} style={{ fontFamily: "Outfit-SemiBold" }}>
                    {item.productName}
                  </Text>
                  <Badge variant={statusVariant[item.status]}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Badge>
                </View>
                {item.size && (
                  <Text className="text-muted text-xs" style={{ fontFamily: "Outfit" }}>
                    Size: {item.size}
                  </Text>
                )}
                <View className="flex-row items-center justify-between mt-2">
                  <Text className="text-primary text-base" style={{ fontFamily: "Outfit-Bold" }}>
                    {formatPrice(item.askPrice)}
                  </Text>
                  <View className="flex-row items-center gap-1">
                    <Eye size={12} color="#7A7A8A" />
                    <Text className="text-muted text-xs" style={{ fontFamily: "Outfit" }}>
                      {item.views}
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
