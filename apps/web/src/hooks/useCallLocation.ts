"use client";

import { useEffect, useState } from "react";

export type CallLocation = {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  label: string;
};

export function useCallLocation() {
  const [location, setLocation] = useState<CallLocation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Location is not supported by this browser");
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const latitude = Number(coords.latitude.toFixed(2));
        const longitude = Number(coords.longitude.toFixed(2));
        setLocation({
          latitude,
          longitude,
          accuracyMeters: Math.round(coords.accuracy),
          label: `${latitude}, ${longitude} (approx.)`,
        });
        setError(null);
      },
      (reason) => setError(reason.message || "Location permission was denied"),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 15_000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { location, error };
}
