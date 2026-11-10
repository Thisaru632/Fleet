import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Trip from "@/models/Trip";
import BankReceipt from "@/models/BankReceipt";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

      // Find any receipts already uploaded so we don't display already uploaded trips
      const existingReceipts = await BankReceipt.find({}, { reference: 1, tripRef: 1 }).lean();
      const uploadedSet = new Set<string>();
      existingReceipts.forEach((r: any) => {
        if (r.reference) uploadedSet.add(String(r.reference).trim().toUpperCase());
        if (r.tripRef) uploadedSet.add(String(r.tripRef).trim().toUpperCase());
      });

      const isVD0322OrAdmin = !driverId || driverId.toLowerCase() === "admin" || driverId.trim().toUpperCase() === "VD0322";

      const query: any = {
        purpose: "Hire",
        $or: [
          { status: { $regex: /^pending$/i } },
          ...(isVD0322OrAdmin ? [
            { "rawValues.12": "1002246" },
            { reference: "FR08385" },
            { reference: "1002246" }
          ] : [])
        ]
      };

      if (driverId && driverId.toLowerCase() !== "admin") {
        query.driverId = { $regex: new RegExp(`^${driverId.trim()}$`, "i") };
      }

      const trips = await Trip.find(query, {
        reference: 1,
        driverId: 1,
        vehicle: 1,
        finalPrice: 1,
        scDue: 1,
        commission: 1,
        timestamp: 1,
        rawValues: 1,
        status: 1,
        purpose: 1
      }).sort({ createdAt: -1 }).limit(100).lean();

      const parseNum = (val: any) => Number(String(val ?? "").replace(/[^\d.-]/g, "")) || 0;

      const seenRefs = new Set<string>();
      const pendingRefs: any[] = [];

      trips.forEach((t: any) => {
        const refUpper = String(t.reference || "").trim().toUpperCase();
        const tripRefUpper = String(t.rawValues?.[12] || "").trim().toUpperCase();

        // If already uploaded, do not display
        if ((refUpper && uploadedSet.has(refUpper)) || (tripRefUpper && uploadedSet.has(tripRefUpper))) {
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

    // Default: fetch payment list for admin
    const receipts = await BankReceipt.find().sort({ createdAt: -1 }).lean();

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

    // Also attach to Trip.images so it's visible in Trip Proofs
    if (trip) {
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
    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ error: "ID and status are required" }, { status: 400 });
    }

    if (!["Approved", "Rejected", "Submitted"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const receipt = await BankReceipt.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );

    if (!receipt) {
      return NextResponse.json({ error: "Bank receipt not found" }, { status: 404 });
    }

    // Also update Trip.paymentStatus if the trip exists
    if (receipt.reference) {
      await Trip.updateOne(
        { reference: receipt.reference.trim() },
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
