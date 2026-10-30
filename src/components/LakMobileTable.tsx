'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  RefreshCw,
  Calendar,
  Filter,
  Download,
  Eye,
  X,
  Car,
  User,
  Phone,
  MapPin,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ExternalLink,
  ShieldCheck,
  FileText,
  Navigation,
  Gauge,
  Image as ImageIcon,
  MessageSquare,
  Tag,
  Info,
  Check,
  Copy,
  ArrowRight,
  Route,
  Building,
  Layers,
  Maximize2
} from 'lucide-react';

export interface LakMobileBooking {
  id: number;
  picktime: string;
  estimatedCompletedAt?: string | null;
  hireNature?: string | null;
  status: string;
  customerName?: string | null;
  mobile?: string | null;
  createdBy?: string | null;
  cabType?: string | null;
  companyName?: string | null;
  isCorporate?: boolean | null;
  corporateId?: number | null;
  hireType?: number | null;
  isShedule?: boolean | null;
  paymentType?: string | null;
  settlementType?: string | null;
  pickDropBrief?: string | null;
  amount?: number | null;
  initialKm?: number | null;
  initialHours?: number | null;
  addKm?: number | null;
  addHours?: number | null;
  increment?: number | null;
  subTotal?: number | null;
  finalTotal?: number | null;
  driverId?: string | null;
  vehicleId?: number | null;
  vehiclePlate?: string | null;
  dispatchBy?: string | null;
  dispatchByName?: string | null;
}

export interface TripStop {
  id: number;
  stopOrder: number;
  type: string;
  address: string;
  latitude?: number;
  longitude?: number;
  status?: string;
  reachedAt?: string | null;
  completedAt?: string | null;
}

export interface LakMobileDriver {
  userId?: string | null;
  name?: string | null;
  phone?: string | null;
  whatsappNo?: string | null;
}

export interface LakMobileVehicle {
  id?: number | null;
  plateNo?: string | null;
  modelCategory?: string | null;
  manufacturedYear?: number | null;
  vehicleCategory?: string | null;
}

export interface FareBreakdown {
  source?: string | null;
  packageSubTotal?: number | null;
  packageKm?: number | null;
  packageMinutes?: number | null;
  actualKm?: number | null;
  actualMinutes?: number | null;
  extraKm?: number | null;
  extraMinutes?: number | null;
  trafficWaitingMinutes?: number | null;
  extPerKm?: number | null;
  extPerMin?: number | null;
  extraKmCharge?: number | null;
  extraTimeCharge?: number | null;
  fareSubTotal?: number | null;
}

export interface LakMobilePayment {
  distanceKm?: number | null;
  durationHours?: number | null;
  durationMinutes?: number | null;
  fareAmount?: number | null;
  callCenterMiscAmount?: number | null;
  driverMiscTotal?: number | null;
  totalAmount?: number | null;
  advancePaid?: number | null;
  balanceDue?: number | null;
  tripFareAmount?: number | null;
  tripFareSubTotal?: number | null;
  tripFareVersion?: number | null;
  fareBreakdown?: FareBreakdown | null;
}

export interface MeterReading {
  startKm?: number | null;
  endKm?: number | null;
  startPhotoUrl?: string | null;
  endPhotoUrl?: string | null;
  croppedStartPhotoUrl?: string | null;
  croppedEndPhotoUrl?: string | null;
  startOcrKm?: number | null;
  endOcrKm?: number | null;
  startOcrConfidence?: number | null;
  endOcrConfidence?: number | null;
  startCapturedAt?: string | null;
  endCapturedAt?: string | null;
}

export interface LakMobileDetail extends LakMobileBooking {
  tripPhase?: string | null;
  passengerId?: number | null;
  medium?: string | null;
  rateType?: string | null;
  initialDays?: number | null;
  extPerKm?: number | null;
  extPerHour?: number | null;
  miscRate?: number | null;
  miscellaneousItems?: string | null;
  isCustomRate?: boolean | null;
  advanceAmount?: number | null;
  advancePaymentMethod?: string | null;
  advanceNotes?: string | null;
  advancePaidAt?: string | null;
  driverCommission?: number | null;
  remark?: string | null;
  staffComments?: string | null;
  driverComment?: string | null;
  passengerCount?: number | null;
  luggage?: number | null;
  weight?: number | null;
  promocode?: string | null;
  mapRouteLink?: string | null;
  leadSource?: string | null;
  editCount?: number | null;
  createdAt?: string | null;
  acceptedAt?: string | null;
  atPlaceAt?: string | null;
  pickedUpAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  senttime?: string | null;
  driver?: LakMobileDriver | null;
  vehicle?: LakMobileVehicle | null;
  tripStops?: TripStop[];
  gpsPoints?: any[];
  payment?: LakMobilePayment | null;
  meterReading?: MeterReading | null;
  driverMiscItems?: any[];
  attachments?: string[];
  gpsDiagDownloadUrl?: string | null;
}

export default function LakMobileTable() {
  const today = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return {
      startOfMonth: `${y}-${m}-01`,
      today: `${y}-${m}-${d}`
    };
  }, []);

  const [startDate, setStartDate] = useState(today.startOfMonth);
  const [endDate, setEndDate] = useState(today.today);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [hireTypeFilter, setHireTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [bookings, setBookings] = useState<LakMobileBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Detail Modal State
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [bookingDetail, setBookingDetail] = useState<LakMobileDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [modalActiveTab, setModalActiveTab] = useState<'overview' | 'billing' | 'meter' | 'info'>('overview');
  const [fullscreenImage, setFullscreenImage] = useState<{ url: string; title: string } | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const fetchBookings = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('from', startDate);
      params.set('to', endDate);

      if (statusFilter !== 'ALL') {
        params.set('status', statusFilter);
      }
      if (hireTypeFilter !== 'ALL') {
        params.set('hireType', hireTypeFilter);
      }
      if (searchQuery.trim()) {
        params.set('searchString', searchQuery.trim());
      }

      const res = await fetch(`/api/admin/external-bookings?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || data.isSuccess === false) {
        throw new Error(data.errorMessage || `Failed to fetch external bookings (${res.status})`);
      }

      const items = Array.isArray(data.dataBundle) ? data.dataBundle : [];
      setBookings(items);
      setCurrentPage(1);
    } catch (err: any) {
      console.error('Error fetching Lak Mobile bookings:', err);
      setError(err?.message || 'Error communicating with Lak Mobile external API');
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [startDate, endDate, statusFilter, hireTypeFilter]);

  // Client-side quick search filtering
  const filteredBookings = useMemo(() => {
    if (!searchQuery.trim()) return bookings;
    const q = searchQuery.toLowerCase().trim();
    return bookings.filter((b) => {
      const idMatch = String(b.id || '').toLowerCase().includes(q);
      const custMatch = String(b.customerName || '').toLowerCase().includes(q);
      const mobMatch = String(b.mobile || '').toLowerCase().includes(q);
      const briefMatch = String(b.pickDropBrief || '').toLowerCase().includes(q);
      const plateMatch = String(b.vehiclePlate || '').toLowerCase().includes(q);
      const drvMatch = String(b.driverId || '').toLowerCase().includes(q);
      const natureMatch = String(b.hireNature || '').toLowerCase().includes(q);
      const cabMatch = String(b.cabType || '').toLowerCase().includes(q);
      const dispatchMatch = String(b.dispatchByName || b.dispatchBy || '').toLowerCase().includes(q);
      return idMatch || custMatch || mobMatch || briefMatch || plateMatch || drvMatch || natureMatch || cabMatch || dispatchMatch;
    });
  }, [bookings, searchQuery]);

  // Pagination calculation
  const totalItems = filteredBookings.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBookings.slice(start, start + pageSize);
  }, [filteredBookings, currentPage, pageSize]);

  // Metrics
  const metrics = useMemo(() => {
    let completed = 0;
    let cancelled = 0;
    let inProgress = 0;
    let scheduled = 0;
    let totalRevenue = 0;

    for (const b of filteredBookings) {
      const s = (b.status || '').toUpperCase();
      if (s === 'PAYMENT_COMPLETE' || s === 'COMPLETED') {
        completed++;
        totalRevenue += (b.finalTotal || b.subTotal || b.amount || 0);
      } else if (s === 'CANCELLED') {
        cancelled++;
      } else if (s === 'IN_PROGRESS' || s === 'PICKED_UP') {
        inProgress++;
      } else if (s === 'SCHEDULED' || s === 'PENDING') {
        scheduled++;
      }
    }

    return {
      total: filteredBookings.length,
      completed,
      cancelled,
      inProgress,
      scheduled,
      totalRevenue
    };
  }, [filteredBookings]);

  // Open Detail Modal
  const handleOpenDetail = async (id: number) => {
    setSelectedBookingId(id);
    setBookingDetail(null);
    setLoadingDetail(true);
    setDetailError(null);
    setModalActiveTab('overview');

    try {
      const res = await fetch(`/api/admin/external-bookings?id=${id}`);
      const data = await res.json();
      if (!res.ok || data.isSuccess === false) {
        throw new Error(data.errorMessage || `Failed to fetch booking #${id} detail`);
      }
      setBookingDetail(data.dataBundle);
    } catch (err: any) {
      console.error(`Error loading booking #${id}:`, err);
      setDetailError(err?.message || 'Failed to load booking details from external database');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedBookingId(null);
    setBookingDetail(null);
    setDetailError(null);
    setFullscreenImage(null);
  };

  const copyBookingId = () => {
    if (selectedBookingId) {
      navigator.clipboard.writeText(String(selectedBookingId));
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // CSV Export
  const exportToCSV = () => {
    if (!filteredBookings.length) return;

    const headers = [
      'ID',
      'Pick Time',
      'Status',
      'Customer Name',
      'Mobile',
      'Cab Type',
      'Hire Nature',
      'Route Brief',
      'Amount',
      'Subtotal',
      'Final Total',
      'Payment Type',
      'Settlement',
      'Vehicle Plate',
      'Driver ID',
      'Dispatched By',
      'Created By'
    ];

    const rows = filteredBookings.map((b) => [
      b.id,
      b.picktime || '',
      b.status || '',
      `"${(b.customerName || '').replace(/"/g, '""')}"`,
      b.mobile || '',
      `"${(b.cabType || '').replace(/"/g, '""')}"`,
      b.hireNature || '',
      `"${(b.pickDropBrief || '').replace(/"/g, '""')}"`,
      b.amount ?? '',
      b.subTotal ?? '',
      b.finalTotal ?? '',
      b.paymentType || '',
      b.settlementType || '',
      b.vehiclePlate || '',
      b.driverId || '',
      `"${(b.dispatchByName || b.dispatchBy || '').replace(/"/g, '""')}"`,
      b.createdBy || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `lak_mobile_bookings_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'PAYMENT_COMPLETE' || s === 'COMPLETED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" />
          {status}
        </span>
      );
    }
    if (s === 'IN_PROGRESS' || s === 'PICKED_UP') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse">
          <Clock className="w-3 h-3" />
          {status}
        </span>
      );
    }
    if (s === 'SCHEDULED' || s === 'ACCEPTED' || s === 'WAITING_CONFIRM') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Clock className="w-3 h-3" />
          {status}
        </span>
      );
    }
    if (s === 'CANCELLED' || s === 'ACCEPT_REJECTED' || s === 'NON_ACCEPT_REJECTED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <AlertCircle className="w-3 h-3" />
          {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-500/10 text-slate-400 border border-slate-500/20">
        {status}
      </span>
    );
  };

  const formatCurrency = (amount?: number | null) => {
    if (amount === undefined || amount === null) return '—';
    return `Rs. ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const formatDateTime = (dt?: string | null) => {
    if (!dt) return '—';
    try {
      const parts = dt.split('T');
      if (parts.length === 2) {
        return `${parts[0]} ${parts[1].substring(0, 5)}`;
      }
      return dt;
    } catch {
      return dt;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="glass-card p-4 rounded-2xl border border-white/5 bg-slate-900/60 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Bookings</p>
            <p className="text-xl font-black text-white mt-1">{metrics.total.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Car className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-white/5 bg-slate-900/60 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed / Paid</p>
            <p className="text-xl font-black text-emerald-400 mt-1">{metrics.completed.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-white/5 bg-slate-900/60 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In Progress / Picked</p>
            <p className="text-xl font-black text-blue-400 mt-1">{metrics.inProgress.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-white/5 bg-slate-900/60 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cancelled</p>
            <p className="text-xl font-black text-rose-400 mt-1">{metrics.cancelled.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-white/5 bg-slate-900/60 col-span-2 md:col-span-1 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Revenue</p>
            <p className="text-lg font-black text-emerald-400 mt-1">{formatCurrency(metrics.totalRevenue)}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Glass Card */}
      <div className="glass-card overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80">
        {/* Section Header & Filters Bar */}
        <div className="p-4 border-b border-white/5 bg-white/[0.02] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">LAK MOBILE</h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  External Partner API
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                Live bookings feed from Lak Mobile database
              </p>
            </div>
          </div>

          {/* Quick Date & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1 lg:justify-end">
            {/* From Date */}
            <div className="flex items-center gap-1.5 bg-slate-950/60 border border-white/10 rounded-xl px-2.5 py-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-xs text-white outline-none cursor-pointer"
              />
            </div>

            {/* To Date */}
            <div className="flex items-center gap-1.5 bg-slate-950/60 border border-white/10 rounded-xl px-2.5 py-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-xs text-white outline-none cursor-pointer"
              />
            </div>

            {/* Status Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-950/60 border border-white/10 rounded-xl px-2.5 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs text-white outline-none cursor-pointer uppercase font-bold"
              >
                <option value="ALL" className="bg-slate-900 text-white">All Statuses</option>
                <option value="PAYMENT_COMPLETE" className="bg-slate-900 text-white">Payment Complete</option>
                <option value="COMPLETED" className="bg-slate-900 text-white">Completed</option>
                <option value="PICKED_UP" className="bg-slate-900 text-white">Picked Up</option>
                <option value="IN_PROGRESS" className="bg-slate-900 text-white">In Progress</option>
                <option value="SCHEDULED" className="bg-slate-900 text-white">Scheduled</option>
                <option value="PENDING" className="bg-slate-900 text-white">Pending</option>
                <option value="CANCELLED" className="bg-slate-900 text-white">Cancelled</option>
              </select>
            </div>

            {/* Hire Type Filter */}
            <div className="flex items-center gap-1.5 bg-slate-950/60 border border-white/10 rounded-xl px-2.5 py-1.5">
              <select
                value={hireTypeFilter}
                onChange={(e) => setHireTypeFilter(e.target.value)}
                className="bg-transparent text-xs text-white outline-none cursor-pointer uppercase font-bold"
              >
                <option value="ALL" className="bg-slate-900 text-white">All Hires</option>
                <option value="0" className="bg-slate-900 text-white">Short Hire</option>
                <option value="1" className="bg-slate-900 text-white">Long Hire</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search ID, customer, driver..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/60 border border-white/10 rounded-xl py-1.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchBookings(true)}
                disabled={loading}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all disabled:opacity-50"
                title="Refresh from Lak Mobile API"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
              </button>

              <button
                type="button"
                onClick={exportToCSV}
                disabled={!filteredBookings.length}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                title="Export filtered records to CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="m-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchBookings(true)}
              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg text-rose-200 font-bold uppercase tracking-wider"
            >
              Retry
            </button>
          </div>
        )}

        {/* Table Content */}
        {loading ? (
          <div className="p-24 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
            <p className="text-slate-400 font-black tracking-widest text-xs uppercase">
              Fetching live Lak Mobile bookings...
            </p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-20 text-center space-y-3">
            <Car className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-300 font-bold text-sm">No bookings found for the selected criteria</p>
            <p className="text-slate-500 text-xs">
              Try adjusting the date range or search query, or hit refresh to pull latest bookings.
            </p>
          </div>
        ) : (
          <>
            <div
              className="overflow-x-auto overflow-y-auto custom-scrollbar"
              style={{ maxHeight: 'calc(100vh - 280px)' }}
            >
              <table className="w-full text-left relative text-xs">
                <thead className="sticky top-0 z-20 bg-slate-950 border-b border-white/10 shadow-md">
                  <tr className="bg-white/[0.02]">
                    <th className="px-4 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">ID</th>
                    <th className="px-4 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Pick Time</th>
                    <th className="px-4 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                    <th className="px-4 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Customer</th>
                    <th className="px-4 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Cab Type</th>
                    <th className="px-4 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Hire Nature</th>
                    <th className="px-4 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Pick → Drop Route</th>
                    <th className="px-4 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">Subtotal</th>
                    <th className="px-4 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">Final Total</th>
                    <th className="px-4 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Payment</th>
                    <th className="px-4 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Vehicle</th>
                    <th className="px-4 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Driver</th>
                    <th className="px-4 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Dispatcher</th>
                    <th className="px-4 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedBookings.map((b) => (
                    <tr
                      key={b.id}
                      className="hover:bg-white/[0.04] transition-colors group cursor-pointer"
                      onClick={() => handleOpenDetail(b.id)}
                    >
                      {/* ID */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-emerald-400 group-hover:underline">
                          #{b.id}
                        </span>
                      </td>

                      {/* Pick Time */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium text-slate-200">
                          {formatDateTime(b.picktime)}
                        </div>
                        {b.isShedule && (
                          <span className="text-[9px] text-amber-400/80 uppercase font-black tracking-wider">
                            Scheduled
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(b.status)}
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{b.customerName || 'N/A'}</span>
                        </div>
                        {b.mobile && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-2.5 h-2.5 text-slate-500" />
                            <span>{b.mobile}</span>
                          </div>
                        )}
                      </td>

                      {/* Cab Type */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-semibold text-slate-300">
                          {b.cabType || '—'}
                        </span>
                      </td>

                      {/* Hire Nature */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] font-bold text-slate-300 uppercase">
                          {b.hireNature || (b.hireType === 1 ? 'Long Hire' : 'Short Hire')}
                        </span>
                      </td>

                      {/* Pick → Drop Route */}
                      <td className="px-4 py-3">
                        <div className="max-w-xs truncate text-slate-300 flex items-center gap-1.5" title={b.pickDropBrief || ''}>
                          <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="truncate">{b.pickDropBrief || '—'}</span>
                        </div>
                      </td>

                      {/* Subtotal */}
                      <td className="px-4 py-3 whitespace-nowrap text-right font-medium text-slate-300">
                        {formatCurrency(b.subTotal ?? b.amount)}
                      </td>

                      {/* Final Total */}
                      <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-emerald-400">
                        {formatCurrency(b.finalTotal)}
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-200">
                          {b.paymentType === 'CA' ? 'Cash' : b.paymentType === 'CP' ? 'Corporate' : b.paymentType === 'CD' ? 'Card' : b.paymentType || '—'}
                        </div>
                        {b.settlementType && (
                          <div className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">
                            {b.settlementType}
                          </div>
                        )}
                      </td>

                      {/* Vehicle */}
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-200">
                        {b.vehiclePlate ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono font-bold text-[11px]">
                            {b.vehiclePlate}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      {/* Driver */}
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-300 font-bold">
                        {b.driverId || <span className="text-slate-500 font-sans font-normal">—</span>}
                      </td>

                      {/* Dispatcher */}
                      <td className="px-4 py-3 whitespace-nowrap text-slate-400 text-[11px]">
                        {b.dispatchByName || b.dispatchBy || '—'}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(b.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 font-black text-[11px] uppercase tracking-wider transition-all border border-emerald-500/20 shadow-sm"
                          title="View Full Booking Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-white/5 bg-white/[0.01] flex items-center justify-between flex-wrap gap-4 text-xs">
              <div className="text-slate-400">
                Showing{' '}
                <span className="font-bold text-white">
                  {Math.min(totalItems, (currentPage - 1) * pageSize + 1)}
                </span>{' '}
                to{' '}
                <span className="font-bold text-white">
                  {Math.min(totalItems, currentPage * pageSize)}
                </span>{' '}
                of <span className="font-bold text-white">{totalItems}</span> bookings
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="px-3 py-1 rounded-xl bg-slate-950 border border-white/10 text-white font-bold">
                  {currentPage} / {totalPages}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Comprehensive Booking Detail Modal (Matches External-Booking-Detail-API specification) */}
      <AnimatePresence>
        {selectedBookingId !== null && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="glass-card w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-white/10 bg-slate-900 shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-white/10 bg-white/[0.02] flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-black text-white font-mono flex items-center gap-1.5">
                        BOOKING #{selectedBookingId}
                        <button
                          type="button"
                          onClick={copyBookingId}
                          className="p-1 hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition-colors"
                          title="Copy Booking ID"
                        >
                          {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </h3>
                      {bookingDetail && getStatusBadge(bookingDetail.status)}
                      {bookingDetail?.hireNature && (
                        <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-slate-300 uppercase">
                          {bookingDetail.hireNature}
                        </span>
                      )}
                      {bookingDetail?.hireType !== undefined && bookingDetail?.hireType !== null && (
                        <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-slate-300 uppercase">
                          {bookingDetail.hireType === 1 ? 'Long Hire' : 'Short Hire'}
                        </span>
                      )}
                      {bookingDetail?.isShedule && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-400 uppercase">
                          Scheduled
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      Lak Mobile External Partner System (GET /api/ext/bookings/{selectedBookingId})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenDetail(selectedBookingId)}
                    disabled={loadingDetail}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/5"
                    title="Refresh Detail"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingDetail ? 'animate-spin text-emerald-400' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseDetail}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/5"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Navigation Tabs Bar */}
              <div className="px-5 pt-3 border-b border-white/10 bg-slate-950/60 flex items-center gap-2 overflow-x-auto custom-scrollbar">
                {[
                  { id: 'overview', label: 'Overview & Route', icon: Route },
                  { id: 'billing', label: 'Fare & Billing', icon: DollarSign },
                  { id: 'meter', label: 'Meter & Photos', icon: Gauge, badge: bookingDetail?.meterReading?.startPhotoUrl || bookingDetail?.meterReading?.endPhotoUrl },
                  { id: 'info', label: 'Trip Info & Notes', icon: Info }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = modalActiveTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setModalActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-black uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
                        isActive
                          ? 'border-emerald-400 text-emerald-400 bg-emerald-500/10'
                          : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                      {tab.badge && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Modal Body */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-6 custom-scrollbar text-xs flex-1">
                {loadingDetail ? (
                  <div className="p-20 flex flex-col items-center justify-center space-y-3">
                    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                    <p className="text-slate-400 font-black tracking-widest text-xs uppercase">
                      Loading full booking detail from Lak Mobile API...
                    </p>
                  </div>
                ) : detailError ? (
                  <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-center space-y-3">
                    <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
                    <p className="font-bold text-sm">{detailError}</p>
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(selectedBookingId)}
                      className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 rounded-xl text-rose-200 font-bold uppercase tracking-wider text-xs"
                    >
                      Try Again
                    </button>
                  </div>
                ) : bookingDetail ? (
                  <>
                    {/* TAB 1: OVERVIEW & ROUTE */}
                    {modalActiveTab === 'overview' && (
                      <div className="space-y-6">
                        {/* 3 Core Cards: Customer, Driver, Vehicle */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {/* Customer Card */}
                          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-emerald-400" /> Customer Information
                            </span>
                            <div>
                              <p className="text-sm font-black text-white">
                                {bookingDetail.customerName || 'N/A'}
                              </p>
                              {bookingDetail.mobile && (
                                <a
                                  href={`tel:${bookingDetail.mobile}`}
                                  className="text-slate-300 hover:text-emerald-400 flex items-center gap-1 font-mono text-xs mt-1 transition-colors"
                                >
                                  <Phone className="w-3 h-3 text-slate-500" /> {bookingDetail.mobile}
                                </a>
                              )}
                            </div>
                            {bookingDetail.isCorporate && (
                              <div className="pt-2 border-t border-white/5">
                                <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[9px] font-bold text-blue-400 uppercase tracking-wider block w-fit mb-1">
                                  Corporate Account
                                </span>
                                <p className="text-slate-200 font-semibold">{bookingDetail.companyName || 'Corporate Client'}</p>
                                {bookingDetail.corporateId && (
                                  <p className="text-[10px] text-slate-500 font-mono">Corp ID: #{bookingDetail.corporateId}</p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Driver Card */}
                          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-emerald-400" /> Assigned Driver
                            </span>
                            {bookingDetail.driver || bookingDetail.driverId ? (
                              <div>
                                <p className="text-sm font-black text-white">
                                  {bookingDetail.driver?.name || 'Driver Name N/A'}
                                </p>
                                <p className="text-[11px] font-mono font-bold text-emerald-400 mt-0.5">
                                  ID: {bookingDetail.driver?.userId || bookingDetail.driverId}
                                </p>
                                {bookingDetail.driver?.phone && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <a
                                      href={`tel:${bookingDetail.driver.phone}`}
                                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center gap-1 font-mono text-[11px] transition-colors"
                                    >
                                      <Phone className="w-3 h-3 text-slate-400" />
                                      {bookingDetail.driver.phone}
                                    </a>
                                    {bookingDetail.driver?.whatsappNo && (
                                      <a
                                        href={`https://wa.me/${bookingDetail.driver.whatsappNo.replace(/[^0-9]/g, '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 transition-colors"
                                      >
                                        WhatsApp
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-slate-500 italic py-2">No driver assigned yet</p>
                            )}
                          </div>

                          {/* Vehicle Card */}
                          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Car className="w-3.5 h-3.5 text-emerald-400" /> Assigned Vehicle
                            </span>
                            {bookingDetail.vehicle || bookingDetail.vehiclePlate ? (
                              <div>
                                <p className="text-sm font-black text-white font-mono">
                                  {bookingDetail.vehicle?.plateNo || bookingDetail.vehiclePlate}
                                </p>
                                <p className="text-slate-300 mt-1">
                                  Cab: <span className="text-white font-semibold">{bookingDetail.cabType || bookingDetail.vehicle?.modelCategory || '—'}</span>
                                </p>
                                {bookingDetail.vehicle?.manufacturedYear && (
                                  <p className="text-[11px] text-slate-400">
                                    Year: {bookingDetail.vehicle.manufacturedYear}
                                  </p>
                                )}
                                {bookingDetail.vehicle?.id && (
                                  <p className="text-[10px] text-slate-500 font-mono">
                                    Vehicle ID: #{bookingDetail.vehicle.id}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-slate-500 italic py-2">Vehicle not assigned</p>
                            )}
                          </div>
                        </div>

                        {/* Lifecycle Progress Timeline */}
                        <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-3">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-emerald-400" /> Trip Lifecycle & Timestamps
                          </span>

                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                            {/* Created */}
                            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                              <span className="text-[9px] font-bold text-slate-500 uppercase block">1. Created</span>
                              <p className="text-white font-semibold text-[11px] mt-0.5">{formatDateTime(bookingDetail.createdAt)}</p>
                              {bookingDetail.createdBy && (
                                <p className="text-[9px] text-slate-400 mt-0.5 truncate">by {bookingDetail.createdBy}</p>
                              )}
                            </div>

                            {/* Dispatched */}
                            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                              <span className="text-[9px] font-bold text-slate-500 uppercase block">2. Dispatched</span>
                              <p className="text-white font-semibold text-[11px] mt-0.5">{formatDateTime(bookingDetail.senttime || bookingDetail.picktime)}</p>
                              {(bookingDetail.dispatchByName || bookingDetail.dispatchBy) && (
                                <p className="text-[9px] text-slate-400 mt-0.5 truncate">{bookingDetail.dispatchByName || bookingDetail.dispatchBy}</p>
                              )}
                            </div>

                            {/* Accepted */}
                            <div className={`p-2.5 rounded-xl border ${bookingDetail.acceptedAt ? 'bg-white/[0.02] border-white/5' : 'opacity-40 border-dashed border-white/5'}`}>
                              <span className="text-[9px] font-bold text-slate-500 uppercase block">3. Accepted</span>
                              <p className="text-white font-semibold text-[11px] mt-0.5">{bookingDetail.acceptedAt ? formatDateTime(bookingDetail.acceptedAt) : 'Pending'}</p>
                            </div>

                            {/* At Place */}
                            <div className={`p-2.5 rounded-xl border ${bookingDetail.atPlaceAt ? 'bg-white/[0.02] border-white/5' : 'opacity-40 border-dashed border-white/5'}`}>
                              <span className="text-[9px] font-bold text-slate-500 uppercase block">4. At Place</span>
                              <p className="text-white font-semibold text-[11px] mt-0.5">{bookingDetail.atPlaceAt ? formatDateTime(bookingDetail.atPlaceAt) : 'Pending'}</p>
                            </div>

                            {/* Picked Up */}
                            <div className={`p-2.5 rounded-xl border ${bookingDetail.pickedUpAt ? 'bg-white/[0.02] border-white/5' : 'opacity-40 border-dashed border-white/5'}`}>
                              <span className="text-[9px] font-bold text-slate-500 uppercase block">5. Picked Up</span>
                              <p className="text-white font-semibold text-[11px] mt-0.5">{bookingDetail.pickedUpAt ? formatDateTime(bookingDetail.pickedUpAt) : 'Pending'}</p>
                            </div>

                            {/* Completed / Cancelled */}
                            <div className={`p-2.5 rounded-xl border ${
                              bookingDetail.cancelledAt
                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                                : bookingDetail.completedAt
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                                : 'opacity-40 border-dashed border-white/5'
                            }`}>
                              <span className="text-[9px] font-bold uppercase block">
                                {bookingDetail.cancelledAt ? '6. Cancelled' : '6. Completed'}
                              </span>
                              <p className="font-semibold text-[11px] mt-0.5">
                                {bookingDetail.cancelledAt ? formatDateTime(bookingDetail.cancelledAt) : bookingDetail.completedAt ? formatDateTime(bookingDetail.completedAt) : 'Pending'}
                              </p>
                              {bookingDetail.cancellationReason && (
                                <p className="text-[9px] text-rose-400 mt-0.5 truncate" title={bookingDetail.cancellationReason}>
                                  {bookingDetail.cancellationReason}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Trip Stops List */}
                        <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                              Route Stops ({bookingDetail.tripStops?.length || 0} stops recorded)
                            </span>
                            <span className="text-xs font-bold text-emerald-400">
                              {bookingDetail.pickDropBrief || ''}
                            </span>
                          </div>

                          {bookingDetail.tripStops && bookingDetail.tripStops.length > 0 ? (
                            <div className="space-y-2.5">
                              {bookingDetail.tripStops.map((stop, idx) => {
                                const isPick = stop.type?.toLowerCase() === 'pick';
                                return (
                                  <div
                                    key={stop.id || idx}
                                    className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
                                  >
                                    <div
                                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0 mt-0.5 ${
                                        isPick
                                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                      }`}
                                    >
                                      {isPick ? 'PICKUP' : 'DROP'} #{stop.stopOrder}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <p className="text-slate-200 font-bold text-xs">{stop.address || 'Address not recorded'}</p>
                                      
                                      <div className="flex items-center gap-4 mt-1.5 text-[10px] text-slate-400 flex-wrap">
                                        {stop.reachedAt && (
                                          <span>Reached: <strong className="text-slate-300">{formatDateTime(stop.reachedAt)}</strong></span>
                                        )}
                                        {stop.completedAt && (
                                          <span>Completed: <strong className="text-slate-300">{formatDateTime(stop.completedAt)}</strong></span>
                                        )}
                                        {stop.latitude && stop.longitude && (
                                          <a
                                            href={`https://maps.google.com/?q=${stop.latitude},${stop.longitude}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 font-semibold"
                                          >
                                            <Navigation className="w-3 h-3" />
                                            Google Maps ({stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)})
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-4 rounded-xl bg-white/[0.01] border border-dashed border-white/5 text-slate-400 text-center">
                              No individual stops recorded. Route brief: <strong>{bookingDetail.pickDropBrief || 'N/A'}</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* TAB 2: FARE & BILLING */}
                    {modalActiveTab === 'billing' && (
                      <div className="space-y-6">
                        {/* Summary Totals Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Package Base</span>
                            <p className="text-base font-black text-white">{formatCurrency(bookingDetail.amount)}</p>
                            <p className="text-[10px] text-slate-500">
                              {bookingDetail.initialKm ?? 0} km | {bookingDetail.initialHours ?? 0} hrs
                            </p>
                          </div>

                          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Subtotal</span>
                            <p className="text-base font-black text-slate-200">{formatCurrency(bookingDetail.subTotal)}</p>
                            {bookingDetail.increment ? (
                              <p className="text-[10px] text-amber-400">+{bookingDetail.increment}% increment</p>
                            ) : (
                              <p className="text-[10px] text-slate-500">No increment</p>
                            )}
                          </div>

                          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Advance Paid</span>
                            <p className="text-base font-black text-slate-300">
                              {formatCurrency(bookingDetail.advanceAmount || bookingDetail.payment?.advancePaid || 0)}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {bookingDetail.advancePaymentMethod ? `via ${bookingDetail.advancePaymentMethod}` : 'No advance'}
                            </p>
                          </div>

                          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">Final Total</span>
                            <p className="text-lg font-black text-emerald-300">
                              {formatCurrency(bookingDetail.payment?.totalAmount ?? bookingDetail.finalTotal ?? bookingDetail.subTotal ?? bookingDetail.amount)}
                            </p>
                            <p className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-wider">
                              Due: {formatCurrency(bookingDetail.payment?.balanceDue ?? ((bookingDetail.finalTotal || bookingDetail.subTotal || 0) - (bookingDetail.advanceAmount || 0)))}
                            </p>
                          </div>
                        </div>

                        {/* Detailed Fare Breakdown Matrix */}
                        {bookingDetail.payment?.fareBreakdown && (
                          <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                                Metered / Calculated Fare Breakdown
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-mono font-bold uppercase">
                                Source: {bookingDetail.payment.fareBreakdown.source || 'CALCULATED'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                <span className="text-slate-500 text-[10px] uppercase font-bold block">Run Distance</span>
                                <p className="text-slate-200 font-bold mt-1 text-sm">
                                  {bookingDetail.payment.fareBreakdown.actualKm ?? bookingDetail.payment.distanceKm ?? 0} km
                                </p>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  Pkg allowance: {bookingDetail.payment.fareBreakdown.packageKm ?? bookingDetail.initialKm ?? 0} km
                                </p>
                              </div>

                              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                <span className="text-slate-500 text-[10px] uppercase font-bold block">Run Duration</span>
                                <p className="text-slate-200 font-bold mt-1 text-sm">
                                  {bookingDetail.payment.durationMinutes ?? bookingDetail.payment.fareBreakdown.actualMinutes ?? 0} mins
                                  {bookingDetail.payment.durationHours ? ` (${bookingDetail.payment.durationHours} hrs)` : ''}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  Pkg allowance: {bookingDetail.payment.fareBreakdown.packageMinutes ?? (bookingDetail.initialHours ? bookingDetail.initialHours * 60 : 0)} mins
                                </p>
                              </div>

                              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                <span className="text-slate-500 text-[10px] uppercase font-bold block">Extra Km Rate / Charge</span>
                                <p className="text-slate-200 font-bold mt-1 text-sm">
                                  {formatCurrency(bookingDetail.payment.fareBreakdown.extraKmCharge || 0)}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  {bookingDetail.payment.fareBreakdown.extraKm ?? 0} km @ Rs. {bookingDetail.payment.fareBreakdown.extPerKm ?? bookingDetail.extPerKm ?? 0}/km
                                </p>
                              </div>

                              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                <span className="text-slate-500 text-[10px] uppercase font-bold block">Extra Time Rate / Charge</span>
                                <p className="text-slate-200 font-bold mt-1 text-sm">
                                  {formatCurrency(bookingDetail.payment.fareBreakdown.extraTimeCharge || 0)}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  {bookingDetail.payment.fareBreakdown.extraMinutes ?? 0} mins @ Rs. {bookingDetail.payment.fareBreakdown.extPerMin ?? 0}/min
                                </p>
                              </div>

                              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                <span className="text-slate-500 text-[10px] uppercase font-bold block">Misc Expenses</span>
                                <p className="text-slate-200 font-bold mt-1 text-sm">
                                  {formatCurrency((bookingDetail.payment.driverMiscTotal || 0) + (bookingDetail.payment.callCenterMiscAmount || 0))}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  Driver: Rs. {bookingDetail.payment.driverMiscTotal || 0} | Staff: Rs. {bookingDetail.payment.callCenterMiscAmount || 0}
                                </p>
                              </div>

                              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                <span className="text-slate-500 text-[10px] uppercase font-bold block">Driver Commission</span>
                                <p className="text-emerald-400 font-bold mt-1 text-sm">
                                  {formatCurrency(bookingDetail.driverCommission)}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  Driver share on booking
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Payment Settlement Method */}
                        <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">Payment Type</span>
                            <p className="text-slate-200 font-semibold mt-0.5">
                              {bookingDetail.paymentType === 'CA' ? 'Cash (CA)' : bookingDetail.paymentType === 'CP' ? 'Corporate (CP)' : bookingDetail.paymentType === 'CD' ? 'Card (CD)' : bookingDetail.paymentType || '—'}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">Settlement Method</span>
                            <p className="text-slate-200 font-semibold mt-0.5">
                              {bookingDetail.settlementType || 'CASH'}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">Advance Notes</span>
                            <p className="text-slate-300 mt-0.5">
                              {bookingDetail.advanceNotes || 'None'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 3: METER & PHOTOS */}
                    {modalActiveTab === 'meter' && (
                      <div className="space-y-6">
                        {bookingDetail.meterReading ? (
                          <>
                            {/* Odometer Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Start Odometer</span>
                                <p className="text-xl font-black text-white font-mono mt-1">
                                  {bookingDetail.meterReading.startKm !== null && bookingDetail.meterReading.startKm !== undefined ? `${bookingDetail.meterReading.startKm} km` : '—'}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-1">
                                  Captured: {formatDateTime(bookingDetail.meterReading.startCapturedAt)}
                                </p>
                              </div>

                              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">End Odometer</span>
                                <p className="text-xl font-black text-white font-mono mt-1">
                                  {bookingDetail.meterReading.endKm !== null && bookingDetail.meterReading.endKm !== undefined ? `${bookingDetail.meterReading.endKm} km` : '—'}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-1">
                                  Captured: {formatDateTime(bookingDetail.meterReading.endCapturedAt)}
                                </p>
                              </div>

                              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">Total Run Meter</span>
                                <p className="text-xl font-black text-emerald-300 font-mono mt-1">
                                  {bookingDetail.meterReading.endKm !== null && bookingDetail.meterReading.startKm !== null
                                    ? `${Number(bookingDetail.meterReading.endKm) - Number(bookingDetail.meterReading.startKm)} km`
                                    : '—'}
                                </p>
                                <p className="text-[10px] text-emerald-400/80 mt-1 font-bold">
                                  Difference of start & end odometer
                                </p>
                              </div>
                            </div>

                            {/* Odometer Photos Side-by-Side */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Start Meter Photo */}
                              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <ImageIcon className="w-3.5 h-3.5 text-emerald-400" /> Start Meter Photo
                                  </span>
                                  {bookingDetail.meterReading.startPhotoUrl && (
                                    <button
                                      type="button"
                                      onClick={() => setFullscreenImage({ url: bookingDetail.meterReading!.startPhotoUrl!, title: `Start Meter: Booking #${selectedBookingId}` })}
                                      className="text-emerald-400 hover:text-emerald-300 text-[10px] font-bold flex items-center gap-1"
                                    >
                                      <Maximize2 className="w-3 h-3" /> Zoom
                                    </button>
                                  )}
                                </div>

                                {bookingDetail.meterReading.startPhotoUrl ? (
                                  <div
                                    className="relative rounded-xl overflow-hidden border border-white/10 bg-black aspect-video cursor-pointer group"
                                    onClick={() => setFullscreenImage({ url: bookingDetail.meterReading!.startPhotoUrl!, title: `Start Meter: Booking #${selectedBookingId}` })}
                                  >
                                    <img
                                      src={bookingDetail.meterReading.startPhotoUrl}
                                      alt="Start Meter"
                                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                      loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5">
                                      <Maximize2 className="w-4 h-4" /> Click to expand
                                    </div>
                                  </div>
                                ) : (
                                  <div className="aspect-video rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center text-slate-500 space-y-2">
                                    <ImageIcon className="w-8 h-8 opacity-40" />
                                    <p className="text-xs">No start meter photo captured</p>
                                  </div>
                                )}
                              </div>

                              {/* End Meter Photo */}
                              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <ImageIcon className="w-3.5 h-3.5 text-emerald-400" /> End Meter Photo
                                  </span>
                                  {bookingDetail.meterReading.endPhotoUrl && (
                                    <button
                                      type="button"
                                      onClick={() => setFullscreenImage({ url: bookingDetail.meterReading!.endPhotoUrl!, title: `End Meter: Booking #${selectedBookingId}` })}
                                      className="text-emerald-400 hover:text-emerald-300 text-[10px] font-bold flex items-center gap-1"
                                    >
                                      <Maximize2 className="w-3 h-3" /> Zoom
                                    </button>
                                  )}
                                </div>

                                {bookingDetail.meterReading.endPhotoUrl ? (
                                  <div
                                    className="relative rounded-xl overflow-hidden border border-white/10 bg-black aspect-video cursor-pointer group"
                                    onClick={() => setFullscreenImage({ url: bookingDetail.meterReading!.endPhotoUrl!, title: `End Meter: Booking #${selectedBookingId}` })}
                                  >
                                    <img
                                      src={bookingDetail.meterReading.endPhotoUrl}
                                      alt="End Meter"
                                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                      loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5">
                                      <Maximize2 className="w-4 h-4" /> Click to expand
                                    </div>
                                  </div>
                                ) : (
                                  <div className="aspect-video rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center text-slate-500 space-y-2">
                                    <ImageIcon className="w-8 h-8 opacity-40" />
                                    <p className="text-xs">No end meter photo captured</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="p-16 rounded-2xl border border-dashed border-white/10 text-center space-y-2">
                            <Gauge className="w-10 h-10 text-slate-600 mx-auto" />
                            <p className="text-slate-300 font-bold text-sm">No Meter Reading Recorded</p>
                            <p className="text-slate-500 text-xs max-w-sm mx-auto">
                              Meter readings and odometer photos are only required for Long Hire / Return trips or when submitted by the driver.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 4: TRIP INFO, NOTES & METADATA */}
                    {modalActiveTab === 'info' && (
                      <div className="space-y-6">
                        {/* Extras & Metadata Matrix */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">Passengers</span>
                            <p className="text-sm font-bold text-white mt-1">{bookingDetail.passengerCount ?? 'Not specified'}</p>
                          </div>
                          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">Luggage Pieces</span>
                            <p className="text-sm font-bold text-white mt-1">{bookingDetail.luggage ?? '0'}</p>
                          </div>
                          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">Weight Allowance</span>
                            <p className="text-sm font-bold text-white mt-1">{bookingDetail.weight ? `${bookingDetail.weight} kg` : 'Standard'}</p>
                          </div>
                          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">Promo / Medium</span>
                            <p className="text-sm font-bold text-emerald-400 mt-1">
                              {bookingDetail.promocode || bookingDetail.medium || 'None'}
                            </p>
                          </div>
                        </div>

                        {/* Notes, Comments & Remarks */}
                        <div className="space-y-3">
                          {bookingDetail.cancellationReason && (
                            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 space-y-1">
                              <span className="text-[10px] font-black uppercase tracking-wider block text-rose-400 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" /> Cancellation Reason
                              </span>
                              <p className="font-semibold text-xs leading-relaxed">{bookingDetail.cancellationReason}</p>
                              {bookingDetail.cancelledAt && (
                                <p className="text-[10px] text-rose-400/80">At {formatDateTime(bookingDetail.cancelledAt)}</p>
                              )}
                            </div>
                          )}

                          {bookingDetail.staffComments && (
                            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
                              <span className="text-[10px] font-black uppercase tracking-wider block text-slate-400 flex items-center gap-1">
                                <MessageSquare className="w-3.5 h-3.5 text-blue-400" /> Staff Comments
                              </span>
                              <p className="text-slate-200 text-xs leading-relaxed whitespace-pre-wrap">{bookingDetail.staffComments}</p>
                            </div>
                          )}

                          {bookingDetail.driverComment && (
                            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
                              <span className="text-[10px] font-black uppercase tracking-wider block text-slate-400 flex items-center gap-1">
                                <MessageSquare className="w-3.5 h-3.5 text-amber-400" /> Driver Comment
                              </span>
                              <p className="text-slate-200 text-xs leading-relaxed whitespace-pre-wrap">{bookingDetail.driverComment}</p>
                            </div>
                          )}

                          {bookingDetail.remark && (
                            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
                              <span className="text-[10px] font-black uppercase tracking-wider block text-slate-400 flex items-center gap-1">
                                <Info className="w-3.5 h-3.5 text-emerald-400" /> Remarks
                              </span>
                              <p className="text-slate-200 text-xs leading-relaxed whitespace-pre-wrap">{bookingDetail.remark}</p>
                            </div>
                          )}
                        </div>

                        {/* GPS & External Links */}
                        <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center justify-between flex-wrap gap-3">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">GPS Diagnostic & Map</span>
                            <p className="text-xs text-slate-300">
                              {bookingDetail.gpsPoints?.length ? `${bookingDetail.gpsPoints.length} GPS trace points recorded` : 'No live GPS tracking trace'}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            {bookingDetail.mapRouteLink && (
                              <a
                                href={bookingDetail.mapRouteLink}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors border border-white/10"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                                Route Map
                              </a>
                            )}
                            {bookingDetail.gpsDiagDownloadUrl && (
                              <a
                                href={bookingDetail.gpsDiagDownloadUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors border border-emerald-500/30"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Download GPS Diag
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : null}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
                <div className="text-[11px] text-slate-500 hidden sm:block">
                  Click on any tab above to inspect full booking details, meter photos, and billing.
                </div>
                <button
                  type="button"
                  onClick={handleCloseDetail}
                  className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all ml-auto"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fullscreen Photo Lightbox Modal */}
      <AnimatePresence>
        {fullscreenImage && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer"
            onClick={() => setFullscreenImage(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full flex items-center justify-between text-white pb-3">
                <span className="text-xs font-bold tracking-wider uppercase text-slate-300">{fullscreenImage.title}</span>
                <button
                  type="button"
                  onClick={() => setFullscreenImage(null)}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <img
                src={fullscreenImage.url}
                alt={fullscreenImage.title}
                className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl border border-white/20"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
