import React from "react";
import { View, Image, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useBrandedColors } from "@/src/theme";

export const AppHeader: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const bc = useBrandedColors();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, borderBottomColor: bc.primary },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.logoSlot}>
          <Image
            source={require("@/assets/icons/LOGO_AIL_HEADER.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.logoSlot}>
          <Image
            source={require("@/assets/icons/LOGO_CUMBRE_HEADER.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Pressable
          onPress={() => router.push("/(app)/(tabs)/settings")}
          style={styles.settingsButton}
          hitSlop={8}
        >
          <Ionicons name="settings-outline" size={24} color={bc.primary} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 20,
    borderBottomWidth: 2,
  },
  content: {
    height: 120,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  logoSlot: {
    flex: 1,
    height: 100,
    justifyContent: "flex-end",
    alignItems: "center",
  },

  logo: {
    width: "100%",
    height: "90%",
  },
  divider: {
    width: 1,
    height: 70,
    backgroundColor: "#6e6e6e",
  },
  settingsButton: {
    padding: 4,
  },
});
