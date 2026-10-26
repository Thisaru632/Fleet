import { NextResponse } from 'next/server';

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

    const query = new URLSearchParams();
    query.set('from', from);
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
