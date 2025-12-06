import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import AppAdminDashboardPage from "./appAdmin/appAdminDashBoard";
import AppAdminSettingsPage from "./appAdmin/appAdminSettingsPage";
import UserManagementPage from "./appAdmin/userManagementPage";
import FeedbackPage from "./appAdmin/feedbackPage";
import { Ionicons } from "@expo/vector-icons";

// The inputs for AppAdmin
interface inputsForAppAdmin {
  userName: string;
  UserRole?: string;
}

// The style  for the AppAdmin Dashboard tab on the page
function AppAdminDashboard() {
  return <AppAdminDashboardPage styleOfThePage={styleOfThePage} />;
}

// The style for the AppAdmin Settings tab on the page
function AppAdminSettings() {
  return <AppAdminSettingsPage styleOfThePage={styleOfThePage} />;
}

// Info used to create the nav bar
const AppAdminTabs = createBottomTabNavigator();

// This is the App Admin Page(the main page that the user will see)
export default function AdminView({ userName, UserRole }: inputsForAppAdmin) {
  const router = useRouter();
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  // Load profile photo from AsyncStorage when component mounts
  useEffect(() => {
    const loadProfilePhoto = async () => {
      try {
        const savedPhoto = await AsyncStorage.getItem("userProfilePhoto");
        if (savedPhoto) {
          setProfilePhoto(savedPhoto);
        }
      } catch (err) {
        console.error("Error loading profile photo:", err);
      }
    };
    loadProfilePhoto();

    // Optionally set up a listener to refresh when returning to Settings
    const interval = setInterval(loadProfilePhoto, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", onPress: () => {} },
      {
        text: "Logout",
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove([
              "authToken",
              "userToken",
              "authUser",
              "username",
              "userRole",
              "userProfilePhoto",
            ]);
            // Also clear onboarding flag to show onboarding again
            await AsyncStorage.removeItem("hasSeenOnboarding");
            // Force hard reload by using navigation stack reset
            // This will trigger _layout.tsx to re-evaluate authentication state
            router.replace("/");
          } catch (e) {
            console.error("Logout error:", e);
            Alert.alert("Error", "Failed to log out.");
          }
        },
      },
    ]);
  };

  return (
    <View style={styleOfThePage.container}>
      {/* this info shows how the icon, the username, and their userRole is showed on the page*/}
      <View style={styleOfThePage.header}>
        {profilePhoto ? (
          <Image source={{ uri: profilePhoto }} style={styleOfThePage.icon} />
        ) : (
          <Image
            source={{ uri: "https://via.placeholder.com/50" }}
            style={styleOfThePage.icon}
          />
        )}
        <View style={{ flex: 1 }}>
          <Text style={styleOfThePage.username}>{userName}</Text>
          {UserRole && <Text style={styleOfThePage.role}>{UserRole}</Text>}
        </View>
        <TouchableOpacity
          onPress={handleLogout}
          style={styleOfThePage.logoutButton}
        >
          <Text style={styleOfThePage.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Info relating to the nav Bar */}
      <AppAdminTabs.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#2563eb",
          tabBarInactiveTintColor: "#6b7280",
        }}
      >
        <AppAdminTabs.Screen
          name="Dashboard"
          component={AppAdminDashboard}
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />

        {/* Make UserManagement a visible tab so it's reachable from the bottom nav */}
        <AppAdminTabs.Screen
          name="UserManagement"
          component={UserManagementPage}
          options={{
            title: "Users",
            tabBarLabel: "Users",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people-outline" size={size} color={color} />
            ),
          }}
        />

        <AppAdminTabs.Screen
          name="Feedback"
          component={FeedbackPage}
          options={{
            title: "Feedback",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="chatbubbles-outline" size={size} color={color} />
            ),
          }}
        />

        <AppAdminTabs.Screen
          name="Settings"
          component={AppAdminSettings}
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />
      </AppAdminTabs.Navigator>
    </View>
  );
}

// The Different Styles for the Admin Page:
const styleOfThePage = StyleSheet.create({
  container: { flex: 1 },
  header: {
    marginTop: 40,
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    backgroundColor: "#f8f8f8",
  },
  icon: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  username: { fontSize: 18, fontWeight: "600" },
  role: { fontSize: 14, color: "#666" },
  screen: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 22 },
  logoutButton: {
    backgroundColor: "#ff4444",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 12,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
