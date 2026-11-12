import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import NoticeBanner from "@/models/NoticeBanner";
import SheetMetadata from "@/models/SheetMetadata";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isAuthorizedNoticeUser(userId?: string | null): boolean {
  const clean = String(userId || "").trim().toUpperCase();
  return clean === "VD0001" || clean === "SCD001";
}

async function ensureInitialBannerSeeded() {
  const seeded = await SheetMetadata.findOne({ key: "notice_banners_seeded" }).lean();
  if (!seeded) {
    const count = await NoticeBanner.countDocuments();
    if (count === 0) {
      await NoticeBanner.create({
        title: "Notice Banner",
        imageUrl: "/notice/notice_banner.jpg",
        uploadedBy: "VD0001",
      });
    }
    await SheetMetadata.findOneAndUpdate(
      { key: "notice_banners_seeded" },
      { key: "notice_banners_seeded", value: true },
      { upsert: true, new: true }
    );
  }
}

export async function GET() {
  try {
    await dbConnect();
    await ensureInitialBannerSeeded();
    const banners = await NoticeBanner.find().sort({ createdAt: 1 }).lean();
    return NextResponse.json({ banners });
  } catch (error: any) {
    console.error("Error fetching notice banners:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { imageUrl, title, userId } = await request.json();

    if (!isAuthorizedNoticeUser(userId)) {
      return NextResponse.json({ error: "Unauthorized: Only VD0001 can manage notice board banners." }, { status: 403 });
    }

    if (!imageUrl) {
      return NextResponse.json({ error: "Banner image is required." }, { status: 400 });
    }

    await ensureInitialBannerSeeded();

    await NoticeBanner.create({
      title: String(title || "Notice Banner").trim() || "Notice Banner",
      imageUrl,
      uploadedBy: "VD0001",
    });

    const banners = await NoticeBanner.find().sort({ createdAt: 1 }).lean();
    return NextResponse.json({ success: true, banners });
  } catch (error: any) {
    console.error("Error adding notice banner:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");
    let userId = searchParams.get("userId");

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
        userId = userId || body?.userId;
      } catch {}
    }

    if (!isAuthorizedNoticeUser(userId)) {
      return NextResponse.json({ error: "Unauthorized: Only VD0001 can manage notice board banners." }, { status: 403 });
    }

    if (!id) {
      return NextResponse.json({ error: "Banner ID is required." }, { status: 400 });
    }

    await NoticeBanner.findByIdAndDelete(id);
    const banners = await NoticeBanner.find().sort({ createdAt: 1 }).lean();
    return NextResponse.json({ success: true, banners });
  } catch (error: any) {
    console.error("Error deleting notice banner:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

