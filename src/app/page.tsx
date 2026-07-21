'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Search,
  Eye,
  MoreVertical,
  Image as ImageIcon,
  Copy
} from 'lucide-react';

import LoginModal from '@/components/LoginModal';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar
} from 'recharts';
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
  const [officeTab, setOfficeTab] = useState<'send' | 'inbox'>('send');
  const [sentMessages, setSentMessages] = useState<any[]>([]);
  const [fetchingSentMessages, setFetchingSentMessages] = useState(false);
  const [inboxMessages, setInboxMessages] = useState<any[]>([]);
  const [fetchingInboxMessages, setFetchingInboxMessages] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showRefreshPopup, setShowRefreshPopup] = useState(false);

  // Admin Dashboard States
  const [adminData, setAdminData] = useState<any>(null);
  const [fetchingAdmin, setFetchingAdmin] = useState(false);
  const [adminFilters, setAdminFilters] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return {
      startDate: `${y}-${m}-01`,
      endDate: `${y}-${m}-${d}`,
      purpose: 'All',
      status: 'All',
      vehicle: 'All',
      driver: 'All'
    };
  });
  const [adminTab, setAdminTab] = useState<'overview' | 'trips' | 'rankings' | 'fleet' | 'messages' | 'accounts' | 'vehicles' | 'driver-manage' | 'commission' | 'report'>('overview');
  const [reportCategory, setReportCategory] = useState<'Credit' | 'Invoice'>('Credit');
  const [reportStartDate, setReportStartDate] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
  });
  const [reportEndDate, setReportEndDate] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [vehicleCommissions, setVehicleCommissions] = useState<Record<string, number>>({});
  const [accountSheetData, setAccountSheetData] = useState<any>(null);
  const [fetchingAccountData, setFetchingAccountData] = useState(false);
  const [accountSearch, setAccountSearch] = useState('');
  const [fleetSearch, setFleetSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [messagesData, setMessagesData] = useState<any>(null);
  const [reportAccountData, setReportAccountData] = useState<any>(null);
  const [reportFleetData, setReportFleetData] = useState<any>(null);
  const [fetchingReportData, setFetchingReportData] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [fetchingMessages, setFetchingMessages] = useState(false);
  const [adminMessageTab, setAdminMessageTab] = useState<'inbox' | 'sent'>('inbox');
  const [showAdminMessageModal, setShowAdminMessageModal] = useState(false);
  const [adminMessageText, setAdminMessageText] = useState('');
  const [adminMessageDriver, setAdminMessageDriver] = useState<string[]>(['All']);
  const [showDriverDropdown, setShowDriverDropdown] = useState(false);
  const driverDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (driverDropdownRef.current && !driverDropdownRef.current.contains(event.target as Node)) {
        setShowDriverDropdown(false);
      }
    };

    if (showDriverDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDriverDropdown]);
  const [importingCsv, setImportingCsv] = useState(false);
  const [adminPage, setAdminPage] = useState(1);
  const [isSyncingAccounts, setIsSyncingAccounts] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [clearingFleet, setClearingFleet] = useState(false);
  const [editingTrip, setEditingTrip] = useState<any>(null);
  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  const [viewingImages, setViewingImages] = useState<any>(null);
  const [viewingTrip, setViewingTrip] = useState<any>(null);
  const [viewingDriver, setViewingDriver] = useState<any>(null);
  const [editingDriver, setEditingDriver] = useState<any>(null);
  const [addingDriver, setAddingDriver] = useState<any>(null);
  const [savingDriver, setSavingDriver] = useState(false);
  const [vehicleDrivers, setVehicleDrivers] = useState<Record<string, string>>({});
  const [driverManageFilters, setDriverManageFilters] = useState({
    search: '',
    driver: 'All',
    status: 'All',
    vehicle: 'All'
  });

  const [debouncedFleetSearch, setDebouncedFleetSearch] = useState('');
  const [newVehicleNumber, setNewVehicleNumber] = useState('');
  const [addingVehicle, setAddingVehicle] = useState(false);

  const cumulativeSalesData = useMemo(() => {
    if (!adminData?.charts?.dailySales) return [];
    let runningTotal = 0;
    return adminData.charts.dailySales.map((d: any) => {
      runningTotal += (d.sales || 0);
      return { ...d, totalSales: runningTotal };
    });
  }, [adminData?.charts?.dailySales]);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentTarget, setCommentTarget] = useState<{rf: string, comment: string} | null>(null);
  const [commentText, setCommentText] = useState('');
  const [savingComment, setSavingComment] = useState(false);

  const handleSaveComment = async () => {
    if (!commentTarget) return;
    setSavingComment(true);
    setAlert({ type: 'warning', message: 'Updating staff comment...' });
    
    try {
      const targetTrip = adminData.tables.fleetData.find((r: any) => r.rf === commentTarget.rf);
      if (!targetTrip) throw new Error("Trip not found");

      const newValues = [...targetTrip.values];
      newValues[27] = commentText;

      const res = await fetch('/api/admin/edit-trip', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: commentTarget.rf, rawValues: newValues })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setAlert({ type: 'success', message: 'Staff comment updated!' });
      
      const newFleetData = [...adminData.tables.fleetData];
      const rowIdx = newFleetData.findIndex((r: any) => r.rf === commentTarget.rf);
      if (rowIdx > -1) {
        newFleetData[rowIdx].values[27] = commentText;
        setAdminData({
          ...adminData,
          tables: {
            ...adminData.tables,
            fleetData: newFleetData
          }
        });
      }
      setShowCommentModal(false);
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Failed to update comment' });
    } finally {
      setSavingComment(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(accountSearch);
    }, 500);
    return () => clearTimeout(handler);
  }, [accountSearch]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFleetSearch(fleetSearch);
    }, 500);
    return () => clearTimeout(handler);
  }, [fleetSearch]);

  const resetAdminFilters = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    setAdminFilters({
      startDate: `${y}-${m}-01`,
      endDate: `${y}-${m}-${d}`,
      purpose: 'All',
      status: 'All',
      vehicle: 'All',
      driver: 'All'
    });
  };

  useEffect(() => {
    resetAdminFilters();
  }, [adminTab]);

  useEffect(() => {
    if (adminTab === 'report' && (reportCategory === 'Credit' || reportCategory === 'Invoice') && (!reportAccountData || !reportFleetData) && !fetchingReportData) {
      setFetchingReportData(true);
      Promise.all([
        fetch('/api/admin/account-data?page=1&limit=5000').then(res => res.json()),
        fetch('/api/admin/sales?page=1&limit=5000').then(res => res.json())
      ]).then(([accData, fleetRes]) => {
        if (!accData.error) setReportAccountData(accData);
        if (!fleetRes.error) setReportFleetData(fleetRes);
        setFetchingReportData(false);
      });
    }
  }, [adminTab, reportCategory, reportAccountData, reportFleetData, fetchingReportData]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('fleet_vehicle_drivers');
      if (saved) setVehicleDrivers(JSON.parse(saved));

    } catch (e) {}

    // Fetch commissions from DB
    fetch('/api/admin/commissions')
      .then(res => res.json())
      .then(data => {
        if (data.commissions) setVehicleCommissions(data.commissions);
      })
      .catch(err => console.error("Error fetching commissions:", err));
  }, []);

  const handleDriverAssign = (vehicle: string, driver: string) => {
    const updated = { ...vehicleDrivers, [vehicle]: driver };
    setVehicleDrivers(updated);
    localStorage.setItem('fleet_vehicle_drivers', JSON.stringify(updated));
  };

  const assignVehicleToDriver = (driver: string, newVehicle: string) => {
    // We update vehicleDrivers locally and in localStorage
    setVehicleDrivers(prev => {
      let updated = { ...prev };
      // First clear this driver from any existing vehicle
      for (const [v, d] of Object.entries(updated)) {
        if (d === driver) delete updated[v];
      }
      // Assign the new vehicle if not unassigned
      if (newVehicle && newVehicle !== "Unassigned") {
        updated[newVehicle] = driver;
      }
      localStorage.setItem('fleet_vehicle_drivers', JSON.stringify(updated));
      return updated;
    });
  };

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
  const [fuelSubmitCount, setFuelSubmitCount] = useState(0);

  const handleAddMoreFuel = () => {
    if (fuelSubmitCount >= 2) {
      setAlert({ type: 'warning', message: 'You can only add up to 2 fuel records.' });
      return;
    }
    setIsFuelSubmitted(false);
    setFormData((prev: any) => ({
      ...prev,
      firstFuelCost: prev.firstFuelCost || prev.fuelCost,
      firstFuelComments: prev.firstFuelComments || prev.comments,
      fuelStationMeter: '',
      fuelLiterCount: '',
      fuelCost: '',
      comments: '',
    }));
    setFiles((prev: any) => ({
      ...prev,
      fuelStationMeterImage: null,
      fuelReceipt: null,
    }));
  };

  const handleFuelDetailsSubmit = async () => {
    if (!formData.fuelStationMeter && !formData.fuelCost && !formData.fuelLiterCount) {
      setAlert({ type: 'error', message: 'Please enter some fuel details to submit.' });
      return;
    }
    if (formData.fuelStationMeter && !files.fuelStationMeterImage) {
      setAlert({ type: 'error', message: 'Please upload the Meter Image.' });
      return;
    }
    if (formData.fuelCost && !files.fuelReceipt) {
      setAlert({ type: 'error', message: 'Please upload the Fuel Receipt.' });
      return;
    }

    setLoading(true);
    setAlert({ type: 'warning', message: 'Submitting fuel details to database...' });

    try {
      const isSecondTime = fuelSubmitCount >= 1;

      let uploadFiles: any[] = [];
      const suffix = isSecondTime ? '_2' : '';
      if (files.fuelReceipt) {
        uploadFiles.push({ name: `${currentRef}_FuelReceipt${suffix}`, dataUrl: await fileToBase64(files.fuelReceipt as File) });
      }
      if (files.fuelStationMeterImage) {
        uploadFiles.push({ name: `${currentRef}_FuelStationMeter${suffix}`, dataUrl: await fileToBase64(files.fuelStationMeterImage as File) });
      }

      let array: any[] = new Array(24).fill('');
      array[0] = user[0];
      array[1] = formData.vehicle;
      array[2] = formData.purpose;
      array[3] = formData.garageStartMeter;
      array[4] = formData.endTs || '';
      array[5] = formData.garageEndMeter || '';

      let finalComments = formData.comments ? formData.comments.trim() : '';
      let fuelDetails = [];
      const meterToAppend = formData.firstFuelMeter || formData.fuelStationMeter;
      const litersToAppend = formData.firstFuelLiters || formData.fuelLiterCount;
      
      if (meterToAppend) fuelDetails.push(`Meter: ${meterToAppend} KM`);
      if (litersToAppend) fuelDetails.push(`Liters: ${litersToAppend}`);
      
      if (fuelDetails.length > 0) {
          finalComments += (finalComments ? ' ' : '') + `(Fuel - ${fuelDetails.join(', ')})`;
      }

      if (isSecondTime) {
        array[6] = formData.firstFuelCost || '';
        array[7] = finalComments;
        array[21] = formData.fuelCost;
        array[22] = formData.fuelStationMeter;
        array[23] = formData.fuelLiterCount;
      } else {
        array[6] = formData.fuelCost;
        array[7] = finalComments;
        array[21] = '';
        array[22] = '';
        array[23] = '';
      }

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
      setFuelSubmitCount(isSecondTime ? 2 : 1);
      setAlert({ type: 'success', message: 'Fuel details saved to database successfully!' });
      window.history.pushState({ stage: 'dashboard' }, '');
      setStage('dashboard');
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
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(splashTimer);
  }, []);

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

  const fetchSentMessages = async () => {
    if (!user || !user[0]) return;
    setFetchingSentMessages(true);
    try {
      const res = await fetch(`/api/fleet/message?drvId=${user[0]}&type=sent&_t=${Date.now()}`);
      const data = await res.json();
      if (data.messages) setSentMessages(data.messages);
    } catch (e) {
      console.error("Failed to fetch sent messages:", e);
    } finally {
      setFetchingSentMessages(false);
    }
  };

  const fetchInboxMessages = async () => {
    if (!user || !user[0]) return;
    setFetchingInboxMessages(true);
    try {
      const res = await fetch(`/api/fleet/message?drvId=${user[0]}&type=inbox&_t=${Date.now()}`);
      const data = await res.json();
      if (data.messages) setInboxMessages(data.messages);
    } catch (e) {
      console.error("Failed to fetch inbox messages:", e);
    } finally {
      setFetchingInboxMessages(false);
    }
  };

  useEffect(() => {
    if (user && user[0]) {
      fetchInboxMessages();
      if (stage === 'contact-office') {
        fetchSentMessages();
      }
    }
  }, [stage, user]);

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
      fetchSentMessages();
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
        limit: '50',
        ...(debouncedFleetSearch ? { search: debouncedFleetSearch } : {})
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
      if (adminTab !== 'messages') {
        fetchAdminMessages(true);
      }
      
      if (adminTab === 'messages') {
        fetchAdminMessages();
      } else if (adminTab === 'accounts') {
        fetchAccountSheetData();
      } else {
        fetchAdminSales();
      }
    }
  }, [stage, adminFilters, adminPage, user, adminTab, debouncedSearch, debouncedFleetSearch]);

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
    setSyncProgress(0);
    setAlert({ type: 'warning', message: 'Syncing with Google Sheets... This may take a moment.' });
    
    const progressInterval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 99) return 99;
        
        let increment = 1;
        if (prev < 40) {
          increment = Math.floor(Math.random() * 8) + 4; // 4 to 11
        } else if (prev < 75) {
          increment = Math.floor(Math.random() * 5) + 2; // 2 to 6
        } else if (prev < 90) {
          increment = Math.floor(Math.random() * 3) + 1; // 1 to 3
        } else {
          increment = Math.random() > 0.6 ? 1 : 0; // Occasionally 1, mostly 0
        }
        
        return Math.min(99, prev + increment);
      });
    }, 600);

    try {
      const res = await fetch('/api/admin/sync-accounts');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setSyncProgress(100);
      setAlert({ type: 'success', message: data.message || 'Account sheet synced successfully!' });
      fetchAccountSheetData(); // Refresh table
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Failed to sync account sheet' });
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setIsSyncingAccounts(false);
        setSyncProgress(0);
      }, 1000);
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
      'Fuel Cost', 'Fuel Meter', 'Fuel Liters', '2nd Fuel Cost', '2nd Fuel Meter', '2nd Fuel Liters', 'Comments', 'Repair Cost', 'Trip Ref',
      'SC Due Amount', 'Drv Comms', 'Trip Start Meter',
      'Trip End Meter', 'Pkg Balance Mileage', 'Loss (Start)',
      'Loss (End)', 'Total Mileage', 'Final Price'
    ];

    const csvRows = [];
    csvRows.push(headers.join(','));

    adminData.tables.fleetData.forEach((t: any) => {
      const rowValues = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'fuel_meter', 'fuel_liters', 24, 25, 26, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 22, 23].map((idx) => {
        let val = '';
        if (idx === 'fuel_meter' || idx === 'fuel_liters') {
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
        } else if (idx === 10) {
          val = (t.values[10] || '').toString();
          val = val.replace(/\(Fuel - (.*?)\)/g, '').replace(/\(Fuel Meter:\s*([\d.]+)\s*KM\)/ig, '').trim();
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
      fetchAdminSales(true);
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Failed to delete trip' });
    }
  };

  const handleDeleteDriver = async (username: string) => {
    if (!confirm(`Are you sure you want to delete driver ${username}?`)) return;
    try {
      const res = await fetch(`/api/admin/delete-driver`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAlert({ type: 'success', message: 'Driver deleted successfully!' });
      fetchAdminSales(true);
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Failed to delete driver' });
    }
  };

  const handleEditDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDriver) return;
    setSavingDriver(true);
    try {
      const res = await fetch('/api/admin/edit-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingDriver)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      if (editingDriver.vehicle !== undefined) {
        assignVehicleToDriver(editingDriver.username, editingDriver.vehicle);
      }
      
      setAlert({ type: 'success', message: 'Driver updated successfully!' });
      setEditingDriver(null);
      fetchAdminSales(true);
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Failed to update driver' });
    } finally {
      setSavingDriver(false);
    }
  };

  const handleAddDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingDriver) return;

    if (!addingDriver.username || !addingDriver.password) {
      setAlert({ type: 'error', message: 'Username and password are required' });
      return;
    }

    setSavingDriver(true);
    try {
      const res = await fetch('/api/admin/add-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addingDriver)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (addingDriver.vehicle !== undefined) {
        assignVehicleToDriver(addingDriver.username, addingDriver.vehicle);
      }

      setAlert({ type: 'success', message: 'Driver added successfully!' });
      setAddingDriver(null);
      fetchAdminSales(true);
    } catch (err: any) {
      setAlert({ type: 'error', message: 'Failed to add driver' });
    } finally {
      setSavingDriver(false);
    }
  };

  const handleSaveEditedTrip = async () => {
    if (!editingTrip) return;
    setSavingEdit(true);
    try {
      let finalValues = [...editingTrip.values];
      let fuelDetails = [];
      if (editingTrip.fMeter) fuelDetails.push(`Meter: ${editingTrip.fMeter} KM`);
      if (editingTrip.fLiters) fuelDetails.push(`Liters: ${editingTrip.fLiters}`);
      let finalComments = editingTrip.cleanComments || '';
      if (fuelDetails.length > 0) finalComments += (finalComments ? ' ' : '') + `(Fuel - ${fuelDetails.join(', ')})`;
      finalValues[10] = finalComments;

      const res = await fetch('/api/admin/edit-trip', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: editingTrip.rf,
          rawValues: finalValues
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
      const res = await fetch(`/api/admin/messages?page=${adminPage}&limit=50&_t=${Date.now()}`);
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

      const firstFuelCost = details[9] || '';
      const secondFuelCost = details[24] || '';

      let count = 0;
      if (extractedMeter || extractedLiters || firstFuelCost) {
        count = 1;
      }
      if (secondFuelCost) {
        count = 2;
      }

      setFormData((prev: any) => ({
        ...prev,
        vehicle: details[4] || '',
        purpose: details[5] || '',
        garageStartMeter: details[6] || '',
        garageEndMeter: details[8] || '',
        tripRef: fetchedTripRef,
        folderUrl: details[20] || '',
        folderId: details[21] || '',
        startTs: details[2] || '',
        endTs: details[7] || '',
        fuelCost: count === 2 ? secondFuelCost : firstFuelCost,
        comments: rawComments,
        fuelStationMeter: count === 2 ? (details[25] || '') : extractedMeter,
        fuelLiterCount: count === 2 ? (details[26] || '') : extractedLiters,
        firstFuelCost: firstFuelCost,
        firstFuelComments: details[10] || '',
        firstFuelMeter: extractedMeter,
        firstFuelLiters: extractedLiters,
        secondFuelCost: secondFuelCost,
        secondFuelMeter: details[25] || '',
        secondFuelLiters: details[26] || '',
        repairCost: details[11] || '',
        scDueAmount: details[13] || '',
        drvComms: stage === 'last-trip' ? (details[14] || '') : '',
        tripStartMeter: details[15] || '',
        tripEndMeter: details[16] || '',
        pkgBalanceMileage: stage === 'last-trip' ? (details[17] || '') : '',
        startLossMileage: details[18] || '',
        endLossMileage: details[19] || '',
        totalMileage: details[22] || '',
        finalPrice: details[23] || '',
        tripPrice: details[23] || '',
      }));
      setCurrentRef(ref);
      
      // Auto-disable Fuel section if it was already filled
      setFuelSubmitCount(count);
      if (count > 0) {
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
      tripStartMeter: matchedRef?.startMeter || prev.tripStartMeter,
      tripEndMeter: matchedRef?.endMeter || prev.tripEndMeter
    }));

    if (!ref) return;

    setFetchingDetails(true);
    try {
      const res = await fetch(`/api/fleet/details?type=trip&ref=${ref}`);
      const data = await res.json();
      const details = data.details;
      if (details) {
        const cleanNum = (val: any) => val ? val.toString().replace(/[^\d.]/g, '') : '';
        const accStartMeter = cleanNum(details[54]);
        const accEndMeter = cleanNum(details[57]);
        const rawFinalPrice = cleanNum(details[4]);
        const finalPriceNum = Number(rawFinalPrice) || 0;

        const pkgKms = Number(cleanNum(details[33])) || 0;
        const distance = Number(cleanNum(details[58])) || 0;
        const rawPkgBalance = (pkgKms - distance).toString();

        setFormData((prev: any) => {
          // Calculate Driver Salary based on Form Vehicle Number (Fleet Data) & Dynamic Commission Rate
          const vehicleNumber = prev.vehicle ? prev.vehicle.toString().trim().toUpperCase() : '';
          // Normalize state keys
          const normalizedComms: Record<string, number> = {};
          for (const key in vehicleCommissions) {
            normalizedComms[key.trim().toUpperCase()] = vehicleCommissions[key];
          }
          
          const commissionRate = normalizedComms[vehicleNumber];
          
          let rawSalary = '';
          if (commissionRate !== undefined && commissionRate > 0) {
            rawSalary = Math.round(finalPriceNum * (commissionRate / 100)).toString();
          } else {
            const vehicleType = details[17] ? details[17].toString().trim().toUpperCase() : '';
            if (vehicleType === 'WAGON R | 3 SEATER' || vehicleType === 'MINI VAN | 6 SEATER') {
              rawSalary = Math.round(finalPriceNum * 0.20).toString();
            } else if (vehicleType === 'KDH HIGH ROOF VAN | 14 SEATER' || vehicleType === 'BUS | NON AC 32 SEATER') {
              rawSalary = Math.round(finalPriceNum * 0.15).toString();
            } else {
              rawSalary = cleanNum(details[2]); // Fallback to default Driver Comm in account sheet
            }
          }

          const fuel1 = Number(prev.firstFuelCost) || 0;
          const fuel2 = Number(prev.fuelCost) || 0;
          const dueAmount = Math.round(finalPriceNum - fuel1 - fuel2 - Number(rawSalary));

          return {
            ...prev,
            tripStartMeter: prev.tripStartMeter || accStartMeter,
            tripEndMeter: prev.tripEndMeter || accEndMeter,
            drvComms: rawSalary,
            tripPrice: rawFinalPrice,
            pkgBalanceMileage: rawPkgBalance,
            scDueAmount: dueAmount
          };
        });
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
    if (['fuelCost', 'firstFuelCost', 'tripPrice', 'drvComms'].includes(id)) {
      // Calc scDueAmount = Final price - fuel cost 1 - fuel cost 2 - driver salary
      setFormData((prev: any) => {
        const fuel1 = Number(prev.firstFuelCost) || 0;
        const fuel2 = Number(prev.fuelCost) || 0;
        const tripPrice = Number((prev.tripPrice || '').toString().replace(/[^\d.]/g, '')) || 0;
        const salary = Number(prev.drvComms) || 0;
        const due = Math.round(tripPrice - fuel1 - fuel2 - salary);
        return { ...prev, scDueAmount: due };
      });
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
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height *= MAX_WIDTH / width));
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width *= MAX_HEIGHT / height));
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress with 0.5 quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
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

        if (formData.purpose === 'Hire') {
          if (
            formData.tripStartMeter === '' || formData.tripStartMeter === null || formData.tripStartMeter === undefined ||
            formData.tripEndMeter === '' || formData.tripEndMeter === null || formData.tripEndMeter === undefined ||
            formData.tripPrice === '' || formData.tripPrice === null || formData.tripPrice === undefined ||
            formData.drvComms === '' || formData.drvComms === null || formData.drvComms === undefined
          ) {
            setShowRefreshPopup(true);
            setLoading(false);
            return;
          }
        }

        if (formData.purpose === 'Repair') {
          if (!files.repairReceipt || (Array.isArray(files.repairReceipt) && files.repairReceipt.length === 0)) {
            setAlert({ type: 'error', message: 'Please upload the repair bill before submitting.' });
            setLoading(false);
            return;
          }
        }
      }

      const now = new Date();
      const endTs = now.toLocaleString('sv-SE').replace('T', ' ');

      let uploadFiles: any[] = [];
      let actualRef = currentRef;

      if (stage === 'new') {
        setAlert({ type: 'warning', message: 'Creating record and uploading data...' });
        const fileData = await fileToBase64(files.garageStartImage!);
        // We use TBD so the backend can replace it with the generated FR number
        uploadFiles.push({ name: `TBD Garage Start`, dataUrl: fileData });

        let array: any[] = new Array(24).fill('');
        array[0] = user[0]; // Driver
        array[1] = formData.vehicle;
        array[2] = formData.purpose;
        array[3] = formData.garageStartMeter;

        if (formData.purpose === 'Hire') array[9] = formData.tripRef;
        if (formData.purpose === 'Repair') array[8] = formData.repairCost;
        if (formData.purpose === 'Fuel') array[6] = formData.fuelCost;

        const createRes = await fetch('/api/fleet/create-record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timestamp: endTs, drvId: user[0], array, files: uploadFiles }),
        });
        const createData = await createRes.json();
        if (createData.error) throw new Error(createData.error);

        actualRef = createData.reference;
        setCurrentRef(actualRef);
      } else {
        // Stage update
        if (files.fuelReceipt && !isFuelSubmitted) uploadFiles.push({ name: `${currentRef}_FuelReceipt`, dataUrl: await fileToBase64(files.fuelReceipt) });
        if (files.fuelStationMeterImage && !isFuelSubmitted) uploadFiles.push({ name: `${currentRef}_FuelStationMeter`, dataUrl: await fileToBase64(files.fuelStationMeterImage) });
        if (files.garageEndImage) uploadFiles.push({ name: `${currentRef}_GarageEnd`, dataUrl: await fileToBase64(files.garageEndImage) });
        if (files.repairReceipt) {
          const repairFiles = Array.isArray(files.repairReceipt) ? files.repairReceipt : [files.repairReceipt];
          for (let i = 0; i < repairFiles.length; i++) {
            uploadFiles.push({
              name: `${currentRef}_Repair_${Date.now()}_${i + 1}`,
              dataUrl: await fileToBase64(repairFiles[i] as File)
            });
          }
        }

        // Calculate Total Mileage
        const totalMileage = Number(formData.garageEndMeter) - Number(formData.garageStartMeter);

        let array: any[] = new Array(24).fill('');
        array[0] = user[0];
        array[1] = formData.vehicle;
        array[2] = formData.purpose;
        array[3] = formData.garageStartMeter;
        array[4] = endTs;
        array[5] = formData.garageEndMeter;
        let finalComments = formData.comments ? formData.comments.trim() : '';
        let fuelDetails = [];
        const meterToAppend = formData.firstFuelMeter || formData.fuelStationMeter;
        const litersToAppend = formData.firstFuelLiters || formData.fuelLiterCount;
        
        if (meterToAppend) fuelDetails.push(`Meter: ${meterToAppend} KM`);
        if (litersToAppend) fuelDetails.push(`Liters: ${litersToAppend}`);
        
        if (fuelDetails.length > 0) {
            finalComments += (finalComments ? ' ' : '') + `(Fuel - ${fuelDetails.join(', ')})`;
        }

        if (fuelSubmitCount >= 1) {
          array[6] = formData.firstFuelCost || (fuelSubmitCount === 1 ? formData.fuelCost : '');
          array[7] = finalComments;
          array[21] = formData.secondFuelCost || (fuelSubmitCount === 2 ? formData.fuelCost : '');
          array[22] = formData.secondFuelMeter || (fuelSubmitCount === 2 ? formData.fuelStationMeter : '');
          array[23] = formData.secondFuelLiters || (fuelSubmitCount === 2 ? formData.fuelLiterCount : '');
        } else {
          array[6] = formData.fuelCost;
          array[7] = finalComments;
        }
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

  if (showSplash) {
    return (
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#f4f7fb]">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative w-64 h-64 sm:w-80 sm:h-80 mb-12"
        >
          <img 
            src="/logo.jpg" 
            alt="Fleet App Splash" 
            className="w-full h-full object-contain drop-shadow-2xl rounded-[2.5rem]"
          />
        </motion.div>
        
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <h2 className="text-sm sm:text-base font-black text-slate-800 tracking-[0.4em] uppercase">SC Fleet</h2>
        </motion.div>
      </div>
    );
  }

  const generateCreditReportCSV = () => {
    if (!reportFleetData?.tables?.fleetData) {
      setAlert({ type: 'error', message: 'No fleet data available to generate report.' });
      setTimeout(() => setAlert(null), 3000);
      return;
    }
    
    // Headers
    const headers = [
      "", "*CreditMemoNo", "*Customer", "*CreditMemoDate", "Location", 
      "Memo", "Item(Product/Service)", "ItemDescription", "ItemQuantity", 
      "ItemRate", "*ItemAmount", "Service Date"
    ];
    
    let csvContent = headers.join(",") + "\n";
    
    const parseDateToLocalMs = (dateStr: string | undefined): number => {
      if (!dateStr) return 0;
      const raw = String(dateStr).split(' ')[0].trim();
      if (!raw) return 0;
      
      if (raw.includes('-')) {
        const parts = raw.split('-');
        if (parts.length === 3) {
          if (parts[0].length === 4) return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])).getTime();
          if (parts[2].length === 4) return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
        }
      }
      
      if (raw.includes('/')) {
        const parts = raw.split('/');
        if (parts.length === 3) {
          if (parts[0].length === 4) return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])).getTime();
          if (parts[2].length === 4) return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
        }
      }
      
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
         return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      }
      return 0;
    };

    const startMs = reportStartDate ? parseDateToLocalMs(reportStartDate) : 0;
    const endMs = reportEndDate ? parseDateToLocalMs(reportEndDate) + 86399999 : Infinity;

    const records = reportFleetData.tables.fleetData
      .filter((t: any) => t.values[5] === 'Hire' && !String(t.values[0] || '').toLowerCase().includes('cancel'))
      .filter((t: any) => {
        if (!startMs && endMs === Infinity) return true;
        const tripRef = t.values[12] || '';
        let recordMs = 0;
        if (tripRef && reportAccountData?.data) {
          const accMatch = reportAccountData.data.find((row: any) => row.rawValues && row.rawValues[11] === tripRef);
          if (accMatch) {
            const rawEndDate = accMatch.rawValues[15] || '';
            recordMs = parseDateToLocalMs(rawEndDate);
          }
        }
        if (!recordMs) return false;
        return recordMs >= startMs && recordMs <= endMs;
      });
      
    records.forEach((t: any) => {
      const tripRef = t.values[12] || '';
      let formattedDate = '';
      let pickUp = '';
      let dropOff = '';
      let scComm = '';

      if (tripRef && reportAccountData?.data) {
        const accMatch = reportAccountData.data.find((row: any) => row.rawValues && row.rawValues[11] === tripRef);
        if (accMatch) {
          const rawEndDate = accMatch.rawValues[15] || '';
          if (rawEndDate) {
            const raw = String(rawEndDate).split(' ')[0];
            const d = new Date(raw);
            if (!isNaN(d.getTime())) {
              formattedDate = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
            } else {
              formattedDate = raw.replace(/\//g, '-');
            }
          }
          pickUp = accMatch.rawValues[24] || '';
          dropOff = accMatch.rawValues[27] || '';
          scComm = accMatch.rawValues[3] || '';
        }
      }
      
      const description = pickUp && dropOff ? `${pickUp} to ${dropOff}` : pickUp || dropOff || '';
      const safeDescription = `"${description.replace(/"/g, '""')}"`;
      
      const row = [
        tripRef, 
        tripRef ? `C${tripRef}` : "", 
        "Senu Cabs & Tours", 
        formattedDate, 
        "", 
        "", 
        "CAB COMMISSION", 
        safeDescription, 
        "", 
        "", 
        scComm, 
        ""
      ];
      csvContent += row.join(",") + "\n";
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Credit_Report_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setAlert({ type: 'success', message: 'Report generated and downloaded successfully!' });
    setTimeout(() => setAlert(null), 3000);
  };

  const generateInvoiceReportCSV = () => {
    if (!reportFleetData?.tables?.fleetData) {
      setAlert({ type: 'error', message: 'No fleet data available to generate report.' });
      setTimeout(() => setAlert(null), 3000);
      return;
    }
    
    // Headers
    const headers = [
      "*InvoiceNo", "*Customer", "*InvoiceDate", "*DueDate", "Terms", 
      "Location", "Memo", "Item(Product/Service)", "ItemDescription", 
      "ItemQuantity", "ItemRate", "*ItemAmount", "DRIVER COMM"
    ];
    
    let csvContent = headers.join(",") + "\n";
    
    const parseDateToLocalMs = (dateStr: string | undefined): number => {
      if (!dateStr) return 0;
      const raw = String(dateStr).split(' ')[0].trim();
      if (!raw) return 0;
      
      if (raw.includes('-')) {
        const parts = raw.split('-');
        if (parts.length === 3) {
          if (parts[0].length === 4) return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])).getTime();
          if (parts[2].length === 4) return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
        }
      }
      
      if (raw.includes('/')) {
        const parts = raw.split('/');
        if (parts.length === 3) {
          if (parts[0].length === 4) return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])).getTime();
          if (parts[2].length === 4) return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
        }
      }
      
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
         return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      }
      return 0;
    };

    const startMs = reportStartDate ? parseDateToLocalMs(reportStartDate) : 0;
    const endMs = reportEndDate ? parseDateToLocalMs(reportEndDate) + 86399999 : Infinity;

    const records = reportFleetData.tables.fleetData
      .filter((t: any) => t.values[5] === 'Hire' && !String(t.values[0] || '').toLowerCase().includes('cancel'))
      .filter((t: any) => {
        if (!startMs && endMs === Infinity) return true;
        const tripRef = t.values[12] || '';
        let recordMs = 0;
        if (tripRef && reportAccountData?.data) {
          const accMatch = reportAccountData.data.find((row: any) => row.rawValues && row.rawValues[11] === tripRef);
          if (accMatch) {
            const rawEndDate = accMatch.rawValues[15] || '';
            recordMs = parseDateToLocalMs(rawEndDate);
          }
        }
        if (!recordMs) return false;
        return recordMs >= startMs && recordMs <= endMs;
      });
      
    records.forEach((t: any) => {
      const tripRef = t.values[12] || '';
      const vehicleNum = t.values[4] || '';
      let formattedDate = '';
      let hireAmount = '';
      
      const driverCode = t.values[3] || '';
      const driverName = adminData.driverNames?.[driverCode] || driverCode;
      const customerName = driverName ? `${driverName} - Cash` : '- Cash';
      const driverComm = t.values[14] || '';

      if (tripRef && reportAccountData?.data) {
        const accMatch = reportAccountData.data.find((row: any) => row.rawValues && row.rawValues[11] === tripRef);
        if (accMatch) {
          const rawEndDate = accMatch.rawValues[15] || '';
          if (rawEndDate) {
            const raw = String(rawEndDate).split(' ')[0];
            const d = new Date(raw);
            if (!isNaN(d.getTime())) {
              formattedDate = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
            } else {
              formattedDate = raw.replace(/\//g, '-');
            }
          }
          hireAmount = accMatch.rawValues[4] || '';
        }
      }
      
      const row = [
        tripRef, 
        `"${customerName}"`, 
        formattedDate, 
        "", 
        "", 
        "", 
        "", 
        vehicleNum, 
        "", 
        "", 
        "", 
        hireAmount,
        driverComm
      ];
      csvContent += row.join(",") + "\n";
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Invoice_Report_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setAlert({ type: 'success', message: 'Invoice Report generated successfully!' });
    setTimeout(() => setAlert(null), 3000);
  };

  if (!user) return <LoginModal onLogin={(u) => { setUser(u); fetchInitialData(u[0]); }} />;

  return (
    <>
      <AnimatePresence>
        {isSyncingAccounts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center"
          >
            <div className="relative flex items-center justify-center mb-6">
              <svg className="w-32 h-32 transform -rotate-90 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]" viewBox="0 0 36 36">
                <path
                  className="opacity-20 text-emerald-500"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-500 transition-all duration-300 ease-out"
                  strokeDasharray={`${syncProgress}, 100`}
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  strokeLinecap="round"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-2xl font-bold text-white">{syncProgress}%</span>
            </div>
            <h2 className="text-2xl font-black tracking-widest text-emerald-500 animate-pulse uppercase">Syncing Data</h2>
            <p className="text-slate-400 text-sm mt-3 font-medium text-center px-6">Please wait while your account details are updated...</p>
          </motion.div>
        )}
      </AnimatePresence>
      <main className={cn("container mx-auto px-4 py-8", stage === 'admin' ? "max-w-full" : "max-w-xl")}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Logo" className="w-10 h-10 object-contain rounded-md" />
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase">
            SC FLEET MANAGEMENT
          </h1>
        </div>
        
        {stage === 'admin' && (
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-tight">
                {adminTab === 'overview' ? 'Sales Dashboard' : 
                 adminTab === 'trips' ? 'Recent Trips' : 
                 adminTab === 'rankings' ? 'Rankings' : 
                 adminTab === 'fleet' ? 'Fleet Data' : 
                 adminTab === 'messages' ? 'Messages' : 
                 adminTab === 'accounts' ? 'Account Sheet' : 
                 adminTab === 'vehicles' ? 'Vehicles' : 
                 adminTab === 'driver-manage' ? 'Driver Manage' : 
                 adminTab === 'report' ? 'Reports Dashboard' : 'Admin Control Panel'}
              </h2>
              <p className="text-[8px] text-emerald-500/60 font-black tracking-widest uppercase mt-0.5">Admin Control Panel</p>
            </div>
          </div>
        )}
      </div>

      {/* Refresh Popup Modal */}
      <AnimatePresence>
        {showRefreshPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card p-8 w-full max-w-sm text-center space-y-6 border-rose-500/20"
            >
              <div className="w-20 h-20 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto">
                <AlertCircle className="w-10 h-10 text-rose-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white">à¶¯à¶­à·Šà¶­ à¶ºà·à·€à¶­à·Š à¶šà·à¶½à·“à¶± à·€à·“à¶¸à·š à¶¯à·œà·à¶ºà¶šà·’</h3>
                <p className="text-slate-400 text-sm">à·€à¶»à¶šà·Š App à¶‘à¶š Refresh à¶šà¶» à¶±à·à·€à¶­ à¶‹à¶­à·Šà·ƒà·„ à¶šà¶»à¶±à·Šà¶±</p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 py-3 rounded-xl border border-rose-500/50 bg-rose-500/10 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-all font-bold text-sm"
                >
                  REFRESH
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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


      {/* Staff Comment Modal */}
      <AnimatePresence>
        {showCommentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card p-6 w-full max-w-md text-center space-y-6 border-blue-500/20 bg-slate-900/90"
            >
              <div className="flex items-center gap-3 text-white font-bold text-sm mb-2 justify-center">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                STAFF COMMENT
              </div>
              <p className="text-xs text-slate-400 mb-4">Enter or update the staff comment for this trip.</p>
              
              <textarea
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all resize-none"
                placeholder="Enter staff comment here..."
                rows={4}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />

              <div className="flex gap-4">
                <button
                  onClick={() => setShowCommentModal(false)}
                  disabled={savingComment}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all font-bold text-sm"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleSaveComment}
                  disabled={savingComment || commentText === commentTarget?.comment}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-all font-bold text-sm flex justify-center items-center gap-2"
                >
                  {savingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : 'SAVE'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Driver Info Bar */}
      {stage !== 'admin' && (
        <div className="flex items-center gap-4 mb-6">
          <div className="glass-card p-4 flex items-center justify-between gap-4 flex-1">
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
              className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-full transition-colors shrink-0"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          
          <button
            onClick={handleSyncAccountSheet}
            disabled={isSyncingAccounts}
            className={`shrink-0 flex flex-col items-center justify-center p-3 sm:px-5 rounded-2xl transition-all border shadow-lg ${
              isSyncingAccounts 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
                : 'bg-emerald-500/20 border-emerald-500 hover:bg-emerald-500 hover:text-white text-emerald-500 shadow-emerald-500/20 hover:shadow-emerald-500/40'
            }`}
            title="Sync Account Data"
          >
            <RefreshCw className={`w-6 h-6 mb-1 ${isSyncingAccounts ? 'animate-spin opacity-50' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{isSyncingAccounts ? 'Syncing...' : 'Sync Data'}</span>
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
              className="flex flex-col items-center justify-center p-8 glass-card hover:border-blue-500/50 transition-all group relative"
            >
              {(() => {
                const unreadCount = inboxMessages.filter((m: any) => !m.isRead).length;
                if (unreadCount > 0) {
                  return (
                    <div className="absolute top-4 right-4 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse flex items-center justify-center min-w-[24px] h-[24px] px-1.5 z-10">
                      <span className="text-[12px] font-black text-white">{unreadCount}</span>
                    </div>
                  );
                }
                return null;
              })()}
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
          <div className="flex gap-2 p-1 bg-slate-900 border border-white/5 rounded-xl">
            <button
              onClick={() => setOfficeTab('send')}
              className={cn("flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-lg transition-all", officeTab === 'send' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white")}
            >
              Send Message
            </button>
            <button
              onClick={() => setOfficeTab('inbox')}
              className={cn("flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-lg transition-all", officeTab === 'inbox' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white")}
            >
              Inbox
            </button>
          </div>

          {officeTab === 'send' && (
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
                Senu cabs à¶šà·à¶»à·Šà¶ºà·à¶½à¶º à·€à·™à¶­ à¶´à·à¶¸à·’à¶±à·’à¶½à·Šà¶½à¶šà·Š, à¶´à¶«à·’à·€à·”à¶©à¶ºà¶šà·Š à·„à· à¶šà·’à·ƒà·’à¶ºà¶¸à·Š à¶¯à·à¶±à·”à¶¸à·Š à¶¯à·“à¶¸à¶šà·Š à¶šà·’à¶»à·’à¶¸à¶§ à¶…à·€à·à·Šà¶º à¶±à¶¸à·Š à¶´à·„à¶­ "Send Message" à¶´à·„à·ƒà·”à¶šà¶¸ à¶·à·à·€à·’à¶­à· à¶šà¶»à¶±à·Šà¶±.
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

              <div className="mt-8 pt-6 border-t border-white/10 space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Last 10 Sent Messages</h4>
                {fetchingSentMessages ? (
                  <div className="py-4 text-center text-slate-400 text-xs font-bold"><Loader2 className="w-4 h-4 animate-spin inline mr-2"/>Loading...</div>
                ) : sentMessages.length === 0 ? (
                  <div className="py-4 text-center text-slate-500 text-xs font-bold bg-slate-900/50 rounded-xl border border-white/5">No messages sent yet.</div>
                ) : (
                  <div className="space-y-3">
                    {sentMessages.map((msg, i) => (
                      <div key={i} className="bg-slate-900/50 border border-white/5 p-4 rounded-xl">
                        <div className="text-[10px] font-bold text-blue-400 mb-2 uppercase tracking-widest">{msg.timestamp}</div>
                        <p className="text-xs font-medium text-slate-200 whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {officeTab === 'inbox' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 border-slate-500/20 bg-slate-500/5"
            >
              <div className="flex items-center gap-3 text-white font-bold text-sm mb-6">
                <MessageSquare className="w-5 h-5 text-slate-400" />
                INBOX
              </div>
              
              <div className="space-y-4">
                {fetchingInboxMessages ? (
                  <div className="py-10 text-center text-slate-400 text-xs font-bold"><Loader2 className="w-4 h-4 animate-spin inline mr-2"/>Loading...</div>
                ) : inboxMessages.length === 0 ? (
                  <div className="py-10 flex flex-col items-center justify-center text-center gap-3 bg-slate-900/50 rounded-2xl border border-white/5">
                    <MessageSquare className="w-8 h-8 text-slate-600" />
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">No messages in inbox</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inboxMessages.map((msg: any, i) => (
                      <div 
                        key={i} 
                        onClick={async () => {
                          if (!msg.isRead) {
                            try {
                              await fetch('/api/fleet/message', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: msg._id })
                              });
                              setInboxMessages(prev => prev.map(m => m._id === msg._id ? { ...m, isRead: true } : m));
                            } catch (e) {}
                          }
                        }}
                        className={cn(
                          "p-4 rounded-xl transition-all",
                          !msg.isRead 
                            ? "bg-blue-500/[0.05] border border-blue-500/30 cursor-pointer hover:bg-blue-500/[0.1]" 
                            : "bg-slate-900/50 border border-white/5"
                        )}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                            {!msg.isRead && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>}
                            {msg.isRead && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                            FROM ADMIN
                          </div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{msg.timestamp}</div>
                        </div>
                        <p className={cn("text-xs whitespace-pre-wrap transition-colors", !msg.isRead ? "text-white font-bold" : "text-slate-400 font-medium")}>{msg.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

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
          {/* Header & Back section removed */}
          {/* Tabs and Filters Container */}
          <div className="flex flex-col gap-3 w-fit">
            {/* Tabs Navigation */}
            <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10 w-full overflow-x-auto">
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
                "px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 relative",
                adminTab === 'messages' ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-white"
              )}
            >
              <MessageSquare className="w-4 h-4" />
              MESSAGES
              {messagesData?.messages?.some((m: any) => !m.isRead && !(m.sender === 'Admin' || (!m.sender && !m.driverName && !m.phoneNumber))) && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              )}
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

            <button
              onClick={() => setAdminTab('driver-manage')}
              className={cn(
                "px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2",
                adminTab === 'driver-manage' ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-white"
              )}
            >
              <Users className="w-4 h-4" />
              DRIVER MANAGE
            </button>

            <button
              onClick={() => setAdminTab('commission')}
              className={cn(
                "px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2",
                adminTab === 'commission' ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-white"
              )}
            >
              <Activity className="w-4 h-4" />
              VEHICLE & COMMISSIONS
            </button>

            <button
              onClick={() => setAdminTab('report')}
              className={cn(
                "px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2",
                adminTab === 'report' ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-white"
              )}
            >
              <ClipboardCheck className="w-4 h-4" />
              REPORTS
            </button>

            <div className="w-px h-8 bg-white/10 mx-2 self-center shrink-0"></div>
            <button
              onClick={() => {
                setAlert(null);
                setStage('dashboard');
              }}
              className="px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white shadow-lg shadow-red-500/10 border border-red-500/20"
            >
              <LogOut className="w-4 h-4" />
              EXIT ADMIN
            </button>
          </div>

          {/* Filters */}
          {adminTab !== 'overview' && adminTab !== 'vehicles' && adminTab !== 'driver-manage' && adminTab !== 'trips' && adminTab !== 'rankings' && adminTab !== 'messages' && adminTab !== 'commission' && adminTab !== 'report' && (
            <div className="p-1.5 bg-white/5 rounded-2xl border border-white/10 flex flex-col md:flex-row items-end gap-2 w-full">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2 flex-1 w-full px-2 py-0.5">
                <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar className="w-2.5 h-2.5" /> From
                </label>
                <input
                  type="date"
                  className="w-full input-field py-0 text-[10px] text-white h-7"
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
                  className="w-full input-field py-0 text-[10px] text-white h-7"
                  value={adminFilters.endDate}
                  onChange={(e) => setAdminFilters({ ...adminFilters, endDate: e.target.value })}
                />
              </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Purpose</label>
                    <select
                      className="w-full input-field py-0 text-[10px] text-white h-7"
                      value={adminFilters.purpose}
                      onChange={(e) => setAdminFilters({ ...adminFilters, purpose: e.target.value })}
                    >
                      {adminData?.filterOptions.purposes.map((p: string) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Status</label>
                    <select
                      className="w-full input-field py-0 text-[10px] text-white h-7"
                      value={adminFilters.status}
                      onChange={(e) => setAdminFilters({ ...adminFilters, status: e.target.value })}
                    >
                      {adminData?.filterOptions.statuses.map((s: string) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Vehicle</label>
                    <select
                      className="w-full input-field py-0 text-[10px] text-white h-7"
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
                      className="w-full input-field py-0 text-[10px] text-white h-7"
                      value={adminFilters.driver}
                      onChange={(e) => setAdminFilters({ ...adminFilters, driver: e.target.value })}
                    >
                      <option value="All">All Drivers</option>
                      {adminData?.filterOptions.drivers.map((d: string) => <option key={d} value={d}>{adminData.driverNames?.[d] || d}</option>)}
                    </select>
                  </div>
            </div>
            <button
              onClick={resetAdminFilters}
              className="h-7 px-4 mb-0.5 mr-0.5 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 shrink-0 w-full md:w-auto"
              title="Clear Filters"
            >
              <X className="w-3 h-3" /> CLEAR
            </button>
          </div>
          )}
          </div>
          {fetchingAdmin ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-emerald-500/10 rounded-full"></div>
                <div className="w-24 h-24 border-4 border-emerald-500 rounded-full animate-spin border-t-transparent absolute inset-0"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <TrendingUp className="w-10 h-10 text-emerald-500 animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-black text-white tracking-widest uppercase shadow-emerald-500/50 drop-shadow-md">Admin Dashboard</h3>
                <p className="text-emerald-500 font-black tracking-[0.25em] text-[10px] uppercase animate-pulse">Synchronizing Data...</p>
              </div>
            </div>
          ) : adminData ? (
            <div className="space-y-8">


              {adminTab === 'overview' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-4 md:p-6 space-y-4 text-slate-200"
                  style={{ minHeight: 'calc(100vh - 12rem)' }}
                >
                  {/* Header */}
                  <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                    <h2 className="text-lg font-bold text-white">Fleet KPI Dashboard</h2>
                    <div className="flex items-center gap-2">
                      <select
                        className="bg-slate-800 text-white text-[11px] font-bold px-2 py-1.5 rounded shadow-sm border border-slate-700 outline-none cursor-pointer"
                        value={(() => {
                          const today = new Date();
                          const y = today.getFullYear();
                          const m = String(today.getMonth() + 1).padStart(2, '0');
                          const d = String(today.getDate()).padStart(2, '0');
                          const todayStr = `${y}-${m}-${d}`;
                        
                          const lastWeek = new Date(today);
                          lastWeek.setDate(today.getDate() - 7);
                          const wy = lastWeek.getFullYear();
                          const wm = String(lastWeek.getMonth() + 1).padStart(2, '0');
                          const wd = String(lastWeek.getDate()).padStart(2, '0');
                          const lastWeekStr = `${wy}-${wm}-${wd}`;
                        
                          if (adminFilters.endDate === todayStr) {
                            if (adminFilters.startDate === todayStr) return 'Daily';
                            if (adminFilters.startDate === lastWeekStr) return 'Weekly';
                            if (adminFilters.startDate === `${y}-${m}-01`) return 'Monthly';
                            if (adminFilters.startDate === `${y}-01-01`) return 'Yearly';
                          }
                          return 'Custom';
                        })()}
                        onChange={(e) => {
                          const preset = e.target.value;
                          const today = new Date();
                          const y = today.getFullYear();
                          const m = String(today.getMonth() + 1).padStart(2, '0');
                          const d = String(today.getDate()).padStart(2, '0');
                          const todayStr = `${y}-${m}-${d}`;

                          if (preset === 'Daily') {
                            setAdminFilters({ ...adminFilters, startDate: todayStr, endDate: todayStr });
                          } else if (preset === 'Weekly') {
                            const lastWeek = new Date(today);
                            lastWeek.setDate(today.getDate() - 7);
                            const wy = lastWeek.getFullYear();
                            const wm = String(lastWeek.getMonth() + 1).padStart(2, '0');
                            const wd = String(lastWeek.getDate()).padStart(2, '0');
                            setAdminFilters({ ...adminFilters, startDate: `${wy}-${wm}-${wd}`, endDate: todayStr });
                          } else if (preset === 'Monthly') {
                            setAdminFilters({ ...adminFilters, startDate: `${y}-${m}-01`, endDate: todayStr });
                          } else if (preset === 'Yearly') {
                            setAdminFilters({ ...adminFilters, startDate: `${y}-01-01`, endDate: todayStr });
                          }
                        }}
                      >
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Yearly">Yearly</option>
                        <option value="Custom" hidden>Custom</option>
                      </select>
                      
                      <div className="flex items-center gap-2 bg-slate-800 px-2.5 py-1 rounded shadow-sm border border-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-white" />
                        <input
                          type="date"
                          className="bg-transparent text-[11px] font-bold text-white outline-none border-none w-[88px] cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:invert"
                          value={adminFilters.startDate}
                          onChange={(e) => setAdminFilters({ ...adminFilters, startDate: e.target.value })}
                        />
                        <span className="text-slate-400 text-[10px] font-bold">—</span>
                        <input
                          type="date"
                          className="bg-transparent text-[11px] font-bold text-white outline-none border-none w-[88px] cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:invert"
                          value={adminFilters.endDate}
                          onChange={(e) => setAdminFilters({ ...adminFilters, endDate: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 gap-4">
                    {/* Left Column (Main content) */}
                    <div className="xl:col-span-4 lg:col-span-3 md:col-span-2 space-y-4">
                      {/* Top KPI Cards */}
                      <div className="flex flex-row w-full gap-2">
                        {[
                          { title: 'HIRE COUNT', value: adminData.kpis.hireCount, color: 'text-emerald-400', trend: '+4%', isUp: true },
                          { title: 'TOTAL REVENUE', value: `Rs. ${adminData.kpis.totalSales.toLocaleString()}`, color: 'text-emerald-400', trend: '+8%', isUp: true },
                          { title: 'FUEL COST', value: `Rs. ${adminData.kpis.totalFuel.toLocaleString()}`, color: 'text-rose-400', trend: '-10%', isUp: false },
                          { title: 'REPAIR COST', value: `Rs. ${adminData.kpis.totalRepairCost.toLocaleString()}`, color: 'text-rose-400', trend: '+49%', isUp: true },
                          { title: 'FUEL LITERS', value: `${(adminData.kpis.totalFuelLiters || 0).toLocaleString(undefined, {maximumFractionDigits: 1})} L`, color: 'text-white', trend: 'N/A', isUp: true },
                          { title: 'TOTAL MILEAGE', value: `${(adminData.tables.fleetData?.reduce((sum: number, row: any) => sum + (Number(String(row.values?.[22] || 0).replace(/[^\d.-]/g, '')) || 0), 0) || 0).toLocaleString()} KM`, color: 'text-slate-200', trend: 'N/A', isUp: true },
                          { title: 'DRIVER COMMISSION', value: `Rs. ${(adminData.kpis.totalCommission || 0).toLocaleString()}`, color: 'text-rose-400', trend: 'N/A', isUp: true },
                        ].map((kpi, idx) => (
                          <div key={idx} className="flex-1 min-w-0 bg-[#0f172a] p-2 rounded-lg shadow-sm border border-slate-800 flex flex-col justify-between h-20">
                            <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-wide truncate">{kpi.title}</h3>
                            <div className={`text-sm font-bold tracking-tight leading-none truncate ${kpi.color}`}>
                              {kpi.value}
                            </div>
                            <div className="flex items-center gap-1 mt-auto truncate">
                              <div className="w-3.5 h-3.5 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                                <TrendingUp className="w-2 h-2 text-slate-500" />
                              </div>
                              <span className={`text-[8px] font-semibold truncate ${kpi.isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {kpi.isUp ? '▲' : '▼'} {kpi.trend}
                              </span>
                              <div className="ml-auto w-3.5 h-3.5 rounded flex items-center justify-center bg-slate-900 shrink-0">
                                <Calendar className="w-2 h-2 text-slate-500" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right Column Wrapper */}
                    <div className="flex flex-col gap-4">
                      {/* Right Sidebar (Fleet Summary) */}
                      <div className="bg-[#0f172a] rounded-lg shadow-sm border border-slate-800 overflow-hidden flex flex-col min-h-[480px] max-h-[600px] xl:max-h-full">
                        <div className="p-3 border-b border-slate-800 bg-slate-900 flex items-center justify-between shrink-0">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide flex-shrink-0">Fleet summary</h3>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                const headers = ["Vehicle", "Hire Income", "KM", "Fuel Cost", "Fuel %"];
                                const rows = (adminData.tables.topVehicles || []).map((v: any) => [
                                  v.vehicle,
                                  Math.round(v.hireIncome).toLocaleString(),
                                  Math.round(v.mileage).toLocaleString(),
                                  `Rs.${Math.round(v.fuelCost).toLocaleString()}`,
                                  `${v.fuelPercentage.toFixed(2)}%`
                                ]);
                                const csvContent = [headers.join("\t"), ...rows.map((r: any) => r.join("\t"))].join("\n");
                                navigator.clipboard.writeText(csvContent);
                                setAlert({ type: 'success', message: 'Copied to clipboard!' });
                              }}
                              className="p-1 hover:bg-slate-800 rounded transition-colors"
                              title="Copy Table"
                            >
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                            <Car className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                        </div>
                        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar bg-slate-950 text-white p-2">
                          <table className="w-full text-left text-xs font-sans border-collapse">
                            <thead>
                              <tr className="border-b border-white/10 text-slate-400">
                                <th className="py-3 px-2 font-bold">Vehicle</th>
                                <th className="py-3 px-2 font-bold text-right">Hire Income</th>
                                <th className="py-3 px-2 font-bold text-right">KM</th>
                                <th className="py-3 px-2 font-bold text-right">Fuel Cost</th>
                                <th className="py-3 px-2 font-bold text-right">Fuel %</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {(adminData.tables.topVehicles || []).map((v: any, i: number) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                  <td className="py-3 px-2 font-bold text-slate-300">{v.vehicle}</td>
                                  <td className="py-3 px-2 text-right text-white font-mono">{Math.round(v.hireIncome).toLocaleString()}</td>
                                  <td className="py-3 px-2 text-right text-slate-300 font-mono">{Math.round(v.mileage).toLocaleString()}</td>
                                  <td className="py-3 px-2 text-right text-rose-400 font-mono">Rs.{Math.round(v.fuelCost).toLocaleString()}</td>
                                  <td className="py-3 px-2 text-right text-rose-400 font-mono">{v.fuelPercentage.toFixed(2)}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Profit Calculation Card */}
                      <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-4 text-white flex flex-col justify-between shadow-sm">
                        <div className="border-b border-slate-800 pb-2 mb-3 flex items-center justify-between">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Profit equation</h3>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider font-mono">Formula: Rev - Cost</span>
                        </div>
                        
                        <div className="space-y-2 text-sm font-sans">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Total Revenue</span>
                            <span className="font-bold text-emerald-400">Rs. {adminData.kpis.totalSales.toLocaleString()}</span>
                          </div>
                          
                          <div className="flex justify-between items-center text-rose-400">
                            <span className="text-slate-400">(-) Fuel Cost</span>
                            <span className="font-semibold">- Rs. {adminData.kpis.totalFuel.toLocaleString()}</span>
                          </div>

                          <div className="flex justify-between items-center text-rose-400">
                            <span className="text-slate-400">(-) Repair Cost</span>
                            <span className="font-semibold">- Rs. {adminData.kpis.totalRepairCost.toLocaleString()}</span>
                          </div>

                          <div className="flex justify-between items-center text-rose-400">
                            <span className="text-slate-400">(-) Driver Commission</span>
                            <span className="font-semibold">- Rs. {adminData.kpis.totalCommission.toLocaleString()}</span>
                          </div>

                          <div className="border-t border-slate-800 my-2 pt-2 flex justify-between items-center">
                            <span className="text-sm font-black tracking-wider text-slate-400 uppercase">Profit</span>
                            <span className={cn(
                              "text-base font-black font-mono",
                              adminData.kpis.netIncome >= 0 ? "text-emerald-400" : "text-rose-500"
                            )}>
                              Rs. {adminData.kpis.netIncome.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
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
                            <span className="text-xs font-bold text-white">{adminData.driverNames?.[d.driver] || d.driver}</span>
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
                            <td className="px-6 py-4 text-[10px] font-bold text-white whitespace-nowrap">{adminData.driverNames?.[t.driver] || t.driver}</td>
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
                                (t.status || 'Pending') === 'Approved' ? "bg-green-300 text-green-900" :
                                (t.status || 'Pending') === 'Cancelled' ? "bg-red-500 text-white" :
                                "bg-yellow-200 text-yellow-900"
                              )}>
                                {t.status || 'Pending'}
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
                  <div className="p-4 border-b border-white/5 bg-white/5 flex flex-col 2xl:flex-row items-start 2xl:items-center justify-between gap-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 w-full 2xl:w-auto justify-between 2xl:justify-start">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden lg:block whitespace-nowrap">Complete Fleet Data</h3>
                      
                      {/* Pagination Controls */}
                      {adminData.pagination && adminData.pagination.totalPages > 1 && (
                        <div className="flex items-center gap-3">
                          <p className="text-[9px] text-slate-500 font-medium whitespace-nowrap">
                            Showing <span className="text-white font-bold">{((adminData.pagination.page - 1) * 50) + 1}</span> to <span className="text-white font-bold">{Math.min(adminData.pagination.page * 50, adminData.pagination.totalItems)}</span> of <span className="text-white font-bold">{adminData.pagination.totalItems}</span>
                          </p>
                          <div className="flex items-center gap-1">
                            <button onClick={() => setAdminPage(prev => Math.max(1, prev - 1))} disabled={adminData.pagination.page === 1} className="p-1 rounded-lg border border-white/5 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-all"><ChevronLeft className="w-3.5 h-3.5" /></button>
                            {Array.from({ length: Math.min(5, adminData.pagination.totalPages) }).map((_, i) => {
                              let pageNum = 1;
                              if (adminData.pagination.totalPages <= 5) pageNum = i + 1;
                              else if (adminData.pagination.page <= 3) pageNum = i + 1;
                              else if (adminData.pagination.page >= adminData.pagination.totalPages - 2) pageNum = adminData.pagination.totalPages - 4 + i;
                              else pageNum = adminData.pagination.page - 2 + i;
                              return (
                                <button key={i} onClick={() => setAdminPage(pageNum)} className={cn("w-6 h-6 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center", adminData.pagination.page === pageNum ? "bg-emerald-500 text-black" : "text-slate-400 hover:text-white hover:bg-white/5")}>{pageNum}</button>
                              );
                            })}
                            <button onClick={() => setAdminPage(prev => Math.min(adminData.pagination.totalPages, prev + 1))} disabled={adminData.pagination.page === adminData.pagination.totalPages} className="p-1 rounded-lg border border-white/5 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-all"><ChevronRight className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="relative mr-2 w-80 hidden sm:block">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search fleet data..."
                          className="w-full bg-slate-900/50 border border-white/10 rounded-lg py-1.5 pl-8 pr-3 text-[10px] text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                          value={fleetSearch}
                          onChange={(e) => setFleetSearch(e.target.value)}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full hidden sm:inline-block">{adminData.tables.fleetData.length} Records</span>
                      <button
                        onClick={() => fetchAdminSales()}
                        className="p-1.5 rounded-lg hover:bg-white/5 transition-all text-slate-400 hover:text-white"
                        title="Refresh Data"
                      >
                        <RefreshCw className={cn("w-3.5 h-3.5", fetchingAdmin && "animate-spin")} />
                      </button>
                      <label className="px-3 py-1 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded text-[10px] font-bold transition-colors uppercase tracking-wider flex items-center gap-1 cursor-pointer">
                        {importingCsv ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                        <span className="hidden sm:inline">{importingCsv ? 'Importing...' : 'Import CSV'}</span>
                        <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} disabled={importingCsv} />
                      </label>
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
                  <div className="overflow-x-auto overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(100vh - 350px)' }}>
                    <table className="w-full text-left relative">
                      <thead className="sticky top-0 z-20 bg-slate-900 shadow-md">
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                          {[
                            'Status', 'STAFF COMMENT', 'FR Ref', 'Start TS', 'Driver', 'Vehicle Num',
                            'Purpose', 'Garage Start', 'Garage End', 'End TS',
                            'Fuel Cost', 'Fuel Meter', 'Fuel Liters', '2nd Fuel Cost', '2nd Fuel Meter', '2nd Fuel Liters', 'Comments', 'Repair Cost', 'Trip Ref',
                            'SC Due Amount', 'Drv Comms', 'Trip Start Meter',
                            'Trip End Meter', 'Pkg Balance Mileage', 'Loss (Start)',
                            'Loss (End)', 'Total Mileage', 'Final Price',
                            'Actions'
                          ].map(h => (
                            <th key={h} className={cn(
                              "px-6 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap",
                              h === 'Actions' ? "sticky right-0 z-10 bg-slate-900 shadow-[-10px_0_20px_-5px_rgba(0,0,0,0.5)] border-l border-white/5" : ""
                            )}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {adminData.tables.fleetData.map((t: any, i: number) => {
                          const originalIndex = adminData.tables.fleetData.indexOf(t);
                          const vehicleNum = t.values[4];
                          const rawGarageStart = t.values[6];
                          
                          const currentStatusStr = String(t.values[0] || '').toLowerCase();
                          const isCurrentIgnoredForAlerts = currentStatusStr.includes('cancel') || currentStatusStr.includes('approved');
                          const isPurposeFiltered = adminFilters.purpose !== 'All';
                          const prevTrip = vehicleNum ? adminData.tables.fleetData.slice(originalIndex + 1).find((pt: any) => pt.values[4] === vehicleNum && !String(pt.values[0] || '').toLowerCase().includes('cancel')) : null;
                          const rawPrevGarageEnd = prevTrip ? prevTrip.values[8] : null;
                          
                          let mismatch = 0;
                          let hasMismatch = false;
                          
                          if (
                            !isCurrentIgnoredForAlerts && !isPurposeFiltered &&
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
                            {[0, 'staff_comment', 1, 2, 3, 4, 5, 6, 8, 7, 9, 'fuel_meter', 'fuel_liters', 24, 25, 26, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 22, 23].map((idx) => (
                              <td 
                                key={idx} 
                                className={cn(
                                  "px-6 py-2 text-xs whitespace-nowrap",
                                  hasMismatch && idx === 6 ? "font-bold" : ""
                                )}
                                title={hasMismatch && idx === 6 ? `${mismatch} km mismatch with the last trip for this vehicle` : undefined}
                              >
                                {idx === 'staff_comment' ? (
                                  <div 
                                    onClick={() => {
                                      const currentComment = t.values[27] || '';
                                      setCommentTarget({ rf: t.rf, comment: currentComment });
                                      setCommentText(currentComment);
                                      setShowCommentModal(true);
                                    }}
                                    className="flex items-center gap-2 cursor-pointer hover:bg-white/10 p-1 rounded transition-colors group min-w-[80px]"
                                  >
                                    {t.values[27] ? (
                                      <span className="text-white text-xs">{t.values[27]}</span>
                                    ) : (
                                      <span className="text-slate-500 italic text-[10px] flex items-center gap-1">
                                        <Plus className="w-3 h-3" /> Add
                                      </span>
                                    )}
                                    {t.values[27] && <Edit className="w-3 h-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                  </div>
                                ) : idx === 'fuel_meter' || idx === 'fuel_liters' ? (
                                  <span className="text-white">
                                    {(() => {
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
                                    })()}
                                  </span>
                                ) : idx === 0 ? (
                                  <select
                                    value={t.values[idx as number] || 'Pending'}
                                    onChange={async (e) => {
                                      const newStatus = e.target.value;
                                      const newValues = [...t.values];
                                      newValues[0] = newStatus;
                                      setAlert({ type: 'warning', message: 'Updating status...' });
                                      try {
                                        const res = await fetch('/api/admin/edit-trip', {
                                          method: 'PUT',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ reference: t.rf, rawValues: newValues })
                                        });
                                        const data = await res.json();
                                        if (data.error) throw new Error(data.error);
                                        setAlert({ type: 'success', message: 'Status updated!' });
                                        
                                        // Update local state optimistically
                                        const newFleetData = [...adminData.tables.fleetData];
                                        const rowIdx = newFleetData.findIndex((r: any) => r.rf === t.rf);
                                        if (rowIdx > -1) {
                                          newFleetData[rowIdx].values[0] = newStatus;
                                          setAdminData({
                                            ...adminData,
                                            tables: {
                                              ...adminData.tables,
                                              fleetData: newFleetData
                                            }
                                          });
                                        }
                                      } catch (err: any) {
                                        setAlert({ type: 'error', message: err.message || 'Failed to update status' });
                                      }
                                    }}
                                    className={cn(
                                      "px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest cursor-pointer outline-none appearance-none text-center",
                                      (t.values[idx as number] || 'Pending') === 'Approved' ? "bg-green-300 text-green-900" :
                                      (t.values[idx as number] || 'Pending') === 'Cancelled' ? "bg-red-500 text-white" :
                                      "bg-yellow-200 text-yellow-900"
                                    )}
                                  >
                                    <option value="Pending" className="bg-slate-800 text-white font-bold">Pending</option>
                                    <option value="Approved" className="bg-slate-800 text-white font-bold">Approved</option>
                                    <option value="Cancelled" className="bg-slate-800 text-white font-bold">Cancelled</option>
                                  </select>
                                ) : idx === 5 ? (
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                                    t.values[idx as number] === 'Hire' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                                  )}>
                                    {t.values[idx as number]}
                                  </span>
                                ) : idx === 10 ? (
                                  <span className="font-sans font-normal text-white">
                                    {(() => {
                                      let val = (t.values[10] || '').toString();
                                      val = val.replace(/\(Fuel - (.*?)\)/g, '').replace(/\(Fuel Meter:\s*([\d.]+)\s*KM\)/ig, '').trim();
                                      return val || '-';
                                    })()}
                                  </span>
                                ) : idx === 1 ? (
                                  <div className="flex items-center gap-2">
                                    {(() => {
                                      const sLossRaw = t.values[18];
                                      const eLossRaw = t.values[19];
                                      if (sLossRaw !== undefined && sLossRaw !== null && String(sLossRaw).trim() !== '' &&
                                          eLossRaw !== undefined && eLossRaw !== null && String(eLossRaw).trim() !== '') {
                                        const sLoss = Number(String(sLossRaw).replace(/[^\d.-]/g, ''));
                                        const eLoss = Number(String(eLossRaw).replace(/[^\d.-]/g, ''));
                                        if (!isNaN(sLoss) && !isNaN(eLoss) && sLoss !== eLoss) {
                                          const currentStatusStr = String(t.values[0] || '').toLowerCase();
                                          if (!currentStatusStr.includes('cancel') && !currentStatusStr.includes('approved')) {
                                            return <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" title="Start and End Loss mismatch"></span>;
                                          }
                                        }
                                      }
                                      return null;
                                    })()}
                                    <span className="text-white">{t.values[idx as number] !== undefined && t.values[idx as number] !== null ? t.values[idx as number].toString() : '-'}</span>
                                  </div>
                                ) : (
                                  <span className={cn(
                                    "font-sans font-normal flex items-center gap-1.5",
                                    (idx === 13 || idx === 14 || idx === 23) ? "text-emerald-500" :
                                      (idx === 9 || idx === 11 || idx === 24) ? "text-rose-400" : "text-white"
                                  )}>
                                    {hasMismatch && idx === 6 && (
                                      <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse shrink-0"></span>
                                    )}
                                    {(() => {
                                      const isFinished = t.values[8] !== undefined && t.values[8] !== null && String(t.values[8]).trim() !== '';
                                      if (!isFinished && (idx === 18 || idx === 19 || idx === 22)) {
                                        return '0';
                                      }
                                      if (idx === 18 && (t.values[idx as number] === undefined || t.values[idx as number] === null || String(t.values[idx as number]).trim() === '')) {
                                        return '0';
                                      }
                                      return (t.values[idx as number] !== undefined && t.values[idx as number] !== null) ? t.values[idx as number].toString() : '-';
                                    })()}
                                  </span>
                                )}
                              </td>
                            ))}
                            <td className="px-6 py-2 text-xs whitespace-nowrap sticky right-0 z-10 bg-slate-900 group-hover:bg-slate-800 shadow-[-10px_0_20px_-5px_rgba(0,0,0,0.5)] border-l border-white/5 transition-colors">
                              <div className="relative group/action">
                                <button className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer outline-none">
                                  <MoreVertical className="w-4 h-4 text-slate-400" />
                                </button>
                                <div className="absolute right-full top-0 mr-2 w-32 bg-slate-800 border border-slate-700/50 rounded-xl shadow-xl opacity-0 invisible group-hover/action:opacity-100 group-hover/action:visible transition-all flex flex-col gap-1 p-1 z-[60]">
                                  <button
                                    onClick={() => setViewingTrip(t)}
                                    className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 text-sky-400 rounded-lg w-full text-left text-xs font-bold transition-colors"
                                  >
                                    <Eye className="w-3.5 h-3.5" /> View Trip
                                  </button>
                                  <button
                                    onClick={async () => {
                                      setViewingImages({ rf: t.rf, images: null, loading: true });
                                      try {
                                        const res = await fetch(`/api/admin/trip-images?ref=${t.rf}`);
                                        const data = await res.json();
                                        setViewingImages({ rf: t.rf, images: data.images || [], loading: false });
                                      } catch (err) {
                                        setViewingImages({ rf: t.rf, images: [], loading: false });
                                      }
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 text-emerald-400 rounded-lg w-full text-left text-xs font-bold transition-colors"
                                  >
                                    <ImageIcon className="w-3.5 h-3.5" /> Proofs
                                  </button>
                                  <button
                                    onClick={() => {
                                      let fMeter = '';
                                      let fLiters = '';
                                      let cleanComments = t.values[10] || '';
                                      const fuelMatch = cleanComments.toString().match(/\(Fuel - (.*?)\)/);
                                      if (fuelMatch) {
                                        const fuelStr = fuelMatch[1];
                                        const m1 = fuelStr.match(/Meter:\s*([\d.]+)\s*KM/i);
                                        if (m1) fMeter = m1[1];
                                        const m2 = fuelStr.match(/Liters:\s*([\d.]+)/i);
                                        if (m2) fLiters = m2[1];
                                      } else {
                                        const oldMatch = cleanComments.toString().match(/\(Fuel Meter:\s*([\d.]+)\s*KM\)/i);
                                        if (oldMatch) fMeter = oldMatch[1];
                                      }
                                      cleanComments = cleanComments.toString().replace(/\(Fuel - (.*?)\)/g, '').replace(/\(Fuel Meter:\s*([\d.]+)\s*KM\)/ig, '').trim();
                                      setEditingTrip({ ...t, fMeter, fLiters, cleanComments: cleanComments || t.values[10] });
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 text-emerald-400 rounded-lg w-full text-left text-xs font-bold transition-colors"
                                  >
                                    <Edit className="w-3.5 h-3.5" /> Edit Trip
                                  </button>
                                  <button
                                    onClick={() => handleDeleteFleetRow(t.rf)}
                                    className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 text-red-400 rounded-lg w-full text-left text-xs font-bold transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete Trip
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls moved to top */}
                </motion.div>
              )}
            </div>
          ) : null}



          {!fetchingAdmin && adminTab === 'driver-manage' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-emerald-500" />
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Driver Management</h3>
                  </div>
                  <button
                    onClick={() => setAddingDriver({ username: '', password: '', name: '', phone: '', role: 'driver', status: 'Active', vehicle: 'Unassigned' })}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-xs font-black transition-colors uppercase tracking-wider shadow-lg shadow-emerald-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    Add Driver
                  </button>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search drivers..."
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                      value={driverManageFilters.search}
                      onChange={(e) => setDriverManageFilters({ ...driverManageFilters, search: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <select
                      className="bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      value={driverManageFilters.driver}
                      onChange={(e) => setDriverManageFilters({ ...driverManageFilters, driver: e.target.value })}
                    >
                      <option value="All">All Drivers</option>
                      {adminData?.filterOptions?.drivers?.map((d: string) => (
                        <option key={d} value={d}>{adminData.driverNames?.[d] || d}</option>
                      ))}
                    </select>
                    <select
                      className="bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      value={driverManageFilters.status}
                      onChange={(e) => setDriverManageFilters({ ...driverManageFilters, status: e.target.value })}
                    >
                      <option value="All">All Statuses</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                    <select
                      className="bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      value={driverManageFilters.vehicle}
                      onChange={(e) => setDriverManageFilters({ ...driverManageFilters, vehicle: e.target.value })}
                    >
                      <option value="All">All Vehicles</option>
                      <option value="Unassigned">Unassigned</option>
                      {adminData?.filterOptions?.vehicles?.map((v: string) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {adminData?.tables?.driversList?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                          {['User Name', 'Password', 'Role', 'Name', 'Phone Number', 'Assigned Vehicle', 'Status', 'Actions'].map(h => (
                            <th key={h} className={cn(
                              "px-10 py-2 text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap",
                              h === 'Actions' ? "sticky right-0 z-10 bg-slate-900 shadow-[-10px_0_20px_-5px_rgba(0,0,0,0.5)] border-l border-white/5 w-[1%]" : "",
                              h === 'Name' ? "w-full" : ""
                            )}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {adminData.tables.driversList.filter((driver: any) => {
                          const searchTerm = driverManageFilters.search.toLowerCase();
                          if (searchTerm && !driver.username.toLowerCase().includes(searchTerm) && !(driver.name || '').toLowerCase().includes(searchTerm)) {
                            return false;
                          }
                          if (driverManageFilters.driver !== 'All' && driver.username !== driverManageFilters.driver) {
                            return false;
                          }
                          if (driverManageFilters.status !== 'All' && driver.status !== driverManageFilters.status) {
                            return false;
                          }
                          let assignedVehicle = "Unassigned";
                          Object.keys(vehicleDrivers).forEach(v => {
                            if (vehicleDrivers[v] === driver.username) assignedVehicle = v;
                          });
                          if (driverManageFilters.vehicle !== 'All' && driverManageFilters.vehicle !== assignedVehicle) {
                            return false;
                          }
                          return true;
                        }).map((driver: any, i: number) => {
                          // Find assigned vehicle
                          let assignedVehicle = "Unassigned";
                          Object.keys(vehicleDrivers).forEach(v => {
                            if (vehicleDrivers[v] === driver.username) {
                              assignedVehicle = v;
                            }
                          });

                          return (
                            <tr key={i} className="hover:bg-white/5 transition-colors group">
                              <td className="px-10 py-2 text-xs font-bold text-emerald-500 whitespace-nowrap">{driver.username}</td>
                              <td className="px-10 py-2 text-xs font-mono text-slate-400 whitespace-nowrap">{driver.password}</td>
                              <td className="px-10 py-2 text-xs font-bold text-indigo-400 whitespace-nowrap">{driver.role}</td>
                              <td className="px-10 py-2 text-xs font-bold text-white whitespace-nowrap">{driver.name || '-'}</td>
                              <td className="px-10 py-2 text-xs text-slate-400 whitespace-nowrap">{driver.phone || '-'}</td>
                              <td className="px-10 py-2 text-xs whitespace-nowrap">
                                <span className={cn(
                                  "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                                  assignedVehicle === 'Unassigned' ? "bg-white/5 text-slate-500" : "bg-sky-500/10 text-sky-500 border border-sky-500/20"
                                )}>
                                  {assignedVehicle}
                                </span>
                              </td>
                              <td className="px-10 py-2 text-xs whitespace-nowrap">
                                <span className={cn(
                                  "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                                  driver.status === 'Active' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                                )}>
                                  {driver.status}
                                </span>
                              </td>
                              <td className="px-10 py-2 text-xs w-[1%] whitespace-nowrap flex items-center gap-2 sticky right-0 z-10 bg-slate-900 group-hover:bg-slate-800 shadow-[-10px_0_20px_-5px_rgba(0,0,0,0.5)] border-l border-white/5 transition-colors">
                                <button
                                  onClick={() => setViewingDriver(driver)}
                                  className="flex items-center gap-1 px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500 text-sky-500 hover:text-black border border-sky-500/20 rounded-lg text-[10px] font-black transition-colors uppercase tracking-wider"
                                >
                                  <Eye className="w-3 h-3" />
                                  View
                                </button>
                                <button
                                  onClick={() => setEditingDriver({ ...driver, vehicle: assignedVehicle })}
                                  className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg text-[10px] font-black transition-colors uppercase tracking-wider"
                                >
                                  <Edit className="w-3 h-3" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteDriver(driver.username)}
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
                ) : (
                  <p className="text-slate-400 text-xs">No driver data available. Please refresh the dashboard.</p>
                )}
              </div>
            </motion.div>
          )}

          {!fetchingAdmin && adminTab === 'accounts' && (
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
                  <div className="overflow-x-auto overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(100vh - 350px)' }}>
                    <table className="w-full text-left relative">
                      <thead className="sticky top-0 z-20 bg-slate-900 shadow-md">
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
                                    (val || 'Pending') === 'Approved' ? "bg-green-300 text-green-900" :
                                    (val || 'Pending') === 'Cancelled' ? "bg-red-500 text-white" :
                                    "bg-yellow-200 text-yellow-900"
                                  )}>
                                    {val || 'Pending'}
                                  </span>
                                ) : (
                                  <span className="font-sans font-normal text-white">
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

          {!fetchingAdmin && adminTab === 'messages' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex gap-2 p-1 bg-slate-900 border border-white/5 rounded-xl w-full max-w-md mb-6">
                <button
                  onClick={() => setAdminMessageTab('sent')}
                  className={cn("flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-lg transition-all", adminMessageTab === 'sent' ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:text-white")}
                >
                  Sent Box
                </button>
                <button
                  onClick={() => setAdminMessageTab('inbox')}
                  className={cn("flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-lg transition-all", adminMessageTab === 'inbox' ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:text-white")}
                >
                  Inbox
                </button>
              </div>

              {adminMessageTab === 'sent' && (
                <div className="glass-card overflow-hidden">
                  <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sent Messages</h3>
                    <button
                      onClick={() => setShowAdminMessageModal(true)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                    >
                      <Plus className="w-3 h-3" />
                      NEW MESSAGE
                    </button>
                  </div>
                  {fetchingMessages ? (
                    <div className="p-20 flex flex-col items-center justify-center space-y-4">
                      <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                      <p className="text-slate-400 font-black tracking-widest text-xs uppercase">Loading Messages...</p>
                    </div>
                  ) : (() => {
                    const isAdminMsg = (m: any) => m.sender === 'Admin' || (!m.sender && !m.driverName && !m.phoneNumber);
                    const adminSent = (messagesData?.messages || []).filter(isAdminMsg);
                    if (adminSent.length === 0) {
                      return (
                        <div className="p-10 flex flex-col items-center justify-center text-center gap-3">
                          <MessageSquare className="w-8 h-8 text-slate-600" />
                          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">No sent messages</p>
                        </div>
                      );
                    }
                    
                    const groupedAdminSent = Object.values(adminSent.reduce((acc: any, curr: any) => {
                      const key = `${curr.message}_${curr.timestamp}`;
                      if (!acc[key]) {
                        acc[key] = { ...curr, recipients: [curr.driverId] };
                      } else {
                        if (!acc[key].recipients.includes(curr.driverId)) {
                          acc[key].recipients.push(curr.driverId);
                        }
                      }
                      return acc;
                    }, {})) as any[];
                    
                    return (
                      <div className="space-y-3 p-4">
                        {groupedAdminSent.map((msg: any, i: number) => (
                          <div key={i} className="bg-slate-900/50 border border-white/5 p-4 rounded-xl flex flex-col md:flex-row justify-between gap-4 group hover:bg-white/5 transition-colors">
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-slate-200 whitespace-pre-wrap">"{msg.message}"</p>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-bold text-emerald-400 mb-2 uppercase tracking-widest">{msg.timestamp}</span>
                                <span className="text-slate-600 text-[10px]">â€¢</span>
                                <span className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Sent to {msg.recipients.length} driver(s)</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {adminMessageTab === 'inbox' && (
                <div className="glass-card overflow-hidden">
                  <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Driver Messages</h3>
                    <MessageSquare className="w-4 h-4 text-emerald-500" />
                  </div>

                {fetchingMessages ? (
                  <div className="p-20 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                    <p className="text-slate-400 font-black tracking-widest text-xs uppercase">Loading Messages...</p>
                  </div>
                ) : (messagesData?.messages || []).filter((m: any) => !(m.sender === 'Admin' || (!m.sender && !m.driverName && !m.phoneNumber))).length > 0 ? (
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
                        {(messagesData?.messages || []).filter((m: any) => !(m.sender === 'Admin' || (!m.sender && !m.driverName && !m.phoneNumber))).map((msg: any, i: number) => (
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
              )}

              {/* New Message Popup */}
              <AnimatePresence>
                {showAdminMessageModal && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative"
                    >
                      <button 
                        onClick={() => setShowAdminMessageModal(false)}
                        className="absolute top-4 right-4 text-slate-500 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2 mb-6">
                        <MessageSquare className="w-5 h-5 text-emerald-500" />
                        Send Message to Drivers
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Select Driver(s)</label>
                          <div className="relative" ref={driverDropdownRef}>
                            <div 
                              onClick={() => setShowDriverDropdown(!showDriverDropdown)}
                              className="w-full bg-slate-950 border border-emerald-500/20 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 transition-all cursor-pointer flex justify-between items-center hover:border-emerald-500/50"
                            >
                              <span className="truncate text-slate-200">
                                {adminMessageDriver.includes('All') 
                                  ? 'All Drivers' 
                                  : adminMessageDriver.length > 0 
                                    ? `${adminMessageDriver.length} Driver(s) Selected` 
                                    : 'Select Drivers'}
                              </span>
                              <div className="text-emerald-500/50 text-[10px]">â–¼</div>
                            </div>
                            
                            <AnimatePresence>
                              {showDriverDropdown && (
                                <motion.div
                                  initial={{ opacity: 0, y: -5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -5 }}
                                  className="absolute top-full mt-2 w-full bg-slate-950 border border-emerald-500/30 rounded-xl overflow-hidden z-[110] shadow-[0_10px_40px_-10px_rgba(16,185,129,0.2)] max-h-[220px] overflow-y-auto custom-scrollbar"
                                >
                                  <div 
                                    onClick={() => setAdminMessageDriver(['All'])}
                                    className="p-3 border-b border-white/5 cursor-pointer hover:bg-emerald-500/10 flex items-center gap-3 transition-colors"
                                  >
                                    <div className={cn("w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all", adminMessageDriver.includes('All') ? "bg-emerald-500 border-emerald-500" : "border-slate-600 bg-slate-900")}>
                                      {adminMessageDriver.includes('All') && <CheckCircle2 className="w-3 h-3 text-black" />}
                                    </div>
                                    <span className={cn("text-xs font-bold", adminMessageDriver.includes('All') ? "text-emerald-400" : "text-white")}>All Drivers</span>
                                  </div>
                                  
                                  {(adminData?.tables?.driversList || [])
                                    .filter((driver: any) => driver.status === 'Active' && driver.username)
                                    .map((driver: any, idx: number) => {
                                      const d = driver.username;
                                      const isSelected = adminMessageDriver.includes(d);
                                      return (
                                        <div 
                                          key={d || `driver-${idx}`}
                                          onClick={() => {
                                            if (adminMessageDriver.includes('All')) {
                                              setAdminMessageDriver([d]);
                                            } else {
                                              if (isSelected) {
                                                const newSelection = adminMessageDriver.filter(val => val !== d);
                                                setAdminMessageDriver(newSelection.length === 0 ? ['All'] : newSelection);
                                              } else {
                                                setAdminMessageDriver([...adminMessageDriver, d]);
                                              }
                                            }
                                          }}
                                          className={cn("p-3 border-b border-white/5 cursor-pointer hover:bg-white/5 flex items-center gap-3 transition-colors", isSelected && "bg-emerald-500/5")}
                                        >
                                          <div className={cn("w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all", isSelected ? "bg-emerald-500 border-emerald-500" : "border-slate-600 bg-slate-900")}>
                                            {isSelected && <CheckCircle2 className="w-3 h-3 text-black" />}
                                          </div>
                                          <span className={cn("text-xs", isSelected ? "font-medium text-emerald-400" : "font-normal text-slate-400")}>
                                            {driver.name || d} ({d})
                                          </span>
                                        </div>
                                      );
                                    })}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Message</label>
                          <textarea
                            className="w-full bg-slate-950 border border-white/5 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all resize-none"
                            rows={5}
                            placeholder="Type your message here..."
                            value={adminMessageText}
                            onChange={(e) => setAdminMessageText(e.target.value)}
                          />
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              let driverIds = adminMessageDriver;
                              if (driverIds.includes('All')) {
                                driverIds = (adminData?.tables?.driversList || [])
                                  .filter((d: any) => d.status === 'Active' && d.username)
                                  .map((d: any) => d.username);
                              }
                              
                              driverIds = driverIds.filter(Boolean);
                              
                              if (driverIds.length === 0) {
                                window.alert("No drivers selected or available.");
                                return;
                              }
                              
                              const res = await fetch('/api/admin/send-message', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  driverIds,
                                  message: adminMessageText
                                }),
                              });
                              
                              const data = await res.json();
                              if (data.error) throw new Error(data.error);
                              
                              setAlert({ type: 'success', message: `Message sent to ${data.count} driver(s)!` });
                              setShowAdminMessageModal(false);
                              setAdminMessageText('');
                              setAdminMessageDriver(['All']);
                              fetchAdminMessages();
                            } catch (err: any) {
                              setAlert({ type: 'error', message: err.message || 'Failed to send message' });
                            }
                          }}
                          disabled={!adminMessageText.trim() || adminMessageDriver.length === 0}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all"
                        >
                          SEND MESSAGE
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

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

          {/* DRIVER COMMISSION TAB */}
          {!fetchingAdmin && adminTab === 'commission' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Add Vehicle Section */}
              <div className="glass-card p-4 border border-white/5 bg-white/5 mb-6 flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1 space-y-1 w-full text-left">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Plus className="w-3 h-3 text-emerald-500" />
                    Add New Vehicle
                  </h3>
                  <p className="text-[9px] text-slate-500">Add a vehicle number to make it available system-wide</p>
                </div>
                <div className="flex w-full sm:w-auto items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. CBK-0647"
                    className="w-full sm:w-48 input-field h-9 text-xs"
                    value={newVehicleNumber}
                    onChange={(e) => setNewVehicleNumber(e.target.value.toUpperCase())}
                  />
                  <button
                    onClick={async () => {
                      if (!newVehicleNumber.trim()) return;
                      setAddingVehicle(true);
                      try {
                        const res = await fetch('/api/admin/add-vehicle', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ vehicleNumber: newVehicleNumber.trim() })
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || 'Failed to add vehicle');
                        setAlert({ type: 'success', message: `${newVehicleNumber} added successfully!` });
                        setNewVehicleNumber('');
                        fetchAdminSales(true);
                      } catch (err: any) {
                        setAlert({ type: 'error', message: err.message });
                      } finally {
                        setAddingVehicle(false);
                      }
                    }}
                    disabled={addingVehicle || !newVehicleNumber.trim()}
                    className="h-9 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shadow-lg shadow-emerald-500/20"
                  >
                    {addingVehicle ? 'ADDING...' : 'ADD VEHICLE'}
                  </button>
                </div>
              </div>

              <div className="glass-card overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Driver Commission Rates</h3>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/admin/commissions', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ commissions: vehicleCommissions })
                        });
                        if (!res.ok) throw new Error('Failed to save');
                        setAlert({ type: 'success', message: 'Commission rates saved to database successfully!' });
                      } catch (err) {
                        setAlert({ type: 'error', message: 'Error saving commission rates' });
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20"
                  >
                    SAVE ALL
                  </button>
                </div>
                
                {adminData?.filterOptions?.vehicles && adminData.filterOptions.vehicles.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                          <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest w-1/2">Vehicle Number</th>
                          <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest w-1/4">Commission Rate (%)</th>
                          <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest w-1/4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {adminData.filterOptions.vehicles.map((vehicle: string) => (
                          <tr key={vehicle} className="hover:bg-white/5 transition-colors group">
                            <td className="px-6 py-4 text-sm font-bold text-white">
                              {vehicle}
                            </td>
                            <td className="px-6 py-4">
                              <div className="relative w-32">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  placeholder="e.g. 10"
                                  value={vehicleCommissions[vehicle] !== undefined ? vehicleCommissions[vehicle] : ''}
                                  onChange={(e) => setVehicleCommissions(prev => ({ ...prev, [vehicle]: parseFloat(e.target.value) || 0 }))}
                                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2 px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors pr-8"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/admin/commissions', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ commissions: vehicleCommissions })
                                    });
                                    if (!res.ok) throw new Error('Failed to save');
                                    setAlert({ type: 'success', message: `Commission rate for ${vehicle} updated to ${vehicleCommissions[vehicle] || 0}% in database` });
                                  } catch (err) {
                                    setAlert({ type: 'error', message: 'Error updating commission rate' });
                                  }
                                }}
                                className="px-4 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-black text-[10px] font-black uppercase tracking-widest transition-all border border-emerald-500/20"
                              >
                                Update
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-20 text-center">
                    <p className="text-slate-500 font-bold">No vehicles found. Please refresh the dashboard.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* REPORT TAB */}
          {!fetchingAdmin && adminTab === 'report' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="glass-card p-4 border border-white/5 bg-white/5">
                <div className="flex flex-col md:flex-row md:items-end gap-4">
                  <div className="flex items-center gap-3 md:mr-2 mb-2 md:mb-0">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hidden md:block">
                      <ClipboardCheck className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-widest whitespace-nowrap">
                        Report
                      </h3>
                      <p className="text-[10px] text-slate-400">Settings</p>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Category</label>
                      <select
                        className="w-full input-field py-0 px-3 text-xs text-white h-9"
                        value={reportCategory}
                        onChange={(e) => setReportCategory(e.target.value as 'Credit' | 'Invoice')}
                      >
                        <option value="Credit">Credit Report</option>
                        <option value="Invoice">Invoice Report</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Date Range</label>
                      <div className="flex items-center gap-2 h-9">
                        <select
                          className="bg-slate-800 text-white text-[11px] font-bold px-2 h-full rounded shadow-sm border border-slate-700 outline-none cursor-pointer"
                          value={(() => {
                            const today = new Date();
                            const y = today.getFullYear();
                            const m = String(today.getMonth() + 1).padStart(2, '0');
                            const d = String(today.getDate()).padStart(2, '0');
                            const todayStr = `${y}-${m}-${d}`;
                          
                            const lastWeek = new Date(today);
                            lastWeek.setDate(today.getDate() - 7);
                            const wy = lastWeek.getFullYear();
                            const wm = String(lastWeek.getMonth() + 1).padStart(2, '0');
                            const wd = String(lastWeek.getDate()).padStart(2, '0');
                            const lastWeekStr = `${wy}-${wm}-${wd}`;
                          
                            if (reportEndDate === todayStr) {
                              if (reportStartDate === todayStr) return 'Daily';
                              if (reportStartDate === lastWeekStr) return 'Weekly';
                              if (reportStartDate === `${y}-${m}-01`) return 'Monthly';
                              if (reportStartDate === `${y}-01-01`) return 'Yearly';
                            }
                            return 'Custom';
                          })()}
                          onChange={(e) => {
                            const preset = e.target.value;
                            const today = new Date();
                            const y = today.getFullYear();
                            const m = String(today.getMonth() + 1).padStart(2, '0');
                            const d = String(today.getDate()).padStart(2, '0');
                            const todayStr = `${y}-${m}-${d}`;

                            if (preset === 'Daily') {
                              setReportStartDate(todayStr);
                              setReportEndDate(todayStr);
                            } else if (preset === 'Weekly') {
                              const lastWeek = new Date(today);
                              lastWeek.setDate(today.getDate() - 7);
                              const wy = lastWeek.getFullYear();
                              const wm = String(lastWeek.getMonth() + 1).padStart(2, '0');
                              const wd = String(lastWeek.getDate()).padStart(2, '0');
                              setReportStartDate(`${wy}-${wm}-${wd}`);
                              setReportEndDate(todayStr);
                            } else if (preset === 'Monthly') {
                              setReportStartDate(`${y}-${m}-01`);
                              setReportEndDate(todayStr);
                            } else if (preset === 'Yearly') {
                              setReportStartDate(`${y}-01-01`);
                              setReportEndDate(todayStr);
                            }
                          }}
                        >
                          <option value="Daily">Daily</option>
                          <option value="Weekly">Weekly</option>
                          <option value="Monthly">Monthly</option>
                          <option value="Yearly">Yearly</option>
                          <option value="Custom" hidden>Custom</option>
                        </select>
                        
                        <div className="flex-1 flex items-center justify-between gap-1 bg-slate-800 px-2 h-full rounded shadow-sm border border-slate-700">
                          <Calendar className="w-3.5 h-3.5 text-white shrink-0" />
                          <input
                            type="date"
                            className="bg-transparent text-[11px] font-bold text-white outline-none border-none w-[90px] cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:invert"
                            value={reportStartDate}
                            onChange={(e) => setReportStartDate(e.target.value)}
                          />
                          <span className="text-slate-400 text-[10px] font-bold shrink-0">—</span>
                          <input
                            type="date"
                            className="bg-transparent text-[11px] font-bold text-white outline-none border-none w-[90px] cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:invert"
                            value={reportEndDate}
                            onChange={(e) => setReportEndDate(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 md:mt-0">
                    <button
                      onClick={() => {
                        if (reportCategory === 'Credit') {
                          generateCreditReportCSV();
                        } else if (reportCategory === 'Invoice') {
                          generateInvoiceReportCSV();
                        } else {
                          setAlert({ type: 'warning', message: `Generating ${reportCategory} Report... Please wait.` });
                          setTimeout(() => setAlert(null), 3000);
                        }
                      }}
                      className="px-4 h-9 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 whitespace-nowrap"
                    >
                      <Download className="w-3 h-3" />
                      Generate
                    </button>

                  </div>
                </div>
              </div>

              {/* Credit Report Table */}
              {reportCategory === 'Credit' && reportFleetData?.tables?.fleetData && (
                fetchingReportData ? (
                  <div className="flex flex-col items-center justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-4" />
                    <p className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest">Loading Report Data...</p>
                  </div>
                ) : (
                <div className="glass-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-max">
                      <thead>
                        <tr className="border-b border-white/10 text-[11px] font-bold text-white uppercase bg-white/5">
                          <th className="p-2 border-r border-white/10"></th>
                          <th className="p-2 border-r border-white/10">*CreditMemoNo</th>
                          <th className="p-2 border-r border-white/10">*Customer</th>
                          <th className="p-2 border-r border-white/10">*CreditMemoDate</th>
                          <th className="p-2 border-r border-white/10">Location</th>
                          <th className="p-2 border-r border-white/10">Memo</th>
                          <th className="p-2 border-r border-white/10">Item(Product/Service)</th>
                          <th className="p-2 border-r border-white/10 min-w-[300px]">ItemDescription</th>
                          <th className="p-2 border-r border-white/10">ItemQuantity</th>
                          <th className="p-2 border-r border-white/10">ItemRate</th>
                          <th className="p-2 border-r border-white/10">*ItemAmount</th>
                          <th className="p-2">Service Date</th>
                        </tr>
                      </thead>
                      <tbody className="text-[12px] text-slate-300">
                        {reportFleetData.tables.fleetData
                          .filter((t: any) => t.values[5] === 'Hire' && !String(t.values[0] || '').toLowerCase().includes('cancel'))
                          .filter((t: any) => {
                            const parseDateToLocalMs = (dateStr: string | undefined): number => {
                              if (!dateStr) return 0;
                              const raw = String(dateStr).split(' ')[0].trim();
                              if (!raw) return 0;
                              if (raw.includes('-')) {
                                const parts = raw.split('-');
                                if (parts.length === 3) {
                                  if (parts[0].length === 4) return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])).getTime();
                                  if (parts[2].length === 4) return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
                                }
                              }
                              if (raw.includes('/')) {
                                const parts = raw.split('/');
                                if (parts.length === 3) {
                                  if (parts[2].length === 4) return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1])).getTime();
                                  if (parts[0].length === 4) return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])).getTime();
                                }
                              }
                              const d = new Date(raw);
                              if (!isNaN(d.getTime())) return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
                              return 0;
                            };
                            const startMs = reportStartDate ? parseDateToLocalMs(reportStartDate) : 0;
                            const endMs = reportEndDate ? parseDateToLocalMs(reportEndDate) + 86399999 : Infinity;
                            if (!startMs && endMs === Infinity) return true;
                            
                            const tripRef = t.values[12] || '';
                            let recordMs = 0;
                            if (tripRef && reportAccountData?.data) {
                              const accMatch = reportAccountData.data.find((row: any) => row.rawValues && row.rawValues[11] === tripRef);
                              if (accMatch) {
                                const rawEndDate = accMatch.rawValues[15] || '';
                                recordMs = parseDateToLocalMs(rawEndDate);
                              }
                            }
                            if (!recordMs) return false;
                            return recordMs >= startMs && recordMs <= endMs;
                          })
                          .map((t: any, i: number) => {
                            const tripRef = t.values[12] || '';
                            let formattedDate = '';
                            let pickUp = '';
                            let dropOff = '';
                            let scComm = '';

                            if (tripRef && reportAccountData?.data) {
                              const accMatch = reportAccountData.data.find((row: any) => row.rawValues && row.rawValues[11] === tripRef);
                              if (accMatch) {
                                const rawEndDate = accMatch.rawValues[15] || '';
                                if (rawEndDate) {
                                  const raw = String(rawEndDate).split(' ')[0];
                                  const d = new Date(raw);
                                  if (!isNaN(d.getTime())) {
                                    formattedDate = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
                                  } else {
                                    formattedDate = raw.replace(/\//g, '-');
                                  }
                                }
                                pickUp = accMatch.rawValues[24] || '';
                                dropOff = accMatch.rawValues[27] || '';
                                scComm = accMatch.rawValues[3] || '';
                              }
                            }
                            
                            const description = pickUp && dropOff ? `${pickUp} to ${dropOff}` : pickUp || dropOff || '';
                            const shortDescription = description.split(' ').length > 6 ? description.split(' ').slice(0, 6).join(' ') + '...' : description;
                            
                            return (
                              <tr key={i} className="hover:bg-white/5 transition-colors border-b border-white/5">
                                <td className="p-2 border-r border-white/5 text-slate-400">{tripRef}</td>
                                <td className="p-2 border-r border-white/5 text-white">{tripRef ? `C${tripRef}` : ''}</td>
                                <td className="p-2 border-r border-white/5 text-white">Senu Cabs & Tours</td>
                                <td className="p-2 border-r border-white/5 text-center text-white">{formattedDate}</td>
                                <td className="p-2 border-r border-white/5"></td>
                                <td className="p-2 border-r border-white/5"></td>
                                <td className="p-2 border-r border-white/5 text-emerald-400">CAB COMMISSION</td>
                                <td className="p-2 border-r border-white/5 whitespace-normal text-xs text-white" title={description}>{shortDescription}</td>
                                <td className="p-2 border-r border-white/5"></td>
                                <td className="p-2 border-r border-white/5"></td>
                                <td className="p-2 border-r border-white/5 text-right font-bold text-white">{scComm}</td>
                                <td className="p-2"></td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
                )
              )}

              {/* Invoice Report Table */}
              {reportCategory === 'Invoice' && reportFleetData?.tables?.fleetData && (
                fetchingReportData ? (
                  <div className="flex flex-col items-center justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-4" />
                    <p className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest">Loading Report Data...</p>
                  </div>
                ) : (
                <div className="glass-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-max">
                      <thead>
                        <tr className="border-b border-white/10 text-[11px] font-bold text-white uppercase bg-white/5">
                          <th className="p-2 border-r border-white/10">*InvoiceNo</th>
                          <th className="p-2 border-r border-white/10">*Customer</th>
                          <th className="p-2 border-r border-white/10">*InvoiceDate</th>
                          <th className="p-2 border-r border-white/10">*DueDate</th>
                          <th className="p-2 border-r border-white/10">Terms</th>
                          <th className="p-2 border-r border-white/10">Location</th>
                          <th className="p-2 border-r border-white/10">Memo</th>
                          <th className="p-2 border-r border-white/10">Item(Product/Service)</th>
                          <th className="p-2 border-r border-white/10">ItemDescription</th>
                          <th className="p-2 border-r border-white/10">ItemQuantity</th>
                          <th className="p-2 border-r border-white/10">ItemRate</th>
                          <th className="p-2 border-r border-white/10">*ItemAmount</th>
                          <th className="p-2">DRIVER COMM</th>
                        </tr>
                      </thead>
                      <tbody className="text-[12px] text-slate-300">
                        {reportFleetData.tables.fleetData
                          .filter((t: any) => t.values[5] === 'Hire' && !String(t.values[0] || '').toLowerCase().includes('cancel'))
                          .filter((t: any) => {
                            const parseDateToLocalMs = (dateStr: string | undefined): number => {
                              if (!dateStr) return 0;
                              const raw = String(dateStr).split(' ')[0].trim();
                              if (!raw) return 0;
                              if (raw.includes('-')) {
                                const parts = raw.split('-');
                                if (parts.length === 3) {
                                  if (parts[0].length === 4) return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])).getTime();
                                  if (parts[2].length === 4) return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
                                }
                              }
                              if (raw.includes('/')) {
                                const parts = raw.split('/');
                                if (parts.length === 3) {
                                  if (parts[2].length === 4) return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1])).getTime();
                                  if (parts[0].length === 4) return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])).getTime();
                                }
                              }
                              const d = new Date(raw);
                              if (!isNaN(d.getTime())) return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
                              return 0;
                            };
                            const startMs = reportStartDate ? parseDateToLocalMs(reportStartDate) : 0;
                            const endMs = reportEndDate ? parseDateToLocalMs(reportEndDate) + 86399999 : Infinity;
                            if (!startMs && endMs === Infinity) return true;
                            
                            const tripRef = t.values[12] || '';
                            let recordMs = 0;
                            if (tripRef && reportAccountData?.data) {
                              const accMatch = reportAccountData.data.find((row: any) => row.rawValues && row.rawValues[11] === tripRef);
                              if (accMatch) {
                                const rawEndDate = accMatch.rawValues[15] || '';
                                recordMs = parseDateToLocalMs(rawEndDate);
                              }
                            }
                            if (!recordMs) return false;
                            return recordMs >= startMs && recordMs <= endMs;
                          })
                          .map((t: any, i: number) => {
                            const tripRef = t.values[12] || '';
                            const vehicleNum = t.values[4] || '';
                            let formattedDate = '';
                            let hireAmount = '';
                            
                            const driverCode = t.values[3] || '';
                            const driverName = adminData.driverNames?.[driverCode] || driverCode;
                            const customerName = driverName ? `${driverName} - Cash` : '- Cash';
                            const driverComm = t.values[14] || '';

                            if (tripRef && reportAccountData?.data) {
                              const accMatch = reportAccountData.data.find((row: any) => row.rawValues && row.rawValues[11] === tripRef);
                              if (accMatch) {
                                const rawEndDate = accMatch.rawValues[15] || '';
                                if (rawEndDate) {
                                  const raw = String(rawEndDate).split(' ')[0];
                                  const d = new Date(raw);
                                  if (!isNaN(d.getTime())) {
                                    formattedDate = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
                                  } else {
                                    formattedDate = raw.replace(/\//g, '-');
                                  }
                                }
                                hireAmount = accMatch.rawValues[4] || '';
                              }
                            }
                            
                            return (
                              <tr key={i} className="hover:bg-white/5 transition-colors border-b border-white/5">
                                <td className="p-2 border-r border-white/5 text-slate-400">{tripRef}</td>
                                <td className="p-2 border-r border-white/5 text-emerald-400">{customerName}</td>
                                <td className="p-2 border-r border-white/5 text-center text-white">{formattedDate}</td>
                                <td className="p-2 border-r border-white/5"></td>
                                <td className="p-2 border-r border-white/5"></td>
                                <td className="p-2 border-r border-white/5"></td>
                                <td className="p-2 border-r border-white/5"></td>
                                <td className="p-2 border-r border-white/5 text-white">{vehicleNum}</td>
                                <td className="p-2 border-r border-white/5"></td>
                                <td className="p-2 border-r border-white/5"></td>
                                <td className="p-2 border-r border-white/5"></td>
                                <td className="p-2 border-r border-white/5 text-right font-bold text-white">{hireAmount}</td>
                                <td className="p-2 text-right font-bold text-rose-400">{driverComm}</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
                )
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* Alert Component */}
      <AnimatePresence>
        {alert && stage !== 'new' && stage !== 'update' && (
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
                      { label: '2nd Fuel Cost', value: `Rs. ${formData.secondFuelCost}` },
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
                          tripRef: '', tripStartMeter: '', tripEndMeter: '', fuelCost: '', secondFuelCost: '',
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
                {!currentRef && (
                  <button
                    onClick={() => setStage('dashboard')}
                    className="w-full py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest"
                  >
                    Back to Dashboard
                  </button>
                )}
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
                      let filtered = (tripRefs || []).map(t => t.ref);
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



            {stage === 'update' && currentRef && (
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
                  disabled={isFuelSubmitted || loading}
                  className={cn(
                    "w-full py-4 font-black rounded-xl transition-all shadow-lg uppercase tracking-widest text-xs flex items-center justify-center gap-2",
                    (isFuelSubmitted || loading) 
                      ? "bg-slate-500/50 text-slate-400 cursor-not-allowed" 
                      : "bg-sky-500 hover:bg-sky-400 text-black shadow-sky-500/20"
                  )}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : isFuelSubmitted ? (
                    'Details Submitted'
                  ) : (
                    'Submit Fuel Details'
                  )}
                </button>
                {isFuelSubmitted && (
                   <p className="text-center text-[10px] text-emerald-400 font-bold uppercase mt-2">
                     Submitted details displayed above.
                   </p>
                )}
                {isFuelSubmitted && fuelSubmitCount === 1 && formData.purpose === 'Hire' && (
                  <button
                    onClick={handleAddMoreFuel}
                    className="w-full py-3 mt-4 font-black rounded-xl border border-sky-500/50 text-sky-400 hover:bg-sky-500 hover:text-black transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                  >
                    + Add More Details
                  </button>
                )}
              </div>
            )}

            {stage === 'update' && currentRef && (
              <div className="glass-card p-6 space-y-6">
                <div className="flex items-center gap-3 text-white font-bold text-lg mb-2">
                  <ClipboardCheck className="w-5 h-5 text-emerald-500" />
                  End Trip Details
                </div>



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
                                âœ•
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

            {formData.purpose === 'Hire' && stage === 'update' && currentRef && (
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
            {(stage === 'new' || (stage === 'update' && currentRef)) && (
              <div className="flex flex-col gap-4">
                <AnimatePresence>
                  {alert && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={cn(
                        "p-4 rounded-2xl flex items-center gap-3 border shadow-lg",
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
                <div className="flex gap-4">
                  <button
                    onClick={() => window.history.back()}
                    className="flex-1 py-4 glass-card font-bold hover:bg-white/5 transition-colors"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !formData.purpose || (stage === 'update' && !formData.garageEndMeter) || (formData.purpose === 'Hire' && !formData.tripRef) || (formData.purpose === 'Fuel' && stage === 'update' && !isFuelSubmitted)}
                    className="flex-[2] py-4 btn-gradient text-white font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ClipboardCheck className="w-5 h-5" />}
                    SUBMIT RECORD
                  </button>
                </div>
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
              className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
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

              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {[
                  {
                    title: 'Start Details',
                    fields: [
                      { label: 'Status', idx: 0, type: 'select', options: ['Pending', 'Approved', 'Cancelled'] },
                      { label: 'Staff Comment', idx: 27, type: 'text' },
                      { label: 'FR Ref', idx: 1, type: 'text', readOnly: true },
                      { label: 'Start TS', idx: 2, type: 'text', readOnly: true },
                      { label: 'Driver', idx: 3, type: 'text' },
                      { label: 'Vehicle Num', idx: 4, type: 'select', options: adminData?.filterOptions?.vehicles || [] },
                      { label: 'Purpose', idx: 5, type: 'select', options: ['Hire', 'Repair', 'Personal', 'Fuel'] },
                      { label: 'Garage Start', idx: 6, type: 'number' },
                    ]
                  },
                  {
                    title: 'Fuel / Repair Details',
                    fields: [
                      { label: 'Fuel Cost', idx: 9, type: 'number' },
                      { label: 'Fuel Meter', idx: 'fuel_meter', type: 'number' },
                      { label: 'Fuel Liters', idx: 'fuel_liters', type: 'number' },
                      { label: '2nd Fuel Cost', idx: 24, type: 'number' },
                      { label: '2nd Fuel Meter', idx: 25, type: 'number' },
                      { label: '2nd Fuel Liters', idx: 26, type: 'number' },
                      { label: 'Comments', idx: 10, type: 'text' },
                      { label: 'Repair Cost', idx: 11, type: 'number' },
                      { label: 'Folder URL', idx: 20, type: 'text' },
                      { label: 'Folder ID', idx: 21, type: 'text' },
                    ]
                  },
                  {
                    title: 'End Details',
                    fields: [
                      { label: 'Garage End', idx: 8, type: 'number' },
                      { label: 'End TS', idx: 7, type: 'text', readOnly: true },
                      { label: 'Trip Ref', idx: 12, type: 'text' },
                      { label: 'SC Due Amount', idx: 13, type: 'number', readOnly: true },
                      { label: 'Drv Comms', idx: 14, type: 'number' },
                      { label: 'Trip Start Meter', idx: 15, type: 'number' },
                      { label: 'Trip End Meter', idx: 16, type: 'number' },
                      { label: 'Pkg Balance Mileage', idx: 17, type: 'number' },
                      { label: 'Loss (Start)', idx: 18, type: 'number', readOnly: true },
                      { label: 'Loss (End)', idx: 19, type: 'number', readOnly: true },
                      { label: 'Total Mileage', idx: 22, type: 'number', readOnly: true },
                      { label: 'Final Price', idx: 23, type: 'number' },
                    ]
                  }
                ].map((section, sIdx) => (
                  <div key={sIdx} className="bg-white/5 p-5 rounded-2xl border border-white/5">
                    <h4 className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-4 border-b border-white/10 pb-2">{section.title}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                      {section.fields.map((field: any, i) => (
                        <div key={i} className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{field.label}</label>
                      {field.type === 'select' ? (
                        <select
                          disabled={field.readOnly}
                          value={editingTrip.values[field.idx as number] || ''}
                          onChange={(e) => {
                            const newValues = [...editingTrip.values];
                            newValues[field.idx as number] = e.target.value;
                            setEditingTrip({ ...editingTrip, values: newValues });
                          }}
                          className="w-full bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                        >
                          <option value="">Select...</option>
                          {field.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : field.idx === 'fuel_meter' ? (
                         <input
                            type="number"
                            disabled={field.readOnly}
                            value={editingTrip.fMeter || ''}
                            onChange={(e) => setEditingTrip({ ...editingTrip, fMeter: e.target.value })}
                            className="w-full bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                         />
                      ) : field.idx === 'fuel_liters' ? (
                         <input
                            type="number"
                            disabled={field.readOnly}
                            value={editingTrip.fLiters || ''}
                            onChange={(e) => setEditingTrip({ ...editingTrip, fLiters: e.target.value })}
                            className="w-full bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                         />
                      ) : field.idx === 10 ? (
                         <input
                            type="text"
                            disabled={field.readOnly}
                            value={editingTrip.cleanComments || ''}
                            onChange={(e) => setEditingTrip({ ...editingTrip, cleanComments: e.target.value })}
                            className="w-full bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                         />
                      ) : (
                        <input
                          type={field.type}
                          disabled={field.readOnly}
                          value={editingTrip.values[field.idx as number] || ''}
                          onChange={(e) => {
                            const newValues = [...editingTrip.values];
                            newValues[field.idx as number] = e.target.value;
                            setEditingTrip({ ...editingTrip, values: newValues });
                          }}
                          className="w-full bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                        />
                      )}
                    </div>
                  ))}
                  </div>
                </div>
                ))}
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
                {viewingImages.loading ? (
                  <div className="p-20 flex flex-col items-center justify-center text-center space-y-3">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                    <p className="text-slate-400 font-black tracking-widest text-xs uppercase">Fetching Images...</p>
                  </div>
                ) : viewingImages.images && viewingImages.images.length > 0 ? (
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
      {/* View Trip Modal */}
      <AnimatePresence>
        {viewingTrip && (
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
              className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-sky-500" />
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">View Fleet Record ({viewingTrip.rf})</h3>
                </div>
                <button
                  onClick={() => setViewingTrip(null)}
                  className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {[
                  {
                    title: 'Start Details',
                    fields: [
                      { label: 'Status', idx: 0 },
                      { label: 'Staff Comment', idx: 27 },
                      { label: 'FR Ref', idx: 1 },
                      { label: 'Start TS', idx: 2 },
                      { label: 'Driver', idx: 3 },
                      { label: 'Vehicle Num', idx: 4 },
                      { label: 'Purpose', idx: 5 },
                      { label: 'Garage Start', idx: 6 },
                    ]
                  },
                  {
                    title: 'Fuel / Repair Details',
                    fields: [
                      { label: 'Fuel Cost', idx: 9 },
                      { label: 'Fuel Meter', idx: 'fuel_meter' },
                      { label: 'Fuel Liters', idx: 'fuel_liters' },
                      { label: '2nd Fuel Cost', idx: 24 },
                      { label: '2nd Fuel Meter', idx: 25 },
                      { label: '2nd Fuel Liters', idx: 26 },
                      { label: 'Comments', idx: 10 },
                      { label: 'Repair Cost', idx: 11 },
                      { label: 'Folder URL', idx: 20 },
                      { label: 'Folder ID', idx: 21 },
                    ]
                  },
                  {
                    title: 'End Details',
                    fields: [
                      { label: 'Garage End', idx: 8 },
                      { label: 'End TS', idx: 7 },
                      { label: 'Trip Ref', idx: 12 },
                      { label: 'SC Due Amount', idx: 13 },
                      { label: 'Drv Comms', idx: 14 },
                      { label: 'Trip Start Meter', idx: 15 },
                      { label: 'Trip End Meter', idx: 16 },
                      { label: 'Pkg Balance Mileage', idx: 17 },
                      { label: 'Loss (Start)', idx: 18 },
                      { label: 'Loss (End)', idx: 19 },
                      { label: 'Total Mileage', idx: 22 },
                      { label: 'Final Price', idx: 23 },
                    ]
                  }
                ].map((section, sIdx) => (
                  <div key={sIdx} className="bg-white/5 p-5 rounded-2xl border border-white/5">
                    <h4 className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-4 border-b border-white/10 pb-2">{section.title}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                      {section.fields.map((field, i) => (
                        <div key={i} className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{field.label}</p>
                      <p className="text-xs font-medium text-white truncate" title={String(field.idx === 'fuel_meter' || field.idx === 'fuel_liters' ? (
                        (() => {
                          if (viewingTrip.values[5] === 'Fuel') {
                            const rawComments = viewingTrip.values[10] || '';
                            const fuelMatch = rawComments.match(/\(Fuel - (.*?)\)/);
                            if (fuelMatch) {
                              const fuelStr = fuelMatch[1];
                              if (field.idx === 'fuel_meter') {
                                const m = fuelStr.match(/Meter:\s*([\d.]+)\s*KM/i);
                                return m ? m[1] : '-';
                              } else {
                                const m = fuelStr.match(/Liters:\s*([\d.]+)/i);
                                return m ? m[1] : '-';
                              }
                            } else {
                              const oldFuelRegex = /\(Fuel Meter:\s*([\d.]+)\s*KM\)/i;
                              const oldFuelMatch = rawComments.match(oldFuelRegex);
                              if (oldFuelMatch && field.idx === 'fuel_meter') return oldFuelMatch[1];
                              return '-';
                            }
                          }
                          return '-';
                        })()
                      ) : (
                        viewingTrip.values[field.idx as number] !== undefined && viewingTrip.values[field.idx as number] !== null && viewingTrip.values[field.idx as number] !== ''
                          ? (field.idx === 10 && viewingTrip.values[5] === 'Fuel' ? viewingTrip.values[10].toString().replace(/\(Fuel - (.*?)\)/g, '').replace(/\(Fuel Meter:\s*([\d.]+)\s*KM\)/ig, '').trim() : viewingTrip.values[field.idx as number])
                          : (field.idx === 18 ? '0' : '-')
                      ))}>
                        {field.idx === 'fuel_meter' || field.idx === 'fuel_liters' ? (
                          (() => {
                            if (viewingTrip.values[5] === 'Fuel') {
                              const rawComments = viewingTrip.values[10] || '';
                              const fuelMatch = rawComments.match(/\(Fuel - (.*?)\)/);
                              if (fuelMatch) {
                                const fuelStr = fuelMatch[1];
                                if (field.idx === 'fuel_meter') {
                                  const m = fuelStr.match(/Meter:\s*([\d.]+)\s*KM/i);
                                  return m ? m[1] : '-';
                                } else {
                                  const m = fuelStr.match(/Liters:\s*([\d.]+)/i);
                                  return m ? m[1] : '-';
                                }
                              } else {
                                const oldFuelRegex = /\(Fuel Meter:\s*([\d.]+)\s*KM\)/i;
                                const oldFuelMatch = rawComments.match(oldFuelRegex);
                                if (oldFuelMatch && field.idx === 'fuel_meter') return oldFuelMatch[1];
                                return '-';
                              }
                            }
                            return '-';
                          })()
                        ) : (
                          viewingTrip.values[field.idx as number] !== undefined && viewingTrip.values[field.idx as number] !== null && viewingTrip.values[field.idx as number] !== ''
                            ? (field.idx === 10 && viewingTrip.values[5] === 'Fuel' ? viewingTrip.values[10].toString().replace(/\(Fuel - (.*?)\)/g, '').replace(/\(Fuel Meter:\s*([\d.]+)\s*KM\)/ig, '').trim() || '-' : viewingTrip.values[field.idx as number])
                            : (field.idx === 18 ? '0' : '-')
                        )}
                      </p>
                    </div>
                  ))}
                  </div>
                </div>
                ))}
              </div>

              <div className="p-4 border-t border-white/5 bg-white/5 flex items-center justify-end">
                <button
                  onClick={() => setViewingTrip(null)}
                  className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-sky-500/20"
                >
                  Close Viewer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {viewingDriver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Driver Details</h3>
                    <p className="text-[10px] text-slate-400 font-medium">{viewingDriver.username}</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingDriver(null)}
                  className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 bg-white/5 p-3 rounded-xl border border-white/5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Username</p>
                    <p className="text-xs font-bold text-emerald-500">{viewingDriver.username}</p>
                  </div>
                  <div className="space-y-1 bg-white/5 p-3 rounded-xl border border-white/5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Password</p>
                    <p className="text-xs font-mono text-slate-300">{viewingDriver.password}</p>
                  </div>
                  <div className="space-y-1 bg-white/5 p-3 rounded-xl border border-white/5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Name</p>
                    <p className="text-xs font-bold text-white">{viewingDriver.name || '-'}</p>
                  </div>
                  <div className="space-y-1 bg-white/5 p-3 rounded-xl border border-white/5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phone</p>
                    <p className="text-xs font-medium text-slate-300">{viewingDriver.phone || '-'}</p>
                  </div>
                  <div className="space-y-1 bg-white/5 p-3 rounded-xl border border-white/5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Role</p>
                    <p className="text-xs font-bold text-indigo-400">{viewingDriver.role}</p>
                  </div>
                  <div className="space-y-1 bg-white/5 p-3 rounded-xl border border-white/5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                    <span className={cn(
                      "inline-flex px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider",
                      viewingDriver.status === 'Active' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                    )}>
                      {viewingDriver.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-white/5 bg-white/5 flex justify-end">
                <button
                  onClick={() => setViewingDriver(null)}
                  className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-sky-500/20"
                >
                  Close Viewer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {editingDriver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                    <Edit className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Edit Driver</h3>
                    <p className="text-[10px] text-slate-400 font-medium">{editingDriver.username}</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingDriver(null)}
                  className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditDriverSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Username (Read-Only)</label>
                    <input
                      type="text"
                      className="w-full bg-black/20 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold text-emerald-500 opacity-70 cursor-not-allowed"
                      value={editingDriver.username}
                      readOnly
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                    <input
                      type="text"
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none transition-colors"
                      value={editingDriver.password}
                      onChange={(e) => setEditingDriver({ ...editingDriver, password: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</label>
                    <input
                      type="text"
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-xs text-white focus:border-emerald-500 focus:outline-none transition-colors"
                      value={editingDriver.name || ''}
                      onChange={(e) => setEditingDriver({ ...editingDriver, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</label>
                    <input
                      type="text"
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-xs text-white focus:border-emerald-500 focus:outline-none transition-colors"
                      value={editingDriver.phone || ''}
                      onChange={(e) => setEditingDriver({ ...editingDriver, phone: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</label>
                      <select
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-xs text-white focus:border-emerald-500 focus:outline-none transition-colors"
                        value={editingDriver.role}
                        onChange={(e) => setEditingDriver({ ...editingDriver, role: e.target.value })}
                      >
                        <option value="driver">Driver</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label>
                      <select
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-xs text-white focus:border-emerald-500 focus:outline-none transition-colors"
                        value={editingDriver.status}
                        onChange={(e) => setEditingDriver({ ...editingDriver, status: e.target.value })}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vehicle</label>
                      <select
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-xs text-white focus:border-emerald-500 focus:outline-none transition-colors"
                        value={editingDriver.vehicle || "Unassigned"}
                        onChange={(e) => setEditingDriver({ ...editingDriver, vehicle: e.target.value })}
                      >
                        <option value="Unassigned">Unassigned</option>
                        {adminData?.filterOptions?.vehicles?.map((v: string) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-white/5 bg-white/5 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingDriver(null)}
                    className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-xs font-black uppercase tracking-wider transition-all"
                    disabled={savingDriver}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                    disabled={savingDriver}
                  >
                    {savingDriver && <Loader2 className="w-4 h-4 animate-spin" />}
                    {savingDriver ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {addingDriver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Add New Driver</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Create a new system user</p>
                  </div>
                </div>
                <button
                  onClick={() => setAddingDriver(null)}
                  className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddDriverSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Username</label>
                    <input
                      type="text"
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-emerald-500 focus:border-emerald-500 focus:outline-none transition-colors"
                      value={addingDriver.username}
                      onChange={(e) => setAddingDriver({ ...addingDriver, username: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                    <input
                      type="text"
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none transition-colors"
                      value={addingDriver.password}
                      onChange={(e) => setAddingDriver({ ...addingDriver, password: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</label>
                    <input
                      type="text"
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-xs text-white focus:border-emerald-500 focus:outline-none transition-colors"
                      value={addingDriver.name || ''}
                      onChange={(e) => setAddingDriver({ ...addingDriver, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</label>
                    <input
                      type="text"
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-xs text-white focus:border-emerald-500 focus:outline-none transition-colors"
                      value={addingDriver.phone || ''}
                      onChange={(e) => setAddingDriver({ ...addingDriver, phone: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</label>
                      <select
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-xs text-white focus:border-emerald-500 focus:outline-none transition-colors"
                        value={addingDriver.role}
                        onChange={(e) => setAddingDriver({ ...addingDriver, role: e.target.value })}
                      >
                        <option value="driver">Driver</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label>
                      <select
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-xs text-white focus:border-emerald-500 focus:outline-none transition-colors"
                        value={addingDriver.status}
                        onChange={(e) => setAddingDriver({ ...addingDriver, status: e.target.value })}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vehicle</label>
                      <select
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-xs text-white focus:border-emerald-500 focus:outline-none transition-colors"
                        value={addingDriver.vehicle || "Unassigned"}
                        onChange={(e) => setAddingDriver({ ...addingDriver, vehicle: e.target.value })}
                      >
                        <option value="Unassigned">Unassigned</option>
                        {adminData?.filterOptions?.vehicles?.map((v: string) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-white/5 bg-white/5 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setAddingDriver(null)}
                    className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-xs font-black uppercase tracking-wider transition-all"
                    disabled={savingDriver}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                    disabled={savingDriver}
                  >
                    {savingDriver && <Loader2 className="w-4 h-4 animate-spin" />}
                    {savingDriver ? 'Saving...' : 'Create Driver'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
    </>
  );
}
