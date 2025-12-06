import React from "react";
import {
  View,
  Text,
  StyleProp,
  ViewStyle,
  ImageStyle,
  TextStyle,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

interface appAdminDashBoardProps {
  styleOfThePage: {
    container: StyleProp<ViewStyle>;
    header: StyleProp<ViewStyle>;
    icon: StyleProp<ImageStyle>;
    username: StyleProp<TextStyle>;
    role: StyleProp<TextStyle>;
    screen: StyleProp<ViewStyle>;
    text: StyleProp<TextStyle>;
  };
}

export default function AppAdminDashboardPage({
  styleOfThePage,
}: appAdminDashBoardProps) {
  const navigation = useNavigation();

  // Mock counts (replace with real data later)
  const businessRequests = 2;
  const feedbackCount = 4;

  const mockActivity = [12, 24, 18, 30, 22, 16, 28, 20, 26]; // hourly-ish mock data

  return (
    <View style={styleOfThePage.screen}>
      <Text style={[styleOfThePage.text, { marginBottom: 12 }]}>
        Welcome to Your Dashboard!
      </Text>

      <View style={localStyles.cardRow}>
        <TouchableOpacity
          style={localStyles.card}
          onPress={() => navigation.navigate("UserManagement" as never)}
        >
          <Text style={localStyles.cardTitle}>Business Requests</Text>
          <Text style={localStyles.cardCount}>{businessRequests}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={localStyles.card}
          onPress={() => navigation.navigate("Feedback" as never)}
        >
          <Text style={localStyles.cardTitle}>Feedback Messages</Text>
          <Text style={localStyles.cardCount}>{feedbackCount}</Text>
        </TouchableOpacity>
      </View>

      <View style={localStyles.chartContainer}>
        <Text style={localStyles.chartTitle}>App Activity (Today)</Text>
        <View style={localStyles.chartRow}>
          {mockActivity.map((v, i) => (
            <View key={i} style={localStyles.barWrap}>
              <View style={[localStyles.bar, { height: Math.max(4, v) }]} />
              <Text style={localStyles.barLabel}>{i}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 16,
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 6,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  cardCount: { fontSize: 28, fontWeight: "700", color: "#111" },
  chartContainer: {
    width: "100%",
    marginTop: 8,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  chartTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  chartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 120,
    paddingBottom: 6,
  },
  barWrap: { flex: 1, alignItems: "center" },
  bar: { width: 10, backgroundColor: "#4f46e5", borderRadius: 4 },
  barLabel: { fontSize: 10, color: "#666", marginTop: 6 },
});
