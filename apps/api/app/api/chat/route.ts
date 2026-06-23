import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { createServerClient } from "@milky/db";
import { env } from "../../../lib/env";

const MILKY_SYSTEM_PROMPT = `You are Milky, an intelligent travel companion. You build a deep, longitudinal understanding of the traveller's travel DNA and plan around who they are — not transactions. You push back when useful and suggest proactively.`;

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messages, conversationId } = (await req.json()) as {
    messages: UIMessage[];
    conversationId?: string;
  };

  if (!messages?.length) {
    return NextResponse.json({ error: "Messages required" }, { status: 400 });
  }

  const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // 1. Resolve internal user UUID from Clerk id, JIT-provisioning if absent.
  // In dev the Clerk webhook can't reach localhost, so first sign-in has no row.
  const { data: userRow, error: lookupErr } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", clerkId)
    .maybeSingle();

  if (lookupErr) {
    console.error("[chat] user lookup failed:", lookupErr);
    return NextResponse.json({ error: "User lookup failed" }, { status: 500 });
  }

  let internalUserId: string;
  if (userRow) {
    internalUserId = userRow.id;
  } else {
    console.warn("[chat] JIT-provisioning missing user — webhook may not have fired", { clerkId });
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkId);
    const primaryEmail = clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId,
    );
    if (!primaryEmail) {
      return NextResponse.json({ error: "Clerk user missing email" }, { status: 500 });
    }
    const displayName =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

    const { data: upserted, error: upsertErr } = await supabase
      .from("users")
      .upsert(
        {
          clerk_user_id: clerkId,
          email: primaryEmail.emailAddress,
          display_name: displayName,
          avatar_url: clerkUser.imageUrl,
        },
        { onConflict: "clerk_user_id", ignoreDuplicates: false },
      )
      .select("id")
      .single();
    if (upsertErr || !upserted) {
      console.error("[chat] user upsert failed:", upsertErr);
      return NextResponse.json({ error: "Failed to provision user" }, { status: 500 });
    }
    internalUserId = upserted.id;
  }

  // 2. Get or create conversation
  let convoId = conversationId;
  if (!convoId) {
    const { data: convo, error: convoErr } = await supabase
      .from("conversations")
      .insert({ user_id: internalUserId, status: "active" })
      .select("id")
      .single();
    if (convoErr || !convo) {
      return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
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
      console.error("[chat] message save failed:", msgErr);
      return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
    }
  }

  // 4. Stream from Claude — TODO: consider AI Gateway for failover/spend tracking before scale
  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: anthropic("claude-opus-4-8"),
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

  // Mobile clients (Expo Go) can't read streaming response bodies, so they
  // ask for the full text as plain JSON via this header. Web clients omit it
  // and get the streamed UI message response. onFinish still persists in both.
  if (req.headers.get("X-Milky-Client") === "mobile") {
    const text = await result.text;
    return NextResponse.json(
      { text, conversationId: convoId },
      { headers: { "X-Conversation-Id": convoId } }
    );
  }

  // Stream to client, passing the conversation id back in a header
  const response = result.toUIMessageStreamResponse();
  const headers = new Headers(response.headers);
  headers.set("X-Conversation-Id", convoId);
  return new Response(response.body, { status: response.status, headers });
}
