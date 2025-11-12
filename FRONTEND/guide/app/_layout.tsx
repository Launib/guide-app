import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Onboarding from "./components/onboarding";
import AuthPage from "./components/auth-page";

export default function RootLayout() {
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      AsyncStorage.getItem("hasSeenOnboarding"),
      AsyncStorage.getItem("userToken"),
    ])
      .then(([onboarded, userToken]) => {
        if (!mounted) return;
        setNeedsOnboarding(onboarded !== "true");
        setIsAuthenticated(!!userToken);
      })
      .catch(() => {
        if (!mounted) return;
        setNeedsOnboarding(true);
        setIsAuthenticated(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (needsOnboarding === null) {
    // still loading flags; render a simple loading placeholder to avoid a blank screen
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 12, color: "#666" }}>Loading…</Text>
      </View>
    );
  }

  if (needsOnboarding) {
    return <Onboarding onDone={() => setNeedsOnboarding(false)} />;
  }

  if (!isAuthenticated) {
    return (
      <AuthPage
        onAuthSuccess={() => {
          // Reload the app state after successful auth
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return <Stack />;
}
