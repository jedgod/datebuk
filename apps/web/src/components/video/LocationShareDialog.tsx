"use client";

import { useState, useEffect } from "react";
import { MapPin, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LocationShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConsent: (consent: boolean, location?: any) => void;
}

export function LocationShareDialog({ open, onOpenChange, onConsent }: LocationShareDialogProps) {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<any>(null);

  // Get user's approximate location
  useEffect(() => {
    if (open && !location) {
      // TODO: Get location from browser or profile
      setLocation({
        city: "Bowie",
        state: "MD",
        country: "US",
        radius: 8,
      });
    }
  }, [open]);

  const handleConsent = async (consent: boolean) => {
    if (!consent) {
      onConsent(false);
      return;
    }

    setLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    onConsent(true, location);
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-pink-500" />
            Share Approximate Location
          </DialogTitle>
          <DialogDescription className="space-y-3 pt-2">
            <p>
              For safety and authenticity, both verified users can share their approximate locations.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Privacy Protected:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
                    <li>Only shows city + {location?.radius || 8} mile radius</li>
                    <li>Exact address never shared</li>
                    <li>Data expires after call ends</li>
                    <li>Both users must consent</li>
                  </ul>
                </div>
              </div>
            </div>
            {location && (
              <p className="text-sm">
                Your approximate location:{" "}
                <span className="font-semibold">
                  {location.city}, {location.state} (~{location.radius} mi radius)
                </span>
              </p>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={() => handleConsent(false)} disabled={loading}>
            No Thanks
          </Button>
          <Button onClick={() => handleConsent(true)} disabled={loading}>
            {loading ? "Sharing..." : "Share Location"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
