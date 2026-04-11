import { View, Text, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Shield, MapPin, Calendar, Users, Eye, Instagram, Twitter } from "lucide-react-native";
import { sellerStats, getActiveListings, formatPrice } from "@vendfinder/shared";
import { useAuth } from "@/context/AuthContext";
import { Rating } from "@/components/ui/Rating";

export default function PublicProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const { user } = useAuth();

  // In a real app, this would fetch by username. Using current user for demo
  const profileUser = user;
  const activeListings = getActiveListings();

  if (!profileUser) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-foreground text-lg" style={{ fontFamily: "Outfit-Medium" }}>
          Profile not found
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center px-5 py-3 gap-3">
        <Pressable onPress={() => router.back()} className="w-10 h-10 bg-card rounded-full items-center justify-center">
          <ArrowLeft size={20} color="#EEEAE4" />
        </Pressable>
        <Text className="text-foreground text-xl" style={{ fontFamily: "Outfit-Bold" }}>
          @{username}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View className="items-center px-5 py-6">
          <View className="w-24 h-24 bg-primary rounded-full items-center justify-center mb-4">
            <Text className="text-background text-3xl" style={{ fontFamily: "Outfit-Bold" }}>
              {profileUser.name?.charAt(0)}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Text className="text-foreground text-2xl" style={{ fontFamily: "PlayfairDisplay" }}>
              {profileUser.name}
            </Text>
            {profileUser.verified && <Shield size={20} color="#00D68F" />}
          </View>
          <Text className="text-muted text-sm mt-1" style={{ fontFamily: "Outfit" }}>
            @{profileUser.username}
          </Text>

          {profileUser.bio && (
            <Text className="text-foreground text-sm text-center mt-3 px-8 leading-5" style={{ fontFamily: "Outfit" }}>
              {profileUser.bio}
            </Text>
          )}

          {/* Meta Info */}
          <View className="flex-row items-center gap-4 mt-3">
            {profileUser.location && (
              <View className="flex-row items-center gap-1">
                <MapPin size={14} color="#7A7A8A" />
                <Text className="text-muted text-xs" style={{ fontFamily: "Outfit" }}>
                  {profileUser.location}
                </Text>
              </View>
            )}
            <View className="flex-row items-center gap-1">
              <Calendar size={14} color="#7A7A8A" />
              <Text className="text-muted text-xs" style={{ fontFamily: "Outfit" }}>
                Joined {profileUser.joinedDate}
              </Text>
            </View>
          </View>

          {/* Social Stats */}
          <View className="flex-row gap-6 mt-4">
            <View className="items-center">
              <Text className="text-foreground text-lg" style={{ fontFamily: "Outfit-Bold" }}>
                {profileUser.followers}
              </Text>
              <Text className="text-muted text-xs" style={{ fontFamily: "Outfit" }}>
                Followers
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-foreground text-lg" style={{ fontFamily: "Outfit-Bold" }}>
                {profileUser.following}
              </Text>
              <Text className="text-muted text-xs" style={{ fontFamily: "Outfit" }}>
                Following
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-foreground text-lg" style={{ fontFamily: "Outfit-Bold" }}>
                {profileUser.profileViews}
              </Text>
              <Text className="text-muted text-xs" style={{ fontFamily: "Outfit" }}>
                Views
              </Text>
            </View>
          </View>

          {/* Social Links */}
          {profileUser.socialLinks && (
            <View className="flex-row gap-4 mt-4">
              {profileUser.socialLinks.instagram && (
                <View className="flex-row items-center gap-1 bg-card px-3 py-1.5 rounded-full">
                  <Instagram size={14} color="#E8883A" />
                  <Text className="text-foreground text-xs" style={{ fontFamily: "Outfit" }}>
                    {profileUser.socialLinks.instagram}
                  </Text>
                </View>
              )}
              {profileUser.socialLinks.twitter && (
                <View className="flex-row items-center gap-1 bg-card px-3 py-1.5 rounded-full">
                  <Twitter size={14} color="#E8883A" />
                  <Text className="text-foreground text-xs" style={{ fontFamily: "Outfit" }}>
                    {profileUser.socialLinks.twitter}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Seller Stats */}
        <View className="px-5 mb-4">
          <Text className="text-foreground text-lg mb-3" style={{ fontFamily: "Outfit-SemiBold" }}>
            Seller Stats
          </Text>
          <View className="bg-card rounded-2xl p-4">
            <View className="flex-row items-center mb-3">
              <Rating value={sellerStats.sellerRating} showCount={false} />
              <Text className="text-foreground text-sm ml-2" style={{ fontFamily: "Outfit-SemiBold" }}>
                {sellerStats.sellerRating}/5.0
              </Text>
            </View>
            <View className="flex-row justify-between">
              <View>
                <Text className="text-foreground text-lg" style={{ fontFamily: "Outfit-Bold" }}>
                  {sellerStats.totalSales}
                </Text>
                <Text className="text-muted text-xs" style={{ fontFamily: "Outfit" }}>Sales</Text>
              </View>
              <View>
                <Text className="text-foreground text-lg" style={{ fontFamily: "Outfit-Bold" }}>
                  {sellerStats.completionRate}%
                </Text>
                <Text className="text-muted text-xs" style={{ fontFamily: "Outfit" }}>Completion</Text>
              </View>
              <View>
                <Text className="text-foreground text-lg" style={{ fontFamily: "Outfit-Bold" }}>
                  {sellerStats.avgShipTime}
                </Text>
                <Text className="text-muted text-xs" style={{ fontFamily: "Outfit" }}>Avg Ship</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Active Listings */}
        <View className="px-5 mb-8">
          <Text className="text-foreground text-lg mb-3" style={{ fontFamily: "Outfit-SemiBold" }}>
            Active Listings ({activeListings.length})
          </Text>
          {activeListings.map((listing) => (
            <View key={listing.id} className="bg-card rounded-2xl p-4 mb-3 flex-row">
              <View className="w-14 h-14 bg-surface rounded-xl items-center justify-center mr-3">
                <Text className="text-xl">
                  {listing.category === "sneakers" ? "👟" : listing.category === "electronics" ? "🎧" : listing.category === "apparel" ? "👕" : "📦"}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-foreground text-sm" numberOfLines={1} style={{ fontFamily: "Outfit-SemiBold" }}>
                  {listing.productName}
                </Text>
                <Text className="text-primary text-base mt-1" style={{ fontFamily: "Outfit-Bold" }}>
                  {formatPrice(listing.askPrice)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
