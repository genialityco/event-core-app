import React, { useEffect } from "react";
import { ImageBackground, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export default function SplashScreen() {
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoggedIn) {
        router.replace("/(app)/(tabs)/home");
      } else {
        router.replace("/welcome");
      }
    }, 5000); // 3 segundos de delay

    return () => clearTimeout(timer);
  }, [isLoggedIn]);

  return (
    <ImageBackground
      source={require("../assets/icons/APP-CUMBRE_SPLASH.png")}
      style={styles.background}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
});
