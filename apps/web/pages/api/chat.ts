import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { createServerClient } from "@milky/db";
import { env } from "../../lib/env";

const MILKY_SYSTEM_PROMPT = `You are Milky, an intelligent travel companion. You build a deep, longitudinal understanding of the traveller's travel DNA and plan around who they are — not transactions. You push back when useful and suggest proactively.`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { messages, conversationId } = req.body as {
    messages: UIMessage[];
    conversationId?: string;
  };

  if (!messages?.length) {
    return res.status(400).json({ error: "Messages required" });
  }

  const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // 1. Resolve internal user UUID from Clerk id
  const { data: userRow, error: userErr } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", clerkId)
    .single();

  if (userErr || !userRow) {
    return res.status(404).json({ error: "User not found" });
  }
  const internalUserId = userRow.id;

  // 2. Get or create conversation
  let convoId = conversationId;
  if (!convoId) {
    const { data: convo, error: convoErr } = await supabase
      .from("conversations")
      .insert({ user_id: internalUserId, status: "active" })
      .select("id")
      .single();
    if (convoErr || !convo) {
      return res.status(500).json({ error: "Failed to create conversation" });
    }
    convoId = convo.id;
  }

  // 3. Persist the latest user message
  const lastMessage = messages[messages.length - 1];
  const userText = lastMessage.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");

  if (lastMessage.role === "user" && userText) {
    const { error: msgErr } = await supabase.from("messages").insert({
      conversation_id: convoId,
      user_id: internalUserId,
      role: "user",
      content: userText,
    });
    if (msgErr) {
      return res.status(500).json({ error: "Failed to save message" });
    }
  }

  // 4. Stream from Claude via AI Gateway
  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: "anthropic/claude-sonnet-4-6",
    system: MILKY_SYSTEM_PROMPT,
    messages: modelMessages,
    onFinish: async ({ text, usage }) => {
      // 5. Persist assistant message + conversation rollups
      await supabase.from("messages").insert({
        conversation_id: convoId,
        user_id: internalUserId,
        role: "assistant",
        content: text,
        input_tokens: usage.inputTokens ?? null,
        output_tokens: usage.outputTokens ?? null,
      });

      await supabase
        .from("conversations")
        .update({
          last_message_at: new Date().toISOString(),
          total_tokens_used: (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
        })
        .eq("id", convoId);
    },
  });

  // Stream to client, passing the conversation id back in a header
  res.setHeader("X-Conversation-Id", convoId);
  return result.pipeUIMessageStreamToResponse(res);
}
