import { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Heart, Share2, ShoppingCart, Check, Star } from "lucide-react-native";
import {
  getProductBySlug,
  getReviewsByProductId,
  formatPrice,
} from "@vendfinder/shared";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Rating } from "@/components/ui/Rating";
import { useHaptics } from "@/hooks/useHaptics";

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { addItem } = useCart();
  const haptics = useHaptics();
  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const [added, setAdded] = useState(false);

  const product = getProductBySlug(slug);
  if (!product) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-foreground text-lg" style={{ fontFamily: "Outfit-Medium" }}>
          Product not found
        </Text>
      </SafeAreaView>
    );
  }

  const reviews = getReviewsByProductId(product.id);

  const handleAddToCart = () => {
    if (product.sizes && !selectedSize) {
      haptics.error();
      return;
    }
    haptics.success();
    addItem(product, 1, selectedSize);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3">
        <Pressable onPress={() => router.back()} className="w-10 h-10 bg-card rounded-full items-center justify-center">
          <ArrowLeft size={20} color="#EEEAE4" />
        </Pressable>
        <View className="flex-row gap-2">
          <Pressable className="w-10 h-10 bg-card rounded-full items-center justify-center">
            <Heart size={20} color="#EEEAE4" />
          </Pressable>
          <Pressable className="w-10 h-10 bg-card rounded-full items-center justify-center">
            <Share2 size={20} color="#EEEAE4" />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View className="bg-surface mx-5 rounded-2xl aspect-square items-center justify-center mb-6">
          <Text className="text-8xl">
            {product.category === "sneakers" ? "👟" : product.category === "electronics" ? "🎧" : product.category === "streetwear" ? "👕" : product.category === "accessories" ? "⌚" : product.category === "collectibles" ? "🎨" : "📦"}
          </Text>
          {discount > 0 && (
            <View className="absolute top-4 left-4">
              <Badge variant="error">{`-${discount}%`}</Badge>
            </View>
          )}
        </View>

        <View className="px-5">
          {/* Title & Price */}
          <Text className="text-muted text-sm uppercase" style={{ fontFamily: "Outfit-Medium" }}>
            {product.category}
          </Text>
          <Text
            className="text-foreground text-2xl mt-1"
            style={{ fontFamily: "PlayfairDisplay" }}
          >
            {product.name}
          </Text>

          <View className="flex-row items-center gap-3 mt-3">
            <Text className="text-primary text-2xl" style={{ fontFamily: "Outfit-Bold" }}>
              {formatPrice(product.price)}
            </Text>
            {product.compareAtPrice && (
              <Text className="text-muted text-lg line-through" style={{ fontFamily: "Outfit" }}>
                {formatPrice(product.compareAtPrice)}
              </Text>
            )}
          </View>

          <View className="mt-2">
            <Rating value={product.rating} count={product.reviewCount} />
          </View>

          {/* Description */}
          <Text className="text-muted text-base mt-4 leading-6" style={{ fontFamily: "Outfit" }}>
            {product.longDescription}
          </Text>

          {/* Size Picker */}
          {product.sizes && (
            <View className="mt-6">
              <Text className="text-foreground text-base mb-3" style={{ fontFamily: "Outfit-SemiBold" }}>
                Select Size
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <Pressable
                    key={size}
                    onPress={() => {
                      haptics.selection();
                      setSelectedSize(size);
                    }}
                    className={`px-4 py-2 rounded-xl border ${
                      selectedSize === size
                        ? "bg-primary border-primary"
                        : "bg-card border-border"
                    }`}
                  >
                    <Text
                      className={selectedSize === size ? "text-background" : "text-foreground"}
                      style={{ fontFamily: "Outfit-Medium", fontSize: 14 }}
                    >
                      {size}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Features */}
          <View className="mt-6">
            <Text className="text-foreground text-base mb-3" style={{ fontFamily: "Outfit-SemiBold" }}>
              Features
            </Text>
            {product.features.map((feature, i) => (
              <View key={i} className="flex-row items-center gap-2 mb-2">
                <Check size={16} color="#00D68F" />
                <Text className="text-muted text-sm" style={{ fontFamily: "Outfit" }}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>

          {/* Specifications */}
          <View className="mt-6">
            <Text className="text-foreground text-base mb-3" style={{ fontFamily: "Outfit-SemiBold" }}>
              Specifications
            </Text>
            <View className="bg-card rounded-xl overflow-hidden">
              {Object.entries(product.specifications).map(([key, value], i) => (
                <View
                  key={key}
                  className={`flex-row items-center px-4 py-3 ${
                    i < Object.entries(product.specifications).length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <Text className="text-muted text-sm flex-1" style={{ fontFamily: "Outfit" }}>
                    {key}
                  </Text>
                  <Text className="text-foreground text-sm" style={{ fontFamily: "Outfit-Medium" }}>
                    {value}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Reviews */}
          {reviews.length > 0 && (
            <View className="mt-6 mb-4">
              <Text className="text-foreground text-base mb-3" style={{ fontFamily: "Outfit-SemiBold" }}>
                Reviews ({reviews.length})
              </Text>
              {reviews.map((review) => (
                <View key={review.id} className="bg-card rounded-xl p-4 mb-3">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-foreground text-sm" style={{ fontFamily: "Outfit-SemiBold" }}>
                      {review.userName}
                    </Text>
                    <Rating value={review.rating} showCount={false} size={12} />
                  </View>
                  <Text className="text-foreground text-sm" style={{ fontFamily: "Outfit-Medium" }}>
                    {review.title}
                  </Text>
                  <Text className="text-muted text-sm mt-1" style={{ fontFamily: "Outfit" }}>
                    {review.body}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View className="h-24" />
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View className="absolute bottom-0 left-0 right-0 bg-surface/95 border-t border-border px-5 py-4 pb-8">
        <Button
          title={added ? "Added to Cart!" : "Add to Cart"}
          onPress={handleAddToCart}
          fullWidth
          size="lg"
          variant={added ? "secondary" : "primary"}
          icon={added ? <Check size={20} color="#00D68F" /> : <ShoppingCart size={20} color="#0B0B0F" />}
        />
      </View>
    </SafeAreaView>
  );
}
