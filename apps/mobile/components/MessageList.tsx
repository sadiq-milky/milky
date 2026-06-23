import { useRef } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { ChatMessage } from "../lib/types";

type Props = {
  messages: ChatMessage[];
  isLoading: boolean;
};

export function MessageList({ messages, isLoading }: Props) {
  const scrollRef = useRef<ScrollView>(null);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.messages}
      contentContainerStyle={styles.messagesContent}
      onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
    >
      {messages.length === 0 && (
        <Text style={styles.emptyHint}>Send a message to start talking to Milky.</Text>
      )}
      {messages.map((m, i) => (
        <View
          key={i}
          style={[styles.bubble, m.role === "user" ? styles.userBubble : styles.aiBubble]}
        >
          <Text style={m.role === "user" ? styles.userText : styles.aiText}>
            {m.text || (isLoading && i === messages.length - 1 ? "…" : "")}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  messages: { flex: 1 },
  messagesContent: { padding: 16, gap: 10 },
  emptyHint: { textAlign: "center", color: "#bbb", marginTop: 40, fontSize: 14 },
  bubble: { maxWidth: "80%", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  userBubble: { alignSelf: "flex-end", backgroundColor: "#6366f1" },
  aiBubble: { alignSelf: "flex-start", backgroundColor: "#f3f4f6" },
  userText: { color: "#fff", fontSize: 15 },
  aiText: { color: "#111", fontSize: 15 },
});
