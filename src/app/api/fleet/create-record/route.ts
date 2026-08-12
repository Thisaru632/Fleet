import { NextResponse } from "next/server";
import { getDrive } from "@/lib/google";
import dbConnect from "@/lib/mongodb";
import Trip from "@/models/Trip";
import { Readable } from "stream";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const { timestamp, drvId, array, files } = await request.json();
    
    if (!drvId || !array) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const drive = await getDrive();
    await dbConnect();

    // 1. Calculate new Reference
    const lastTrip = await Trip.findOne({ reference: /^FR/ }).sort({ reference: -1 });
    let nextNumber = 1;
    
    if (lastTrip && lastTrip.reference) {
      nextNumber = parseInt(lastTrip.reference.slice(2)) + 1;
    }

    const newReference = `FR${String(nextNumber).padStart(5, "0")}`;

    // 2. Drive upload removed as requested, images will only be stored in Database
    let folderId = "";
    let folderUrl = "";

    // 3. Prepare Images for Database
    const imagesToSave: { name: string; dataUrl: any; }[] = [];
    if (files && files.length > 0) {
      files.forEach((file: any) => {
        // We will rename the file to include the newReference just in case it's generic
        const fileName = file.name.replace("TBD", newReference); 
        imagesToSave.push({ name: fileName, dataUrl: file.dataUrl });
      });
    }

    // 4. Save to MongoDB ONLY after successful uploads
    const parseNum = (val: any) => Number(val?.toString().replace(/[^\d.]/g, "")) || 0;

    // Set folder url and id into array
    array[17] = folderUrl || '';
    array[18] = folderId || '';

    if (array.length < 30) {
      array.length = 30;
    }
    if (!array[29]) {
      array[29] = 'Office card';
    }

    // Map array values to fields
    const driverId = array[0] || drvId;
    const vehicle = array[1] || "";
    const purpose = array[2] || "";
    const fuel = parseNum(array[6]) + (array.length > 21 ? parseNum(array[21]) : 0);
    const repair = parseNum(array[8]);
    const commission = parseNum(array[11]);
    const mileage = parseNum(array[19]);
    const finalPrice = parseNum(array[20]);
    
    // Recalculate scDue: only for Hire trips, else 0
    const isHire = purpose === "Hire";
    const scDue = isHire ? Math.round(finalPrice - fuel - commission) : 0;
    if (array.length > 10) {
      array[10] = scDue;
    }

    const newTrip = new Trip({
      status: "Pending",
      reference: newReference,
      timestamp,
      driverId: driverId,
      vehicle: vehicle,
      purpose: purpose,
      fuel: fuel,
      repair: repair,
      commission: commission,
      mileage: mileage,
      finalPrice: finalPrice,
      scDue: scDue,
      folderUrl,
      folderId,
      images: imagesToSave,
      rawValues: ["Pending", newReference, timestamp, ...array]
    });

    await newTrip.save();

    return NextResponse.json({ success: true, reference: newReference, folderId });
  } catch (error: any) {
    console.error("CRITICAL ERROR in create-record:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
