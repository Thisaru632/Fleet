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
  Phone
} from 'lucide-react';
import LoginModal from '@/components/LoginModal';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function FleetApp() {
  const [user, setUser] = useState<any>(null);
  const [stage, setStage] = useState<'dashboard' | 'new' | 'update'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [options, setOptions] = useState<{ vehicles: string[], purposes: string[] }>({ vehicles: [], purposes: [] });
  const [tripRefs, setTripRefs] = useState<any[]>([]);
  const [frRefs, setFrRefs] = useState<string[]>([]);
  const [currentRef, setCurrentRef] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'warning' | 'error', message: string } | null>(null);

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
    } catch (err) {
      console.error('Error fetching initial data:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('fleetUser');
    setUser(null);
    setStage('dashboard');
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

      const tripStart = d[54] || 0;
      const tripEnd = d[57] || 0;
      const distance = Number(d[58] || 0);
      const finalTripPriceRaw = d[67] || 0;
      const miscValueRaw = d[66] || 0;
      const numFinal = Number(finalTripPriceRaw.toString().replace(/[^\d.]/g, '')) || 0;
      const numMisc = Number(miscValueRaw.toString().replace(/[^\d.]/g, '')) || 0;
      const tripPrice = numFinal - numMisc;
      const vehicle = d[17] || '';
      
      const numericPrice = Number(tripPrice.toString().replace(/[^\d.]/g, ''));
      let percentage = 0.20;
      const v = vehicle.toUpperCase();
      if (v.includes('KDH') || v.includes('BUS')) {
        percentage = 0.15;
      }
      const comms = Math.round(numericPrice * percentage);

      setFormData((prev: any) => ({
        ...prev,
        tripRef: ref,
        tripStartMeter: tripStart,
        tripEndMeter: tripEnd,
        drvComms: comms,
        pkgBalanceMileage: distance,
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
    <main className="container mx-auto px-4 py-8 max-w-xl">
      {/* Header */}
      <div className="flex flex-col items-center mb-10 text-center">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white text-center">
          FLEET MANAGEMENT
        </h1>
      </div>

      {/* Driver Info Bar */}
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
              <span className="font-bold text-sm">UPDATE RECORD</span>
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

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
            {(currentRef || stage === 'new') && (
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
            {formData.purpose === 'Hire' && (
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
            <div className="flex gap-4">
              <button 
                onClick={() => setStage('dashboard')}
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
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
