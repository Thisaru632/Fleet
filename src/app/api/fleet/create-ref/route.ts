import { NextResponse } from "next/server";
import { getDrive } from "@/lib/google";
import dbConnect from "@/lib/mongodb";
import Trip from "@/models/Trip";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const timestamp = body.timestamp || new Date().toISOString();
    const drvId = body.drvId || "Unknown";
    const drive = await getDrive();

    await dbConnect();

    // Find max numeric FR reference from MongoDB
    const frTrips = await Trip.find({ reference: /^FR/ }, { reference: 1 }).lean();
    let maxNumber = 0;
    frTrips.forEach((t: any) => {
      const match = String(t.reference || '').match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNumber) maxNumber = num;
      }
    });

    const nextNumber = maxNumber > 0 ? maxNumber + 1 : 1;
    const newReference = nextNumber >= 7000 ? `FR${nextNumber}` : `FR${String(nextNumber).padStart(5, "0")}`;

    // Create Drive Folder
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
      
      const contentType = proxyRes.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await proxyRes.text();
        throw new Error(`Apps Script Proxy returned non-JSON response (${proxyRes.status}): ${text.slice(0, 100)}`);
      }
      const proxyData = await proxyRes.json();
      if (!proxyData.success) {
        throw new Error("Apps Script Proxy Error: " + proxyData.error);
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

    // Save to MongoDB
    const newTrip = new Trip({
      status: "Pending",
      reference: newReference,
      timestamp,
      driverId: drvId,
      folderUrl,
      folderId,
      rawValues: ["Pending", newReference, timestamp, drvId, "", "", "", "", "", "", "", "", "", 0, "", "", "", "", "", "", folderUrl, folderId]
    });

    await newTrip.save();

    return NextResponse.json({ reference: newReference, folderId });
  } catch (error: any) {
    console.error("CRITICAL ERROR in create-ref:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
