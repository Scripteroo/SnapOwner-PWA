"use client";

import { useState, useRef, useCallback } from "react";
import { compressImage } from "@/lib/image-utils";

export function useCamera() {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const openCamera = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const raw = ev.target?.result as string;
      // Compress to save storage space
      const compressed = await compressImage(raw, 1200, 0.8);
      setPhotoUrl(compressed);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

  return { photoUrl, setPhotoUrl, inputRef, openCamera, handleFileChange };
}