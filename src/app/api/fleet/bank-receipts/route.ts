import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Trip from "@/models/Trip";
import BankReceipt from "@/models/BankReceipt";
import User from "@/models/User";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function resolveDriverIdRegexes(driverId: string): Promise<RegExp[]> {
  const clean = driverId.trim();
  if (!clean) return [];
  const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const primaryRegex = new RegExp(`^${escaped}$`, "i");
  const idSet = new Set<string>([clean.toUpperCase()]);

  try {
    const matchedUsers = await User.find({
      $or: [
        { username: primaryRegex },
        { driverId: primaryRegex },
        { "rawValues.0": primaryRegex },
        { "rawValues.3": primaryRegex },
      ],
    }).lean();

    matchedUsers.forEach((u: any) => {
      if (u.username) idSet.add(String(u.username).trim().toUpperCase());
      if (u.driverId) idSet.add(String(u.driverId).trim().toUpperCase());
      if (u.rawValues?.[0]) idSet.add(String(u.rawValues[0]).trim().toUpperCase());
      if (u.rawValues?.[3]) idSet.add(String(u.rawValues[3]).trim().toUpperCase());
    });
  } catch (err) {
    console.error("Error resolving driver aliases:", err);
  }

  return Array.from(idSet)
    .filter(Boolean)
    .map((id) => new RegExp(`^${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"));
}

const BASE_URL = process.env.LAKMOBILE_API_BASE_URL || process.env.BOOKING_API_BASE_URL || "https://senuportal.lakmobile.com";
const USERNAME = process.env.LAKMOBILE_API_USER || process.env.BOOKING_API_USER || "vconnect-senu-ext-prod";
const PASSWORD = process.env.LAKMOBILE_API_PASS || process.env.BOOKING_API_PASS || "YKExtprodKH8988!202897SAM";
const TENANT = process.env.LAKMOBILE_API_TENANT || process.env.BOOKING_API_TENANT || "vconnect";

function getLakAuthHeader(): string {
  const credentials = `${USERNAME}:${PASSWORD}`;
  return `Basic ${Buffer.from(credentials).toString("base64")}`;
}

async function fetchLakMobileCashRefSet(): Promise<Set<string> | null> {
  try {
    const now = new Date();
    const toDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const toStr = toDate.toISOString().split("T")[0];
    const fromDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const fromStr = fromDate.toISOString().split("T")[0];

    const url = `${BASE_URL.replace(/\/+$/, "")}/api/ext/bookings?from=${fromStr}&to=${toStr}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: getLakAuthHeader(),
        "customer-reference": TENANT,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = await res.json();
    const bookings = Array.isArray(data?.dataBundle) ? data.dataBundle : [];
    const cashSet = new Set<string>();

    bookings.forEach((b: any) => {
      const idStr = String(b?.id ?? "").trim().toUpperCase();
      if (!idStr) return;
      const payType = String(b?.paymentType ?? "").trim().toUpperCase();
      if (payType === "CA" || payType === "CASH") {
        cashSet.add(idStr);
      }
    });

    return cashSet;
  } catch (err) {
    console.error("Error fetching Lak Mobile bookings for cash filter:", err);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (id) {
      const receipt = await BankReceipt.findById(id).lean();
      if (!receipt) {
        return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
      }
      return NextResponse.json({ receipt });
    }

    if (type === "pending-refs" || searchParams.get("pending") === "true") {
      const driverId = searchParams.get("driverId");

      const isVD0322OrAdmin = !driverId || driverId.toLowerCase() === "admin" || driverId.trim().toUpperCase() === "VD0322";

      const query: any = {
        purpose: "Hire",
        $or: [
          { status: { $regex: /^pending$/i } },
          { paymentStatus: "Rejected" },
          ...(isVD0322OrAdmin ? [
            { "rawValues.12": "1002246" },
            { reference: "FR08385" },
            { reference: "1002246" }
          ] : [])
        ]
      };

      if (driverId && driverId.toLowerCase() !== "admin") {
        const driverRegexes = await resolveDriverIdRegexes(driverId);
        query.driverId = driverRegexes.length === 1 ? driverRegexes[0] : { $in: driverRegexes };
      }

      // Fetch active receipts, candidate trips, and Lak Mobile cash bookings in parallel
      const [activeReceipts, trips, lakCashSet] = await Promise.all([
        BankReceipt.find(
          { status: { $in: ["Submitted", "Approved"] } },
          { reference: 1, tripRef: 1 }
        ).lean(),
        Trip.find(query, {
          reference: 1,
          driverId: 1,
          vehicle: 1,
          finalPrice: 1,
          scDue: 1,
          commission: 1,
          timestamp: 1,
          rawValues: 1,
          status: 1,
          purpose: 1,
          paymentStatus: 1
        }).sort({ createdAt: -1 }).limit(100).lean(),
        fetchLakMobileCashRefSet()
      ]);

      const activeUploadedSet = new Set<string>();
      activeReceipts.forEach((r: any) => {
        if (r.reference) activeUploadedSet.add(String(r.reference).trim().toUpperCase());
        if (r.tripRef) activeUploadedSet.add(String(r.tripRef).trim().toUpperCase());
      });

      const parseNum = (val: any) => Number(String(val ?? "").replace(/[^\d.-]/g, "")) || 0;

      const seenRefs = new Set<string>();
      const pendingRefs: any[] = [];

      trips.forEach((t: any) => {
        const refUpper = String(t.reference || "").trim().toUpperCase();
        const tripRefUpper = String(t.rawValues?.[12] || "").trim().toUpperCase();

        // Only display Cash hire references matched against Lak Mobile bookings
        if (lakCashSet) {
          const isCashHire = (tripRefUpper && lakCashSet.has(tripRefUpper)) || (refUpper && lakCashSet.has(refUpper));
          if (!isCashHire) {
            return;
          }
        }

        // If has an active (Submitted or Approved) receipt, do not display
        if ((refUpper && activeUploadedSet.has(refUpper)) || (tripRefUpper && activeUploadedSet.has(tripRefUpper))) {
          return;
        }

        // Deduplicate so it only displays once
        const uniqueKey = tripRefUpper || refUpper;
        if (!uniqueKey || seenRefs.has(uniqueKey)) {
          return;
        }
        seenRefs.add(uniqueKey);

        const scDueAmount = parseNum(
          t.rawValues?.[13] !== undefined && t.rawValues?.[13] !== null && String(t.rawValues?.[13]).trim() !== ""
            ? t.rawValues[13]
            : t.scDue
        );
        const drvComms = parseNum(
          t.rawValues?.[14] !== undefined && t.rawValues?.[14] !== null && String(t.rawValues?.[14]).trim() !== ""
            ? t.rawValues[14]
            : t.commission
        );
        const combinedScDue = scDueAmount + drvComms;

        pendingRefs.push({
          reference: t.reference,
          tripRef: t.rawValues?.[12] || "",
          driverId: t.driverId,
          vehicle: t.vehicle || t.rawValues?.[4] || "",
          finalPrice: t.finalPrice || t.rawValues?.[23] || "",
          scDueAmount,
          drvComms,
          scDue: combinedScDue,
          startTs: t.rawValues?.[2] || t.timestamp || ""
        });
      });

      return NextResponse.json({ pendingRefs });
    }

    // Default: fetch payment list (for admin or filtered by driver + 1 month)
    const driverIdParam = searchParams.get("driverId");
    const oneMonthParam = searchParams.get("oneMonth") === "true";

    const receiptFilter: any = {};
    if (driverIdParam && driverIdParam.toLowerCase() !== "admin") {
      const driverRegexes = await resolveDriverIdRegexes(driverIdParam);
      if (driverRegexes.length > 0) {
        receiptFilter.driverId = { $in: driverRegexes };
      }
    }
    if (oneMonthParam) {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      receiptFilter.createdAt = { $gte: oneMonthAgo };
    }

    const receipts = await BankReceipt.find(receiptFilter).sort({ createdAt: -1 }).lean();

    const refs = receipts.map((r: any) => r.reference).filter(Boolean);
    const tripRefs = receipts.map((r: any) => r.tripRef).filter(Boolean);

    const trips = await Trip.find({
      $or: [
        { reference: { $in: refs } },
        { "rawValues.1": { $in: refs } },
        { "rawValues.12": { $in: tripRefs } }
      ]
    }, { reference: 1, rawValues: 1, finalPrice: 1 }).lean();

    const tripMap = new Map();
    trips.forEach((t: any) => {
      const price = (t.rawValues?.[23] !== undefined && t.rawValues?.[23] !== null && String(t.rawValues?.[23]).trim() !== '')
        ? t.rawValues[23]
        : (t.finalPrice ?? '');
      if (t.reference) tripMap.set(String(t.reference).trim().toUpperCase(), price);
      if (t.rawValues?.[1]) tripMap.set(String(t.rawValues[1]).trim().toUpperCase(), price);
      if (t.rawValues?.[12]) tripMap.set(String(t.rawValues[12]).trim().toUpperCase(), price);
    });

    const receiptsWithPrice = receipts.map((r: any) => {
      const refKey = String(r.reference || '').trim().toUpperCase();
      const tripRefKey = String(r.tripRef || '').trim().toUpperCase();
      const finalPrice = tripMap.get(refKey) || tripMap.get(tripRefKey) || r.finalPrice || '';
      return {
        ...r,
        finalPrice
      };
    });

    return NextResponse.json({ receipts: receiptsWithPrice });
  } catch (error: any) {
    console.error("Error in bank-receipts GET:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { reference, receiptValue, comments, fileData, fileName, driverId } = await request.json();

    if (!reference) {
      return NextResponse.json({ error: "Reference is required" }, { status: 400 });
    }
    if (receiptValue === undefined || receiptValue === null || receiptValue === "") {
      return NextResponse.json({ error: "Receipt value is required" }, { status: 400 });
    }
    if (!fileData) {
      return NextResponse.json({ error: "Receipt image is required" }, { status: 400 });
    }

    const trip = await Trip.findOne({ reference: reference.trim() });
    const tripVehicle = trip?.vehicle || trip?.rawValues?.[4] || "";
    const tripRefVal = trip?.rawValues?.[12] || "";
    const finalDriver = driverId || trip?.driverId || "Unknown";
    const tripFinalPrice = Number(trip?.finalPrice || trip?.rawValues?.[23] || 0);

    const imgName = fileName || `${reference.trim()}_BankReceipt_${Date.now()}`;

    // Also attach to Trip.images so it's visible in Trip Proofs and update paymentStatus to Submitted
    if (trip) {
      trip.paymentStatus = "Submitted";
      trip.images = trip.images || [];
      trip.images.push({ name: imgName, dataUrl: fileData });
      trip.markModified("images");
      await trip.save();
    }

    const bankReceipt = new BankReceipt({
      reference: reference.trim(),
      tripRef: tripRefVal,
      driverId: finalDriver,
      vehicle: tripVehicle,
      finalPrice: tripFinalPrice,
      receiptValue: Number(receiptValue) || 0,
      comments: comments || "",
      imageName: imgName,
      imageDataUrl: fileData,
      status: "Submitted"
    });

    await bankReceipt.save();

    return NextResponse.json({ success: true, receipt: bankReceipt });
  } catch (error: any) {
    console.error("Error in bank-receipts POST:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await dbConnect();
    const { id, status, reviewedBy } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ error: "ID and status are required" }, { status: 400 });
    }

    if (!["Approved", "Rejected", "Submitted"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const existingReceipt: any = await BankReceipt.findById(id).lean();
    if (!existingReceipt) {
      return NextResponse.json({ error: "Bank receipt not found" }, { status: 404 });
    }

    if (existingReceipt.status === "Approved" || existingReceipt.status === "Rejected") {
      return NextResponse.json(
        { error: "This receipt has already been approved or rejected and cannot be changed." },
        { status: 400 }
      );
    }

    const updateFields: Record<string, any> = { status };
    if (reviewedBy !== undefined) {
      updateFields.reviewedBy = String(reviewedBy).trim();
    }

    const receipt = await BankReceipt.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, strict: false }
    );

    // Also update Trip.paymentStatus if the trip exists (match by reference or tripRef)
    if (receipt.reference || receipt.tripRef) {
      await Trip.updateMany(
        {
          $or: [
            ...(receipt.reference ? [{ reference: receipt.reference.trim() }, { "rawValues.1": receipt.reference.trim() }] : []),
            ...(receipt.tripRef ? [{ "rawValues.12": receipt.tripRef.trim() }] : [])
          ]
        },
        { $set: { paymentStatus: status } }
      );
    }

    return NextResponse.json({ success: true, receipt });
  } catch (error: any) {
    console.error("Error in bank-receipts PATCH:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const PUT = PATCH;
