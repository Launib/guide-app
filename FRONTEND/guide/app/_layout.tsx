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
  const [userRole, setUserRole]= useState<string | null >(null); //this could be used for the admin, business user, reg user, etc. 
  const [username, setUsername]= useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      AsyncStorage.getItem("hasSeenOnboarding"),
      AsyncStorage.getItem("userToken"),

      //new:
      AsyncStorage.getItem("userRole"), 
      AsyncStorage.getItem("username"),

    ])
    //new: added "type" and "name" to this: 
      .then(([onboarded, userToken, type, name]) => {
        if (!mounted) return;
        setNeedsOnboarding(onboarded !== "true");
        setIsAuthenticated(!!userToken);

        //new:
        setUserRole(type ?? null);
        setUsername(name ?? null);
      })
      .catch(() => {
        if (!mounted) return;
        setNeedsOnboarding(true);
        setIsAuthenticated(false);

        //new:
        setUserRole(null);
        setUsername(null);
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

  //new: (would need to do this for other users in the future:)
  if(userRole === "App Admin" && username){
    return <AdminView userName= {username} UserRole = " App Admin" />;
  }

  return <Stack />;
}
