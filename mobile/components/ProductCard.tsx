import { View, Text, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";
import { Product, formatPrice } from "@vendfinder/shared";
import { Rating } from "@/components/ui/Rating";
import { useHaptics } from "@/hooks/useHaptics";

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const router = useRouter();
  const haptics = useHaptics();

  const handlePress = () => {
    haptics.light();
    router.push(`/products/${product.slug}`);
  };

  if (compact) {
    return (
      <Pressable
        onPress={handlePress}
        className="w-[160px] mr-3 active:opacity-80"
      >
        <View className="bg-card rounded-2xl overflow-hidden">
          <View className="bg-surface aspect-square items-center justify-center">
            <Text className="text-muted text-4xl">
              {product.category === "sneakers" ? "👟" : product.category === "electronics" ? "🎧" : product.category === "streetwear" ? "👕" : product.category === "accessories" ? "⌚" : product.category === "collectibles" ? "🎨" : "📦"}
            </Text>
          </View>
          <View className="p-3">
            <Text
              className="text-foreground text-sm"
              numberOfLines={1}
              style={{ fontFamily: "Outfit-Medium" }}
            >
              {product.name}
            </Text>
            <Text
              className="text-primary text-sm mt-1"
              style={{ fontFamily: "Outfit-Bold" }}
            >
              {formatPrice(product.price)}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      className="bg-card rounded-2xl overflow-hidden active:bg-card-hover"
    >
      <View className="bg-surface aspect-[4/3] items-center justify-center">
        <Text className="text-muted text-5xl">
          {product.category === "sneakers" ? "👟" : product.category === "electronics" ? "🎧" : product.category === "streetwear" ? "👕" : product.category === "accessories" ? "⌚" : product.category === "collectibles" ? "🎨" : "📦"}
        </Text>
      </View>
      <View className="p-4">
        <Text
          className="text-foreground text-base"
          numberOfLines={1}
          style={{ fontFamily: "Outfit-SemiBold" }}
        >
          {product.name}
        </Text>
        <Text
          className="text-muted text-sm mt-1"
          numberOfLines={1}
          style={{ fontFamily: "Outfit" }}
        >
          {product.description}
        </Text>
        <View className="flex-row items-center justify-between mt-3">
          <Text
            className="text-primary text-lg"
            style={{ fontFamily: "Outfit-Bold" }}
          >
            {formatPrice(product.price)}
          </Text>
          {product.compareAtPrice && (
            <Text className="text-muted text-sm line-through" style={{ fontFamily: "Outfit" }}>
              {formatPrice(product.compareAtPrice)}
            </Text>
          )}
        </View>
        <View className="mt-2">
          <Rating value={product.rating} count={product.reviewCount} size={12} />
        </View>
      </View>
    </Pressable>
  );
}
