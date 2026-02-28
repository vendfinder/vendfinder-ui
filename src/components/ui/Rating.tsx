import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingProps {
  value: number;
  count?: number;
  size?: "sm" | "md";
}

export default function Rating({ value, count, size = "sm" }: RatingProps) {
  const starSize = size === "sm" ? 14 : 18;

  return (
    <div className="flex items-center gap-1 mt-1.5">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={starSize}
            className={cn(
              star <= Math.round(value)
                ? "fill-primary text-primary"
                : "fill-border text-border"
            )}
          />
        ))}
      </div>
      {count !== undefined && (
        <span className="text-xs text-muted ml-1">({count})</span>
      )}
    </div>
  );
}
