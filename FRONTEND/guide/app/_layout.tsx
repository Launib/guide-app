import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Onboarding from "./components/onboarding";
import AuthPage from "./components/auth-page";

//new:
import AdminView from "./components/appAdmin-page";

export default function RootLayout() {
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  //new:
  const [userRole, setUserRole] = useState<string | null>(null); //this could be used for the admin, business user, reg user, etc.
  const [username, setUsername] = useState<string | null>(null);

  // DEV MODE: Set to true to show onboarding every time you open the app for testing
  const FORCE_SHOW_ONBOARDING = false;

  useEffect(() => {
    let mounted = true;

    const readFlags = async () => {
      try {
        const [onboarded, authToken, userToken, type, name] = await Promise.all(
          [
            AsyncStorage.getItem("hasSeenOnboarding"),
            AsyncStorage.getItem("authToken"),
            AsyncStorage.getItem("userToken"),
            AsyncStorage.getItem("userRole"),
            AsyncStorage.getItem("username"),
          ]
        );
        if (!mounted) return;
        setNeedsOnboarding(FORCE_SHOW_ONBOARDING || onboarded !== "true");
        setIsAuthenticated(!!(authToken || userToken));
        setUserRole(type ?? null);
        setUsername(name ?? null);
      } catch (err) {
        if (!mounted) return;
        setNeedsOnboarding(true);
        setIsAuthenticated(false);
        setUserRole(null);
        setUsername(null);
      }
    };

    // Initial read
    readFlags();

    // Poll briefly so that changes made by other screens (logout, settings) are noticed
    const interval = setInterval(readFlags, 800);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [FORCE_SHOW_ONBOARDING]);

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

  // Render admin view when role contains 'admin' and we have a username
  if (userRole && username) {
    const normalized = (userRole || "").toString().toLowerCase();
    if (normalized.includes("admin")) {
      return <AdminView userName={username} UserRole={userRole} />;
    }
  }

  return <Stack />;
}
