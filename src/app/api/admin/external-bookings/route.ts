import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Trip from '@/models/Trip';

export const dynamic = 'force-dynamic';

const BASE_URL = process.env.LAKMOBILE_API_BASE_URL || process.env.BOOKING_API_BASE_URL || 'https://senuportal.lakmobile.com';
const USERNAME = process.env.LAKMOBILE_API_USER || process.env.BOOKING_API_USER || 'vconnect-senu-ext-prod';
const PASSWORD = process.env.LAKMOBILE_API_PASS || process.env.BOOKING_API_PASS || 'YKExtprodKH8988!202897SAM';
const TENANT = process.env.LAKMOBILE_API_TENANT || process.env.BOOKING_API_TENANT || 'vconnect';

function getAuthHeader(): string {
  const credentials = `${USERNAME}:${PASSWORD}`;
  return `Basic ${Buffer.from(credentials).toString('base64')}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Check if fetching single booking detail
    const bookingId = searchParams.get('id') || searchParams.get('bookingId');
    if (bookingId) {
      const detailUrl = `${BASE_URL.replace(/\/+$/, '')}/api/ext/bookings/${encodeURIComponent(bookingId)}`;
      const res = await fetch(detailUrl, {
        method: 'GET',
        headers: {
          'Authorization': getAuthHeader(),
          'customer-reference': TENANT,
          'Accept': 'application/json'
        },
        cache: 'no-store'
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        return NextResponse.json(
          {
            isSuccess: false,
            errorMessage: data?.errorMessage || `External API returned status ${res.status}: ${res.statusText}`
          },
          { status: res.status }
        );
      }

      return NextResponse.json(data);
    }

    // Default dates if not specified
    const now = new Date();
    const defaultYear = now.getFullYear();
    const defaultMonth = String(now.getMonth() + 1).padStart(2, '0');
    const defaultDay = String(now.getDate()).padStart(2, '0');

    const from = searchParams.get('from') || `${defaultYear}-${defaultMonth}-01`;
    const to = searchParams.get('to') || `${defaultYear}-${defaultMonth}-${defaultDay}`;

    const fleetOnly = searchParams.get('fleetOnly') === 'true';
    const includeDetails = searchParams.get('includeDetails') === 'true';

    let apiFrom = from;
    if (fleetOnly && includeDetails && from) {
      const fromDateObj = new Date(`${from}T00:00:00`);
      if (!isNaN(fromDateObj.getTime())) {
        fromDateObj.setDate(fromDateObj.getDate() - 14);
        const y = fromDateObj.getFullYear();
        const m = String(fromDateObj.getMonth() + 1).padStart(2, '0');
        const d = String(fromDateObj.getDate()).padStart(2, '0');
        apiFrom = `${y}-${m}-${d}`;
      }
    }

    const query = new URLSearchParams();
    query.set('from', apiFrom);
    query.set('to', to);

    const search = searchParams.get('search') || searchParams.get('searchString');
    if (search && search.trim()) {
      query.set('searchString', search.trim());
    }

    const status = searchParams.get('status');
    if (status && status !== 'ALL' && status !== 'All') {
      query.set('status', status);
    }

    const tripPhase = searchParams.get('tripPhase');
    if (tripPhase && tripPhase !== 'ALL' && tripPhase !== 'All') {
      query.set('tripPhase', tripPhase);
    }

    const hireType = searchParams.get('hireType');
    if (hireType !== null && hireType !== undefined && hireType !== 'ALL' && hireType !== 'All') {
      query.set('hireType', hireType);
    }

    const isShedule = searchParams.get('isShedule');
    if (isShedule !== null && isShedule !== undefined && isShedule !== 'ALL' && isShedule !== 'All') {
      query.set('isShedule', isShedule);
    }

    const isCorporate = searchParams.get('isCorporate');
    if (isCorporate !== null && isCorporate !== undefined && isCorporate !== 'ALL' && isCorporate !== 'All') {
      query.set('isCorporate', isCorporate);
    }

    const paymentType = searchParams.get('paymentType');
    if (paymentType && paymentType !== 'ALL' && paymentType !== 'All') {
      query.set('paymentType', paymentType);
    }

    const listUrl = `${BASE_URL.replace(/\/+$/, '')}/api/ext/bookings?${query.toString()}`;

    const res = await fetch(listUrl, {
      method: 'GET',
      headers: {
        'Authorization': getAuthHeader(),
        'customer-reference': TENANT,
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return NextResponse.json(
        {
          isSuccess: false,
          errorMessage: data?.errorMessage || `External API returned status ${res.status}: ${res.statusText}`,
          dataBundle: []
        },
        { status: res.status }
      );
    }

    if ((fleetOnly || includeDetails) && Array.isArray(data?.dataBundle)) {
      let items: any[] = data.dataBundle;
      const fleetDriverMap = new Map<string, string>();
      const fleetDrvCommMap = new Map<string, string>();
      const fleetFinalPriceMap = new Map<string, number>();

      if (fleetOnly) {
        await dbConnect();
        const users = await User.find({}, { username: 1, driverId: 1, name: 1, status: 1 }).lean();
        users.forEach((u: any) => {
          const uName = String(u.name ?? '').trim();
          if (u.username) {
            const code = String(u.username).trim().toUpperCase();
            if (code) fleetDriverMap.set(code, uName || String(u.username).trim());
          }
          if (u.driverId) {
            const dCode = String(u.driverId).trim().toUpperCase();
            if (dCode && !fleetDriverMap.has(dCode)) {
              fleetDriverMap.set(dCode, uName || String(u.driverId).trim());
            }
          }
        });

        items = items.filter((b: any) => {
          const drvCode = String(b.driverId || '').trim().toUpperCase();
          if (!drvCode || !fleetDriverMap.has(drvCode)) return false;
          const s = String(b.status || '').toUpperCase();
          if (s !== 'PAYMENT_COMPLETE' && s !== 'COMPLETED') return false;
          return true;
        });

        if (items.length > 0) {
          const bookingIdStrings = items.map((b: any) => String(b.id).trim());
          const matchedTrips = await Trip.find(
            { 'rawValues.12': { $in: bookingIdStrings } },
            { rawValues: 1, finalPrice: 1, status: 1 }
          ).lean();
          matchedTrips.forEach((t: any) => {
            const statusStr = String(t.rawValues?.[0] || t.status || '').toLowerCase();
            if (statusStr.includes('cancel')) return;
            const refStr = String(t.rawValues?.[12] || '').trim();
            const commStr = String(t.rawValues?.[14] ?? '').replace(/Rs\.?\s*/gi, '').trim();
            if (refStr && commStr && !fleetDrvCommMap.has(refStr)) {
              fleetDrvCommMap.set(refStr, commStr);
            }
            const rawPriceStr = String(t.rawValues?.[23] ?? t.finalPrice ?? '').replace(/[^\d.-]/g, '').trim();
            const parsedPrice = parseFloat(rawPriceStr);
            if (refStr && rawPriceStr !== '' && !isNaN(parsedPrice) && !fleetFinalPriceMap.has(refStr)) {
              fleetFinalPriceMap.set(refStr, parsedPrice);
            }
          });
        }
      }

      if (includeDetails && items.length > 0) {
        const baseUrlClean = BASE_URL.replace(/\/+$/, '');
        const authHeader = getAuthHeader();
        const detailedItems = await Promise.all(
          items.map(async (b: any) => {
            const drvCode = String(b.driverId || '').trim().toUpperCase();
            const fleetDriverName = fleetDriverMap.get(drvCode) || '';
            const idKey = String(b.id).trim();
            const fleetDrvComm = fleetDrvCommMap.get(idKey) || '';
            const fleetFinalPrice = fleetFinalPriceMap.has(idKey) ? fleetFinalPriceMap.get(idKey) : null;
            if (b.estimatedCompletedAt) {
              return { ...b, fleetDriverName, fleetDrvComm, fleetFinalPrice };
            }
            try {
              const detRes = await fetch(`${baseUrlClean}/api/ext/bookings/${encodeURIComponent(b.id)}`, {
                method: 'GET',
                headers: {
                  'Authorization': authHeader,
                  'customer-reference': TENANT,
                  'Accept': 'application/json'
                },
                cache: 'no-store'
              });
              const detData = await detRes.json().catch(() => null);
              if (detRes.ok && detData?.dataBundle) {
                return {
                  ...b,
                  ...detData.dataBundle,
                  estimatedCompletedAt: b.estimatedCompletedAt || detData.dataBundle?.estimatedCompletedAt,
                  cabType: b.cabType || detData.dataBundle?.cabType,
                  vehiclePlate: b.vehiclePlate || detData.dataBundle?.vehicle?.plateNo || detData.dataBundle?.vehiclePlate,
                  finalTotal: b.finalTotal ?? detData.dataBundle?.finalTotal ?? detData.dataBundle?.payment?.totalAmount,
                  driverId: b.driverId || detData.dataBundle?.driver?.userId,
                  fleetDriverName,
                  fleetDrvComm,
                  fleetFinalPrice
                };
              }
              return { ...b, fleetDriverName, fleetDrvComm, fleetFinalPrice };
            } catch {
              return { ...b, fleetDriverName, fleetDrvComm, fleetFinalPrice };
            }
          })
        );
        items = detailedItems.filter((b: any) => {
          if (b.cancelledAt) return false;
          const endTimeVal = b.estimatedCompletedAt || b.completedAt;
          if (!endTimeVal) return false;
          const endDateStr = String(endTimeVal).split('T')[0].split(' ')[0].trim();
          if (from && endDateStr < from) return false;
          if (to && endDateStr > to) return false;
          return true;
        });
      }

      return NextResponse.json({
        ...data,
        dataBundle: items
      });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Lak Mobile API Route Error:', error);
    return NextResponse.json(
      {
        isSuccess: false,
        errorMessage: error?.message || 'Internal Server Error while fetching external bookings',
        dataBundle: []
      },
      { status: 500 }
    );
  }
}
