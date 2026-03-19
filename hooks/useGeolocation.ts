"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface GeoState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  address: string | null;
  loading: boolean;
  error: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({
    latitude: null, longitude: null, accuracy: null, address: null, loading: true, error: null,
  });
  const watchRef = useRef<number | null>(null);
  const bestRef = useRef<{ lat: number; lng: number; acc: number } | null>(null);
  const resolvedRef = useRef(false);

  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      if (data.address) {
        const a = data.address;
        const street = a.house_number ? `${a.house_number} ${a.road || ""}` : a.road || "";
        const city = a.city || a.town || a.village || a.hamlet || "";
        const stateCode = a.state || "";
        const zip = a.postcode || "";
        const parts = [street.trim(), city, `${stateCode} ${zip}`.trim()].filter(Boolean);
        if (parts.length > 0) return parts.join(", ");
      }
      if (data.display_name) return data.display_name.split(", ").slice(0, 4).join(", ");
    } catch (e) {
      console.warn("Nominatim failed:", e);
    }
    try {
      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
      const data = await res.json();
      const parts = [data.locality || "", data.city || "", data.principalSubdivision || "", data.postcode || ""].filter(Boolean);
      if (parts.length > 0) return parts.join(", ");
    } catch (e) {
      console.warn("BigDataCloud failed:", e);
    }
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }, []);

  const finalize = useCallback(async (lat: number, lng: number, acc: number) => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    const address = await reverseGeocode(lat, lng);
    setState({ latitude: lat, longitude: lng, accuracy: acc, address, loading: false, error: null });
  }, [reverseGeocode]);

  const requestLocation = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    resolvedRef.current = false;
    bestRef.current = null;

    if (typeof window === "undefined" || !navigator.geolocation) {
      setState((s) => ({ ...s, loading: false, error: "Geolocation not supported" }));
      return;
    }

    // Watch position — takes multiple readings, keeps the most accurate
    watchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const current = bestRef.current;

        // Keep this reading if it's more accurate than what we have
        if (!current || accuracy < current.acc) {
          bestRef.current = { lat: latitude, lng: longitude, acc: accuracy };
        }

        // If accuracy is under 10 meters, that's great — use it immediately
        if (accuracy <= 10) {
          finalize(latitude, longitude, accuracy);
        }
      },
      (err) => {
        // If we have any reading at all, use it
        if (bestRef.current) {
          finalize(bestRef.current.lat, bestRef.current.lng, bestRef.current.acc);
        } else {
          setState((s) => ({ ...s, loading: false, error: err.message || "Location access denied" }));
        }
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );

    // After 4 seconds, use whatever best reading we have
    setTimeout(() => {
      if (!resolvedRef.current && bestRef.current) {
        finalize(bestRef.current.lat, bestRef.current.lng, bestRef.current.acc);
      }
    }, 4000);

    // Hard cutoff at 10 seconds
    setTimeout(() => {
      if (!resolvedRef.current) {
        if (bestRef.current) {
          finalize(bestRef.current.lat, bestRef.current.lng, bestRef.current.acc);
        } else {
          setState((s) => ({ ...s, loading: false, error: "Could not determine location" }));
        }
      }
    }, 10000);
  }, [finalize]);

  useEffect(() => {
    requestLocation();
    return () => {
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
      }
    };
  }, [requestLocation]);

  return { ...state, requestLocation };
}