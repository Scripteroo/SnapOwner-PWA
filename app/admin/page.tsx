"use client";

import { useState, useEffect, useCallback } from "react";

interface Analytics {
  pageViews: { today: number; week: number; allTime: number };
  uniqueUsers: { today: number; week: number; allTime: number };
  propertyLookups: { total: number; today: number; cost: number };
  skipTraces: { total: number; today: number; cost: number };
  spend: { today: number; week: number; allTime: number };
  topAddresses: Array<{ address: string; count: number }>;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{label}</p>
      <p className="text-[28px] font-bold text-gray-900">{value}</p>
      {sub && <p className="text-[12px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function CostCard({ label, amount, alert }: { label: string; amount: number; alert?: boolean }) {
  return (
    <div className={`rounded-2xl shadow-sm border px-5 py-4 ${alert ? "bg-red-50 border-red-200" : "bg-white border-gray-100"}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{label}</p>
      <p className={`text-[24px] font-bold ${alert ? "text-red-600" : "text-gray-900"}`}>
        ${amount.toFixed(2)}
      </p>
      {alert && <p className="text-[11px] text-red-500 font-semibold mt-1">Daily spend exceeds $50</p>}
    </div>
  );
}

export default function AdminPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState("");
  const [needsKey, setNeedsKey] = useState(false);

  const fetchData = useCallback(async (adminKey: string) => {
    try {
      const res = await fetch("/api/analytics", {
        headers: { "x-admin-key": adminKey },
      });
      if (res.status === 401) {
        setNeedsKey(true);
        setLoading(false);
        localStorage.removeItem("hl_admin_key");
        return;
      }
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setData(json);
      setError(null);
      setNeedsKey(false);
    } catch {
      setError("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("hl_admin_key");
    if (stored) {
      setKey(stored);
      fetchData(stored);
    } else {
      setNeedsKey(true);
      setLoading(false);
    }
  }, [fetchData]);

  // Auto-refresh every 60s
  useEffect(() => {
    if (!key || needsKey) return;
    const interval = setInterval(() => fetchData(key), 60000);
    return () => clearInterval(interval);
  }, [key, needsKey, fetchData]);

  const handleKeySubmit = () => {
    localStorage.setItem("hl_admin_key", key);
    setLoading(true);
    fetchData(key);
  };

  if (needsKey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-sm w-full">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleKeySubmit()}
            placeholder="Enter admin key"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm mb-3"
          />
          <button
            onClick={handleKeySubmit}
            className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold"
          >
            Access Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading analytics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">{error || "No data"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">SnapOwner Analytics</h1>
          <p className="text-[11px] text-gray-400">Auto-refreshes every 60s</p>
        </div>

        {/* Users */}
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Users</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Today" value={String(data.uniqueUsers.today)} sub={`${data.pageViews.today} views`} />
          <StatCard label="This Week" value={String(data.uniqueUsers.week)} sub={`${data.pageViews.week} views`} />
          <StatCard label="All Time" value={String(data.uniqueUsers.allTime)} sub={`${data.pageViews.allTime} views`} />
          <StatCard label="Lookups Today" value={String(data.propertyLookups.today)} sub={`${data.skipTraces.today} skip traces`} />
        </div>

        {/* API Usage */}
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">API Usage</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <StatCard label="Property Lookups" value={String(data.propertyLookups.total)} sub={`~$${data.propertyLookups.cost.toFixed(2)} Realie`} />
          <StatCard label="Skip Traces" value={String(data.skipTraces.total)} sub={`~$${data.skipTraces.cost.toFixed(2)} Tracerfy`} />
          <StatCard label="Total Events" value={String(data.pageViews.allTime + data.propertyLookups.total + data.skipTraces.total)} />
        </div>

        {/* Spend */}
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Estimated Spend</p>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <CostCard label="Today" amount={data.spend.today} alert={data.spend.today > 50} />
          <CostCard label="This Week" amount={data.spend.week} />
          <CostCard label="All Time" amount={data.spend.allTime} />
        </div>

        {/* Top Addresses */}
        {data.topAddresses.length > 0 && (
          <>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Top Addresses</p>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
              {data.topAddresses.map((a, i) => (
                <div key={i} className="flex justify-between items-center px-5 py-3 border-b border-gray-50 last:border-0">
                  <span className="text-[13px] text-gray-700 truncate mr-4">{a.address}</span>
                  <span className="text-[13px] font-semibold text-gray-900 flex-shrink-0">{a.count}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
