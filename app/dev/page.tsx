"use client";

import { useState, useEffect } from "react";
import { getCreditState } from "@/lib/credits";

export default function DevPage() {
  const [creditInfo, setCreditInfo] = useState<string>("Loading...");
  const [devEnabled, setDevEnabled] = useState(false);

  useEffect(() => {
    setDevEnabled(localStorage.getItem("hl_dev") === "1");
    loadCredits();
  }, []);

  const loadCredits = async () => {
    try {
      const state = await getCreditState();
      setCreditInfo(JSON.stringify(state, null, 2));
    } catch {
      setCreditInfo("Error loading credits");
    }
  };

  const resetDB = () => {
    const req = indexedDB.deleteDatabase("houselens_db");
    req.onsuccess = () => {
      alert("Database reset! Go back to home.");
      loadCredits();
    };
    req.onerror = () => {
      alert("Error resetting database.");
    };
  };

  const toggleDev = () => {
    if (devEnabled) {
      localStorage.removeItem("hl_dev");
      setDevEnabled(false);
      alert("Dev mode OFF.");
    } else {
      localStorage.setItem("hl_dev", "1");
      setDevEnabled(true);
      alert("Dev mode ON. All limits bypassed.");
    }
  };

  return (
    <div style={{ padding: 40, fontFamily: "system-ui", maxWidth: 500 }}>
      <h1 style={{ fontSize: 22, fontWeight: "bold", marginBottom: 24 }}>Dev Tools</h1>

      <button
        onClick={resetDB}
        style={{ display: "block", width: "100%", padding: "15px 30px", marginBottom: 12, fontSize: 16, background: "#ef4444", color: "white", border: "none", borderRadius: 12, cursor: "pointer" }}
      >
        Reset IndexedDB (houselens_db)
      </button>

      <button
        onClick={toggleDev}
        style={{ display: "block", width: "100%", padding: "15px 30px", marginBottom: 12, fontSize: 16, background: devEnabled ? "#f97316" : "#22c55e", color: "white", border: "none", borderRadius: 12, cursor: "pointer" }}
      >
        {devEnabled ? "Disable Dev Mode" : "Enable Dev Mode (bypass limits)"}
      </button>

      <button
        onClick={loadCredits}
        style={{ display: "block", width: "100%", padding: "15px 30px", marginBottom: 24, fontSize: 16, background: "#3b82f6", color: "white", border: "none", borderRadius: 12, cursor: "pointer" }}
      >
        Refresh Credit Status
      </button>

      <div style={{ background: "#f1f5f9", borderRadius: 12, padding: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: "bold", marginBottom: 8 }}>Current Credit State</h3>
        <pre style={{ fontSize: 12, whiteSpace: "pre-wrap", wordBreak: "break-all", color: "#334155" }}>
          {creditInfo}
        </pre>
      </div>

      <div style={{ marginTop: 16, background: devEnabled ? "#dcfce7" : "#fef2f2", borderRadius: 12, padding: 16 }}>
        <p style={{ fontSize: 13, fontWeight: "bold", color: devEnabled ? "#166534" : "#991b1b" }}>
          Dev Mode: {devEnabled ? "ON" : "OFF"}
        </p>
        <p style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
          {devEnabled ? "All credit gates and limits are bypassed." : "Normal credit limits are enforced."}
        </p>
      </div>
    </div>
  );
}
