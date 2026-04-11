import { useState } from "react";
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable } from "react-native";
import { ArrowLeft, CreditCard, Truck, Shield } from "lucide-react-native";
import { formatPrice } from "@vendfinder/shared";
import { useCart } from "@/context/CartContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useHaptics } from "@/hooks/useHaptics";

export default function CheckoutScreen() {
  const { items, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const haptics = useHaptics();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    zip: "",
    card: "",
  });

  const shippingCost = totalPrice > 50 ? 0 : 9.99;
  const tax = totalPrice * 0.08;
  const orderTotal = totalPrice + shippingCost + tax;

  const handleCheckout = async () => {
    setLoading(true);
    haptics.medium();
    // Simulate processing
    await new Promise((r) => setTimeout(r, 1500));
    clearCart();
    haptics.success();
    setLoading(false);
    router.replace("/checkout/success");
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center px-5 py-3 gap-3">
        <Pressable onPress={() => router.back()} className="w-10 h-10 bg-card rounded-full items-center justify-center">
          <ArrowLeft size={20} color="#EEEAE4" />
        </Pressable>
        <Text className="text-foreground text-xl" style={{ fontFamily: "Outfit-Bold" }}>
          Checkout
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Order Summary */}
          <View className="bg-card rounded-2xl p-4 mb-6">
            <Text className="text-foreground text-base mb-3" style={{ fontFamily: "Outfit-SemiBold" }}>
              Order Summary
            </Text>
            {items.map((item) => (
              <View key={`${item.product.id}-${item.size}`} className="flex-row justify-between mb-2">
                <Text className="text-muted text-sm flex-1" style={{ fontFamily: "Outfit" }}>
                  {item.product.name} x{item.quantity}
                </Text>
                <Text className="text-foreground text-sm" style={{ fontFamily: "Outfit-Medium" }}>
                  {formatPrice(item.product.price * item.quantity)}
                </Text>
              </View>
            ))}
            <View className="border-t border-border mt-2 pt-2">
              <View className="flex-row justify-between mb-1">
                <Text className="text-muted text-sm" style={{ fontFamily: "Outfit" }}>Subtotal</Text>
                <Text className="text-foreground text-sm" style={{ fontFamily: "Outfit" }}>{formatPrice(totalPrice)}</Text>
              </View>
              <View className="flex-row justify-between mb-1">
                <Text className="text-muted text-sm" style={{ fontFamily: "Outfit" }}>Shipping</Text>
                <Text className={`text-sm ${shippingCost === 0 ? "text-success" : "text-foreground"}`} style={{ fontFamily: "Outfit" }}>
                  {shippingCost === 0 ? "Free" : formatPrice(shippingCost)}
                </Text>
              </View>
              <View className="flex-row justify-between mb-1">
                <Text className="text-muted text-sm" style={{ fontFamily: "Outfit" }}>Tax</Text>
                <Text className="text-foreground text-sm" style={{ fontFamily: "Outfit" }}>{formatPrice(tax)}</Text>
              </View>
              <View className="flex-row justify-between mt-2 pt-2 border-t border-border">
                <Text className="text-foreground text-base" style={{ fontFamily: "Outfit-SemiBold" }}>Total</Text>
                <Text className="text-primary text-lg" style={{ fontFamily: "Outfit-Bold" }}>
                  {formatPrice(orderTotal)}
                </Text>
              </View>
            </View>
          </View>

          {/* Shipping Info */}
          <Text className="text-foreground text-base mb-3" style={{ fontFamily: "Outfit-SemiBold" }}>
            Shipping Information
          </Text>
          <Input label="Full Name" placeholder="John Doe" value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} autoCapitalize="words" />
          <Input label="Email" placeholder="john@email.com" value={form.email} onChangeText={(t) => setForm({ ...form, email: t })} keyboardType="email-address" />
          <Input label="Address" placeholder="123 Main St" value={form.address} onChangeText={(t) => setForm({ ...form, address: t })} autoCapitalize="words" />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Input label="City" placeholder="New York" value={form.city} onChangeText={(t) => setForm({ ...form, city: t })} autoCapitalize="words" />
            </View>
            <View className="flex-1">
              <Input label="ZIP Code" placeholder="10001" value={form.zip} onChangeText={(t) => setForm({ ...form, zip: t })} keyboardType="numeric" />
            </View>
          </View>

          {/* Payment */}
          <Text className="text-foreground text-base mb-3 mt-2" style={{ fontFamily: "Outfit-SemiBold" }}>
            Payment
          </Text>
          <Input label="Card Number" placeholder="4242 4242 4242 4242" value={form.card} onChangeText={(t) => setForm({ ...form, card: t })} keyboardType="numeric" icon={<CreditCard size={20} color="#7A7A8A" />} />

          {/* Trust Signals */}
          <View className="flex-row justify-center gap-6 my-4">
            <View className="items-center">
              <Shield size={20} color="#00D68F" />
              <Text className="text-muted text-xs mt-1" style={{ fontFamily: "Outfit" }}>Secure</Text>
            </View>
            <View className="items-center">
              <Truck size={20} color="#00D68F" />
              <Text className="text-muted text-xs mt-1" style={{ fontFamily: "Outfit" }}>Fast Ship</Text>
            </View>
          </View>

          <Button
            title="Place Order"
            onPress={handleCheckout}
            loading={loading}
            fullWidth
            size="lg"
          />

          <View className="h-8" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
