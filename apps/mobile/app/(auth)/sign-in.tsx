import { useSSO, useSignIn } from "@clerk/expo";
import { Link, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";

// Required so the browser session closes cleanly after Google redirects back
WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const { signIn, fetchStatus } = useSignIn();
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleGoogleSignIn() {
    setError("");
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: Linking.createURL("/"),
      });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace("/(app)");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign in failed");
    }
  }

  async function handleSignIn() {
    if (fetchStatus === "fetching") return;
    setError("");
    const { error } = await signIn.password({ emailAddress: email, password });
    if (error) {
      setError(error.message);
      return;
    }
    if (signIn.status === "complete") {
      await signIn.finalize();
      router.replace("/(app)");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Milky</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
        <Text style={styles.googleButtonText}>Continue with Google</Text>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity
        style={styles.button}
        onPress={handleSignIn}
        disabled={fetchStatus === "fetching"}
      >
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>

      <Link href="/(auth)/sign-up" style={styles.link}>
        Don't have an account? Sign up
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 24, textAlign: "center" },
  error: { color: "red", marginBottom: 12, textAlign: "center" },
  googleButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  googleButtonText: { fontSize: 16, fontWeight: "600", color: "#333" },
  divider: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#eee" },
  dividerText: { marginHorizontal: 12, color: "#999", fontSize: 13 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 12 },
  button: { backgroundColor: "#6366f1", padding: 14, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  link: { marginTop: 16, textAlign: "center", color: "#6366f1" },
});
