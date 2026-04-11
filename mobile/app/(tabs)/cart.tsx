import { View, Text, FlatList, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react-native";
import { formatPrice } from "@vendfinder/shared";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/Button";
import { useHaptics } from "@/hooks/useHaptics";

export default function CartScreen() {
  const { items, totalItems, totalPrice, removeItem, updateQuantity, clearCart } = useCart();
  const router = useRouter();
  const haptics = useHaptics();

  const handleRemove = (productId: string, size?: string) => {
    haptics.medium();
    removeItem(productId, size);
  };

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center" edges={["top"]}>
        <ShoppingBag size={64} color="#7A7A8A" />
        <Text
          className="text-foreground text-xl mt-4"
          style={{ fontFamily: "Outfit-SemiBold" }}
        >
          Your cart is empty
        </Text>
        <Text
          className="text-muted text-base mt-2 text-center px-8"
          style={{ fontFamily: "Outfit" }}
        >
          Browse our collection and add items to get started
        </Text>
        <View className="mt-6">
          <Button title="Browse Products" onPress={() => router.push("/browse")} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
        <Text
          className="text-foreground text-2xl"
          style={{ fontFamily: "Outfit-Bold" }}
        >
          Cart ({totalItems})
        </Text>
        <Pressable
          onPress={() => {
            Alert.alert("Clear Cart", "Remove all items?", [
              { text: "Cancel", style: "cancel" },
              { text: "Clear", style: "destructive", onPress: clearCart },
            ]);
          }}
        >
          <Text className="text-error text-sm" style={{ fontFamily: "Outfit-Medium" }}>
            Clear All
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => `${item.product.id}-${item.size || "default"}`}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View className="bg-card rounded-2xl p-4 mb-3 flex-row">
            <View className="w-20 h-20 bg-surface rounded-xl items-center justify-center mr-4">
              <Text className="text-3xl">
                {item.product.category === "sneakers" ? "👟" : item.product.category === "electronics" ? "🎧" : "📦"}
              </Text>
            </View>
            <View className="flex-1">
              <Text
                className="text-foreground text-base"
                numberOfLines={1}
                style={{ fontFamily: "Outfit-SemiBold" }}
              >
                {item.product.name}
              </Text>
              {item.size && (
                <Text className="text-muted text-sm" style={{ fontFamily: "Outfit" }}>
                  Size: {item.size}
                </Text>
              )}
              <Text
                className="text-primary text-base mt-1"
                style={{ fontFamily: "Outfit-Bold" }}
              >
                {formatPrice(item.product.price * item.quantity)}
              </Text>
              <View className="flex-row items-center mt-2">
                <Pressable
                  onPress={() => {
                    haptics.light();
                    updateQuantity(item.product.id, item.quantity - 1, item.size);
                  }}
                  className="w-8 h-8 bg-surface rounded-lg items-center justify-center"
                >
                  <Minus size={14} color="#EEEAE4" />
                </Pressable>
                <Text
                  className="text-foreground text-base mx-4"
                  style={{ fontFamily: "Outfit-SemiBold" }}
                >
                  {item.quantity}
                </Text>
                <Pressable
                  onPress={() => {
                    haptics.light();
                    updateQuantity(item.product.id, item.quantity + 1, item.size);
                  }}
                  className="w-8 h-8 bg-surface rounded-lg items-center justify-center"
                >
                  <Plus size={14} color="#EEEAE4" />
                </Pressable>
                <View className="flex-1" />
                <Pressable
                  onPress={() => handleRemove(item.product.id, item.size)}
                  className="w-8 h-8 items-center justify-center"
                >
                  <Trash2 size={18} color="#FF4757" />
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />

      {/* Checkout Bar */}
      <View className="bg-surface border-t border-border px-5 py-4 pb-8">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-muted text-base" style={{ fontFamily: "Outfit" }}>
            Total
          </Text>
          <Text
            className="text-foreground text-2xl"
            style={{ fontFamily: "Outfit-Bold" }}
          >
            {formatPrice(totalPrice)}
          </Text>
        </View>
        <Button
          title="Proceed to Checkout"
          onPress={() => {
            haptics.medium();
            router.push("/checkout");
          }}
          fullWidth
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}
