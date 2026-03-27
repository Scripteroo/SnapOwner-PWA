"use client";

interface Props {
  onTap?: () => void;
}

export default function LensLogo({ onTap }: Props) {
  return (
    <div className="flex justify-center -mt-14 relative z-20">
      <div className="relative w-[120px] h-[120px]">
        {/* Pulsating ring — centered on the lens circle (offset up-left since handle extends bottom-right) */}
        <div
          className="absolute rounded-full bg-blue-400/20 animate-ping"
          style={{ animationDuration: "3s", top: -4, left: -4, width: 108, height: 108 }}
        />
        <button
          onClick={onTap}
          type="button"
          className="relative w-[120px] h-[120px] flex items-center justify-center active:scale-95 transition-transform"
          style={{ background: "transparent" }}
        >
          <img
            src="/logo.png"
            alt="SnapOwner"
            className="w-[120px] h-[120px] object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.25)]"
            draggable={false}
          />
        </button>
      </div>
    </div>
  );
}
