import { NextResponse } from "next/server";
import { runAccountSync } from "@/lib/syncHelper";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await runAccountSync();
    if (!result.success) {
      return NextResponse.json({ error: result.message, details: result.details }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
