import React, { useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

type Slide = {
  key: string;
  title: string;
  subtitle?: string;
  backgroundColor?: string;
};

const slides: Slide[] = [
  {
    key: "one",
    title: "Welcome to Guide",
    subtitle: "Quickly find curated tutorials and tips.",
    backgroundColor: "#6C63FF",
  },
  {
    key: "two",
    title: "Track Progress",
    subtitle: "Save your place and pick up where you left off.",
    backgroundColor: "#00C2A8",
  },
  {
    key: "three",
    title: "Get Started",
    subtitle: "Explore the app and enjoy learning!",
    backgroundColor: "#FF7A7A",
  },
];

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const scrollRef = useRef<ScrollView | null>(null);
  const [index, setIndex] = useState(0);

  const handleScroll = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / width);
    setIndex(i);
  };

  const goNext = async () => {
    if (index < slides.length - 1) {
      scrollRef.current?.scrollTo({ x: (index + 1) * width, animated: true });
    } else {
      await AsyncStorage.setItem("hasSeenOnboarding", "true");
      onDone();
    }
  };

  const skip = async () => {
    await AsyncStorage.setItem("hasSeenOnboarding", "true");
    onDone();
  };

  return (
    <View style={styles.container}>
      <View style={styles.skipRow} pointerEvents="box-none">
        <TouchableOpacity
          onPress={skip}
          style={styles.skipButton}
          hitSlop={{ top: 16, left: 16, right: 16, bottom: 16 }}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ref={(r) => {
          // assign to ref without returning value to satisfy TS callback ref type
          scrollRef.current = r;
        }}
      >
        {slides.map((s) => (
          <View
            key={s.key}
            style={[
              styles.slide,
              { backgroundColor: s.backgroundColor || "#333" },
            ]}
          >
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.subtitle}>{s.subtitle}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === index ? styles.dotActive : undefined]}
            />
          ))}
        </View>

        <TouchableOpacity onPress={goNext} style={styles.nextButton}>
          <Text style={styles.nextText}>
            {index === slides.length - 1 ? "Get started" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  skipRow: {
    position: "absolute",
    top: Platform.OS === "android" ? 48 : 40,
    right: 16,
    zIndex: 999,
    alignItems: "flex-end",
    padding: 8,
  },
  skipButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 8,
  },
  skipText: { color: "#555" },
  slide: {
    width,
    height: "70%",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: { color: "#fff", fontSize: 16, marginTop: 12, textAlign: "center" },
  footer: {
    height: "30%",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 24,
  },
  dots: { flexDirection: "row", alignItems: "center" },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ddd",
    marginHorizontal: 6,
  },
  dotActive: { backgroundColor: "#333", width: 14 },
  nextButton: {
    backgroundColor: "#111",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  nextText: { color: "#fff", fontWeight: "600" },
});
