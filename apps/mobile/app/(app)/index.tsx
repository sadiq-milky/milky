import { useAuth } from "@clerk/expo";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ChatInput } from "../../components/ChatInput";
import { MessageList } from "../../components/MessageList";
import { sendChatMessage } from "../../lib/api";
import type { ChatMessage } from "../../lib/types";

export default function HomeScreen() {
  const { signOut, getToken } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();

  async function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");

    // Build the full conversation history in the format the API expects
    const apiMessages = [
      ...messages.map((m, i) => ({
        id: String(i + 1),
        role: m.role,
        parts: [{ type: "text" as const, text: m.text }],
      })),
      {
        id: String(messages.length + 1),
        role: "user" as const,
        parts: [{ type: "text" as const, text }],
      },
    ];

    // Show user message immediately, add empty assistant bubble for streaming
    setMessages((prev) => [
      ...prev,
      { id: String(prev.length + 1), role: "user", text },
      { id: String(prev.length + 2), role: "assistant", text: "" },
    ]);
    setIsLoading(true);

    try {
      const token = await getToken();
      const data = await sendChatMessage(apiMessages, conversationId, token);

      // Track the conversation so follow-up messages continue it
      if (data.conversationId) setConversationId(data.conversationId);

      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { ...next[next.length - 1], text: data.text || "…" };
        return next;
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { ...next[next.length - 1], text: `Error: ${msg}` };
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Milky</Text>
        <TouchableOpacity onPress={() => signOut()}>
          <Text style={styles.signOut}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <MessageList messages={messages} isLoading={isLoading} />

      <ChatInput
        value={input}
        onChangeText={setInput}
        onSend={handleSend}
        disabled={isLoading}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: { fontSize: 20, fontWeight: "700" },
  signOut: { fontSize: 14, color: "#999" },
});
