import { useAuth } from "@clerk/expo";
import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Message {
  role: "user" | "assistant";
  text: string;
}

export default function HomeScreen() {
  const { signOut, getToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const scrollRef = useRef<ScrollView>(null);

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
      { role: "user", text },
      { role: "assistant", text: "" },
    ]);
    setIsLoading(true);

    try {
      const token = await getToken();

      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Milky-Client": "mobile",
        },
        body: JSON.stringify({ messages: apiMessages, conversationId }),
      });

      if (!res.ok) {
        throw new Error(`${res.status}: ${await res.text()}`);
      }

      // Track the conversation so follow-up messages continue it
      const convoId = res.headers.get("X-Conversation-Id");
      if (convoId) setConversationId(convoId);

      // Mobile gets plain JSON ({ text, conversationId }) — see X-Milky-Client
      // header above. Streaming word-by-word needs a custom dev build (later).
      const data = (await res.json()) as { text: string; conversationId: string };
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", text: data.text || "…" };
        return next;
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", text: `Error: ${msg}` };
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

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask Milky something…"
          editable={!isLoading}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          multiline
        />
        <TouchableOpacity
          style={[styles.send, isLoading && styles.sendDisabled]}
          onPress={handleSend}
          disabled={isLoading}
        >
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
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
  messages: { flex: 1 },
  messagesContent: { padding: 16, gap: 10 },
  emptyHint: { textAlign: "center", color: "#bbb", marginTop: 40, fontSize: 14 },
  bubble: { maxWidth: "80%", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  userBubble: { alignSelf: "flex-end", backgroundColor: "#6366f1" },
  aiBubble: { alignSelf: "flex-start", backgroundColor: "#f3f4f6" },
  userText: { color: "#fff", fontSize: 15 },
  aiText: { color: "#111", fontSize: 15 },
  inputRow: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  input: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 120,
  },
  send: {
    backgroundColor: "#6366f1",
    borderRadius: 20,
    paddingHorizontal: 18,
    justifyContent: "center",
  },
  sendDisabled: { backgroundColor: "#c7c8f0" },
  sendText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});
