"use client";

import { useState } from "react";
import { X, Share2, Users, Zap, Crown } from "lucide-react";

interface Props {
  lookupCount: number;
  canDismiss: boolean;
  onDismiss: () => void;
  onShare5: () => void;
  onShareContacts: () => void;
  onGoPro: () => void;
}

export default function NagScreen({ lookupCount, canDismiss, onDismiss, onShare5, onShareContacts, onGoPro }: Props) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-t-3xl overflow-hidden animate-slide-up" style={{ paddingBottom: "env(safe-area-inset-bottom, 24px)" }}>
        {/* Header */}
        <div className="relative px-6 pt-6 pb-3">
          {canDismiss && (
            <button onClick={onDismiss} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-lens-bg flex items-center justify-center" type="button">
              <X className="w-4 h-4 text-lens-secondary" />
            </button>
          )}
          <div className="text-center mb-2">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-lens-accent to-blue-600 flex items-center justify-center mx-auto mb-3">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-[20px] font-bold text-lens-text">
              You&apos;ve used {lookupCount} lookups!
            </h3>
            <p className="text-[14px] text-lens-secondary mt-1">
              {canDismiss
                ? "Share SnapOwner to keep looking up properties for free."
                : "Share SnapOwner with friends to continue using the app."
              }
            </p>
          </div>
        </div>

        {/* Options */}
        <div className="px-6 space-y-3 pb-6">
          {/* Share with 5 friends */}
          <button onClick={onShare5} className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-lens-accent/20 bg-lens-accent/[0.03] active:scale-[0.98] transition-all" type="button">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <Share2 className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[15px] font-semibold text-lens-text">Share with 5 friends</p>
              <p className="text-[13px] text-lens-secondary mt-0.5">Get <span className="font-bold text-green-600">10 more free lookups</span></p>
            </div>
          </button>

          {/* Share with contact list */}
          <button onClick={onShareContacts} className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-blue-300/30 bg-blue-50/50 active:scale-[0.98] transition-all" type="button">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[15px] font-semibold text-lens-text">Share with your contacts</p>
              <p className="text-[13px] text-lens-secondary mt-0.5">Get <span className="font-bold text-blue-600">unlimited free lookups</span></p>
            </div>
          </button>

          {/* Go Pro */}
          <button onClick={onGoPro} className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-amber-300/50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 active:scale-[0.98] transition-all" type="button">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <Crown className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[15px] font-semibold text-lens-text">Go Pro</p>
              <p className="text-[13px] text-lens-secondary mt-0.5"><span className="font-bold text-amber-600">Unlimited lookups + contact info</span></p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-[16px] font-bold text-lens-text">$19.95</span>
              <p className="text-[10px] text-lens-secondary">/month</p>
            </div>
          </button>

          {canDismiss && (
            <button onClick={onDismiss} className="w-full py-3 text-[13px] text-lens-secondary font-medium active:text-lens-text transition-colors" type="button">
              Maybe later ({canDismiss ? "you can dismiss this 2 times" : ""})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}