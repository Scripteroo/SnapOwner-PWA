"use client";

import { X, Search, Info, Mail, PlusCircle } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onNewSearch?: () => void;
}

export default function SideMenu({ open, onClose, onNewSearch }: Props) {
  return (
    <>
      {open && <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm" onClick={onClose} />}
      <div className={`fixed top-0 left-0 bottom-0 z-[80] w-72 bg-white shadow-elevated transform transition-transform duration-300 ease-out ${open ? "translate-x-0" : "-translate-x-full"}`} style={{ paddingTop: "env(safe-area-inset-top, 12px)" }}>
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-[20px] font-bold text-lens-text tracking-tight">HouseLens</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-lens-bg flex items-center justify-center" type="button">
            <X className="w-4 h-4 text-lens-secondary" />
          </button>
        </div>
        <div className="px-3 mt-2">
          <button onClick={() => { onNewSearch?.(); onClose(); }} className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-lens-accent font-semibold hover:bg-lens-accent/5 active:bg-lens-accent/10 transition-colors" type="button">
            <PlusCircle className="w-5 h-5" />
            <span className="text-[15px]">New Property</span>
          </button>
          {[{ icon: Info, label: "About" }, { icon: Mail, label: "Contact" }].map(({ icon: Icon, label }) => (
            <button key={label} className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-lens-text hover:bg-lens-bg active:bg-lens-bg transition-colors" type="button">
              <Icon className="w-5 h-5 text-lens-secondary" />
              <span className="text-[15px] font-medium">{label}</span>
            </button>
          ))}
        </div>
        <div className="absolute bottom-8 inset-x-0 px-5">
          <p className="text-[11px] text-lens-secondary text-center">HouseLens v0.2 · PoC</p>
        </div>
      </div>
    </>
  );
}