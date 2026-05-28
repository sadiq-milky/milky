import { ClerkProvider, useAuth } from "@clerk/expo";
import * as SecureStore from "expo-secure-store";
import { Stack } from "expo-router";
import Constants from "expo-constants";

const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string) {
    return SecureStore.setItemAsync(key, value);
  },
};

const publishableKey = Constants.expoConfig?.extra?.clerkPublishableKey as string;

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack>
    </ClerkProvider>
  );
}
