"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";

interface Props {
  count: number;
  onDismiss: () => void;
}

const MESSAGES: Record<number, string> = {
  5: "You're getting started! Share your first finds with friends.",
  10: "Double digits! You're building an impressive collection.",
  25: "Power scanner! Your portfolio is growing fast.",
  50: "Legendary! You've scanned more properties than 99% of users.",
  100: "Century club! You're a true property intelligence pro.",
};

export default function MilestonePopup({ count, onDismiss }: Props) {
  const [confetti, setConfetti] = useState<Array<{ left: number; color: string; size: number; delay: number; duration: number; rotation: number }>>([]);
  const message = MESSAGES[count] || `${count} properties scanned!`;

  useEffect(() => {
    const colors = ["#3B82F6", "#F97316", "#22C55E", "#EAB308", "#8B5CF6", "#EC4899"];
    const pieces = Array.from({ length: 28 }, () => ({
      left: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 6,
      delay: Math.random() * 0.8,
      duration: 2 + Math.random() * 2,
      rotation: Math.random() * 360,
    }));
    setConfetti(pieces);
  }, []);

  const handleShare = async () => {
    const shareFooter = "\n\n---\n\uD83D\uDCF2 Get HouseLens \u2014 look up any property owner instantly\nNo install needed \u2192 houselens.io";
    if (navigator.share) {
      try {
        await navigator.share({
          title: "HouseLens Streak",
          text: `I just scanned ${count} properties on HouseLens! \uD83C\uDFE0\uD83D\uDD0D${shareFooter}`,
          url: "https://houselens.io",
        });
        trackEvent("share_attempt", { milestone: count });
      } catch {}
    }
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-[250] bg-black/70 backdrop-blur-sm flex items-center justify-center px-6" onClick={onDismiss}>
      <div className="bg-white rounded-3xl w-full max-w-sm p-8 relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Confetti */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {confetti.map((p, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${p.left}%`,
                top: -12,
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                transform: `rotate(${p.rotation}deg)`,
                animation: `confettiFall ${p.duration}s ease-in ${p.delay}s both`,
              }}
            />
          ))}
        </div>

        <div className="relative text-center">
          <p className="text-[48px] mb-2">{"\uD83C\uDF89"}</p>
          <h2 className="text-[32px] font-extrabold text-gray-900 mb-1">{count} Properties!</h2>
          <p className="text-[14px] text-gray-500 leading-relaxed mb-6">{message}</p>

          <button
            onClick={handleShare}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-[16px] font-bold shadow-lg active:scale-[0.97] transition-all mb-3"
          >
            Share My Streak {"\uD83D\uDD25"}
          </button>

          <button onClick={onDismiss} className="text-[13px] text-gray-400 font-medium py-2" type="button">
            Continue
          </button>
        </div>

        <style jsx>{`
          @keyframes confettiFall {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(420px) rotate(720deg); opacity: 0; }
          }
        `}</style>
      </div>
    </div>
  );
}
