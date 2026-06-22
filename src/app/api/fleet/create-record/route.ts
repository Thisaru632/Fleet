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

    // 2. Create Drive Folder
    let folderId, folderUrl;

    if (process.env.APPS_SCRIPT_WEB_APP_URL) {
      const proxyRes = await fetch(process.env.APPS_SCRIPT_WEB_APP_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "createFolder",
          parentId: process.env.DRIVE_PARENT_FOLDER_ID,
          folderName: `${newReference} ${drvId}`
        })
      });
      
      const proxyData = await proxyRes.json();
      if (!proxyData.success) {
        throw new Error("Apps Script Proxy Error (Folder): " + proxyData.error);
      }
      folderId = proxyData.folderId;
      folderUrl = proxyData.folderUrl;
    } else {
      const folderMetadata = {
        name: `${newReference} ${drvId}`,
        parents: [process.env.DRIVE_PARENT_FOLDER_ID!],
        mimeType: "application/vnd.google-apps.folder",
      };

      const folder = await drive.files.create({
        requestBody: folderMetadata,
        fields: "id",
      });

      folderId = folder.data.id;
      folderUrl = `https://drive.google.com/drive/folders/${folderId}`;
    }

    // 3. Upload Files to the folder
    const imagesToSave: { name: string; dataUrl: any; }[] = [];
    if (files && files.length > 0) {
      const uploadPromises = files.map(async (file: any) => {
        // We will rename the file to include the newReference just in case it's generic
        const fileName = file.name.replace("TBD", newReference); 
        imagesToSave.push({ name: fileName, dataUrl: file.dataUrl });
        const base64Data = file.dataUrl.split(",")[1];
        
        if (process.env.APPS_SCRIPT_WEB_APP_URL) {
          const proxyRes = await fetch(process.env.APPS_SCRIPT_WEB_APP_URL, {
            method: "POST",
            body: JSON.stringify({
              action: "uploadFile",
              folderId: folderId,
              fileName: fileName,
              base64Data: base64Data,
              mimeType: "image/jpeg"
            })
          });
          
          const proxyData = await proxyRes.json();
          if (!proxyData.success) {
            throw new Error("Apps Script Proxy Error (File): " + proxyData.error);
          }
        } else {
          const buffer = Buffer.from(base64Data, "base64");
          const stream = Readable.from(buffer);

          await drive.files.create({
            requestBody: {
              name: fileName,
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
    }

    // 4. Save to MongoDB ONLY after successful uploads
    const parseNum = (val: any) => Number(val?.toString().replace(/[^\d.]/g, "")) || 0;

    // Set folder url and id into array
    array[17] = folderUrl || '';
    array[18] = folderId || '';

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
