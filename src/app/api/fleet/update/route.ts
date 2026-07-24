import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Trip from "@/models/Trip";
import { getDrive } from "@/lib/google";
import { Readable } from "stream";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const { stage, ref, array, files } = await request.json();
    
    if (!ref) {
      return NextResponse.json({ error: "No Reference provided" }, { status: 400 });
    }

    await dbConnect();

    const trip = await Trip.findOne({ reference: ref.trim() });

    if (!trip) {
      return NextResponse.json({ error: "Reference not found" }, { status: 404 });
    }

    // Map array values to fields
    // Array starts at Column D (index 3 of A:Z)
    // D: 0, E: 1, F: 2, G: 3, H: 4, I: 5, J: 6 (Fuel), K: 7, L: 8 (Repair), M: 9, N: 10, O: 11 (Comms), ...
    const parseNum = (val: any) => Number(val?.toString().replace(/[^\d.]/g, "")) || 0;

    if (stage === 'fuel') {
      trip.fuel = parseNum(array[6]) + (array.length > 21 ? parseNum(array[21]) : 0);
      
      const isHire = trip.purpose === "Hire";
      const scDue = isHire ? Math.round(trip.finalPrice - trip.fuel - trip.commission) : 0;
      trip.scDue = scDue;

      const existingArray = trip.rawValues.slice(3);
      existingArray[6] = array[6];
      existingArray[7] = array[7];
      if (array.length > 21) {
        existingArray[21] = array[21] || existingArray[21] || '';
        existingArray[22] = array[22] || existingArray[22] || '';
        existingArray[23] = array[23] || existingArray[23] || '';
      }
      if (existingArray.length > 10) {
        existingArray[10] = scDue;
      }
      
      trip.rawValues = [trip.status, trip.reference, trip.timestamp, ...existingArray];
    } else if (stage === 'repair') {
      trip.repair = parseNum(array[8]);
      
      const isHire = trip.purpose === "Hire";
      const scDue = isHire ? Math.round(trip.finalPrice - trip.fuel - trip.commission - trip.repair) : 0;
      trip.scDue = scDue;

      const existingArray = trip.rawValues.slice(3);
      existingArray[8] = array[8];
      existingArray[10] = scDue;
      existingArray[24] = array[24];
      
      trip.rawValues = [trip.status, trip.reference, trip.timestamp, ...existingArray];
    } else {
      trip.driverId = array[0] || trip.driverId;
      trip.vehicle = array[1] || trip.vehicle;
      trip.purpose = array[2] || trip.purpose;
      trip.fuel = parseNum(array[6]) + (array.length > 21 ? parseNum(array[21]) : 0);
      trip.repair = parseNum(array[8]);
      trip.commission = parseNum(array[11]);
      trip.mileage = parseNum(array[19]);
      trip.finalPrice = parseNum(array[20]);
      
      // Recalculate scDue: only for Hire trips, else 0
      const isHire = trip.purpose === "Hire";
      const scDue = isHire ? Math.round(trip.finalPrice - trip.fuel - trip.commission - trip.repair) : 0;
      trip.scDue = scDue;
      if (array.length > 10) {
        array[10] = scDue;
      }

      // Update rawValues to match the sheet structure
      // Column A and B and C are already in trip.status, trip.reference, trip.timestamp
      trip.rawValues = [trip.status, trip.reference, trip.timestamp, ...array];
    }

    // Handle file uploads
    if (files && files.length > 0) {
      trip.images = trip.images || [];
      for (const file of files) {
        // Avoid adding duplicate images if same file name exists
        const exists = trip.images.some((img: any) => img.name === file.name);
        if (!exists) {
          trip.images.push({ name: file.name, dataUrl: file.dataUrl });
        }
      }

      try {
        const drive = await getDrive();
        const folderId = trip.folderId;

        const uploadPromises = files.map(async (file: any) => {
          const base64Data = file.dataUrl.split(",")[1];
          
          if (process.env.APPS_SCRIPT_WEB_APP_URL) {
            const proxyRes = await fetch(process.env.APPS_SCRIPT_WEB_APP_URL, {
              method: "POST",
              body: JSON.stringify({
                action: "uploadFile",
                folderId: folderId,
                fileName: file.name,
                base64Data: base64Data,
                mimeType: "image/jpeg"
              })
            });
            
            const proxyData = await proxyRes.json();
            if (!proxyData.success) {
              throw new Error("Apps Script Proxy Error: " + proxyData.error);
            }
          } else {
            const buffer = Buffer.from(base64Data, "base64");
            const stream = Readable.from(buffer);

            await drive.files.create({
              requestBody: {
                name: file.name,
                parents: [folderId!],
              },
              media: {
                mimeType: "image/jpeg",
                body: stream,
              },
            });
          }
        });
        
        await Promise.all(uploadPromises);
      } catch (driveError) {
        console.error("Google Drive upload failed, image saved in DB:", driveError);
      }
    }

    trip.markModified("images");
    trip.markModified("rawValues");
    await trip.save();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
