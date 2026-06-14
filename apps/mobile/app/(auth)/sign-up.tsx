import { useSignUp } from "@clerk/expo";
import { Link, useRouter } from "expo-router";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";

export default function SignUpScreen() {
  const { signUp, fetchStatus } = useSignUp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  async function handleSignUp() {
    if (fetchStatus === "fetching") return;
    setError("");
    const { error } = await signUp.password({ emailAddress: email, password });
    if (error) {
      setError(error.message);
      return;
    }
    const { error: sendError } = await signUp.verifications.sendEmailCode();
    if (sendError) {
      setError(sendError.message);
      return;
    }
    setPendingVerification(true);
  }

  async function handleVerify() {
    if (fetchStatus === "fetching") return;
    setError("");
    const { error } = await signUp.verifications.verifyEmailCode({ code });
    if (error) {
      setError(error.message);
      return;
    }
    if (signUp.status === "complete") {
      await signUp.finalize();
      router.replace("/(app)");
    }
  }

  if (pendingVerification) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Check your email</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TextInput
          style={styles.input}
          placeholder="Verification code"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
        />
        <TouchableOpacity
          style={styles.button}
          onPress={handleVerify}
          disabled={fetchStatus === "fetching"}
        >
          <Text style={styles.buttonText}>Verify</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
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
        onPress={handleSignUp}
        disabled={fetchStatus === "fetching"}
      >
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
      <Link href="/(auth)/sign-in" style={styles.link}>
        Already have an account? Sign in
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 24, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 12 },
  button: { backgroundColor: "#6366f1", padding: 14, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  link: { marginTop: 16, textAlign: "center", color: "#6366f1" },
  error: { color: "red", marginBottom: 12, textAlign: "center" },
});
