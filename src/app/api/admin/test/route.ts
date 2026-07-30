import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import AccountSheet from "@/models/AccountSheet";

export async function GET() {
  await dbConnect();
  const doc = await AccountSheet.findOne({}).lean();
  return NextResponse.json({ rawValues: doc?.rawValues || [] });
}
