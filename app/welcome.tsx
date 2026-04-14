import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { clientConfig } from "@/clients";
import { useBrandedColors } from "@/src/theme";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

export default function WelcomeScreen() {
  const bc = useBrandedColors();
  const { t } = useTranslation();

  return (
    <ImageBackground
      source={require("../assets/icons/APP-CUMBRE_SPLASH-REGISTRO.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>{clientConfig.name}</Text>
          <Text style={styles.title}>{t("welcome.title")}</Text>
          <Text style={styles.subtitle}>{t("welcome.subtitle")}</Text>
        </View>

        {/* Cards */}
        <View style={styles.cards}>
          {/* Card Ingresar */}
          <TouchableOpacity
            style={[styles.card, { borderColor: bc.primary }]}
            onPress={() => router.push("/login")}
            activeOpacity={0.85}
          >
            <View style={[styles.iconCircle, { backgroundColor: bc.primary }]}>
              <Ionicons name="log-in-outline" size={32} color="#fff" />
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: bc.primary }]}>
                {t("welcome.signIn")}
              </Text>
              <Text style={styles.cardSub}>{t("welcome.signInSub")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={bc.primary} />
          </TouchableOpacity>

          {/* Card Registrarse */}
          <TouchableOpacity
            style={[styles.card, { borderColor: bc.primary }]}
            onPress={() => router.push("/register")}
            activeOpacity={0.85}
          >
            <View style={[styles.iconCircle, { backgroundColor: bc.primary }]}>
              <Ionicons name="person-add-outline" size={32} color="#fff" />
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: bc.primary }]}>
                {t("welcome.signUp")}
              </Text>
              <Text style={styles.cardSub}>{t("welcome.signUpSub")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={bc.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 40,
  },
  header: {
    alignItems: "center",
    gap: 8,
  },
  appName: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  cards: {
    gap: 16,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.93)",
    borderRadius: 16,
    borderWidth: 2,
    paddingVertical: 24,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  cardSub: {
    fontSize: 13,
    color: "#777",
  },
});
