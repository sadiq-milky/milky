import { useAuth, useUser } from "@clerk/expo";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function HomeScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Hello, {user?.firstName ?? "traveller"} 🌍</Text>
      <Text style={styles.subtitle}>Your AI travel companion is ready.</Text>
      <TouchableOpacity style={styles.button} onPress={() => signOut()}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  greeting: { fontSize: 26, fontWeight: "bold", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 32 },
  button: { backgroundColor: "#ef4444", padding: 14, borderRadius: 8, width: "100%", alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
