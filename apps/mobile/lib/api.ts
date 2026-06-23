type ApiMessage = {
  id: string;
  role: "user" | "assistant";
  parts: { type: "text"; text: string }[];
};

export type ChatResponse = {
  text: string;
  conversationId: string | null;
};

export async function sendChatMessage(
  messages: ApiMessage[],
  conversationId: string | undefined,
  token: string | null,
): Promise<ChatResponse> {
  const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Milky-Client": "mobile",
    },
    body: JSON.stringify({ messages, conversationId }),
  });

  if (!res.ok) {
    throw new Error(`${res.status}: ${await res.text()}`);
  }

  const convoId = res.headers.get("X-Conversation-Id");
  const data = (await res.json()) as { text: string; conversationId: string };

  return {
    text: data.text,
    conversationId: convoId,
  };
}
