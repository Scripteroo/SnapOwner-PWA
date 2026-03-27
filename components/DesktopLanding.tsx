"use client";

import Link from "next/link";

export default function DesktopLanding() {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#0B1D3A] overflow-auto">
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
        <div className="max-w-[800px] w-full flex flex-col items-center">
          {/* Logo with pulse */}
          <div className="relative mb-8" style={{ animation: "desktopFloat 4s ease-in-out infinite" }}>
            <div
              className="absolute rounded-full"
              style={{
                top: -6, left: -6, width: 112, height: 112,
                background: "rgba(96,165,250,0.15)",
                animation: "desktopPing 3s cubic-bezier(0,0,0.2,1) infinite",
              }}
            />
            <img
              src="/logo.png"
              alt="SnapOwner"
              className="relative w-[100px] h-[100px] object-contain drop-shadow-[0_4px_20px_rgba(96,165,250,0.3)]"
              draggable={false}
            />
          </div>

          {/* Title */}
          <h1 className="text-[42px] font-extrabold text-white tracking-tight mb-3">SnapOwner</h1>
          <div className="w-16 h-1 rounded-full bg-orange-500 mb-6" />

          {/* Tagline */}
          <p className="text-[20px] text-white/90 text-center font-medium mb-2">
            Snap any house. <span className="text-orange-400">See the owner.</span> Get their number.
          </p>
          <p className="text-[15px] text-white/50 text-center mb-12 max-w-md">
            SnapOwner is a mobile-first property intelligence app designed for use in the field.
          </p>

          {/* QR Code */}
          <div className="relative mb-4">
            <div
              className="absolute -inset-4 rounded-2xl"
              style={{
                background: "radial-gradient(circle, rgba(96,165,250,0.12) 0%, transparent 70%)",
                animation: "desktopGlow 3s ease-in-out infinite",
              }}
            />
            <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://snapowner.com&bgcolor=0B1D3A&color=FFFFFF"
                alt="Scan to open SnapOwner"
                width={200}
                height={200}
                className="mx-auto"
              />
            </div>
          </div>
          <p className="text-[14px] text-white/40 mb-14">Scan with your phone to get started</p>

          {/* Feature cards */}
          <div className="grid grid-cols-3 gap-4 w-full max-w-lg mb-16">
            {[
              { emoji: "\uD83D\uDCF8", title: "Snap", desc: "Point your camera at any property" },
              { emoji: "\uD83D\uDC64", title: "Discover", desc: "See owner name, phone, email instantly" },
              { emoji: "\uD83D\uDCCA", title: "Analyze", desc: "Property value, tax records, liens & more" },
            ].map((f) => (
              <div key={f.title} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-5 text-center">
                <p className="text-[28px] mb-2">{f.emoji}</p>
                <p className="text-[15px] font-bold text-white mb-1">{f.title}</p>
                <p className="text-[12px] text-white/50 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <p className="text-[13px] text-white/30 mb-3">Available as a Progressive Web App &bull; No download required</p>
          <div className="flex gap-4">
            <Link href="/terms" className="text-[12px] text-white/25 hover:text-white/50 transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="text-[12px] text-white/25 hover:text-white/50 transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes desktopPing {
          0% { transform: scale(1); opacity: 0.6; }
          75%, 100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes desktopFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes desktopGlow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
