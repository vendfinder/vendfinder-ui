import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { CheckCircle, Package, ArrowRight } from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

export default function CheckoutSuccessScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background items-center justify-center px-8">
      <Animated.View entering={FadeInDown.duration(600)} className="items-center">
        <View className="w-24 h-24 bg-success/10 rounded-full items-center justify-center mb-6">
          <CheckCircle size={56} color="#00D68F" />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200).duration(600)} className="items-center">
        <Text
          className="text-foreground text-2xl text-center"
          style={{ fontFamily: "PlayfairDisplay" }}
        >
          Order Confirmed!
        </Text>
        <Text
          className="text-muted text-base text-center mt-3 leading-6"
          style={{ fontFamily: "Outfit" }}
        >
          Thank you for your purchase. You'll receive a confirmation email with your tracking details shortly.
        </Text>

        <View className="bg-card rounded-2xl p-4 mt-6 w-full">
          <View className="flex-row items-center gap-3">
            <Package size={24} color="#E8883A" />
            <View>
              <Text className="text-foreground text-sm" style={{ fontFamily: "Outfit-SemiBold" }}>
                Estimated Delivery
              </Text>
              <Text className="text-muted text-sm" style={{ fontFamily: "Outfit" }}>
                3-5 business days
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-8 gap-3 w-full">
          <Button
            title="Continue Shopping"
            onPress={() => router.replace("/(tabs)")}
            fullWidth
            size="lg"
          />
          <Button
            title="View Orders"
            onPress={() => router.replace("/dashboard/orders")}
            variant="secondary"
            fullWidth
            size="lg"
          />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}
