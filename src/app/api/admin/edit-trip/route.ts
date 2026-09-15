import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Trip from "@/models/Trip";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  try {
    const { reference, rawValues } = await request.json();

    if (!reference || !rawValues) {
      return NextResponse.json({ error: "Reference and rawValues are required" }, { status: 400 });
    }

    await dbConnect();
    const trip = await Trip.findOne({ reference: reference.trim() });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const parseNum = (val: any) => Number(val?.toString().replace(/[^\d.]/g, "")) || 0;

    // Recalculate total mileage
    const startMeter = parseNum(rawValues[6]);
    const endMeter = parseNum(rawValues[8]);
    trip.mileage = endMeter > 0 ? (endMeter - startMeter) : 0;
    rawValues[22] = trip.mileage;

    // Recalculate scDueAmount: only deduct fuel if payment type is Hire cash
    const isHire = (rawValues[5] || trip.purpose) === "Hire";
    const fuel1Cost = parseNum(rawValues[9]);
    const fuel2Cost = rawValues.length > 24 ? parseNum(rawValues[24]) : 0;
    const pType1 = String((rawValues.length > 32 && rawValues[32]) || '').trim().toLowerCase();
    const pType2 = String((rawValues.length > 34 && rawValues[34]) || '').trim().toLowerCase();
    const deductibleFuel = (pType1 === 'hire cash' ? fuel1Cost : 0) + (pType2 === 'hire cash' ? fuel2Cost : 0);

    const scDue = isHire ? Math.round(parseNum(rawValues[23]) - deductibleFuel - parseNum(rawValues[11]) - parseNum(rawValues[14])) : 0;
    trip.scDue = scDue;
    rawValues[13] = scDue;

    // Recalculate loss mileages if start/end are set
    const tStart = parseNum(rawValues[15]);
    const tEnd = parseNum(rawValues[16]);
    if (tStart > 0 && startMeter > 0) {
      rawValues[18] = tStart - startMeter; // Loss (Start)
    }
    if (endMeter > 0 && tEnd > 0) {
      rawValues[19] = endMeter - tEnd; // Loss (End)
    }

    await Trip.updateOne(
      { reference: reference.trim() },
      {
        $set: {
          status: rawValues[0] || trip.status,
          driverId: rawValues[3] || trip.driverId,
          vehicle: rawValues[4] || trip.vehicle,
          purpose: rawValues[5] || trip.purpose,
          fuel: parseNum(rawValues[9]) + (rawValues.length > 24 ? parseNum(rawValues[24]) : 0),
          repair: parseNum(rawValues[11]),
          commission: parseNum(rawValues[14]),
          finalPrice: parseNum(rawValues[23]),
          mileage: trip.mileage,
          scDue: scDue,
          rawValues: rawValues
        }
      }
    );

    return NextResponse.json({ success: true, message: "Trip successfully updated" });
  } catch (error: any) {
    console.error("Edit trip error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
