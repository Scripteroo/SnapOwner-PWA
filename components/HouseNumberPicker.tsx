"use client";

import { useRef, useEffect, useCallback } from "react";

interface Props {
  currentNumber: number;
  onNumberChange: (num: number) => void;
}

const ITEM_H = 24;
const RANGE = 30;

export default function HouseNumberPicker({ currentNumber, onNumberChange }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSnapped = useRef(currentNumber);

  const numbers: number[] = [];
  for (let i = -RANGE; i <= RANGE; i++) {
    const n = currentNumber + i;
    if (n > 0) numbers.push(n);
  }

  const centerIndex = numbers.indexOf(currentNumber);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = centerIndex * ITEM_H;
    lastSnapped.current = currentNumber;
  }, [currentNumber]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(idx, numbers.length - 1));
    const num = numbers[clamped];
    if (num && num !== lastSnapped.current) {
      lastSnapped.current = num;
      if (navigator.vibrate) navigator.vibrate(5);
      onNumberChange(num);
    }
  }, [numbers, onNumberChange]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let timeout: ReturnType<typeof setTimeout>;
    const onScroll = () => { clearTimeout(timeout); timeout = setTimeout(handleScroll, 60); };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => { el.removeEventListener("scroll", onScroll); clearTimeout(timeout); };
  }, [handleScroll]);

  return (
    <div className="relative flex-shrink-0" style={{ width: 36, height: ITEM_H * 3 }}>
      <div className="absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-lens-card to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-lens-card to-transparent z-10 pointer-events-none" />
      <div
        ref={scrollRef}
        className="h-full overflow-y-auto"
        style={{
          scrollSnapType: "y mandatory",
          WebkitOverflowScrolling: "touch",
          paddingTop: ITEM_H,
          paddingBottom: ITEM_H,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>
        {numbers.map((num, i) => (
          <div
            key={num}
            className="flex items-center justify-center"
            style={{ height: ITEM_H, scrollSnapAlign: "center" }}
          >
            <span
              className={
                num === lastSnapped.current
                  ? "text-[15px] font-bold text-lens-text tabular-nums"
                  : "text-[12px] text-lens-secondary/40 tabular-nums"
              }
            >
              {num}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
