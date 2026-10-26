import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import AccountSheet from "@/models/AccountSheet";
import SheetMetadata from "@/models/SheetMetadata";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const search = searchParams.get("search") || "";
  const skip = (page - 1) * limit;

  try {
    await dbConnect();
    
    const excludeFilter = {
      $nor: [
        { driverId: /^DV1811$/i },
        { rawValues: /^DV1811$/i }
      ]
    };

    let query: any = excludeFilter;
    if (search) {
      query = {
        $and: [
          excludeFilter,
          { rawValues: { $regex: new RegExp(search, "i") } }
        ]
      };
    }

    const [totalItems, headersDoc] = await Promise.all([
      AccountSheet.countDocuments(query),
      SheetMetadata.findOne({ key: "account_sheet_headers" })
    ]);
    
    const totalPages = Math.ceil(totalItems / limit);
    const headers = headersDoc ? headersDoc.value : [];
    
    const data = await AccountSheet.find(query, null, { sort: { _id: -1 }, allowDiskUse: true })
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
