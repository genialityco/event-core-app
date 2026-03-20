import React, { useEffect, useState } from "react";
import { ThemeProvider, DefaultTheme } from "@react-navigation/native";
import { Stack } from "expo-router";
import { PaperProvider } from "react-native-paper";
import theme from "@/theme";
import { AuthProvider } from "@/context/AuthContext";
import { TenantProvider } from "@/context/TenantContext";
import { EventProvider } from "@/context/EventContext";
import { FeatureFlagProvider } from "@/context/FeatureFlagContext";
import { NotificationsProvider } from "@/context/NotificationsContext";
import { initI18n } from "@/src/i18n";

export default function RootLayout() {
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    initI18n().then(() => setI18nReady(true));
  }, []);

  if (!i18nReady) return null;

  return (
    <TenantProvider>
      <EventProvider>
      <AuthProvider>
        <FeatureFlagProvider>
          <NotificationsProvider>
            <PaperProvider theme={theme}>
              <ThemeProvider value={DefaultTheme}>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(app)" />
                  <Stack.Screen name="login" />
                </Stack>
              </ThemeProvider>
            </PaperProvider>
          </NotificationsProvider>
        </FeatureFlagProvider>
      </AuthProvider>
      </EventProvider>
    </TenantProvider>
  );
}
