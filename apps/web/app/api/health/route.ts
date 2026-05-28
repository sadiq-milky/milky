import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  let dbStatus: "ok" | "error" = "ok";
  let dbError: string | null = null;

  try {
    // Lightweight ping — queries pg_catalog so no user tables required.
    const { error } = await supabase.from("_health_check" as never).select("1").limit(1);
    // A "relation does not exist" error still means Supabase responded — connection is healthy.
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
