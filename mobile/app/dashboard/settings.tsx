import { View, Text, ScrollView, Pressable, Switch, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Bell, Shield, Moon, Globe, HelpCircle, FileText, ChevronRight } from "lucide-react-native";
import { useState } from "react";
import { useHaptics } from "@/hooks/useHaptics";

export default function SettingsScreen() {
  const router = useRouter();
  const haptics = useHaptics();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const sections = [
    {
      title: "Preferences",
      items: [
        {
          label: "Push Notifications",
          icon: Bell,
          toggle: true,
          value: notifications,
          onToggle: () => {
            haptics.selection();
            setNotifications(!notifications);
          },
        },
        {
          label: "Dark Mode",
          icon: Moon,
          toggle: true,
          value: darkMode,
          onToggle: () => {
            haptics.selection();
            Alert.alert("VendFinder", "Dark mode is the only option on VendFinder.");
          },
        },
      ],
    },
    {
      title: "More",
      items: [
        { label: "Privacy Policy", icon: Shield },
        { label: "Terms of Service", icon: FileText },
        { label: "Help Center", icon: HelpCircle },
        { label: "Language", icon: Globe, value: "English" },
      ],
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center px-5 py-3 gap-3">
        <Pressable onPress={() => router.back()} className="w-10 h-10 bg-card rounded-full items-center justify-center">
          <ArrowLeft size={20} color="#EEEAE4" />
        </Pressable>
        <Text className="text-foreground text-xl" style={{ fontFamily: "Outfit-Bold" }}>
          Settings
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {sections.map((section) => (
          <View key={section.title} className="mb-6">
            <Text className="text-muted text-xs tracking-widest uppercase px-5 mb-2" style={{ fontFamily: "Outfit-SemiBold" }}>
              {section.title}
            </Text>
            <View className="bg-card mx-5 rounded-2xl overflow-hidden">
              {section.items.map((item, idx) => (
                <View
                  key={item.label}
                  className={`flex-row items-center px-4 py-3.5 ${
                    idx < section.items.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <item.icon size={20} color="#E8883A" />
                  <Text className="text-foreground text-base flex-1 ml-3" style={{ fontFamily: "Outfit" }}>
                    {item.label}
                  </Text>
                  {item.toggle ? (
                    <Switch
                      value={item.value}
                      onValueChange={item.onToggle}
                      trackColor={{ false: "#2A2A38", true: "#E8883A" }}
                      thumbColor="#EEEAE4"
                    />
                  ) : (
                    <>
                      {item.value && (
                        <Text className="text-muted text-sm mr-2" style={{ fontFamily: "Outfit" }}>
                          {item.value}
                        </Text>
                      )}
                      <ChevronRight size={18} color="#7A7A8A" />
                    </>
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        <View className="items-center py-4">
          <Text className="text-muted text-xs" style={{ fontFamily: "Outfit" }}>
            VendFinder v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
