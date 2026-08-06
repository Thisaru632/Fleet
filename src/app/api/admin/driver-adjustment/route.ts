import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import DriverAdjustment from "@/models/DriverAdjustment";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { driverCode, month, salaryAdvance, shorts, inclusions, exclusions, comment, exclusionsComment } = body;

    if (!driverCode || !month) {
      return NextResponse.json({ error: "Driver Code and Month are required" }, { status: 400 });
    }

    const numAdvance = Number(salaryAdvance) || 0;
    const numShorts = Number(shorts) || 0;
    const numInclusions = Number(inclusions) || 0;
    const numExclusions = Number(exclusions) || 0;
    const commentStr = comment ? comment.toString().trim() : "";
    const exclusionsCommentStr = exclusionsComment ? exclusionsComment.toString().trim() : "";

    const updated = await DriverAdjustment.findOneAndUpdate(
      { driverCode: driverCode.toString().trim(), month: month.toString().trim() },
      { $set: { salaryAdvance: numAdvance, shorts: numShorts, inclusions: numInclusions, exclusions: numExclusions, comment: commentStr, exclusionsComment: exclusionsCommentStr } },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, adjustment: updated });
  } catch (error: any) {
    console.error("Error saving driver adjustment:", error);
    return NextResponse.json({ error: error.message || "Failed to save adjustment" }, { status: 500 });
  }
}
