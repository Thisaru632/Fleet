const mongoose = require('mongoose');

const parseNum = (val) => Number(val?.toString().replace(/[^\d.]/g, "")) || 0;

mongoose.connect('mongodb+srv://user09senucabs_db_user:O929xNcJ71o7fQ34@cluster0.heu3gps.mongodb.net/fleet').then(async () => {
  const db = mongoose.connection.db;
  const trips = await db.collection('trips').find({ purpose: "Hire" }).toArray();
  let updatedCount = 0;

  for (const trip of trips) {
    if (trip.rawValues && trip.rawValues.length > 20) {
      // SC Due = Final Price - Fuel - 2nd Fuel - Repair - Drv Comms
      const finalPrice = parseNum(trip.rawValues[23]);
      const fuel1 = parseNum(trip.rawValues[9]);
      const fuel2 = trip.rawValues.length > 24 ? parseNum(trip.rawValues[24]) : 0;
      const repair = parseNum(trip.rawValues[11]);
      const drvComms = parseNum(trip.rawValues[14]);

      const scDue = Math.round(finalPrice - fuel1 - fuel2 - repair - drvComms);

      if (trip.scDue !== scDue || trip.rawValues[13] !== scDue) {
        trip.scDue = scDue;
        trip.rawValues[13] = scDue;

        await db.collection('trips').updateOne(
          { _id: trip._id },
          { $set: { scDue: scDue, rawValues: trip.rawValues } }
        );
        updatedCount++;
      }
    }
  }

  console.log(`Successfully updated SC Due for ${updatedCount} Hire trips.`);
  process.exit(0);
}).catch(console.error);
