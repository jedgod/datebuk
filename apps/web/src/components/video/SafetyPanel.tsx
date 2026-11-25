"use client";

import { useState } from "react";
import { Shield, AlertOctagon, Ban, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface SafetyPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  onReport: () => void;
}

const REPORT_REASONS = [
  { value: "harassment", label: "Harassment or bullying", priority: "high" },
  { value: "inappropriate", label: "Inappropriate behavior", priority: "high" },
  { value: "safety_concern", label: "Safety concern", priority: "high" },
  { value: "spam", label: "Spam or scam", priority: "normal" },
  { value: "fake_profile", label: "Fake profile/catfish", priority: "normal" },
  { value: "other", label: "Other", priority: "normal" },
];

export function SafetyPanel({ open, onOpenChange, sessionId, onReport }: SafetyPanelProps) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;

    setLoading(true);

    try {
      const response = await fetch("/api/video-session/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          reportedUserId: "match_user_id", // TODO: Get from session
          reason,
          description,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          onReport();
          onOpenChange(false);
          setSubmitted(false);
          setReason("");
          setDescription("");
        }, 2000);
      }
    } catch (error) {
      console.error("Report failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = () => {
    // TODO: Block user
    alert("User blocked");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Shield className="w-5 h-5" />
            Safety & Reporting
          </DialogTitle>
          <DialogDescription>
            {submitted
              ? "Report submitted successfully. Thank you for helping keep our community safe."
              : "Report inappropriate behavior or block this user"}
          </DialogDescription>
        </DialogHeader>

        {!submitted ? (
          <div className="space-y-4 py-4">
            {/* Report Reason */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Reason for report:</Label>
              <RadioGroup value={reason} onValueChange={setReason}>
                {REPORT_REASONS.map((r) => (
                  <div key={r.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={r.value} id={r.value} />
                    <Label htmlFor={r.value} className="font-normal cursor-pointer">
                      {r.label}
                      {r.priority === "high" && (
                        <span className="ml-2 text-xs text-red-500">(High Priority)</span>
                      )}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold">
                Additional details (optional):
              </Label>
              <Textarea
                id="description"
                placeholder="Please provide any additional information..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Quick Actions */}
            <div className="pt-2 space-y-2">
              <p className="text-sm font-semibold">Quick Actions:</p>
              <Button
                variant="outline"
                onClick={handleBlock}
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Ban className="w-4 h-4 mr-2" />
                Block this user
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Flag className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-lg font-semibold text-green-600">Report Submitted</p>
            <p className="text-sm text-gray-600 mt-2">
              Our team will review this within 24 hours
            </p>
          </div>
        )}

        {!submitted && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!reason || loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
