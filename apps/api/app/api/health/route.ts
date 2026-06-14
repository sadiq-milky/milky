import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  let dbStatus: "ok" | "error" = "ok";
  let dbError: string | null = null;

  try {
    const { error } = await supabase.from("users").select("count").limit(1);
    if (error && !error.message.includes("does not exist")) {
      dbStatus = "error";
      dbError = error.message;
    }
  } catch (err) {
    dbStatus = "error";
    dbError = err instanceof Error ? err.message : "Unknown error";
  }

  const status = dbStatus === "ok" ? 200 : 503;

  return NextResponse.json(
    {
      status: "ok",
      db: dbStatus,
      ...(dbError ? { dbError } : {}),
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}
