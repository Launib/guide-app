import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TabKey = "info" | "coupons" | "contact";

const screenW = Dimensions.get("window").width;

export default function BusinessPage({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<TabKey>("info");

  const isBusinessUser = true;

  const business = useMemo(
    () => ({
      name: "The Coffee House",
      category: "Gourmet coffee and pastries",
      city: "San Francisco, CA",
      about:
        "The Coffee House is a cozy cafe dedicated to serving the finest artisanal coffee and freshly baked pastries. We believe in quality, community, and a perfect cup of coffee to start your day.",
      logo:
        "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=256&q=60",
      banner:
        "https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=1200&q=60",
      locations: [
        {
          id: "1",
          name: "Downtown Branch",
          address: "123 Market St, San Francisco, CA 94103",
          map:
            "https://maps.googleapis.com/maps/api/staticmap?center=San%20Francisco&zoom=12&size=600x300",
        },
        {
          id: "2",
          name: "Oakland Cafe",
          address: "456 Broadway, Oakland, CA 94607",
          map:
            "https://maps.googleapis.com/maps/api/staticmap?center=Oakland&zoom=12&size=600x300",
        },
      ],
      hours: [
        { day: "Monday - Friday", time: "7:00 AM - 7:00 PM" },
        { day: "Saturday", time: "8:00 AM - 6:00 PM" },
        { day: "Sunday", time: "8:00 AM - 5:00 PM" },
      ],
    }),
    []
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <Text style={styles.icon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Business Profile</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Text style={styles.icon}>⋮</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.infoRow}>
          <Image source={{ uri: business.logo }} style={styles.logo} />

          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{business.name}</Text>
            <Text style={styles.sub}>{business.category}</Text>
            <Text style={styles.sub}>{business.city}</Text>
          </View>

          {isBusinessUser && (
            <TouchableOpacity style={styles.editBtn} onPress={() => { }}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>


        <Image source={{ uri: business.banner }} style={styles.banner} />

        <Text style={styles.about}>{business.about}</Text>

        <View style={styles.tabs}>
          {["info", "coupons", "contact"].map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t as TabKey)}
              style={[
                styles.tab,
                tab === t && styles.tabActive,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  tab === t && styles.tabTextActive,
                ]}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === "info" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Locations</Text>

            {business.locations.map((l) => (
              <View key={l.id} style={styles.card}>
                <Image source={{ uri: l.map }} style={styles.map} />
                <View style={styles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.locName}>{l.name}</Text>
                    <Text style={styles.locAddr}>{l.address}</Text>
                  </View>
                  <TouchableOpacity style={styles.cta}>
                    <Text style={styles.ctaText}>Get Directions</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
              Hours
            </Text>

            <View style={styles.hours}>
              {business.hours.map((h) => (
                <View key={h.day} style={styles.hoursRow}>
                  <Text style={styles.day}>{h.day}</Text>
                  <Text style={styles.time}>{h.time}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  icon: { fontSize: 18 },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },

  infoRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    padding: 16,
    alignItems: "center",
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#ddd",
  },
  name: { fontSize: 20, fontWeight: "800" },
  sub: { color: "#666", marginTop: 2 },

  banner: {
    width: screenW - 32,
    height: 180,
    marginHorizontal: 16,
    borderRadius: 14,
  },

  editBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#111",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },

  editBtnText: {
    color: "#fff",
    fontWeight: "600",
  },

  about: {
    padding: 16,
    color: "#444",
    lineHeight: 20,
  },

  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tab: {
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: "#111" },
  tabText: { color: "#777", fontWeight: "600" },
  tabTextActive: { color: "#111" },

  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: 10 },

  card: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 16,
  },
  map: { height: 130, width: "100%" },
  cardRow: {
    flexDirection: "row",
    padding: 12,
    alignItems: "center",
    gap: 12,
  },
  locName: { fontWeight: "800" },
  locAddr: { color: "#666", marginTop: 2 },

  cta: {
    backgroundColor: "#0b1b2e",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 12 },

  hours: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 14,
    padding: 12,
  },
  hoursRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  day: { color: "#444" },
  time: { fontWeight: "700" },
});
