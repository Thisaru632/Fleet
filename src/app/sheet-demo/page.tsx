'use client';

import React, { useEffect, useState } from 'react';

export default function SheetDemo() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheetName, setSheetName] = useState('Sheet1');
  const [range, setRange] = useState('A1:Z100');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sheet?sheet=${encodeURIComponent(sheetName)}&range=${encodeURIComponent(range)}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleWriteData = async () => {
    try {
      const res = await fetch("/api/sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sheetName: sheetName,
          values: [["Demo Entry", "demo@test.com", new Date().toLocaleString()]]
        })
      });
      const result = await res.json();
      alert("Data written successfully to " + sheetName);
      fetchData(); // Refresh data
    } catch (err: any) {
      alert("Error writing data: " + err.message);
    }
  };

  return (
    <div className="p-8 text-white min-h-screen bg-slate-900">
      <h1 className="text-3xl font-black mb-8 text-emerald-400">Multi-Sheet Integration</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-slate-800/50 p-6 rounded-2xl border border-white/10">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sheet Name (Tab)</label>
          <input 
            type="text" 
            value={sheetName} 
            onChange={(e) => setSheetName(e.target.value)}
            placeholder="e.g., master, user name pw"
            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-all"
          />
          <p className="text-[10px] text-slate-500">Tip: Try "master" or "user name pw" if they exist in your sheet.</p>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Range</label>
          <input 
            type="text" 
            value={range} 
            onChange={(e) => setRange(e.target.value)}
            placeholder="e.g., A1:Z100"
            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-all"
          />
        </div>
        <div className="md:col-span-2 flex gap-4">
          <button 
            onClick={fetchData}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-emerald-600 rounded-xl font-bold hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? "FETCHING..." : "LOAD DATA"}
          </button>
          <button 
            onClick={handleWriteData}
            className="flex-1 px-6 py-3 bg-slate-700 rounded-xl font-bold hover:bg-slate-600 transition-all active:scale-95"
          >
            WRITE TO THIS SHEET
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-slate-400 font-medium">Accessing spreadsheet...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400">
          <p className="font-bold">Error Accessing Sheet</p>
          <p className="text-sm">{error}</p>
          <p className="text-xs mt-2 text-rose-400/60">Ensure the sheet name is spelled exactly as it appears in Google Sheets.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <h2 className="text-lg font-bold text-slate-200">Data Preview: {sheetName}</h2>
            <p className="text-xs text-slate-500">{data.length} rows found</p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-800/80">
                  {data[0]?.map((col: string, i: number) => (
                    <th key={i} className="border-b border-white/10 p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">{col || `Col ${i+1}`}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.length > 0 ? (
                  data.slice(1).map((row: any[], i: number) => (
                    <tr key={i} className="hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors">
                      {row.map((cell: any, j: number) => (
                        <td key={j} className="p-4 text-sm text-slate-300">{cell}</td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="p-20 text-center text-slate-500">
                      No data found in this sheet or range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
