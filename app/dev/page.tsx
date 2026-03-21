"use client";
export default function DevPage() {
  const reset = () => {
    const req = indexedDB.deleteDatabase("houselens_db");
    req.onsuccess = () => { alert("Reset! Go back to home."); };
    req.onerror = () => { alert("Error resetting."); };
  };
  const devMode = () => {
    localStorage.setItem("hl_dev", "1");
    alert("Dev mode ON. Go back to home.");
  };
  return (
    <div style={{ padding: 40, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 20, marginBottom: 20 }}>Dev Tools</h1>
      <button onClick={reset} style={{ display: "block", padding: "15px 30px", marginBottom: 15, fontSize: 16, background: "#ef4444", color: "white", border: "none", borderRadius: 12 }}>
        Reset All Credits & Data
      </button>
      <button onClick={devMode} style={{ display: "block", padding: "15px 30px", fontSize: 16, background: "#22c55e", color: "white", border: "none", borderRadius: 12 }}>
        Enable Dev Mode (bypass limits)
      </button>
    </div>
  );
}
