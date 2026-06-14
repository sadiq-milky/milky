import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { createServerClient } from "@milky/db";
import { env } from "../../../../lib/env";

interface ClerkEmailAddress {
  id: string;
  email_address: string;
}

interface ClerkUserCreatedEvent {
  type: "user.created";
  data: {
    id: string;
    email_addresses: ClerkEmailAddress[];
    primary_email_address_id: string;
    first_name: string | null;
    last_name: string | null;
    image_url: string | null;
  };
}

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const body = await req.text();

  let event: ClerkUserCreatedEvent;
  try {
    const wh = new Webhook(secret);
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkUserCreatedEvent;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "user.created") {
    return NextResponse.json({ status: "ignored" });
  }

  const { id: clerkId, email_addresses, primary_email_address_id, first_name, last_name, image_url } = event.data;

  const primaryEmail = email_addresses.find((e) => e.id === primary_email_address_id);
  if (!primaryEmail) {
    // Test events from the Clerk dashboard send empty email_addresses — skip silently.
    return NextResponse.json({ status: "skipped", reason: "no email" });
  }

  const displayName = [first_name, last_name].filter(Boolean).join(" ") || null;

  const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const { error } = await supabase.from("users").insert({
    clerk_user_id: clerkId,
    email: primaryEmail.email_address,
    display_name: displayName,
    avatar_url: image_url,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: "ok" });
}
