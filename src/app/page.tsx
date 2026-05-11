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
  Filter
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
  const [adminTab, setAdminTab] = useState<'overview' | 'trips' | 'rankings'>('overview');

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
  });

  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    garageStartImage: null,
    garageEndImage: null,
    fuelReceipt: null,
    repairReceipt: null,
  });

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
          drvName: user[2],
          drvPhone: user[3],
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

  const fetchAdminSales = async () => {
    setFetchingAdmin(true);
    try {
      const params = new URLSearchParams(adminFilters);
      const res = await fetch(`/api/admin/sales?${params.toString()}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAdminData(data);
    } catch (err: any) {
      console.error('Error fetching admin sales:', err);
      setAlert({ type: 'error', message: 'Failed to load dashboard data' });
    } finally {
      setFetchingAdmin(false);
    }
  };

  useEffect(() => {
    if (stage === 'admin' && user[4]?.toLowerCase() === 'admin') {
      fetchAdminSales();
    }
  }, [stage, adminFilters, user]);

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
      tripPrice: '',
    });
    setFiles({
      garageStartImage: null, garageEndImage: null,
      fuelReceipt: null, repairReceipt: null,
    });
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
    });
    setFiles({
      garageStartImage: null,
      garageEndImage: null,
      fuelReceipt: null,
      repairReceipt: null,
    });
    window.history.pushState({ stage: 'update' }, '');
    setStage('update');
    setAlert({ type: 'warning', message: 'Please select an FR reference from the list.' });
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

      const fetchedTripRef = details[11] || '';

      setFormData((prev: any) => ({
        ...prev,
        vehicle: details[3] || '',
        purpose: details[4] || '',
        garageStartMeter: details[5] || '',
        tripRef: fetchedTripRef,
        folderUrl: details[19] || '',
        folderId: details[20] || '',
        startTs: details[1] || '',
        endTs: details[6] || '',
        fuelCost: details[8] || '',
        comments: details[9] || '',
        repairCost: details[10] || '',
        scDueAmount: details[12] || '',
        drvComms: details[13] || '',
        tripStartMeter: details[14] || '',
        tripEndMeter: details[15] || '',
        pkgBalanceMileage: details[16] || '',
        startLossMileage: details[17] || '',
        endLossMileage: details[18] || '',
        totalMileage: details[21] || '',
        finalPrice: details[22] || '',
      }));
      setCurrentRef(ref);
      setAlert(null);

      if (fetchedTripRef && details[4] === 'Hire') {
        await handleTripRefChange(fetchedTripRef);
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to fetch details' });
    } finally {
      setFetchingDetails(false);
    }
  };

  const handleTripRefChange = async (ref: string) => {
    setFetchingDetails(true);
    try {
      const res = await fetch(`/api/fleet/details?type=trip&ref=${ref}`);
      const data = await res.json();
      const d = data.details;
      
      if (!d) {
        setAlert({ type: 'error', message: 'Trip details not found.' });
        return;
      }

      const parseNum = (val: any) => Number(val?.toString().replace(/[^\d.]/g, '')) || 0;

      const tripStart = parseNum(d[54]);
      const tripEnd = parseNum(d[57]);
      const distance = parseNum(d[58]);
      const finalTripPriceRaw = d[67] || 0;
      const miscValueRaw = d[66] || 0;
      const numFinal = parseNum(finalTripPriceRaw);
      const numMisc = parseNum(miscValueRaw);
      const tripPrice = numFinal - numMisc;
      const vehicle = d[17] || '';
      
      const numericPrice = parseNum(tripPrice);
      let percentage = 0.20;
      const v = vehicle.toUpperCase();
      if (v.includes('KDH') || v.includes('BUS')) {
        percentage = 0.15;
      }
      const comms = Math.round(numericPrice * percentage);

      const pkgKms = parseNum(d[33]);
      const pkgBalance = pkgKms - distance;

      setFormData((prev: any) => ({
        ...prev,
        tripRef: ref,
        tripStartMeter: tripStart,
        tripEndMeter: tripEnd,
        drvComms: comms,
        pkgBalanceMileage: pkgBalance,
        tripPrice: tripPrice,
      }));
    } catch (err) {
      console.error(err);
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
        startLossMileage: tStart - gStart,
        endLossMileage: gEnd - tEnd,
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
        
        let array: any[] = [];
        if (formData.purpose === 'Personal') {
          array = [user[0], formData.vehicle, formData.purpose, formData.garageStartMeter];
        } else if (formData.purpose === 'Hire') {
          array = [user[0], formData.vehicle, formData.purpose, formData.garageStartMeter, '', '', '', '', '', formData.tripRef];
        } else if (formData.purpose === 'Repair') {
          array = [user[0], formData.vehicle, formData.purpose, formData.garageStartMeter, '', '', '', formData.comments, formData.repairCost];
        } else if (formData.purpose === 'Fuel') {
          array = [user[0], formData.vehicle, formData.purpose, formData.garageStartMeter, '', '', formData.fuelCost, formData.comments];
        }

        const updateRes = await fetch('/api/fleet/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stage: 'start', ref: actualRef, array, files: uploadFiles }),
        });
        const updateData = await updateRes.json();
        if (updateData.error) throw new Error(updateData.error);

      } else {
        // Stage update
        if (files.fuelReceipt) uploadFiles.push({ name: `${currentRef}_FuelReceipt`, dataUrl: await fileToBase64(files.fuelReceipt) });
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

        let array: any[] = [];
        if (formData.purpose === 'Hire') {
          array = [user[0], formData.vehicle, formData.purpose, formData.garageStartMeter, endTs, formData.garageEndMeter, formData.fuelCost, formData.comments, 0, formData.tripRef, formData.scDueAmount, formData.drvComms, formData.tripStartMeter, formData.tripEndMeter, formData.pkgBalanceMileage, formData.startLossMileage, formData.endLossMileage, formData.folderUrl, formData.folderId, '', formData.tripPrice];
        } else if (formData.purpose === 'Personal') {
          array = [user[0], formData.vehicle, formData.purpose, formData.garageStartMeter, endTs, formData.garageEndMeter, formData.fuelCost, formData.comments, 0, '', '', 0, 0, 0, 0, 0, 0];
        } else if (formData.purpose === 'Repair') {
          array = [user[0], formData.vehicle, formData.purpose, formData.garageStartMeter, endTs, formData.garageEndMeter, formData.fuelCost, formData.comments, formData.repairCost, '', '', 0, 0, 0, 0, 0, 0];
        } else if (formData.purpose === 'Fuel') {
          array = [user[0], formData.vehicle, formData.purpose, formData.garageStartMeter, endTs, formData.garageEndMeter, formData.fuelCost, formData.comments, 0, '', '', 0, 0, 0, 0, 0, 0];
        }

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
          scDueAmount: '', drvComms: '', startLossMileage: '', endLossMileage: '', pkgBalanceMileage: '',
        });
        setFiles({ garageStartImage: null, garageEndImage: null, fuelReceipt: null, repairReceipt: null });
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
                <span className="text-sm font-bold text-white">{user[2]}</span>
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

            {user[4]?.toLowerCase() === 'admin' && (
              <button 
                onClick={() => {
                  window.history.pushState({ stage: 'admin' }, '');
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
                  <button 
                    onClick={() => setStage('dashboard')}
                    className="px-4 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest"
                  >
                    Exit Admin
                  </button>
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
                        onChange={(e) => setAdminFilters({...adminFilters, startDate: e.target.value})}
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
                        onChange={(e) => setAdminFilters({...adminFilters, endDate: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Purpose</label>
                      <select 
                        className="w-full input-field py-2 text-[10px] text-white h-9"
                        value={adminFilters.purpose}
                        onChange={(e) => setAdminFilters({...adminFilters, purpose: e.target.value})}
                      >
                        {adminData?.filterOptions.purposes.map((p: string) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Status</label>
                      <select 
                        className="w-full input-field py-2 text-[10px] text-white h-9"
                        value={adminFilters.status}
                        onChange={(e) => setAdminFilters({...adminFilters, status: e.target.value})}
                      >
                        {adminData?.filterOptions.statuses.map((s: string) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Vehicle</label>
                      <select 
                        className="w-full input-field py-2 text-[10px] text-white h-9"
                        value={adminFilters.vehicle}
                        onChange={(e) => setAdminFilters({...adminFilters, vehicle: e.target.value})}
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
                        onChange={(e) => setAdminFilters({...adminFilters, driver: e.target.value})}
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
                  </div>
                ) : null}
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
        {stage !== 'dashboard' && (
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
                        <span>RF Number</span>
                        <span>Date</span>
                        <span className="text-right">Salary (Rs)</span>
                      </div>
                    </div>
                    <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
                      {salaryData.map((item, idx) => (
                        <div key={idx} className="p-4 grid grid-cols-3 items-center hover:bg-white/5 transition-colors">
                          <span className="text-xs font-bold text-white">{item.rf}</span>
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
            {formData.purpose === 'Hire' && stage !== 'last-trip' && (
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
                    let filtered = (tripRefs || []).filter(t => !formData.vehicle || t.vehicle === formData.vehicle).map(t => t.ref);
                    // Ensure the current value is in the list (especially for the Update stage)
                    if (formData.tripRef && !filtered.includes(formData.tripRef)) {
                      filtered = [formData.tripRef, ...filtered];
                    }
                    return filtered.map((t, idx) => <option key={`${t}-${idx}`} value={t}>{t}</option>);
                  })()}
                </select>
                </div>

                {stage === 'update' && (
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
                      <p className="font-bold text-emerald-400">Rs. {formData.drvComms}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 uppercase">Pkg Balance</p>
                      <p className="font-bold text-amber-400">{formData.pkgBalanceMileage} KM</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {formData.purpose === 'Hire' && stage === 'update' && formData.tripPrice && (
              <div className="glass-card p-6 border-blue-500/30 bg-blue-500/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Final Trip Price</p>
                    <p className="text-3xl font-black text-white">
                      <span className="text-sm font-normal text-blue-400 mr-1">Rs.</span>
                      {formData.tripPrice.toString().replace(/[^\d.,]/g, '')}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-blue-500/10">
                    <Car className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
              </div>
            )}


            {stage === 'update' && (
              <div className="glass-card p-6 space-y-6">
                <div className="flex items-center gap-3 text-white font-bold text-lg mb-2">
                  <ClipboardCheck className="w-5 h-5 text-emerald-500" />
                  End Trip Details
                </div>

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
                  disabled={loading || !formData.purpose || (formData.purpose === 'Hire' && (!formData.tripRef || !formData.tripPrice))}
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
    </main>
  );
}
