import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Trip from "@/models/Trip";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  try {
    const { 
      reference,
      status,
      driverId,
      vehicle,
      purpose,
      garageStartMeter,
      garageEndMeter,
      fuel,
      repair,
      commission,
      tripRef,
      finalPrice
    } = await request.json();

    if (!reference) {
      return NextResponse.json({ error: "Reference is required" }, { status: 400 });
    }

    await dbConnect();
    const trip = await Trip.findOne({ reference: reference.trim() });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const parseNum = (val: any) => Number(val?.toString().replace(/[^\d.]/g, "")) || 0;

    trip.status = status || trip.status;
    trip.driverId = driverId || trip.driverId;
    trip.vehicle = vehicle || trip.vehicle;
    trip.purpose = purpose || trip.purpose;
    trip.fuel = parseNum(fuel);
    trip.repair = parseNum(repair);
    trip.commission = parseNum(commission);
    trip.finalPrice = parseNum(finalPrice);
    
    // Recalculate total mileage
    const startMeter = parseNum(garageStartMeter);
    const endMeter = parseNum(garageEndMeter);
    trip.mileage = endMeter - startMeter;

    // Update rawValues array to match the sheet schema
    let raw = [...(trip.rawValues || new Array(25).fill(""))];
    raw[0] = trip.status;
    raw[1] = trip.reference;
    raw[2] = trip.timestamp;
    raw[3] = trip.driverId;
    raw[4] = trip.vehicle;
    raw[5] = trip.purpose;
    raw[6] = garageStartMeter;
    raw[8] = garageEndMeter;
    raw[9] = fuel;
    raw[11] = repair;
    raw[12] = tripRef || "";
    raw[14] = commission;
    raw[22] = trip.mileage;
    raw[23] = finalPrice;
    
    // Auto-calculate scDueAmount: finalPrice - fuel - commission only if purpose is Hire
    const isHire = trip.purpose === "Hire";
    const scDue = isHire ? Math.round(parseNum(finalPrice) - parseNum(fuel) - parseNum(commission)) : 0;
    trip.scDue = scDue;
    raw[13] = scDue;

    // Recalculate loss mileages if start/end are set
    const tStart = parseNum(raw[15]);
    const tEnd = parseNum(raw[16]);
    if (tStart > 0 && startMeter > 0) {
      raw[18] = tStart - startMeter; // Loss (Start)
    }
    if (endMeter > 0 && tEnd > 0) {
      raw[19] = endMeter - tEnd; // Loss (End)
    }

    trip.rawValues = raw;
    trip.markModified("rawValues");
    await trip.save();

    return NextResponse.json({ success: true, message: "Trip successfully updated" });
  } catch (error: any) {
    console.error("Edit trip error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
