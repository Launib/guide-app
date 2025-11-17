import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";


// The inputs for AppAdmin
interface inputsForAppAdmin {
  userName: string;
  UserRole?: string;
}

// The style  for the AppAdmin Dashboard tab on the page
function AppAdminDashboard() {
  return (
    <View style={styleOfThePage.screen}>
      <Text style={styleOfThePage.text}>Dashboard</Text>
    </View>
  );
}

// The style for the AppAdmin Settings tab on the page
function AppAdminSettings() {
  return (
    <View style={styleOfThePage.screen}>
      <Text style={styleOfThePage.text}>Settings Screen</Text>
    </View>
  );
}

// Info used to create the nav bar
const AppAdminTabs = createBottomTabNavigator();

// This is the App Admin Page(the main page that the user will see)
export default function AdminView({ userName, UserRole }: inputsForAppAdmin) {
  return (
    <View style={styleOfThePage.container}>
      {/* this info shows how the icon, the username, and their userRole is showed on the page*/}
      <View style={styleOfThePage.header}>
        <Image
          source={{ uri: "https://via.placeholder.com/50" }}
          style={styleOfThePage.icon}
        />
        <View>
          <Text style={styleOfThePage.username}>{userName}</Text>
          {UserRole && <Text style={styleOfThePage.role}>{UserRole}</Text>}
        </View>
      </View>

      {/* Info relating to the nav Bar */}
      <AppAdminTabs.Navigator screenOptions={{ headerShown: false }}>
        <AppAdminTabs.Screen name="Dashboard" component={AppAdminDashboard} />
        <AppAdminTabs.Screen name="Settings" component={AppAdminSettings} />
      </AppAdminTabs.Navigator>
    </View>
  );
}


// The Different Styles for the Admin Page: 
const styleOfThePage = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8f8f8",
  },
  icon: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  username: { fontSize: 18, fontWeight: "600" },
  role: { fontSize: 14, color: "#666" },
  screen: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 22 },
});
