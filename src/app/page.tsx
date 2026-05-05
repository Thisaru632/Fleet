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
  const [options, setOptions] = useState<{ vehicles: string[], purposes: string[] }>({ vehicles: [], purposes: [] });
  const [tripRefs, setTripRefs] = useState<string[]>([]);
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
    setLoading(true);
    setAlert({ type: 'warning', message: 'Retrieving reference details...' });
    try {
      const res = await fetch(`/api/fleet/details?type=fr&ref=${ref}`);
      const data = await res.json();
      const details = data.details;
      
      setFormData({
        ...formData,
        vehicle: details[3] || '',
        purpose: details[4] || '',
        garageStartMeter: details[5] || '',
        tripRef: details[7] || '',
      });
      setCurrentRef(ref);
      setAlert(null);
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to fetch details' });
    } finally {
      setLoading(false);
    }
  };

  const handleTripRefChange = async (ref: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/fleet/details?type=trip&ref=${ref}`);
      const data = await res.json();
      const d = data.details;
      
      const drvComms = Math.round(Number(d[44]) * 0.2); // Matching Apps Script logic? Wait, index check.
      // In Apps Script: data[43] is tripStart, data[46] is tripEnd, data[56] is price?
      // Let's re-verify the indices from Apps Script.
      // Range L30000:BP -> L is index 0. 
      // L=0, M=1, N=2, O=3, P=4, Q=5, R=6, S=7, T=8, U=9, V=10, W=11, X=12, Y=13, Z=14, 
      // AA=15, AB=16, AC=17, AD=18, AE=19, AF=20, AG=21, AH=22, AI=23, AJ=24, AK=25, AL=26, AM=27, AN=28, AO=29, AP=30, AQ=31, AR=32, AS=33, AT=34, AU=35, AV=36, AW=37, AX=38, AY=39, AZ=40,
      // BA=41, BB=42, BC=43, BD=44, BE=45, BF=46, BG=47, BH=48, BI=49, BJ=50, BK=51, BL=52, BM=53, BN=54, BO=55, BP=56.
      // Apps script: data[43] = BC, data[46] = BF, data[56] = BP, data[22] = AH, data[47] = BG.
      
      const tripStart = d[43];
      const tripEnd = d[46];
      const price = Number(d[56]);
      const comms = Math.round(price * 0.2);
      const pkgOriginal = Number(d[22]);
      const pkgUtilized = Number(d[47]);

      setFormData({
        ...formData,
        tripRef: ref,
        tripStartMeter: tripStart,
        tripEndMeter: tripEnd,
        drvComms: comms,
        pkgBalanceMileage: pkgUtilized - pkgOriginal,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [id]: value }));

    // Auto-calcs
    if (id === 'fuelCost' || id === 'repairCost') {
      // Calc scDueAmount
      const fuel = id === 'fuelCost' ? Number(value) : Number(formData.fuelCost);
      const comms = Number(formData.drvComms);
      const tripPrice = comms * 5;
      const due = Math.round(tripPrice - comms - fuel);
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
    const { id, files } = e.target;
    if (files && files[0]) {
      setFiles((prev: any) => ({ ...prev, [id]: files[0] }));
    }
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
      const now = new Date();
      const endTs = now.toISOString().slice(0, 19).replace('T', ' ');
      
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
          array = [user[0], formData.vehicle, formData.purpose, formData.garageStartMeter, '', '', '', '', '', '', formData.tripRef];
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
        if (files.repairReceipt) uploadFiles.push({ name: `${currentRef}_Repair`, dataUrl: await fileToBase64(files.repairReceipt) });

        let array: any[] = [];
        if (formData.purpose === 'Hire') {
          array = [user[0], formData.vehicle, formData.purpose, formData.garageStartMeter, endTs, formData.garageEndMeter, formData.fuelCost, formData.comments, 0, '', formData.tripRef, formData.scDueAmount, formData.drvComms, formData.tripStartMeter, formData.tripEndMeter, formData.pkgBalanceMileage, formData.startLossMileage, formData.endLossMileage];
        } else if (formData.purpose === 'Personal') {
          array = [user[0], formData.vehicle, formData.purpose, formData.garageStartMeter, endTs, formData.garageEndMeter, formData.fuelCost, formData.comments, 0, '', '', 0, 0, 0, 0, 0, 0, 0];
        } else if (formData.purpose === 'Repair') {
          array = [user[0], formData.vehicle, formData.purpose, formData.garageStartMeter, endTs, formData.garageEndMeter, formData.fuelCost, formData.comments, formData.repairCost, '', '', 0, 0, 0, 0, 0, 0, 0];
        } else if (formData.purpose === 'Fuel') {
          array = [user[0], formData.vehicle, formData.purpose, formData.garageStartMeter, endTs, formData.garageEndMeter, formData.fuelCost, formData.comments, 0, '', '', 0, 0, 0, 0, 0, 0, 0];
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
        <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
          FLEET MANAGEMENT
          <span className="text-[10px] bg-emerald-500 text-white px-3 py-1 rounded-full uppercase tracking-widest font-bold shadow-lg shadow-emerald-500/20">
            Senu Cabs
          </span>
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
                      disabled={stage === 'update'}
                      className="w-full input-field py-3"
                      value={formData.garageStartMeter}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Start Image</label>
                    <div className="relative">
                      <Camera className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input 
                        id="garageStartImage"
                        type="file"
                        accept="image/*"
                        disabled={stage === 'update'}
                        className="w-full input-field py-2 pr-10 text-[10px]"
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stage Specific Cards */}
            {formData.purpose === 'Hire' && (
              <div className="glass-card p-6 space-y-6">
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
                    {tripRefs?.map((t, idx) => <option key={`${t}-${idx}`} value={t}>{t}</option>)}
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
                      <p className="text-[10px] text-slate-400 uppercase">Commission</p>
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

            {/* End Trip Details (Update Stage) */}
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
                        className="w-full input-field py-2 text-[10px]"
                        onChange={handleFileChange}
                      />
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

                {formData.scDueAmount && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                    <p className="text-[10px] text-amber-500 uppercase font-bold mb-1 tracking-wider">Amount Due to Office</p>
                    <p className="text-2xl font-black text-amber-400">Rs. {formData.scDueAmount}</p>
                  </div>
                )}
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
                disabled={loading || !formData.purpose}
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
