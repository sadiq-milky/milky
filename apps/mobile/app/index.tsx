import { useAuth } from "@clerk/expo";
import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return isSignedIn ? <Redirect href="/(app)" /> : <Redirect href="/(auth)/sign-in" />;
}
