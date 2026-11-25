"use client";
import { TextField } from "@/components/ui/textfield";
import { useState } from "react";

interface Step4Props {
  values: any;
  errors: any;
  onChange: (field: string, value: any) => void;
}

export default function Step4Location({ values, errors, onChange }: Step4Props) {
  const [detecting, setDetecting] = useState(false);

  const detectLocation = () => {
    setDetecting(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // In production, you'd use a geocoding service
            const { latitude, longitude } = position.coords;
            onChange('location', {
              city: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
              lat: latitude,
              lng: longitude,
            });
          } catch (err) {
            console.error('Geocoding error:', err);
          } finally {
            setDetecting(false);
          }
        },
        (error) => {
          console.error('Location error:', error);
          setDetecting(false);
        }
      );
    } else {
      setDetecting(false);
      alert('Geolocation is not supported by your browser');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900">Where are you?</h2>
        <p className="mt-2 text-sm text-gray-600">
          We'll show you matches nearby
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <TextField
            label="City, State"
            type="text"
            value={values.location?.city || ''}
            onChange={(e) => onChange('location', { ...values.location, city: e.target.value })}
            placeholder="e.g., Los Angeles, CA"
          />
          {errors.location && (
            <p className="mt-1 text-sm text-red-600">{errors.location}</p>
          )}
        </div>

        <button
          type="button"
          onClick={detectLocation}
          disabled={detecting}
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-semibold hover:border-gray-300 transition-all disabled:opacity-50"
        >
          {detecting ? 'Detecting...' : '📍 Use my current location'}
        </button>

        <p className="text-xs text-gray-500 text-center">
          Your exact location is never shared. We only show your general area.
        </p>
      </div>
    </div>
  );
}
