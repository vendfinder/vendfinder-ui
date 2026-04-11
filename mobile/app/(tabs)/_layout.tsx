import { Tabs } from "expo-router";
import { View, Text, Pressable } from "react-native";
import { Home, Search, ShoppingCart, User } from "lucide-react-native";
import { useCart } from "@/context/CartContext";
import { useHaptics } from "@/hooks/useHaptics";

export default function TabLayout() {
  const { totalItems } = useCart();
  const haptics = useHaptics();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#14141B",
          borderTopColor: "#2A2A38",
          borderTopWidth: 1,
          height: 88,
          paddingTop: 8,
          paddingBottom: 28,
        },
        tabBarActiveTintColor: "#E8883A",
        tabBarInactiveTintColor: "#7A7A8A",
        tabBarLabelStyle: {
          fontFamily: "Outfit-Medium",
          fontSize: 11,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
        listeners={{
          tabPress: () => haptics.selection(),
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: "Browse",
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
        listeners={{
          tabPress: () => haptics.selection(),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color, size }) => (
            <View>
              <ShoppingCart size={size} color={color} />
              {totalItems > 0 && (
                <View className="absolute -top-1 -right-2 bg-primary rounded-full w-5 h-5 items-center justify-center">
                  <Text
                    className="text-background text-[10px]"
                    style={{ fontFamily: "Outfit-Bold" }}
                  >
                    {totalItems > 9 ? "9+" : totalItems}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
        listeners={{
          tabPress: () => haptics.selection(),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: "Me",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
        listeners={{
          tabPress: () => haptics.selection(),
        }}
      />
    </Tabs>
  );
}
