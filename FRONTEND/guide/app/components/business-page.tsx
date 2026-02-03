import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

interface BusinessPageProps {
  userName: string;
  UserRole?: string;
}

export default function BusinessPage({ userName, UserRole }: BusinessPageProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const performLogout = async () => {
      try {
        await AsyncStorage.multiRemove([
          "authToken",
          "userToken",
          "authUser",
          "username",
          "userRole",
          "userProfilePhoto",
        ]);
        await AsyncStorage.removeItem("hasSeenOnboarding");
        router.replace("/");
      } catch (e) {
        console.error("Logout error:", e);
        Alert.alert("Error", "Failed to log out.");
      }
    };

    if (Platform.OS === "web") {
      performLogout();
    } else {
      Alert.alert("Logout", "Are you sure you want to log out?", [
        { text: "Cancel", onPress: () => {} },
        {
          text: "Logout",
          onPress: performLogout,
        },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.username}>{userName}</Text>
          {UserRole && <Text style={styles.role}>{UserRole}</Text>}
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Business Dashboard</Text>
        <Text style={styles.subtitle}>Welcome to your business account</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    marginTop: 40,
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    paddingHorizontal: 16,
    backgroundColor: "#f8f8f8",
    paddingBottom: 10,
  },
  username: {
    fontSize: 18,
    fontWeight: "600",
  },
  role: {
    fontSize: 14,
    color: "#666",
  },
  logoutButton: {
    backgroundColor: "#ff4444",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
});
