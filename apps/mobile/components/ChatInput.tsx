import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  disabled: boolean;
};

export function ChatInput({ value, onChangeText, onSend, disabled }: Props) {
  return (
    <View style={styles.inputRow}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder="Ask Milky something…"
        editable={!disabled}
        returnKeyType="send"
        onSubmitEditing={onSend}
        multiline
      />
      <TouchableOpacity
        style={[styles.send, disabled && styles.sendDisabled]}
        onPress={onSend}
        disabled={disabled}
      >
        <Text style={styles.sendText}>Send</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
