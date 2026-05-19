import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import AccountSheet from "@/models/AccountSheet";
import SheetMetadata from "@/models/SheetMetadata";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  try {
    await dbConnect();
    
    const [totalItems, headersDoc] = await Promise.all([
      AccountSheet.countDocuments(),
      SheetMetadata.findOne({ key: "account_sheet_headers" })
    ]);
    
    const totalPages = Math.ceil(totalItems / limit);
    const headers = headersDoc ? headersDoc.value : [];
    
    const data = await AccountSheet.find()
      .sort({ date: -1, _id: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      data,
      headers,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages
      }
    });
  } catch (error: any) {
    console.error("Account data API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
