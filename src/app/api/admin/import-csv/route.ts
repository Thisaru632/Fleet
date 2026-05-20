import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Trip from "@/models/Trip";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const text = await file.text();
    // Basic CSV parser that handles quotes
    const rows = text.split("\n").filter(line => line.trim()).map(line => {
      const result = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current);
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current);
      return result;
    });
    
    // Remove header row if it exists
    if (rows.length > 0 && (rows[0][0].toLowerCase().includes("status") || rows[0][1].toLowerCase().includes("ref"))) {
      rows.shift();
    }

    await dbConnect();

    const tripsToInsert = rows
      .filter(row => row.length >= 2 && row[1]) // Ensure reference exists
      .map(row => {
        const clean = (val: string) => val?.trim().replace(/^"|"$/g, "") || "";
        const parseNum = (val: string) => Number(val?.replace(/[^\d.]/g, "")) || 0;

        const purpose = clean(row[5]);
        const scDue = purpose === "Hire" ? parseNum(row[13]) : 0;
        const rawValues = row.map(clean);
        if (rawValues.length > 13) {
          rawValues[13] = scDue.toString();
        }

        // Map to our 24-column structure
        // The indices here should match the UI we just built
        return {
          status: clean(row[0]) || "Approved",
          reference: clean(row[1]),
          timestamp: clean(row[2]) || new Date().toISOString(),
          driverId: clean(row[3]) || "Unknown",
          vehicle: clean(row[4]),
          purpose: purpose,
          fuel: parseNum(row[9]),
          repair: parseNum(row[11]),
          scDue: scDue,
          commission: parseNum(row[14]),
          mileage: parseNum(row[18]) || parseNum(row[22]), // Total or Start Loss
          finalPrice: parseNum(row[23]),
          folderUrl: clean(row[20]),
          folderId: clean(row[21]),
          rawValues: rawValues
        };
      });

    const uniqueTrips = [];
    const seenRefs = new Set();
    
    for (const trip of tripsToInsert) {
      if (!seenRefs.has(trip.reference)) {
        seenRefs.add(trip.reference);
        uniqueTrips.push(trip);
      }
    }

    if (uniqueTrips.length === 0) {
      return NextResponse.json({ error: "No valid records found in CSV" }, { status: 400 });
    }

    // Remove all existing records first as requested
    await Trip.deleteMany({});
    
    // Insert all new records from the CSV
    const result = await Trip.insertMany(uniqueTrips);

    return NextResponse.json({ 
      success: true, 
      message: `Successfully replaced database with ${uniqueTrips.length} new records. Ignored duplicates.`,
      details: {
        insertedCount: result.length
      }
    });

  } catch (error: any) {
    console.error("CSV Import error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
