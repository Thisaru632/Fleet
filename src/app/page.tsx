'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  RefreshCw,
  LogOut,
  Car,
  MapPin,
  Fuel,
  Wrench,
  ClipboardCheck,
  Camera,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Loader2,
  IdCard,
  Phone,
  Download,
  X,
  Lock,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  History,
  Calendar,
  Database,
  Upload,
  ChevronLeft,
  ChevronRight,
  Filter,
  Trash2,
  Edit,
  Search
} from 'lucide-react';

import LoginModal from '@/components/LoginModal';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function FleetApp() {
  const [user, setUser] = useState<any>(null);
  const [stage, setStage] = useState<'dashboard' | 'new' | 'update' | 'last-trip' | 'salary' | 'contact-office' | 'admin'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [options, setOptions] = useState<{ vehicles: string[], purposes: string[] }>({ vehicles: [], purposes: [] });
  const [tripRefs, setTripRefs] = useState<any[]>([]);
  const [frRefs, setFrRefs] = useState<string[]>([]);
  const [historyFrRefs, setHistoryFrRefs] = useState<string[]>([]);
  const [currentRef, setCurrentRef] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'warning' | 'error', message: string } | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPopup, setShowInstallPopup] = useState(false);
  const [salaryYear, setSalaryYear] = useState(new Date().getFullYear().toString());
  const [salaryMonth, setSalaryMonth] = useState((new Date().getMonth() + 1).toString());
  const [salaryData, setSalaryData] = useState<any[]>([]);
  const [totalSalary, setTotalSalary] = useState(0);
  const [fetchingSalary, setFetchingSalary] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [officeMessage, setOfficeMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Admin Dashboard States
  const [adminData, setAdminData] = useState<any>(null);
  const [fetchingAdmin, setFetchingAdmin] = useState(false);
  const [adminFilters, setAdminFilters] = useState({
    startDate: '',
    endDate: '',
    purpose: 'All',
    status: 'All',
    vehicle: 'All',
    driver: 'All'
  });
  const [adminTab, setAdminTab] = useState<'overview' | 'trips' | 'rankings' | 'fleet' | 'messages' | 'accounts'>('overview');
  const [accountSheetData, setAccountSheetData] = useState<any>(null);
  const [fetchingAccountData, setFetchingAccountData] = useState(false);
  const [accountSearch, setAccountSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [messagesData, setMessagesData] = useState<any>(null);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [fetchingMessages, setFetchingMessages] = useState(false);
  const [importingCsv, setImportingCsv] = useState(false);
  const [adminPage, setAdminPage] = useState(1);
  const [isSyncingAccounts, setIsSyncingAccounts] = useState(false);
  const [clearingFleet, setClearingFleet] = useState(false);
  const [editingTrip, setEditingTrip] = useState<any>(null);
  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  const [viewingImages, setViewingImages] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState<any>({
    vehicle: '',
    purpose: '',
    garageStartMeter: '',
    garageEndMeter: '',
    tripRef: '',
    tripStartMeter: '',
    tripEndMeter: '',
    fuelCost: '',
    repairCost: '',
    comments: '',
    scDueAmount: '',
    drvComms: '',
    startLossMileage: '',
    endLossMileage: '',
    pkgBalanceMileage: '',
    tripPrice: '',
    folderUrl: '',
    folderId: '',
    startTs: '',
    endTs: '',
    totalMileage: '',
    finalPrice: '',
    fuelStationMeter: '',
    fuelLiterCount: '',
  });

  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    garageStartImage: null,
    garageEndImage: null,
    fuelReceipt: null,
    repairReceipt: null,
    fuelStationMeterImage: null,
  });

  const [isFuelSubmitted, setIsFuelSubmitted] = useState(false);

  const handleFuelDetailsSubmit = async () => {
    if (!formData.fuelStationMeter || !files.fuelStationMeterImage || !formData.fuelCost || !files.fuelReceipt || !formData.fuelLiterCount) {
      setAlert({ type: 'error', message: 'Please fill all fields in the Fuel Station details section.' });
      return;
    }

    setLoading(true);
    setAlert({ type: 'warning', message: 'Submitting fuel details to database...' });

    try {
      let uploadFiles: any[] = [];
      uploadFiles.push({ name: `${currentRef}_FuelReceipt`, dataUrl: await fileToBase64(files.fuelReceipt as File) });
      uploadFiles.push({ name: `${currentRef}_FuelStationMeter`, dataUrl: await fileToBase64(files.fuelStationMeterImage as File) });

      let array: any[] = new Array(21).fill('');
      array[0] = user[0];
      array[1] = formData.vehicle;
      array[2] = formData.purpose;
      array[3] = formData.garageStartMeter;
      array[4] = formData.endTs || '';
      array[5] = formData.garageEndMeter || '';
      array[6] = formData.fuelCost;
      
      let finalComments = formData.comments || '';
      if (formData.purpose === 'Fuel') {
        let fuelDetails = [];
        if (formData.fuelStationMeter) fuelDetails.push(`Meter: ${formData.fuelStationMeter} KM`);
        if (formData.fuelLiterCount) fuelDetails.push(`Liters: ${formData.fuelLiterCount}`);
        if (fuelDetails.length > 0) finalComments += ` (Fuel - ${fuelDetails.join(', ')})`;
      }
      array[7] = finalComments;
      array[8] = formData.purpose === 'Repair' ? formData.repairCost : 0;
      array[9] = formData.tripRef || '';
      array[10] = formData.scDueAmount || '';
      array[11] = formData.drvComms || '';
      array[12] = formData.tripStartMeter || '';
      array[13] = formData.tripEndMeter || '';
      array[14] = formData.pkgBalanceMileage || '';
      array[15] = formData.purpose === 'Hire' ? (formData.startLossMileage || '') : '';
      array[16] = formData.purpose === 'Hire' ? (formData.endLossMileage || '') : '';
      array[17] = formData.folderUrl || '';
      array[18] = formData.folderId || '';
      array[19] = formData.totalMileage || '';
      array[20] = formData.tripPrice || '';

      const updateRes = await fetch('/api/fleet/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'fuel', ref: currentRef, array, files: uploadFiles }),
      });
      const updateData = await updateRes.json();
      if (updateData.error) throw new Error(updateData.error);

      setIsFuelSubmitted(true);
      setAlert({ type: 'success', message: 'Fuel details saved to database successfully!' });
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Failed to submit fuel details' });
    } finally {
      setLoading(false);
      setTimeout(() => setAlert(null), 3000);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('fleetUser');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      fetchInitialData(parsedUser[0]);
    }

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }

    // Capture Install Prompt
    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setShowInstallPopup(false);
    });
  }, []);

  useEffect(() => {
    if (user && deferredPrompt) {
      setShowInstallPopup(true);
    }
  }, [user, deferredPrompt]);

  useEffect(() => {
    const handlePopState = () => {
      setStage('dashboard');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const fetchInitialData = async (drvId: string) => {
    try {
      const [optRes, tripRes] = await Promise.all([
        fetch('/api/fleet/options'),
        fetch(`/api/fleet/trips?drvId=${drvId}`)
      ]);
      const optData = await optRes.json();
      const tripData = await tripRes.json();
      setOptions(optData);
      setTripRefs(tripData.tripRefs);
      setFrRefs(tripData.frRefs);
      setHistoryFrRefs(tripData.historyFrRefs);
    } catch (err) {
      console.error('Error fetching initial data:', err);
    }
  };

  const fetchSalaryDetails = async () => {
    if (!user) return;
    setFetchingSalary(true);
    setAlert({ type: 'warning', message: 'Fetching salary details...' });
    try {
      const res = await fetch(`/api/fleet/salary?drvId=${user[0]}&year=${salaryYear}&month=${salaryMonth}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSalaryData(data.salaryDetails);
      setTotalSalary(data.totalSalary);
      setAlert(null);
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Failed to fetch salary details' });
    } finally {
      setFetchingSalary(false);
    }
  };

  useEffect(() => {
    if (stage === 'salary' && user) {
      fetchSalaryDetails();
    }
  }, [stage, salaryYear, salaryMonth, user]);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('fleetUser');
    setUser(null);
    setStage('dashboard');
    setShowLogoutConfirm(false);
  };

  const handleSendMessage = async () => {
    if (!officeMessage.trim()) return;
    setSendingMessage(true);
    try {
      const res = await fetch('/api/fleet/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drvId: user[0],
          drvName: user[4],
          message: officeMessage
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setAlert({ type: 'success', message: 'Message sent to Senu Cabs Office successfully!' });
      setOfficeMessage('');
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Failed to send message' });
    } finally {
      setSendingMessage(false);
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const fetchAdminSales = async (quiet = false) => {
    if (!quiet) setFetchingAdmin(true);
    try {
      const params = new URLSearchParams({
        ...adminFilters,
        page: adminPage.toString(),
        limit: '50'
      });
      const res = await fetch(`/api/admin/sales?${params.toString()}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAdminData(data);
    } catch (err: any) {
      console.error('Error fetching admin sales:', err);
      if (!quiet) setAlert({ type: 'error', message: 'Failed to load dashboard data' });
    } finally {
      if (!quiet) setFetchingAdmin(false);
    }
  };

  useEffect(() => {
    if (stage === 'admin' && user[2]?.toLowerCase() === 'admin') {
      if (adminTab === 'messages') {
        fetchAdminMessages();
      } else if (adminTab === 'accounts') {
        fetchAccountSheetData();
      } else {
        fetchAdminSales();
      }
    }
  }, [stage, adminFilters, adminPage, user, adminTab, debouncedSearch]);

  // Periodic polling to auto-update tables and views without manual refresh
  useEffect(() => {
    if (!user) return;

    const role = user[2]?.toLowerCase();
    const intervalTime = 30 * 1000; // 30 seconds

    const interval = setInterval(() => {
      if (role === 'admin' && stage === 'admin') {
        if (adminTab === 'messages') {
          fetchAdminMessages(true);
        } else if (adminTab === 'accounts') {
          fetchAccountSheetData(true);
        }
      } else if (role === 'driver' && stage !== 'admin' && stage !== 'salary') {
        fetchInitialData(user[0]);
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [stage, adminTab, user]);

  const fetchAccountSheetData = async (quiet = false) => {
    if (!quiet) setFetchingAccountData(true);
    try {
      const res = await fetch(`/api/admin/account-data?page=${adminPage}&limit=50&search=${encodeURIComponent(debouncedSearch)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAccountSheetData(data);
    } catch (err: any) {
      if (!quiet) setAlert({ type: 'error', message: err.message || 'Failed to fetch account data' });
    } finally {
      if (!quiet) setFetchingAccountData(false);
    }
  };

  const handleSyncAccountSheet = async () => {
    setIsSyncingAccounts(true);
    setAlert({ type: 'warning', message: 'Syncing with Google Sheets... This may take a moment.' });
    try {
      const res = await fetch('/api/admin/sync-accounts');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAlert({ type: 'success', message: data.message || 'Account sheet synced successfully!' });
      fetchAccountSheetData(); // Refresh table
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Failed to sync account sheet' });
    } finally {
      setIsSyncingAccounts(false);
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleClearFleetData = async () => {
    if (!confirm("Are you sure you want to clear ALL fleet data? This action cannot be undone.")) return;
    setClearingFleet(true);
    setAlert({ type: 'warning', message: 'Clearing fleet data...' });
    try {
      const res = await fetch('/api/admin/clear-fleet', { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAlert({ type: 'success', message: 'Fleet data cleared successfully!' });
      
      // Refresh admin data
      const queryParams = new URLSearchParams({
        page: adminPage.toString(),
        limit: "50"
      });
      if (adminFilters.purpose !== 'All') queryParams.append('purpose', adminFilters.purpose);
      if (adminFilters.status !== 'All') queryParams.append('status', adminFilters.status);
      if (adminFilters.vehicle !== 'All') queryParams.append('vehicle', adminFilters.vehicle);
      if (adminFilters.driver !== 'All') queryParams.append('driver', adminFilters.driver);
      
      const updatedDataRes = await fetch(`/api/admin/sales?${queryParams.toString()}`);
      const updatedData = await updatedDataRes.json();
      setAdminData(updatedData);
    } catch (err: any) {
      console.error(err);
      setAlert({ type: 'error', message: err.message || 'Failed to clear fleet data' });
    } finally {
      setClearingFleet(false);
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleExportCSV = () => {
    if (!adminData || !adminData.tables || !adminData.tables.fleetData || adminData.tables.fleetData.length === 0) {
      setAlert({ type: 'warning', message: 'No fleet data available to export.' });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    const headers = [
      'Status', 'FR Ref', 'Start TS', 'Driver', 'Vehicle Num',
      'Purpose', 'Garage Start', 'End TS', 'Garage End',
      'Fuel Cost', 'Fuel Meter', 'Fuel Liters', 'Comments', 'Repair Cost', 'Trip Ref',
      'SC Due Amount', 'Drv Comms', 'Trip Start Meter',
      'Trip End Meter', 'Pkg Balance Mileage', 'Loss (Start)',
      'Loss (End)', 'Folder URL', 'Folder ID', 'Total Mileage', 'Final Price'
    ];

    const csvRows = [];
    csvRows.push(headers.join(','));

    adminData.tables.fleetData.forEach((t: any) => {
      const rowValues = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'fuel_meter', 'fuel_liters', 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map((idx) => {
        let val = '';
        if (idx === 'fuel_meter' || idx === 'fuel_liters') {
            if (t.values[5] === 'Fuel') {
                const rawComments = t.values[10] || '';
                const fuelMatch = rawComments.match(/\(Fuel - (.*?)\)/);
                if (fuelMatch) {
                    const fuelStr = fuelMatch[1];
                    if (idx === 'fuel_meter') {
                        const m = fuelStr.match(/Meter:\s*([\d.]+)\s*KM/i);
                        val = m ? m[1] : '-';
                    } else {
                        const m = fuelStr.match(/Liters:\s*([\d.]+)/i);
                        val = m ? m[1] : '-';
                    }
                } else {
                    const oldFuelRegex = /\(Fuel Meter:\s*([\d.]+)\s*KM\)/i;
                    const oldFuelMatch = rawComments.match(oldFuelRegex);
                    if (oldFuelMatch && idx === 'fuel_meter') val = oldFuelMatch[1];
                    else val = '-';
                }
            } else {
                val = '-';
            }
        } else if (idx === 10) {
          val = (t.values[10] || '').toString();
          if (t.values[5] === 'Fuel') {
            val = val.replace(/\(Fuel - (.*?)\)/g, '').replace(/\(Fuel Meter:\s*([\d.]+)\s*KM\)/ig, '').trim();
          }
          if (!val) val = '-';
        } else if (idx === 0) {
          val = t.values[idx as number] || 'Pending';
        } else if (idx === 18 && (t.values[idx as number] === undefined || t.values[idx as number] === null || t.values[idx as number].toString().trim() === '')) {
          val = '0';
        } else if (t.values[idx as number] !== undefined && t.values[idx as number] !== null) {
          val = t.values[idx as number].toString();
        } else {
          val = '-';
        }
        
        // Escape for CSV
        const escaped = val.replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(rowValues.join(','));
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `fleet_data_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteFleetRow = async (ref: string) => {
    if (!confirm(`Are you sure you want to delete trip ${ref}?`)) return;
    try {
      const res = await fetch(`/api/admin/delete-trip?ref=${ref}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAlert({ type: 'success', message: 'Trip deleted successfully!' });
      fetchAdminSales();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Failed to delete trip' });
    }
  };

  const handleSaveEditedTrip = async () => {
    if (!editingTrip) return;
    setSavingEdit(true);
    try {
      const res = await fetch('/api/admin/edit-trip', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: editingTrip.rf,
          status: editingTrip.status,
          driverId: editingTrip.driver,
          vehicle: editingTrip.vehicle,
          purpose: editingTrip.purpose,
          garageStartMeter: editingTrip.values[6],
          garageEndMeter: editingTrip.values[8],
          fuel: editingTrip.values[9],
          repair: editingTrip.values[11],
          commission: editingTrip.values[14],
          tripRef: editingTrip.values[12],
          finalPrice: editingTrip.values[23]
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAlert({ type: 'success', message: 'Trip updated successfully!' });
      setEditingTrip(null);
      fetchAdminSales();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Failed to update trip' });
    } finally {
      setSavingEdit(false);
    }
  };

  const fetchAdminMessages = async (quiet = false) => {
    if (!quiet) setFetchingMessages(true);
    try {
      const res = await fetch(`/api/admin/messages?page=${adminPage}&limit=50`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessagesData(data);
    } catch (err: any) {
      if (!quiet) setAlert({ type: 'error', message: err.message || 'Failed to fetch messages' });
    } finally {
      if (!quiet) setFetchingMessages(false);
    }
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingCsv(true);
    setAlert({ type: 'warning', message: 'Importing CSV data...' });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/import-csv', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setAlert({ type: 'success', message: data.message });
      fetchAdminSales(); // Refresh data
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Failed to import CSV' });
    } finally {
      setImportingCsv(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallPopup(false);
    }
  };

  const handleNewRecord = () => {
    setCurrentRef('TBD'); // Temporary value until submit
    setFormData({
      vehicle: '', purpose: '', garageStartMeter: '', garageEndMeter: '',
      tripRef: '', tripStartMeter: '', tripEndMeter: '', fuelCost: '',
      repairCost: '', comments: '', scDueAmount: '', drvComms: '',
      startLossMileage: '', endLossMileage: '', pkgBalanceMileage: '',
      tripPrice: '', fuelStationMeter: '', fuelLiterCount: '',
    });
    setFiles({
      garageStartImage: null, garageEndImage: null,
      fuelReceipt: null, repairReceipt: null, fuelStationMeterImage: null,
    });
    setIsFuelSubmitted(false);
    window.history.pushState({ stage: 'new' }, '');
    setStage('new');
    setAlert({ type: 'success', message: 'Please fill details. The record will be created when you submit.' });
  };

  const handleUpdateBtnClick = () => {
    setCurrentRef(null);
    setFormData({
      vehicle: '',
      purpose: '',
      garageStartMeter: '',
      garageEndMeter: '',
      tripRef: '',
      tripStartMeter: '',
      tripEndMeter: '',
      fuelCost: '',
      repairCost: '',
      comments: '',
      scDueAmount: '',
      drvComms: '',
      startLossMileage: '',
      endLossMileage: '',
      pkgBalanceMileage: '',
      tripPrice: '',
      fuelStationMeter: '',
      fuelLiterCount: '',
    });
    setFiles({
      garageStartImage: null,
      garageEndImage: null,
      fuelReceipt: null,
      repairReceipt: null,
      fuelStationMeterImage: null,
    });
    setIsFuelSubmitted(false);
    window.history.pushState({ stage: 'update' }, '');
    setStage('update');
  };

  const handleFrRefChange = async (ref: string) => {
    setFetchingDetails(true);
    setAlert({ type: 'warning', message: 'Retrieving reference details...' });
    try {
      const res = await fetch(`/api/fleet/details?type=fr&ref=${ref}`);
      const data = await res.json();
      const details = data.details;

      if (!details) {
        setAlert({ type: 'error', message: 'FR details not found.' });
        setLoading(false);
        return;
      }

      const fetchedTripRef = details[12] || '';

      let rawComments = details[10] || '';
      let extractedMeter = '';
      let extractedLiters = '';

      if (details[5] === 'Fuel') {
        const fuelRegex = /\(Fuel - (.*?)\)/;
        const fuelMatch = rawComments.match(fuelRegex);
        if (fuelMatch) {
          const fuelStr = fuelMatch[1];
          const meterMatch = fuelStr.match(/Meter:\s*([\d.]+)\s*KM/i);
          if (meterMatch) extractedMeter = meterMatch[1];
          const literMatch = fuelStr.match(/Liters:\s*([\d.]+)/i);
          if (literMatch) extractedLiters = literMatch[1];
          rawComments = rawComments.replace(fuelMatch[0], '').trim();
        } else {
          // Backward compatibility for older formatting
          const oldFuelRegex = /\(Fuel Meter:\s*([\d.]+)\s*KM\)/i;
          const oldFuelMatch = rawComments.match(oldFuelRegex);
          if (oldFuelMatch) {
            extractedMeter = oldFuelMatch[1];
            rawComments = rawComments.replace(oldFuelMatch[0], '').trim();
          }
        }
      }

      setFormData((prev: any) => ({
        ...prev,
        vehicle: details[4] || '',
        purpose: details[5] || '',
        garageStartMeter: details[6] || '',
        tripRef: fetchedTripRef,
        folderUrl: details[20] || '',
        folderId: details[21] || '',
        startTs: details[2] || '',
        endTs: details[7] || '',
        fuelCost: details[9] || '',
        comments: rawComments,
        fuelStationMeter: extractedMeter,
        fuelLiterCount: extractedLiters,
        repairCost: details[11] || '',
        scDueAmount: details[13] || '',
        drvComms: stage === 'last-trip' ? (details[14] || '') : '',
        tripStartMeter: stage === 'last-trip' ? (details[15] || '') : '',
        tripEndMeter: stage === 'last-trip' ? (details[16] || '') : '',
        pkgBalanceMileage: stage === 'last-trip' ? (details[17] || '') : '',
        startLossMileage: details[18] || '',
        endLossMileage: details[19] || '',
        totalMileage: details[22] || '',
        finalPrice: details[23] || '',
        tripPrice: details[23] || '',
      }));
      setCurrentRef(ref);
      
      // Auto-disable Fuel section if it was already filled
      if (details[5] === 'Fuel' && (extractedMeter || extractedLiters)) {
        setIsFuelSubmitted(true);
      } else {
        setIsFuelSubmitted(false);
      }

      setAlert(null);

      if (stage !== 'last-trip' && fetchedTripRef && details[5] === 'Hire') {
        await handleTripRefChange(fetchedTripRef);
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to fetch details' });
    } finally {
      setFetchingDetails(false);
    }
  };

  const handleTripRefChange = async (ref: string) => {
    const matchedRef = tripRefs.find((t: any) => (t.ref || t) === ref);
    setFormData((prev: any) => ({
      ...prev,
      tripRef: ref,
      tripStartMeter: matchedRef?.startMeter || '',
      tripEndMeter: matchedRef?.endMeter || ''
    }));

    if (!ref) return;

    setFetchingDetails(true);
    try {
      const res = await fetch(`/api/fleet/details?type=trip&ref=${ref}`);
      const data = await res.json();
      const details = data.details;
      if (details) {
        const cleanNum = (val: any) => val ? val.toString().replace(/[^\d.]/g, '') : '';
        const rawFinalPrice = cleanNum(details[4]);
        const finalPriceNum = Number(rawFinalPrice) || 0;

        // Calculate Driver Salary based on Vehicle Type
        const vehicleType = details[17] ? details[17].toString().trim().toUpperCase() : '';
        let rawSalary = '';
        if (vehicleType === 'WAGON R | 3 SEATER' || vehicleType === 'MINI VAN | 6 SEATER') {
          rawSalary = Math.round(finalPriceNum * 0.20).toString();
        } else if (vehicleType === 'KDH HIGH ROOF VAN | 14 SEATER' || vehicleType === 'BUS | NON AC 32 SEATER') {
          rawSalary = Math.round(finalPriceNum * 0.15).toString();
        } else {
          rawSalary = cleanNum(details[2]); // Fallback to default Driver Comm in account sheet
        }

        const pkgKms = Number(cleanNum(details[33])) || 0;
        const distance = Number(cleanNum(details[58])) || 0;
        const rawPkgBalance = (pkgKms - distance).toString();

        setFormData((prev: any) => ({
          ...prev,
          drvComms: rawSalary,
          tripPrice: rawFinalPrice,
          pkgBalanceMileage: rawPkgBalance
        }));
      }
    } catch (err) {
      console.error("Error fetching trip details:", err);
    } finally {
      setFetchingDetails(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target as any;

    // Prevent negative numbers for price and mileage fields
    if (type === 'number' && Number(value) < 0) return;

    if (id === 'comments') {
      const words = value.trim().split(/\s+/).filter(Boolean);
      if (words.length > 50) {
        const currentWords = (formData.comments || "").trim().split(/\s+/).filter(Boolean);
        if (words.length > currentWords.length) return;
      }
    }

    setFormData((prev: any) => ({ ...prev, [id]: value }));

    // Auto-calcs
    if (id === 'fuelCost') {
      // Calc scDueAmount = Final price - fuel cost - driver salary
      const fuel = Number(value) || 0;
      const tripPrice = Number(formData.tripPrice.toString().replace(/[^\d.]/g, '')) || 0;
      const salary = Number(formData.drvComms) || 0;
      const due = Math.round(tripPrice - fuel - salary);
      setFormData((prev: any) => ({ ...prev, scDueAmount: due }));
    }

    if (id === 'garageEndMeter') {
      const gStart = Number(formData.garageStartMeter);
      const gEnd = Number(value);
      const tStart = Number(formData.tripStartMeter);
      const tEnd = Number(formData.tripEndMeter);
      setFormData((prev: any) => ({
        ...prev,
        startLossMileage: prev.purpose === 'Hire' ? tStart - gStart : '',
        endLossMileage: prev.purpose === 'Hire' ? gEnd - tEnd : '',
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles.length > 0) {
      if (id === 'repairReceipt') {
        // Append files for repairReceipt instead of overwriting
        setFiles((prev: any) => ({
          ...prev,
          [id]: [...(Array.isArray(prev[id]) ? prev[id] : []), ...Array.from(selectedFiles)]
        }));
      } else {
        setFiles((prev: any) => ({ ...prev, [id]: selectedFiles[0] }));
      }
    }
  };

  const removeFile = (id: string, index: number) => {
    setFiles((prev: any) => ({
      ...prev,
      [id]: Array.isArray(prev[id]) ? prev[id].filter((_: any, i: number) => i !== index) : null
    }));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (debouncedSearch !== accountSearch) {
        setDebouncedSearch(accountSearch);
        setAdminPage(1); // Reset to first page on search
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [accountSearch, debouncedSearch]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setAlert({ type: 'warning', message: 'Submitting record, please hold on...' });

    try {
      // Validation
      if (stage === 'new') {
        if (!formData.vehicle || !formData.purpose || !formData.garageStartMeter || !files.garageStartImage) {
          setAlert({ type: 'error', message: 'Please fill all required fields (Vehicle, Purpose, Start KM, and Start Image).' });
          setLoading(false);
          return;
        }
        if (formData.purpose === 'Hire' && !formData.tripRef) {
          setAlert({ type: 'error', message: 'Please select a Trip Reference for Hire records.' });
          setLoading(false);
          return;
        }
      } else {
        // Update stage validation
        if (!formData.garageEndMeter || !files.garageEndImage) {
          setAlert({ type: 'error', message: 'Please enter Garage End KM and upload the End Image.' });
          setLoading(false);
          return;
        }
      }

      const now = new Date();
      const endTs = now.toLocaleString('sv-SE').replace('T', ' ');

      let uploadFiles: any[] = [];
      let actualRef = currentRef;

      if (stage === 'new') {
        setAlert({ type: 'warning', message: 'Generating new Reference...' });
        const createRes = await fetch('/api/fleet/create-ref', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timestamp: endTs, drvId: user[0] }),
        });
        const createData = await createRes.json();

        if (createData.error) {
          throw new Error(createData.error);
        }

        actualRef = createData.reference;
        setCurrentRef(actualRef);

        setAlert({ type: 'warning', message: 'Uploading data...' });
        const fileData = await fileToBase64(files.garageStartImage!);
        uploadFiles.push({ name: `${actualRef} Garage Start`, dataUrl: fileData });

        let array: any[] = new Array(21).fill('');
        array[0] = user[0]; // Driver
        array[1] = formData.vehicle;
        array[2] = formData.purpose;
        array[3] = formData.garageStartMeter;

        if (formData.purpose === 'Hire') array[9] = formData.tripRef;
        if (formData.purpose === 'Repair') array[8] = formData.repairCost;
        if (formData.purpose === 'Fuel') array[6] = formData.fuelCost;

        const updateRes = await fetch('/api/fleet/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stage: 'start', ref: actualRef, array, files: uploadFiles }),
        });
        const updateData = await updateRes.json();
        if (updateData.error) throw new Error(updateData.error);

      } else {
        // Stage update
        if (files.fuelReceipt && !isFuelSubmitted) uploadFiles.push({ name: `${currentRef}_FuelReceipt`, dataUrl: await fileToBase64(files.fuelReceipt) });
        if (files.fuelStationMeterImage && !isFuelSubmitted) uploadFiles.push({ name: `${currentRef}_FuelStationMeter`, dataUrl: await fileToBase64(files.fuelStationMeterImage) });
        if (files.garageEndImage) uploadFiles.push({ name: `${currentRef}_GarageEnd`, dataUrl: await fileToBase64(files.garageEndImage) });
        if (files.repairReceipt) {
          const repairFiles = Array.isArray(files.repairReceipt) ? files.repairReceipt : [files.repairReceipt];
          for (let i = 0; i < repairFiles.length; i++) {
            uploadFiles.push({
              name: `${currentRef}_Repair_${i + 1}`,
              dataUrl: await fileToBase64(repairFiles[i] as File)
            });
          }
        }

        // Calculate Total Mileage
        const totalMileage = Number(formData.garageEndMeter) - Number(formData.garageStartMeter);

        let array: any[] = new Array(21).fill('');
        array[0] = user[0];
        array[1] = formData.vehicle;
        array[2] = formData.purpose;
        array[3] = formData.garageStartMeter;
        array[4] = endTs;
        array[5] = formData.garageEndMeter;
        array[6] = formData.fuelCost;
        let finalComments = formData.comments || '';
        if (formData.purpose === 'Fuel') {
          let fuelDetails = [];
          if (formData.fuelStationMeter) fuelDetails.push(`Meter: ${formData.fuelStationMeter} KM`);
          if (formData.fuelLiterCount) fuelDetails.push(`Liters: ${formData.fuelLiterCount}`);
          if (fuelDetails.length > 0) finalComments += ` (Fuel - ${fuelDetails.join(', ')})`;
        }
        array[7] = finalComments;
        array[8] = formData.purpose === 'Repair' ? formData.repairCost : 0;
        array[9] = formData.tripRef || '';
        array[10] = formData.scDueAmount || '';
        array[11] = formData.drvComms || '';
        array[12] = formData.tripStartMeter || '';
        array[13] = formData.tripEndMeter || '';
        array[14] = formData.pkgBalanceMileage || '';
        array[15] = formData.purpose === 'Hire' ? (formData.startLossMileage || '') : '';
        array[16] = formData.purpose === 'Hire' ? (formData.endLossMileage || '') : '';
        array[17] = formData.folderUrl || '';
        array[18] = formData.folderId || '';
        array[19] = totalMileage || '';
        array[20] = formData.tripPrice || '';

        await fetch('/api/fleet/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stage: 'end', ref: currentRef, array, files: uploadFiles }),
        });
      }

      setAlert({ type: 'success', message: 'Record successfully updated!' });
      setTimeout(() => {
        setStage('dashboard');
        setAlert(null);
        setFormData({
          vehicle: '', purpose: '', garageStartMeter: '', garageEndMeter: '', tripRef: '',
          tripStartMeter: '', tripEndMeter: '', fuelCost: '', repairCost: '', comments: '',
          scDueAmount: '', drvComms: '', startLossMileage: '', endLossMileage: '', pkgBalanceMileage: '', fuelStationMeter: '', fuelLiterCount: '',
        });
        setFiles({ garageStartImage: null, garageEndImage: null, fuelReceipt: null, repairReceipt: null, fuelStationMeterImage: null });
        setIsFuelSubmitted(false);
        fetchInitialData(user[0]);
      }, 3000);
    } catch (err) {
      setAlert({ type: 'error', message: 'Submission failed' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <LoginModal onLogin={(u) => { setUser(u); fetchInitialData(u[0]); }} />;

  return (
    <main className={cn("container mx-auto px-4 py-8", stage === 'admin' ? "max-w-full" : "max-w-xl")}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <img src="/logo.jpg" alt="Logo" className="w-16 h-16 object-contain" />
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white uppercase">
          SC FLEET MANAGEMENT
        </h1>
      </div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card p-8 w-full max-w-sm text-center space-y-6 border-rose-500/20"
            >
              <div className="w-20 h-20 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto">
                <LogOut className="w-10 h-10 text-rose-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white">ARE YOU SURE?</h3>
                <p className="text-slate-400 text-sm">You will need to login again to access your fleet records.</p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all font-bold text-sm"
                >
                  CANCEL
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 py-3 rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition-all font-bold text-sm"
                >
                  YES, LOGOUT
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Driver Info Bar */}
      {stage !== 'admin' && (
        <div className="glass-card p-4 mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center px-3 border-r border-white/10">
              <IdCard className="w-5 h-5 text-emerald-500 mb-1" />
              <span className="text-xs font-bold text-white">{user[0]}</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{user[4]}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Phone className="w-3 h-3" />
                <span className="text-[10px]">{user[3]}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Dashboard Actions */}
      <AnimatePresence mode="wait">
        {stage === 'dashboard' ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-2 gap-4 mb-8"
          >
            <button
              onClick={handleNewRecord}
              disabled={loading}
              className="flex flex-col items-center justify-center p-8 glass-card hover:border-emerald-500/50 transition-all group"
            >
              <div className="p-4 rounded-2xl bg-emerald-500/10 group-hover:bg-emerald-500 group-hover:text-white transition-all mb-4">
                <Plus className="w-8 h-8 text-emerald-500 group-hover:text-white" />
              </div>
              <span className="font-bold text-sm">NEW RECORD</span>
            </button>
            <button
              onClick={handleUpdateBtnClick}
              disabled={loading}
              className="flex flex-col items-center justify-center p-8 glass-card hover:border-blue-500/50 transition-all group"
            >
              <div className="p-4 rounded-2xl bg-blue-500/10 group-hover:bg-blue-500 group-hover:text-white transition-all mb-4">
                <RefreshCw className="w-8 h-8 text-blue-500 group-hover:text-white" />
              </div>
              <span className="font-bold text-sm text-center">UPDATE RECORD</span>
            </button>

            <button
              onClick={() => {
                window.history.pushState({ stage: 'last-trip' }, '');
                setStage('last-trip');
              }}
              disabled={loading}
              className="flex flex-col items-center justify-center p-8 glass-card hover:border-purple-500/50 transition-all group"
            >
              <div className="p-4 rounded-2xl bg-purple-500/10 group-hover:bg-purple-500 group-hover:text-white transition-all mb-4">
                <MapPin className="w-8 h-8 text-purple-500 group-hover:text-white" />
              </div>
              <span className="font-bold text-sm text-center uppercase">Last Trip Details</span>
            </button>

            <button
              onClick={() => {
                window.history.pushState({ stage: 'salary' }, '');
                setStage('salary');
              }}
              disabled={loading}
              className="flex flex-col items-center justify-center p-8 glass-card hover:border-emerald-500/50 transition-all group"
            >
              <div className="p-4 rounded-2xl bg-emerald-500/10 group-hover:bg-emerald-500 group-hover:text-white transition-all mb-4">
                <IdCard className="w-8 h-8 text-emerald-500 group-hover:text-white" />
              </div>
              <span className="font-bold text-sm text-center uppercase">Salary Details</span>
            </button>

            <button
              onClick={() => {
                window.history.pushState({ stage: 'contact-office' }, '');
                setStage('contact-office');
              }}
              disabled={loading}
              className="flex flex-col items-center justify-center p-8 glass-card hover:border-blue-500/50 transition-all group"
            >
              <div className="p-4 rounded-2xl bg-blue-500/10 group-hover:bg-blue-500 group-hover:text-white transition-all mb-4">
                <MessageSquare className="w-8 h-8 text-blue-500 group-hover:text-white" />
              </div>
              <span className="font-bold text-sm text-center uppercase">Contact Office</span>
            </button>

            {user[2]?.toLowerCase() === 'admin' && (
              <button
                onClick={() => {
                  window.history.pushState({ stage: 'admin' }, '');
                  setAlert(null);
                  setStage('admin');
                }}
                disabled={loading}
                className="flex flex-col items-center justify-center p-8 glass-card hover:border-rose-500/50 transition-all group"
              >
                <div className="p-4 rounded-2xl bg-rose-500/10 group-hover:bg-rose-500 group-hover:text-white transition-all mb-4">
                  <Lock className="w-8 h-8 text-rose-500 group-hover:text-white" />
                </div>
                <span className="font-bold text-sm text-center uppercase">Admin Dashboard</span>
              </button>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {stage === 'contact-office' && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 space-y-4 border-blue-500/20 bg-blue-500/5"
          >
            <div className="flex items-center gap-3 text-white font-bold text-sm mb-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              SEND MESSAGE TO SENU CABS OFFICE
            </div>
            <p className="text-sm font-bold text-slate-200 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
              Senu cabs කාර්යාලය වෙත පැමිනිල්ලක්, පණිවුඩයක් හෝ කිසියම් දැනුම් දීමක් කිරිමට අවශ්ය නම් පහත "Send Message" පහසුකම භාවිතා කරන්න.
            </p>
            <textarea
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all resize-none"
              placeholder="Type your message here..."
              rows={6}
              value={officeMessage}
              onChange={(e) => setOfficeMessage(e.target.value)}
            />
            <button
              onClick={handleSendMessage}
              disabled={sendingMessage || !officeMessage.trim()}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
            >
              {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : 'SEND MESSAGE'}
            </button>
          </motion.div>

          <button
            onClick={() => setStage('dashboard')}
            className="w-full py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest"
          >
            Back to Dashboard
          </button>
        </div>
      )}

      {stage === 'admin' && (
        <div className="space-y-8 pb-20">
          {/* Header & Back */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <TrendingUp className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Sales Dashboard</h2>
                <p className="text-[10px] text-emerald-500/60 font-black tracking-widest uppercase">Admin Control Panel</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-widest cursor-pointer transition-all">
                {importingCsv ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {importingCsv ? 'Importing...' : 'Import CSV'}
                <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} disabled={importingCsv} />
              </label>
              <button
                onClick={() => {
                  setAlert(null);
                  setStage('dashboard');
                }}
                className="px-4 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest"
              >
                Exit Admin
              </button>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10 w-fit">
            <button
              onClick={() => setAdminTab('overview')}
              className={cn(
                "px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2",
                adminTab === 'overview' ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-white"
              )}
            >
              <Activity className="w-4 h-4" />
              OVERVIEW
            </button>
            <button
              onClick={() => setAdminTab('trips')}
              className={cn(
                "px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2",
                adminTab === 'trips' ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-white"
              )}
            >
              <History className="w-4 h-4" />
              RECENT TRIPS
            </button>
            <button
              onClick={() => setAdminTab('rankings')}
              className={cn(
                "px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2",
                adminTab === 'rankings' ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-white"
              )}
            >
              <Users className="w-4 h-4" />
              RANKINGS
            </button>
            <button
              onClick={() => setAdminTab('fleet')}
              className={cn(
                "px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2",
                adminTab === 'fleet' ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-white"
              )}
            >
              <Database className="w-4 h-4" />
              FLEET DATA
            </button>
            <button
              onClick={() => setAdminTab('messages')}
              className={cn(
                "px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2",
                adminTab === 'messages' ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-white"
              )}
            >
              <MessageSquare className="w-4 h-4" />
              MESSAGES
            </button>
            <button
              onClick={() => setAdminTab('accounts')}
              className={cn(
                "px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2",
                adminTab === 'accounts' ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-white"
              )}
            >
              <IdCard className="w-4 h-4" />
              ACCOUNT SHEET
            </button>
          </div>

          {/* Filters */}
          <div className="glass-card p-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar className="w-2.5 h-2.5" /> From
                </label>
                <input
                  type="date"
                  className="w-full input-field py-2 text-[10px] text-white h-9"
                  value={adminFilters.startDate}
                  onChange={(e) => setAdminFilters({ ...adminFilters, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar className="w-2.5 h-2.5" /> To
                </label>
                <input
                  type="date"
                  className="w-full input-field py-2 text-[10px] text-white h-9"
                  value={adminFilters.endDate}
                  onChange={(e) => setAdminFilters({ ...adminFilters, endDate: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Purpose</label>
                <select
                  className="w-full input-field py-2 text-[10px] text-white h-9"
                  value={adminFilters.purpose}
                  onChange={(e) => setAdminFilters({ ...adminFilters, purpose: e.target.value })}
                >
                  {adminData?.filterOptions.purposes.map((p: string) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Status</label>
                <select
                  className="w-full input-field py-2 text-[10px] text-white h-9"
                  value={adminFilters.status}
                  onChange={(e) => setAdminFilters({ ...adminFilters, status: e.target.value })}
                >
                  {adminData?.filterOptions.statuses.map((s: string) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Vehicle</label>
                <select
                  className="w-full input-field py-2 text-[10px] text-white h-9"
                  value={adminFilters.vehicle}
                  onChange={(e) => setAdminFilters({ ...adminFilters, vehicle: e.target.value })}
                >
                  <option value="All">All Vehicles</option>
                  {adminData?.filterOptions.vehicles.map((v: string) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Driver</label>
                <select
                  className="w-full input-field py-2 text-[10px] text-white h-9"
                  value={adminFilters.driver}
                  onChange={(e) => setAdminFilters({ ...adminFilters, driver: e.target.value })}
                >
                  <option value="All">All Drivers</option>
                  {adminData?.filterOptions.drivers.map((d: string) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          </div>
          {fetchingAdmin ? (
            <div className="glass-card p-20 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
              <p className="text-slate-400 font-black tracking-widest text-xs uppercase animate-pulse">Calculating Stats...</p>
            </div>
          ) : adminData ? (
            <div className="space-y-8">


              {adminTab === 'overview' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {[
                      { label: 'Total Sales', value: adminData.kpis.totalSales, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                      { label: 'Driver Comms', value: adminData.kpis.totalCommission, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                      { label: 'Loss Mileage', value: adminData.kpis.totalMileage, unit: 'KM', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                      { label: 'Hires Count', value: adminData.kpis.hireCount, unit: 'Trips', icon: ClipboardCheck, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                      { label: 'Fuel Cost', value: adminData.kpis.totalFuel, icon: Fuel, color: 'text-sky-500', bg: 'bg-sky-500/10' },
                      { label: 'Repair Cost', value: adminData.kpis.totalRepairCost, icon: Wrench, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                    ].map((kpi, idx) => (
                      <div key={idx} className="glass-card p-6 space-y-4">
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", kpi.bg)}>
                          <kpi.icon className={cn("w-6 h-6", kpi.color)} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{kpi.label}</p>
                          <p className="text-2xl font-black text-white tracking-tight">
                            {kpi.unit === 'KM' || kpi.unit === 'Trips' || kpi.unit === 'Repairs' ? '' : 'Rs. '}
                            {kpi.value.toLocaleString()}
                            <span className="text-xs ml-1 text-slate-500 font-bold">{kpi.unit || ''}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary Rankings Preview */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="glass-card overflow-hidden">
                      <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Top 3 Vehicles</h3>
                        <Car className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="divide-y divide-white/5">
                        {adminData.tables.topVehicles.slice(0, 3).map((v: any, i: number) => (
                          <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-slate-500">#{i + 1}</span>
                              <span className="text-xs font-bold text-white">{v.vehicle}</span>
                            </div>
                            <span className="text-xs font-black text-emerald-500">Rs. {v.sales.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => setAdminTab('rankings')}
                        className="w-full py-3 bg-white/5 text-[10px] font-black text-slate-400 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        SEE ALL RANKINGS <TrendingUp className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="glass-card overflow-hidden">
                      <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Top 3 Drivers</h3>
                        <Users className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="divide-y divide-white/5">
                        {adminData.tables.topDrivers.slice(0, 3).map((d: any, i: number) => (
                          <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-slate-500">#{i + 1}</span>
                              <span className="text-xs font-bold text-white">{d.driver}</span>
                            </div>
                            <span className="text-xs font-black text-blue-500">Rs. {d.sales.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => setAdminTab('rankings')}
                        className="w-full py-3 bg-white/5 text-[10px] font-black text-slate-400 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        SEE ALL RANKINGS <TrendingUp className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {adminTab === 'rankings' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                >
                  <div className="glass-card overflow-hidden">
                    <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Top 10 Vehicles by Sales</h3>
                      <Car className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="divide-y divide-white/5">
                      {adminData.tables.topVehicles.map((v: any, i: number) => (
                        <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-500">#{i + 1}</span>
                            <span className="text-xs font-bold text-white">{v.vehicle}</span>
                          </div>
                          <span className="text-xs font-black text-emerald-500">Rs. {v.sales.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-card overflow-hidden">
                    <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Top 10 Drivers by Sales</h3>
                      <Users className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="divide-y divide-white/5">
                      {adminData.tables.topDrivers.map((d: any, i: number) => (
                        <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-500">#{i + 1}</span>
                            <span className="text-xs font-bold text-white">{d.driver}</span>
                          </div>
                          <span className="text-xs font-black text-blue-500">Rs. {d.sales.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {adminTab === 'trips' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card overflow-hidden"
                >
                  <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Trips</h3>
                    <History className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                          {['FR Ref', 'Date', 'Driver', 'Vehicle', 'Purpose', 'Status', 'Sales', 'Commission', 'Fuel', 'Repair', 'Loss Mileage'].map(h => (
                            <th key={h} className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {adminData.tables.recentTrips.map((t: any, i: number) => (
                          <tr key={i} className="hover:bg-white/5 transition-colors group">
                            <td className="px-6 py-4 text-[10px] font-bold text-white whitespace-nowrap">{t.rf}</td>
                            <td className="px-6 py-4 text-[10px] text-slate-500 whitespace-nowrap">{t.date.split(' ')[0]}</td>
                            <td className="px-6 py-4 text-[10px] font-bold text-white whitespace-nowrap">{t.driver}</td>
                            <td className="px-6 py-4 text-[10px] text-slate-400 whitespace-nowrap">{t.vehicle}</td>
                            <td className="px-6 py-4">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                                t.purpose === 'Hire' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                              )}>
                                {t.purpose}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                                t.status === 'Approved' ? "bg-emerald-500 text-black" : "bg-amber-500 text-black"
                              )}>
                                {t.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-[10px] font-black text-emerald-500 whitespace-nowrap">Rs. {t.finalPrice?.toLocaleString()}</td>
                            <td className="px-6 py-4 text-[10px] font-black text-blue-400 whitespace-nowrap">Rs. {t.comms.toLocaleString()}</td>
                            <td className="px-6 py-4 text-[10px] text-rose-400 whitespace-nowrap">Rs. {t.fuel.toLocaleString()}</td>
                            <td className="px-6 py-4 text-[10px] text-amber-400 whitespace-nowrap">Rs. {t.repair.toLocaleString()}</td>
                            <td className="px-6 py-4 text-[10px] text-slate-400 whitespace-nowrap">{t.mileage} KM</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {adminTab === 'fleet' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card overflow-hidden"
                >
                  <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Complete Fleet Data</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">{adminData.tables.fleetData.length} Records</span>
                      <Database className="w-4 h-4 text-emerald-500" />
                      <button
                        onClick={() => fetchAdminSales()}
                        className="p-2 rounded-lg hover:bg-white/5 transition-all text-slate-400 hover:text-white"
                        title="Refresh Data"
                      >
                        <RefreshCw className={cn("w-4 h-4", fetchingAdmin && "animate-spin")} />
                      </button>
                      <button
                        onClick={handleExportCSV}
                        className="px-3 py-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black rounded text-[10px] font-bold transition-colors uppercase tracking-wider flex items-center gap-1"
                        title="Export to CSV"
                      >
                        <Download className="w-3 h-3" />
                        Export CSV
                      </button>
                      <button
                        onClick={handleClearFleetData}
                        disabled={clearingFleet}
                        className="ml-4 px-3 py-1 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded text-[10px] font-bold transition-colors uppercase tracking-wider flex items-center gap-1"
                      >
                        {clearingFleet ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        Clear Data
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                          {[
                            'Status', 'FR Ref', 'Start TS', 'Driver', 'Vehicle Num',
                            'Purpose', 'Garage Start', 'Garage End', 'End TS',
                            'Fuel Cost', 'Fuel Meter', 'Fuel Liters', 'Comments', 'Repair Cost', 'Trip Ref',
                            'SC Due Amount', 'Drv Comms', 'Trip Start Meter',
                            'Trip End Meter', 'Pkg Balance Mileage', 'Loss (Start)',
                            'Loss (End)', 'Folder URL', 'Folder ID', 'Total Mileage', 'Final Price',
                            'Actions'
                          ].map(h => (
                            <th key={h} className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {adminData.tables.fleetData.map((t: any, i: number) => {
                          const vehicleNum = t.values[4];
                          const rawGarageStart = t.values[6];
                          
                          const prevTrip = vehicleNum ? adminData.tables.fleetData.slice(i + 1).find((pt: any) => pt.values[4] === vehicleNum) : null;
                          const rawPrevGarageEnd = prevTrip ? prevTrip.values[8] : null;
                          
                          let mismatch = 0;
                          let hasMismatch = false;
                          
                          if (
                            rawGarageStart !== undefined && rawGarageStart !== null && String(rawGarageStart).trim() !== '' &&
                            rawPrevGarageEnd !== undefined && rawPrevGarageEnd !== null && String(rawPrevGarageEnd).trim() !== ''
                          ) {
                            const garageStart = Number(String(rawGarageStart).replace(/[^\d.-]/g, ''));
                            const prevGarageEnd = Number(String(rawPrevGarageEnd).replace(/[^\d.-]/g, ''));
                            if (!isNaN(garageStart) && !isNaN(prevGarageEnd) && garageStart !== prevGarageEnd) {
                              mismatch = Math.abs(garageStart - prevGarageEnd);
                              hasMismatch = mismatch > 0;
                            }
                          }

                          return (
                            <tr 
                              key={i} 
                              className="transition-colors group hover:bg-white/5"
                            >
                            {[0, 1, 2, 3, 4, 5, 6, 8, 7, 9, 'fuel_meter', 'fuel_liters', 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map((idx) => (
                              <td 
                                key={idx} 
                                className={cn(
                                  "px-6 py-4 text-[10px] whitespace-nowrap",
                                  hasMismatch && idx === 6 ? "animate-pulse bg-red-500/30 font-bold" : ""
                                )}
                                title={hasMismatch && idx === 6 ? `${mismatch} km mismatch with the last trip for this vehicle` : undefined}
                              >
                                {idx === 'fuel_meter' || idx === 'fuel_liters' ? (
                                  <span className="text-white">
                                    {(() => {
                                      if (t.values[5] === 'Fuel') {
                                        const rawComments = t.values[10] || '';
                                        const fuelMatch = rawComments.match(/\(Fuel - (.*?)\)/);
                                        if (fuelMatch) {
                                          const fuelStr = fuelMatch[1];
                                          if (idx === 'fuel_meter') {
                                            const m = fuelStr.match(/Meter:\s*([\d.]+)\s*KM/i);
                                            return m ? m[1] : '-';
                                          } else {
                                            const m = fuelStr.match(/Liters:\s*([\d.]+)/i);
                                            return m ? m[1] : '-';
                                          }
                                        } else {
                                          const oldFuelRegex = /\(Fuel Meter:\s*([\d.]+)\s*KM\)/i;
                                          const oldFuelMatch = rawComments.match(oldFuelRegex);
                                          if (oldFuelMatch && idx === 'fuel_meter') return oldFuelMatch[1];
                                          return '-';
                                        }
                                      }
                                      return '-';
                                    })()}
                                  </span>
                                ) : idx === 0 ? (
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                                    t.values[idx as number] === 'Approved' ? "bg-emerald-500 text-black" : "bg-amber-500 text-black"
                                  )}>
                                    {t.values[idx as number] || 'Pending'}
                                  </span>
                                ) : idx === 5 ? (
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                                    t.values[idx as number] === 'Hire' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                                  )}>
                                    {t.values[idx as number]}
                                  </span>
                                ) : idx === 20 ? (
                                  <button
                                    onClick={() => setViewingImages({ rf: t.rf, images: t.images || [] })}
                                    className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-black border border-emerald-500/20 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all"
                                  >
                                    View
                                  </button>
                                ) : idx === 21 ? (
                                  <span className="text-slate-500 italic max-w-[100px] truncate block" title={t.values[idx as number]}>
                                    {t.values[idx as number] || '-'}
                                  </span>
                                ) : idx === 10 ? (
                                  <span className="font-sans font-normal text-white">
                                    {(() => {
                                      let val = (t.values[10] || '').toString();
                                      if (t.values[5] === 'Fuel') {
                                        val = val.replace(/\(Fuel - (.*?)\)/g, '').replace(/\(Fuel Meter:\s*([\d.]+)\s*KM\)/ig, '').trim();
                                      }
                                      return val || '-';
                                    })()}
                                  </span>
                                ) : (
                                  <span className={cn(
                                    "font-sans font-normal",
                                    (idx === 13 || idx === 14 || idx === 23) ? "text-emerald-500" :
                                      (idx === 9 || idx === 11) ? "text-rose-400" : "text-white"
                                  )}>
                                    {idx === 18 && (t.values[idx as number] === undefined || t.values[idx as number] === null || t.values[idx as number].toString().trim() === '')
                                      ? '0'
                                      : (t.values[idx as number] !== undefined && t.values[idx as number] !== null ? t.values[idx as number].toString() : '-')}
                                  </span>
                                )}
                              </td>
                            ))}
                            <td className="px-6 py-4 text-[10px] whitespace-nowrap flex items-center gap-2">
                              <button
                                onClick={() => setEditingTrip(t)}
                                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg text-[10px] font-black transition-colors uppercase tracking-wider"
                              >
                                <Edit className="w-3 h-3" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteFleetRow(t.rf)}
                                className="flex items-center gap-1 px-2.5 py-1 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-lg text-[10px] font-black transition-colors uppercase tracking-wider"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {adminData.pagination && adminData.pagination.totalPages > 1 && (
                    <div className="p-4 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
                      <p className="text-[10px] text-slate-500 font-medium">
                        Showing <span className="text-white font-bold">{((adminData.pagination.page - 1) * 50) + 1}</span> to <span className="text-white font-bold">{Math.min(adminData.pagination.page * 50, adminData.pagination.totalItems)}</span> of <span className="text-white font-bold">{adminData.pagination.totalItems}</span> records
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setAdminPage(prev => Math.max(1, prev - 1))}
                          disabled={adminData.pagination.page === 1}
                          className="p-2 rounded-lg border border-white/5 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        {/* Page Numbers */}
                        {Array.from({ length: Math.min(5, adminData.pagination.totalPages) }).map((_, i) => {
                          let pageNum = 1;
                          if (adminData.pagination.totalPages <= 5) pageNum = i + 1;
                          else if (adminData.pagination.page <= 3) pageNum = i + 1;
                          else if (adminData.pagination.page >= adminData.pagination.totalPages - 2) pageNum = adminData.pagination.totalPages - 4 + i;
                          else pageNum = adminData.pagination.page - 2 + i;

                          return (
                            <button
                              key={i}
                              onClick={() => setAdminPage(pageNum)}
                              className={cn(
                                "w-8 h-8 rounded-lg text-[10px] font-bold transition-all",
                                adminData.pagination.page === pageNum ? "bg-emerald-500 text-black" : "text-slate-400 hover:text-white hover:bg-white/5"
                              )}
                            >
                              {pageNum}
                            </button>
                          );
                        })}

                        <button
                          onClick={() => setAdminPage(prev => Math.min(adminData.pagination.totalPages, prev + 1))}
                          disabled={adminData.pagination.page === adminData.pagination.totalPages}
                          className="p-2 rounded-lg border border-white/5 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          ) : null}

          {adminTab === 'accounts' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="glass-card overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <IdCard className="w-5 h-5 text-emerald-500" />
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Sheet Data</h3>
                  </div>
                  <div className="flex items-center gap-2 flex-1 max-w-md ml-auto">
                    <div className="relative w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="Search records..."
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                        value={accountSearch}
                        onChange={(e) => setAccountSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSyncAccountSheet}
                      disabled={isSyncingAccounts}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                    >
                      {isSyncingAccounts ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      SYNC NOW
                    </button>
                    <button
                      onClick={() => fetchAccountSheetData()}
                      className="p-2 rounded-lg hover:bg-white/5 transition-all text-slate-400 hover:text-white"
                      title="Refresh Data"
                    >
                      <RefreshCw className={cn("w-4 h-4", fetchingAccountData && "animate-spin")} />
                    </button>
                  </div>
                </div>

                {fetchingAccountData ? (
                  <div className="p-20 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                    <p className="text-slate-400 font-black tracking-widest text-xs uppercase">Loading Account Data...</p>
                  </div>
                ) : accountSheetData?.data?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                          {(accountSheetData?.headers || [
                            'Status', 'FR Ref', 'Start TS', 'Driver', 'Vehicle Num',
                            'Purpose', 'Garage Start', 'End TS', 'Garage End',
                            'Fuel Cost', 'Comments', 'Repair Cost', 'Trip Ref',
                            'SC Due Amount', 'Drv Comms', 'Trip Start Meter',
                            'Trip End Meter', 'Pkg Balance Mileage', 'Loss (Start)',
                            'Loss (End)', 'Folder URL', 'Folder ID', 'Total Mileage', 'Final Price'
                          ]).map((h: string) => (
                            <th key={h} className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {accountSheetData.data
                          .map((row: any, i: number) => (
                          <tr key={i} className="hover:bg-white/5 transition-colors group">
                            {(row.rawValues || []).map((val: any, idx: number) => (
                              <td key={idx} className="px-6 py-4 text-[10px] whitespace-nowrap">
                                {idx === 0 ? (
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                                    val === 'Approved' ? "bg-emerald-500 text-black" : "bg-amber-500 text-black"
                                  )}>
                                    {val || 'Pending'}
                                  </span>
                                ) : idx === 5 ? (
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                                    val === 'Hire' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                                  )}>
                                    {val}
                                  </span>
                                ) : (
                                  <span className={cn(
                                    "font-sans font-normal",
                                    (idx === 13 || idx === 14 || idx === 23) ? "text-emerald-500" :
                                      (idx === 9 || idx === 11) ? "text-rose-400" : "text-white"
                                  )}>
                                    {val !== undefined && val !== null ? val.toString() : '-'}
                                  </span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-20 text-center">
                    <p className="text-slate-500 font-bold">No account data found.</p>
                  </div>
                )}

                {/* Pagination for account sheet */}
                {accountSheetData?.pagination && accountSheetData.pagination.totalPages > 1 && (
                  <div className="p-4 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <p className="text-[10px] text-slate-500 font-medium">
                      Showing <span className="text-white font-bold">{((accountSheetData.pagination.page - 1) * 50) + 1}</span> to <span className="text-white font-bold">{Math.min(accountSheetData.pagination.page * 50, accountSheetData.pagination.totalItems)}</span> of <span className="text-white font-bold">{accountSheetData.pagination.totalItems}</span> records
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setAdminPage(prev => Math.max(1, prev - 1))}
                        disabled={accountSheetData.pagination.page === 1}
                        className="p-2 rounded-lg border border-white/5 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setAdminPage(prev => Math.min(accountSheetData.pagination.totalPages, prev + 1))}
                        disabled={accountSheetData.pagination.page === accountSheetData.pagination.totalPages}
                        className="p-2 rounded-lg border border-white/5 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {adminTab === 'messages' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="glass-card overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Driver Messages</h3>
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                </div>

                {fetchingMessages ? (
                  <div className="p-20 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                    <p className="text-slate-400 font-black tracking-widest text-xs uppercase">Loading Messages...</p>
                  </div>
                ) : messagesData?.messages?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                          {['Status', 'Driver ID', 'Driver Name', 'Message Preview', 'Actions'].map(h => (
                            <th key={h} className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {messagesData.messages.map((msg: any, i: number) => (
                          <tr key={i} className={cn("hover:bg-white/5 transition-colors group", !msg.isRead && "bg-blue-500/[0.02]")}>
                            <td className="px-6 py-4">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                                msg.isRead ? "bg-slate-500/10 text-slate-500" : "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                              )}>
                                {msg.isRead ? 'READ' : 'NEW'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-[10px] font-bold text-white">{msg.driverId}</td>
                            <td className="px-6 py-4 text-[10px] font-bold text-slate-300">{msg.driverName || '-'}</td>
                            <td className="px-6 py-4 text-[10px] text-slate-500 max-w-[200px] truncate italic">"{msg.message}"</td>
                            <td className="px-6 py-4">
                              <button
                                onClick={async () => {
                                  setSelectedMessage(msg);
                                  if (!msg.isRead) {
                                    await fetch('/api/admin/messages', {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ id: msg._id }),
                                    });
                                    fetchAdminMessages(); // Refresh status
                                  }
                                }}
                                className="px-4 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all border border-blue-500/20"
                              >
                                VIEW
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-20 text-center">
                    <p className="text-slate-500 font-bold">No messages found.</p>
                  </div>
                )}
              </div>

              {/* Message View Modal */}
              <AnimatePresence>
                {selectedMessage && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      className="w-full max-w-lg glass-card p-8 space-y-6 relative border-blue-500/30 bg-slate-900/90 shadow-2xl shadow-blue-500/10"
                    >
                      <button
                        onClick={() => setSelectedMessage(null)}
                        className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>

                      <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                          <MessageSquare className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-white uppercase tracking-tight">Driver Message</h3>
                          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{selectedMessage.timestamp}</p>
                        </div>
                      </div>

                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Driver</p>
                          <p className="text-sm font-bold text-white">{selectedMessage.driverName} ({selectedMessage.driverId})</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Message Content</p>
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 min-h-[150px]">
                          <p className="text-slate-200 text-sm leading-relaxed italic">
                            "{selectedMessage.message}"
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedMessage(null)}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl transition-all shadow-lg shadow-blue-600/20 uppercase tracking-widest text-xs"
                      >
                        CLOSE MESSAGE
                      </button>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Pagination for messages */}
              {messagesData?.pagination && messagesData.pagination.totalPages > 1 && (
                <div className="p-4 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <p className="text-[10px] text-slate-500 font-medium">
                    Showing <span className="text-white font-bold">{((messagesData.pagination.page - 1) * 50) + 1}</span> to <span className="text-white font-bold">{Math.min(messagesData.pagination.page * 50, messagesData.pagination.totalItems)}</span> of <span className="text-white font-bold">{messagesData.pagination.totalItems}</span> messages
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setAdminPage(prev => Math.max(1, prev - 1))}
                      disabled={messagesData.pagination.page === 1}
                      className="p-2 rounded-lg border border-white/5 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setAdminPage(prev => Math.min(messagesData.pagination.totalPages, prev + 1))}
                      disabled={messagesData.pagination.page === messagesData.pagination.totalPages}
                      className="p-2 rounded-lg border border-white/5 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* Alert Component */}
      <AnimatePresence>
        {alert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
              "p-4 rounded-2xl mb-6 flex items-center gap-3 border shadow-lg",
              alert.type === 'success' && "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
              alert.type === 'warning' && "bg-amber-500/10 border-amber-500/20 text-amber-400",
              alert.type === 'error' && "bg-rose-500/10 border-rose-500/20 text-rose-400"
            )}
          >
            {alert.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <p className="text-sm font-medium">{alert.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Content */}
      <AnimatePresence>
        {stage !== 'dashboard' && stage !== 'admin' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {stage === 'last-trip' && (
              <div className="glass-card p-6 space-y-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center block">Select FR Number (Last 10)</label>
                <select
                  className="w-full input-field py-3"
                  value={currentRef || ''}
                  onChange={(e) => handleFrRefChange(e.target.value)}
                >
                  <option value="" disabled>Select FR Reference</option>
                  {historyFrRefs?.map((ref, idx) => (
                    <option key={`${ref}-${idx}`} value={ref}>{ref}</option>
                  ))}
                </select>
              </div>
            )}

            {stage === 'salary' && (
              <div className="space-y-6">
                <div className="glass-card p-6 space-y-4">
                  <div className="flex items-center gap-3 text-white font-bold text-lg mb-2">
                    <IdCard className="w-5 h-5 text-emerald-500" />
                    Salary Period
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Year</label>
                      <select
                        className="w-full input-field py-3 text-white bg-white/5 border-white/10 rounded-xl px-4 text-sm"
                        value={salaryYear}
                        onChange={(e) => setSalaryYear(e.target.value)}
                      >
                        {[2024, 2025, 2026, 2027].map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Month</label>
                      <select
                        className="w-full input-field py-3 text-white bg-white/5 border-white/10 rounded-xl px-4 text-sm"
                        value={salaryMonth}
                        onChange={(e) => setSalaryMonth(e.target.value)}
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                          <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Summary Card */}
                {salaryData.length > 0 && (
                  <div className="glass-card p-6 bg-emerald-500/10 border-emerald-500/20">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-8">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block">Salary</span>
                          <span className="text-3xl font-black text-white">Rs. {totalSalary.toLocaleString()}</span>
                        </div>
                        <div className="w-px h-10 bg-white/10" />
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Hire Count</span>
                          <span className="text-2xl font-bold text-white">{salaryData.length} <span className="text-xs font-normal text-slate-400">Trips</span></span>
                        </div>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter italic">
                          {new Date(2000, parseInt(salaryMonth) - 1).toLocaleString('default', { month: 'short' })} {salaryYear}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Trip Table */}
                {salaryData.length > 0 && (
                  <div className="glass-card overflow-hidden">
                    <div className="p-4 border-b border-white/10 bg-white/5">
                      <div className="grid grid-cols-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span>Trip Reference</span>
                        <span>Date</span>
                        <span className="text-right">Salary (Rs)</span>
                      </div>
                    </div>
                    <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
                      {salaryData.map((item, idx) => (
                        <div key={idx} className="p-4 grid grid-cols-3 items-center hover:bg-white/5 transition-colors">
                          <span className="text-xs font-bold text-white">{item.tripRef}</span>
                          <span className="text-[10px] text-slate-400">{item.date?.split(' ')[0]}</span>
                          <span className="text-xs font-bold text-emerald-400 text-right">{item.salary.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {salaryData.length === 0 && !fetchingSalary && (
                  <div className="glass-card p-12 text-center border-dashed border-white/10">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                      <IdCard className="w-8 h-8 text-emerald-500/50" />
                    </div>
                    <p className="text-slate-400 text-sm font-medium">
                      No hire commissions found for this period.
                    </p>
                  </div>
                )}

                <button
                  onClick={() => {
                    setStage('dashboard');
                    setSalaryData([]);
                    setTotalSalary(0);
                  }}
                  className="w-full py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest"
                >
                  Back to Dashboard
                </button>
              </div>
            )}

            {stage === 'last-trip' && !currentRef && (
              <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                  <MapPin className="w-10 h-10 text-purple-500" />
                </div>
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                  Last Trip Details
                </h2>
                <p className="text-slate-400 text-sm max-w-xs">
                  Please select a reference number above to view trip details.
                </p>
                <button
                  onClick={() => window.history.back()}
                  className="mt-6 px-8 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm font-bold"
                >
                  GO BACK
                </button>
              </div>
            )}
            {stage === 'last-trip' && currentRef && (
              <div className="space-y-6">
                <div className="glass-card p-6 border-purple-500/30 bg-purple-500/5">
                  <div className="flex items-center gap-3 text-white font-bold text-lg mb-6">
                    <ClipboardCheck className="w-6 h-6 text-purple-500" />
                    Detailed Trip Report: {currentRef}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {[
                      { label: 'Start Timestamp', value: formData.startTs },
                      { label: 'End Timestamp', value: formData.endTs },
                      { label: 'Vehicle Number', value: formData.vehicle },
                      { label: 'Purpose', value: formData.purpose },
                      { label: 'Trip Reference', value: formData.tripRef },
                      { label: 'Garage Start', value: `${formData.garageStartMeter} KM` },
                      { label: 'Garage End', value: `${formData.garageEndMeter} KM` },
                      { label: 'Trip Start', value: `${formData.tripStartMeter} KM` },
                      { label: 'Trip End', value: `${formData.tripEndMeter} KM` },
                      { label: 'Pkg Balance', value: `${formData.pkgBalanceMileage} KM` },
                      { label: 'Loss (Start)', value: `${formData.startLossMileage} KM` },
                      { label: 'Loss (End)', value: `${formData.endLossMileage} KM` },
                      { label: 'Total Mileage', value: `${formData.totalMileage} KM` },
                      { label: 'Fuel Cost', value: `Rs. ${formData.fuelCost}` },
                      { label: 'Repair Cost', value: `Rs. ${formData.repairCost}` },
                      { label: 'SC Due', value: `Rs. ${formData.scDueAmount}`, highlight: true },
                      { label: 'Driver Comms', value: `Rs. ${formData.drvComms}`, highlight: true },
                      { label: 'Final Price', value: `Rs. ${formData.finalPrice}`, highlight: true },
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{item.label}</p>
                        <p className={cn("text-sm font-bold", item.highlight ? "text-purple-400" : "text-white")}>
                          {item.value || 'N/A'}
                        </p>
                      </div>
                    ))}
                  </div>

                  {formData.comments && (
                    <div className="mt-8 pt-6 border-t border-white/5">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">Comments / Remarks</p>
                      <p className="text-sm text-slate-200 italic leading-relaxed">"{formData.comments}"</p>
                    </div>
                  )}

                  <div className="mt-8">
                    <button
                      onClick={() => {
                        setCurrentRef(null);
                        setFormData({
                          vehicle: '', purpose: '', garageStartMeter: '', garageEndMeter: '',
                          tripRef: '', tripStartMeter: '', tripEndMeter: '', fuelCost: '',
                          repairCost: '', comments: '', scDueAmount: '', drvComms: '',
                          startLossMileage: '', endLossMileage: '', pkgBalanceMileage: '',
                          tripPrice: '', totalMileage: '', finalPrice: '', startTs: '', endTs: ''
                        });
                      }}
                      className="w-full py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest"
                    >
                      Close Report
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* FR Reference Selection (Update Stage) */}
            {stage === 'update' && (
              <div className="glass-card p-6 space-y-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Reference</label>
                <select
                  className="w-full input-field py-3"
                  value={currentRef || ''}
                  onChange={(e) => handleFrRefChange(e.target.value)}
                >
                  <option value="" disabled>Select FR Reference</option>
                  {frRefs?.map((ref, idx) => (
                    <option key={`${ref}-${idx}`} value={ref}>{ref}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Core Details Card */}
            {(currentRef || stage === 'new') && stage !== 'last-trip' && stage !== 'salary' && stage !== 'contact-office' && (
              <div className="glass-card p-6 space-y-6">
                <div className="flex items-center gap-3 text-white font-bold text-lg mb-2">
                  <Car className="w-5 h-5 text-emerald-500" />
                  Vehicle & Purpose
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Vehicle</label>
                    <select
                      id="vehicle"
                      disabled={stage === 'update'}
                      className="w-full input-field py-3"
                      value={formData.vehicle}
                      onChange={handleInputChange}
                    >
                      <option value="">Select</option>
                      {options?.vehicles?.map((v, idx) => <option key={`${v}-${idx}`} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Purpose</label>
                    <select
                      id="purpose"
                      disabled={stage === 'update'}
                      className="w-full input-field py-3"
                      value={formData.purpose}
                      onChange={handleInputChange}
                    >
                      <option value="">Select</option>
                      {options?.purposes?.map((p, idx) => <option key={`${p}-${idx}`} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Garage Start (KM)</label>
                    <input
                      id="garageStartMeter"
                      type="number"
                      min="0"
                      disabled={stage === 'update'}
                      className="w-full input-field py-3"
                      value={formData.garageStartMeter}
                      onChange={handleInputChange}
                    />
                  </div>
                  {stage === 'new' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Start Image</label>
                      <div className="relative">
                        <Camera className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          id="garageStartImage"
                          type="file"
                          accept="image/*"
                          className="w-full input-field py-2 pr-10 text-[10px]"
                          onChange={handleFileChange}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stage Specific Cards */}
            {formData.purpose === 'Hire' && (stage === 'new' || stage === 'update') && (
              <div className="glass-card p-6 space-y-6 relative overflow-hidden">
                {fetchingDetails && (
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md z-20 flex flex-col items-center justify-center">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-2" />
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Loading Trip Data...</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-white font-bold text-lg mb-2">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  Hire Details
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Trip Reference</label>
                  <select
                    id="tripRef"
                    disabled={stage === 'update'}
                    className="w-full input-field py-3"
                    value={formData.tripRef}
                    onChange={(e) => handleTripRefChange(e.target.value)}
                  >
                    <option value="">Select</option>
                    {(() => {
                      // Filter by vehicle if selected
                      let filtered = (tripRefs || []).filter(t => !formData.vehicle || t.vehicle?.toString().trim().toUpperCase() === formData.vehicle.toString().trim().toUpperCase()).map(t => t.ref);
                      // Ensure the current value is in the list (especially for the Update stage)
                      if (formData.tripRef && !filtered.includes(formData.tripRef)) {
                        filtered = [formData.tripRef, ...filtered];
                      }
                      return filtered.map((t, idx) => <option key={`${t}-${idx}`} value={t}>{t}</option>);
                    })()}
                  </select>
                </div>

                {stage === 'update' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 uppercase">Trip Start</p>
                      <p className="font-bold">{formData.tripStartMeter} KM</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 uppercase">Trip End</p>
                      <p className="font-bold">{formData.tripEndMeter} KM</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 uppercase">Driver Salary</p>
                      <p className="font-bold text-emerald-400">Rs. {formData.drvComms ? Number(formData.drvComms).toLocaleString() : ''}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 uppercase">Pkg Balance</p>
                      <p className="font-bold text-amber-400">{formData.pkgBalanceMileage ? `${Number(formData.pkgBalanceMileage).toLocaleString()} KM` : ''}</p>
                    </div>
                    <div className="space-y-1 col-span-2 border-t border-white/5 pt-3 mt-1">
                      <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Final Price</p>
                      <p className="text-xl font-black text-white">Rs. {formData.tripPrice ? Number(formData.tripPrice).toLocaleString() : '0'}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            )}



            {formData.purpose === 'Fuel' && stage === 'update' && (
              <div className="glass-card p-6 space-y-6 border-sky-500/20 bg-sky-500/5">
                <div className="flex items-center gap-3 text-white font-bold text-lg mb-2">
                  <Fuel className="w-5 h-5 text-sky-500" />
                  Details in the Fuel Station
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Meter in the Fuel Station</label>
                    <input
                      id="fuelStationMeter"
                      type="number"
                      min="0"
                      disabled={isFuelSubmitted}
                      className="w-full input-field py-3 disabled:opacity-50"
                      value={formData.fuelStationMeter || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Meter Image Upload</label>
                    <input
                      id="fuelStationMeterImage"
                      type="file"
                      accept="image/*"
                      disabled={isFuelSubmitted}
                      className="w-full input-field py-2 text-[10px] disabled:opacity-50"
                      onChange={handleFileChange}
                    />
                  </div>
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Fuel Liter Count</label>
                    <input
                      id="fuelLiterCount"
                      type="number"
                      min="0"
                      step="0.01"
                      disabled={isFuelSubmitted}
                      className="w-full input-field py-3 disabled:opacity-50"
                      value={formData.fuelLiterCount || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Fuel Cost (Rs.)</label>
                    <input
                      id="fuelCost"
                      type="number"
                      min="0"
                      disabled={isFuelSubmitted}
                      className="w-full input-field py-3 disabled:opacity-50"
                      value={formData.fuelCost}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Fuel Receipt</label>
                    <input
                      id="fuelReceipt"
                      type="file"
                      accept="image/*"
                      disabled={isFuelSubmitted}
                      className="w-full input-field py-2 text-[10px] disabled:opacity-50"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>

                <button
                  onClick={handleFuelDetailsSubmit}
                  disabled={isFuelSubmitted}
                  className={cn(
                    "w-full py-4 font-black rounded-xl transition-all shadow-lg uppercase tracking-widest text-xs flex items-center justify-center gap-2",
                    isFuelSubmitted 
                      ? "bg-slate-500/50 text-slate-400 cursor-not-allowed" 
                      : "bg-sky-500 hover:bg-sky-400 text-black shadow-sky-500/20"
                  )}
                >
                  {isFuelSubmitted ? 'Details Submitted' : 'Submit Fuel Details'}
                </button>
                {isFuelSubmitted && (
                   <p className="text-center text-[10px] text-emerald-400 font-bold uppercase mt-2">
                     Submitted details displayed above.
                   </p>
                )}
              </div>
            )}

            {stage === 'update' && (
              <div className="glass-card p-6 space-y-6">
                <div className="flex items-center gap-3 text-white font-bold text-lg mb-2">
                  <ClipboardCheck className="w-5 h-5 text-emerald-500" />
                  End Trip Details
                </div>

                {formData.purpose !== 'Fuel' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Fuel Cost (Rs.)</label>
                      <input
                        id="fuelCost"
                        type="number"
                        min="0"
                        className="w-full input-field py-3"
                        value={formData.fuelCost}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Fuel Receipt</label>
                      <input
                        id="fuelReceipt"
                        type="file"
                        className="w-full input-field py-2 text-[10px]"
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Garage End (KM)</label>
                    <input
                      id="garageEndMeter"
                      type="number"
                      min="0"
                      className="w-full input-field py-3"
                      value={formData.garageEndMeter}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">End Image</label>
                    <input
                      id="garageEndImage"
                      type="file"
                      className="w-full input-field py-2 text-[10px]"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>

                {formData.purpose === 'Repair' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Repair Cost (Rs.)</label>
                      <input
                        id="repairCost"
                        type="number"
                        min="0"
                        className="w-full input-field py-3"
                        value={formData.repairCost}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Repair Receipt</label>
                      <input
                        id="repairReceipt"
                        type="file"
                        multiple
                        className="w-full input-field py-2 text-[10px]"
                        onChange={handleFileChange}
                      />
                      {files.repairReceipt && Array.isArray(files.repairReceipt) && files.repairReceipt.length > 0 && (
                        <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                          {files.repairReceipt.map((f, i) => (
                            <div key={i} className="flex items-center justify-between text-[10px] text-slate-400 bg-white/5 p-2 rounded-lg border border-white/5">
                              <span className="truncate flex-1 mr-2">{f.name}</span>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  removeFile('repairReceipt', i);
                                }}
                                className="text-rose-500 hover:text-rose-400 font-bold px-1"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Comments</label>
                  <textarea
                    id="comments"
                    rows={3}
                    className="w-full input-field py-3"
                    value={formData.comments}
                    onChange={handleInputChange}
                  />
                </div>


              </div>
            )}

            {formData.purpose === 'Hire' && stage === 'update' && (
              <div className="glass-card p-6 border-rose-500/30 bg-rose-500/5">
                <div className="flex items-center gap-3 text-white font-bold text-lg mb-4">
                  <AlertCircle className="w-5 h-5 text-rose-500" />
                  Mileage Loss Summary
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase">Start Loss</p>
                    <p className="font-bold text-white">
                      {(Number(formData.tripStartMeter) - Number(formData.garageStartMeter))} KM
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase">End Loss</p>
                    <p className="font-bold text-white">
                      {formData.garageEndMeter ? (Number(formData.garageEndMeter) - Number(formData.tripEndMeter)) : 0} KM
                    </p>
                  </div>
                  <div className="space-y-1 border-l border-white/10 pl-4">
                    <p className="text-[10px] text-emerald-400 font-bold uppercase">SC Due Amount</p>
                    <p className="text-2xl font-black text-emerald-500">
                      Rs. {formData.scDueAmount}
                    </p>
                  </div>
                  <div className="space-y-1 border-l border-white/10 pl-4">
                    <p className="text-[10px] text-rose-400 font-bold uppercase">Total Loss</p>
                    <p className="text-2xl font-black text-rose-500">
                      {formData.garageEndMeter ? ((Number(formData.tripStartMeter) - Number(formData.garageStartMeter)) + (Number(formData.garageEndMeter) - Number(formData.tripEndMeter))) : 0} KM
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            {(stage === 'new' || stage === 'update') && (
              <div className="flex gap-4">
                <button
                  onClick={() => window.history.back()}
                  className="flex-1 py-4 glass-card font-bold hover:bg-white/5 transition-colors"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !formData.purpose || (stage === 'update' && !formData.garageEndMeter) || (formData.purpose === 'Hire' && !formData.tripRef)}
                  className="flex-[2] py-4 btn-gradient text-white font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ClipboardCheck className="w-5 h-5" />}
                  SUBMIT RECORD
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {/* PWA Install Popup */}
      <AnimatePresence>
        {showInstallPopup && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-6 right-6 z-[100] md:max-w-md md:mx-auto"
          >
            <div className="glass-card p-5 border-blue-500/30 bg-slate-900/90 backdrop-blur-xl shadow-2xl shadow-blue-500/20 relative">
              <button
                onClick={() => setShowInstallPopup(false)}
                className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                  <Download className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-base leading-tight">Install Fleet App</h3>
                  <p className="text-slate-400 text-xs mt-1">Add to your home screen for quick access and better experience.</p>
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={handleInstall}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-600/20"
                >
                  <Download className="w-4 h-4" />
                  Install Now
                </button>
                <button
                  onClick={() => setShowInstallPopup(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
                >
                  Later
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Trip Modal */}
      <AnimatePresence>
        {editingTrip && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Edit Fleet Record ({editingTrip.rf})</h3>
                </div>
                <button
                  onClick={() => setEditingTrip(null)}
                  className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Status</label>
                    <select
                      value={editingTrip.status}
                      onChange={(e) => setEditingTrip({ ...editingTrip, status: e.target.value })}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Driver ID</label>
                    <input
                      type="text"
                      value={editingTrip.driver}
                      onChange={(e) => setEditingTrip({ ...editingTrip, driver: e.target.value })}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Vehicle Num</label>
                    <input
                      type="text"
                      value={editingTrip.vehicle}
                      onChange={(e) => setEditingTrip({ ...editingTrip, vehicle: e.target.value })}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Purpose</label>
                    <select
                      value={editingTrip.purpose}
                      onChange={(e) => setEditingTrip({ ...editingTrip, purpose: e.target.value })}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Hire">Hire</option>
                      <option value="Repair">Repair</option>
                      <option value="Personal">Personal</option>
                      <option value="Fuel">Fuel</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Garage Start KM</label>
                    <input
                      type="number"
                      value={editingTrip.values[6] || ''}
                      onChange={(e) => {
                        const newValues = [...editingTrip.values];
                        newValues[6] = e.target.value;
                        setEditingTrip({ ...editingTrip, values: newValues });
                      }}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Garage End KM</label>
                    <input
                      type="number"
                      value={editingTrip.values[8] || ''}
                      onChange={(e) => {
                        const newValues = [...editingTrip.values];
                        newValues[8] = e.target.value;
                        setEditingTrip({ ...editingTrip, values: newValues });
                      }}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Fuel Cost</label>
                    <input
                      type="number"
                      value={editingTrip.values[9] || ''}
                      onChange={(e) => {
                        const newValues = [...editingTrip.values];
                        newValues[9] = e.target.value;
                        setEditingTrip({ ...editingTrip, values: newValues });
                      }}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Repair Cost</label>
                    <input
                      type="number"
                      value={editingTrip.values[11] || ''}
                      onChange={(e) => {
                        const newValues = [...editingTrip.values];
                        newValues[11] = e.target.value;
                        setEditingTrip({ ...editingTrip, values: newValues });
                      }}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Driver Comms</label>
                    <input
                      type="number"
                      value={editingTrip.values[14] || ''}
                      onChange={(e) => {
                        const newValues = [...editingTrip.values];
                        newValues[14] = e.target.value;
                        setEditingTrip({ ...editingTrip, values: newValues });
                      }}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Trip Ref (Booking Ref)</label>
                    <input
                      type="text"
                      value={editingTrip.values[12] || ''}
                      onChange={(e) => {
                        const newValues = [...editingTrip.values];
                        newValues[12] = e.target.value;
                        setEditingTrip({ ...editingTrip, values: newValues });
                      }}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Final Price</label>
                    <input
                      type="number"
                      value={editingTrip.values[23] || ''}
                      onChange={(e) => {
                        const newValues = [...editingTrip.values];
                        newValues[23] = e.target.value;
                        setEditingTrip({ ...editingTrip, values: newValues });
                      }}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-white/5 bg-white/5 flex items-center justify-end gap-2">
                <button
                  onClick={() => setEditingTrip(null)}
                  className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEditedTrip}
                  disabled={savingEdit}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {savingEdit && <Loader2 className="w-3 h-3 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Images Modal */}
      <AnimatePresence>
        {viewingImages && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Uploaded Images ({viewingImages.rf})</h3>
                </div>
                <button
                  onClick={() => setViewingImages(null)}
                  className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-950/40">
                {viewingImages.images && viewingImages.images.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {viewingImages.images.map((img: any, idx: number) => (
                      <div key={idx} className="glass-card overflow-hidden border border-white/5 flex flex-col">
                        <div className="p-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{img.name}</span>
                          <span className="text-[9px] text-slate-500 font-bold">{idx + 1} of {viewingImages.images.length}</span>
                        </div>
                        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[300px] p-2">
                          <img
                            src={img.dataUrl}
                            alt={img.name}
                            className="max-h-[400px] w-auto object-contain rounded-lg shadow-lg hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-20 flex flex-col items-center justify-center text-center space-y-3">
                    <Camera className="w-12 h-12 text-slate-600 animate-pulse" />
                    <p className="text-slate-400 font-black tracking-widest text-xs uppercase">No images found in database</p>
                    <p className="text-slate-500 text-[10px]">Images are stored in MongoDB when new records are submitted or updated.</p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-white/5 bg-white/5 flex items-center justify-end">
                <button
                  onClick={() => setViewingImages(null)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20"
                >
                  Close Viewer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
