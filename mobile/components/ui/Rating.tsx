import { View, Text } from "react-native";
import { Star } from "lucide-react-native";

interface RatingProps {
  value: number;
  count?: number;
  size?: number;
  showCount?: boolean;
}

export function Rating({ value, count, size = 14, showCount = true }: RatingProps) {
  return (
    <View className="flex-row items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          color="#E8883A"
          fill={i < Math.floor(value) ? "#E8883A" : "transparent"}
        />
      ))}
      {showCount && count !== undefined && (
        <Text
          className="text-muted text-xs ml-1"
          style={{ fontFamily: "Outfit" }}
        >
          ({count})
        </Text>
      )}
    </View>
  );
}
