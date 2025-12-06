import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Mock feedback data structure
interface Feedback {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  subject: string;
  message: string;
  status: "pending" | "viewed" | "replied";
  reply?: string;
}

const mockFeedbackData: Feedback[] = [
  {
    id: "1",
    username: "john_doe",
    firstName: "John",
    lastName: "Doe",
    subject: "Issue with payment processing",
    message:
      "I tried to complete my transaction but the payment gateway keeps failing. Please help me resolve this issue. I have tried multiple times and even switched payment methods, but the error persists.",
    status: "pending",
  },
  {
    id: "2",
    username: "jane_smith",
    firstName: "Jane",
    lastName: "Smith",
    subject: "Feature request: Dark mode",
    message:
      "It would be great to have a dark mode option in the app. Many users prefer dark interfaces, especially during evening use.",
    status: "viewed",
  },
  {
    id: "3",
    username: "bob_wilson",
    firstName: "Bob",
    lastName: "Wilson",
    subject: "Account not syncing across devices",
    message:
      "My account data is not syncing properly between my phone and tablet. I updated my profile on the phone, but the changes are not reflected on the tablet.",
    status: "replied",
    reply:
      "Thank you for reporting this issue. We've identified the sync problem and have released a fix in the latest update. Please reinstall the app.",
  },
  {
    id: "4",
    username: "Lily_Anderson",
    firstName: "Lily",
    lastName: "Anderson",
    subject: "Cant update my location",
    message:
      "I tried to update my location in the app, but it keeps reverting back to the old one. I've checked my device settings and everything seems fine.",
    status: "pending",
  },
];

export default function FeedbackPage() {
  const [feedbackList, setFeedbackList] =
    useState<Feedback[]>(mockFeedbackData);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(
    null
  );
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isReplyMode, setIsReplyMode] = useState(false);
  const [replyText, setReplyText] = useState("");

  const handleFeedbackPress = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setIsModalVisible(true);

    // Mark as viewed if not already
    if (feedback.status === "pending") {
      setFeedbackList((prevList) =>
        prevList.map((fb) =>
          fb.id === feedback.id ? { ...fb, status: "viewed" } : fb
        )
      );
      feedback.status = "viewed";
    }
  };

  const handleReply = () => {
    if (!replyText.trim() || !selectedFeedback) return;

    // Update feedback with reply
    setFeedbackList((prevList) =>
      prevList.map((fb) =>
        fb.id === selectedFeedback.id
          ? { ...fb, status: "replied", reply: replyText }
          : fb
      )
    );

    // Update selected feedback
    setSelectedFeedback({
      ...selectedFeedback,
      status: "replied",
      reply: replyText,
    });

    setIsReplyMode(false);
    setReplyText("");
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setIsReplyMode(false);
    setReplyText("");
    setSelectedFeedback(null);
  };

  const getStatusColor = (status: "pending" | "viewed" | "replied") => {
    switch (status) {
      case "pending":
        return "#f59e0b"; // Amber
      case "viewed":
        return "#6b7280"; // Gray
      case "replied":
        return "#10b981"; // Green
      default:
        return "#6b7280";
    }
  };

  const getStatusLabel = (status: "pending" | "viewed" | "replied") => {
    switch (status) {
      case "pending":
        return "New";
      case "viewed":
        return "Viewed";
      case "replied":
        return "Replied";
      default:
        return "New";
    }
  };

  const renderFeedbackCard = ({ item }: { item: Feedback }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleFeedbackPress(item)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.subject}>{item.subject}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Feedback</Text>
        <Text style={styles.subtitle}>{feedbackList.length} messages</Text>
      </View>

      <FlatList
        data={feedbackList}
        keyExtractor={(item) => item.id}
        renderItem={renderFeedbackCard}
        contentContainerStyle={styles.listContent}
        scrollEnabled
      />

      {/* Feedback Detail Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={handleCloseModal}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Message Details</Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {selectedFeedback && (
              <>
                {/* Sender Info */}
                <View style={styles.senderInfo}>
                  <Text style={styles.label}>From:</Text>
                  <Text style={styles.senderName}>
                    {selectedFeedback.firstName} {selectedFeedback.lastName}
                  </Text>
                  <Text style={styles.username}>
                    @{selectedFeedback.username}
                  </Text>
                </View>

                {/* Subject */}
                <View style={styles.section}>
                  <Text style={styles.label}>Subject:</Text>
                  <Text style={styles.subject}>{selectedFeedback.subject}</Text>
                </View>

                {/* Message */}
                <View style={styles.section}>
                  <Text style={styles.label}>Message:</Text>
                  <View style={styles.messageBox}>
                    <Text style={styles.messageText}>
                      {selectedFeedback.message}
                    </Text>
                  </View>
                </View>

                {/* Status Badge */}
                <View style={styles.section}>
                  <View
                    style={[
                      styles.statusBadgeLarge,
                      {
                        backgroundColor: getStatusColor(
                          selectedFeedback.status
                        ),
                      },
                    ]}
                  >
                    <Text style={styles.statusTextLarge}>
                      {getStatusLabel(selectedFeedback.status)}
                    </Text>
                  </View>
                </View>

                {/* Reply Section */}
                {selectedFeedback.reply && (
                  <View style={styles.section}>
                    <Text style={styles.label}>Your Reply:</Text>
                    <View style={styles.replyBox}>
                      <Text style={styles.replyText}>
                        {selectedFeedback.reply}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Reply Input (only show in reply mode) */}
                {isReplyMode && !selectedFeedback.reply && (
                  <View style={styles.section}>
                    <Text style={styles.label}>Type Your Reply:</Text>
                    <TextInput
                      style={styles.replyInput}
                      placeholder="Enter your reply message..."
                      placeholderTextColor="#999"
                      multiline
                      numberOfLines={4}
                      value={replyText}
                      onChangeText={setReplyText}
                    />
                  </View>
                )}

                {/* Buttons */}
                <View style={styles.buttonRow}>
                  {isReplyMode && !selectedFeedback.reply ? (
                    <>
                      <TouchableOpacity
                        style={[styles.btn, styles.cancelBtn]}
                        onPress={() => {
                          setIsReplyMode(false);
                          setReplyText("");
                        }}
                      >
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.btn,
                          styles.sendBtn,
                          !replyText.trim() && styles.disabledBtn,
                        ]}
                        onPress={handleReply}
                        disabled={!replyText.trim()}
                      >
                        <Text style={styles.sendBtnText}>Done</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={[styles.btn, styles.cancelBtn]}
                        onPress={handleCloseModal}
                      >
                        <Text style={styles.cancelBtnText}>Close</Text>
                      </TouchableOpacity>
                      {!selectedFeedback.reply && (
                        <TouchableOpacity
                          style={[styles.btn, styles.replyBtn]}
                          onPress={() => setIsReplyMode(true)}
                        >
                          <Text style={styles.replyBtnText}>Reply</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#666" },
  listContent: { paddingHorizontal: 12, paddingVertical: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#2563eb",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardLeft: { flex: 1, marginRight: 12 },
  username: { fontSize: 14, fontWeight: "600", color: "#333" },
  subject: { fontSize: 16, fontWeight: "700", marginTop: 4, color: "#111" },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: { color: "#fff", fontWeight: "600", fontSize: 12 },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  closeBtn: { width: 28, justifyContent: "center" },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalContent: { flex: 1, paddingHorizontal: 16, paddingVertical: 16 },
  senderInfo: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: "600", color: "#666", marginBottom: 4 },
  senderName: { fontSize: 16, fontWeight: "700", color: "#111" },
  section: { marginBottom: 20 },
  messageBox: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 12,
    marginTop: 6,
  },
  messageText: { fontSize: 14, color: "#333", lineHeight: 20 },
  statusBadgeLarge: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusTextLarge: { color: "#fff", fontWeight: "700", fontSize: 13 },
  replyBox: {
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    padding: 12,
    marginTop: 6,
    borderLeftWidth: 4,
    borderLeftColor: "#2563eb",
  },
  replyText: { fontSize: 14, color: "#333", lineHeight: 20 },
  replyInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    marginTop: 6,
    fontSize: 14,
    color: "#333",
    textAlignVertical: "top",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 24,
  },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  cancelBtn: { backgroundColor: "#e5e7eb" },
  cancelBtnText: { color: "#333", fontWeight: "600" },
  sendBtn: { backgroundColor: "#2563eb" },
  sendBtnText: { color: "#fff", fontWeight: "600" },
  replyBtn: { backgroundColor: "#10b981" },
  replyBtnText: { color: "#fff", fontWeight: "600" },
  disabledBtn: { backgroundColor: "#d1d5db", opacity: 0.6 },
});
