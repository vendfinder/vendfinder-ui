import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  User,
  Settings,
  Package,
  Heart,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Tag,
  Plus,
  ChevronRight,
  LogOut,
  LogIn,
  Shield,
} from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { sellerStats, formatPrice } from "@vendfinder/shared";
import { useHaptics } from "@/hooks/useHaptics";

export default function MeScreen() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const haptics = useHaptics();

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-8" edges={["top"]}>
        <View className="w-20 h-20 bg-card rounded-full items-center justify-center mb-4">
          <User size={40} color="#7A7A8A" />
        </View>
        <Text
          className="text-foreground text-xl text-center"
          style={{ fontFamily: "Outfit-SemiBold" }}
        >
          Sign in to VendFinder
        </Text>
        <Text
          className="text-muted text-base text-center mt-2 mb-6"
          style={{ fontFamily: "Outfit" }}
        >
          Access your dashboard, track orders, and manage listings
        </Text>
        <Pressable
          onPress={() => router.push("/(auth)/login")}
          className="bg-primary rounded-xl px-8 py-3 flex-row items-center"
        >
          <LogIn size={20} color="#0B0B0F" />
          <Text className="text-background text-base ml-2" style={{ fontFamily: "Outfit-SemiBold" }}>
            Sign In
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/(auth)/signup")}
          className="mt-4"
        >
          <Text className="text-primary text-sm" style={{ fontFamily: "Outfit-Medium" }}>
            Create an Account
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const menuSections = [
    {
      title: "Buying",
      items: [
        { label: "Purchase History", icon: ShoppingBag, route: "/dashboard/buying", value: String(sellerStats.totalPurchases) },
        { label: "Favorites", icon: Heart, route: "/dashboard/favorites", value: String(sellerStats.totalFavorites) },
        { label: "Orders", icon: Package, route: "/dashboard/orders" },
        { label: "Portfolio", icon: TrendingUp, route: "/dashboard/portfolio", value: formatPrice(sellerStats.portfolioValue) },
      ],
    },
    {
      title: "Selling",
      items: [
        { label: "My Listings", icon: Tag, route: "/dashboard/selling", value: String(sellerStats.activeListings) + " active" },
        { label: "New Listing", icon: Plus, route: "/dashboard/listings/new" },
        { label: "Payouts", icon: DollarSign, route: "/dashboard/payouts" },
      ],
    },
    {
      title: "Account",
      items: [
        { label: "Edit Profile", icon: User, route: "/dashboard/profile" },
        { label: "Settings", icon: Settings, route: "/dashboard/settings" },
      ],
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View className="px-5 pt-4 pb-6">
          <View className="flex-row items-center">
            <View className="w-16 h-16 bg-primary rounded-full items-center justify-center mr-4">
              <Text className="text-background text-xl" style={{ fontFamily: "Outfit-Bold" }}>
                {user?.name?.charAt(0) || "U"}
              </Text>
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text
                  className="text-foreground text-xl"
                  style={{ fontFamily: "Outfit-Bold" }}
                >
                  {user?.name}
                </Text>
                {user?.verified && <Shield size={16} color="#00D68F" />}
              </View>
              <Text className="text-muted text-sm" style={{ fontFamily: "Outfit" }}>
                @{user?.username}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                haptics.light();
                router.push(`/profile/${user?.username}`);
              }}
              className="bg-card px-3 py-2 rounded-lg"
            >
              <Text className="text-foreground text-sm" style={{ fontFamily: "Outfit-Medium" }}>
                View Profile
              </Text>
            </Pressable>
          </View>

          {/* Quick Stats */}
          <View className="flex-row mt-4 gap-3">
            <View className="flex-1 bg-card rounded-xl p-3 items-center">
              <Text className="text-foreground text-lg" style={{ fontFamily: "Outfit-Bold" }}>
                {sellerStats.totalSales}
              </Text>
              <Text className="text-muted text-xs" style={{ fontFamily: "Outfit" }}>
                Sales
              </Text>
            </View>
            <View className="flex-1 bg-card rounded-xl p-3 items-center">
              <Text className="text-foreground text-lg" style={{ fontFamily: "Outfit-Bold" }}>
                {sellerStats.sellerRating}
              </Text>
              <Text className="text-muted text-xs" style={{ fontFamily: "Outfit" }}>
                Rating
              </Text>
            </View>
            <View className="flex-1 bg-card rounded-xl p-3 items-center">
              <Text className="text-foreground text-lg" style={{ fontFamily: "Outfit-Bold" }}>
                {sellerStats.completionRate}%
              </Text>
              <Text className="text-muted text-xs" style={{ fontFamily: "Outfit" }}>
                Completion
              </Text>
            </View>
          </View>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <View key={section.title} className="mb-4">
            <Text
              className="text-muted text-xs tracking-widest uppercase px-5 mb-2"
              style={{ fontFamily: "Outfit-SemiBold" }}
            >
              {section.title}
            </Text>
            <View className="bg-card mx-5 rounded-2xl overflow-hidden">
              {section.items.map((item, idx) => (
                <Pressable
                  key={item.label}
                  onPress={() => {
                    haptics.light();
                    router.push(item.route as any);
                  }}
                  className={`flex-row items-center px-4 py-3.5 active:bg-card-hover ${
                    idx < section.items.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <item.icon size={20} color="#E8883A" />
                  <Text
                    className="text-foreground text-base flex-1 ml-3"
                    style={{ fontFamily: "Outfit" }}
                  >
                    {item.label}
                  </Text>
                  {item.value && (
                    <Text className="text-muted text-sm mr-2" style={{ fontFamily: "Outfit" }}>
                      {item.value}
                    </Text>
                  )}
                  <ChevronRight size={18} color="#7A7A8A" />
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <Pressable
          onPress={() => {
            haptics.medium();
            logout();
          }}
          className="flex-row items-center justify-center mx-5 mb-8 py-3 bg-card rounded-2xl"
        >
          <LogOut size={20} color="#FF4757" />
          <Text className="text-error text-base ml-2" style={{ fontFamily: "Outfit-Medium" }}>
            Sign Out
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
