"use client";

import { Calendar, Heart, MapPin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EndCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onPlanInPerson: () => void;
}

export function EndCallDialog({ open, onOpenChange, onConfirm, onPlanInPerson }: EndCallDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">Great video date! 🎉</DialogTitle>
          <DialogDescription className="text-center pt-2">
            What would you like to do next?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {/* Plan in-person date */}
          <Button
            onClick={onPlanInPerson}
            className="w-full h-14 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-base"
          >
            <Calendar className="w-5 h-5 mr-2" />
            Plan an In-Person Date
          </Button>

          {/* Continue chatting */}
          <Button
            variant="outline"
            onClick={onConfirm}
            className="w-full h-12 text-base"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Continue Chatting
          </Button>

          {/* Share location */}
          <Button
            variant="outline"
            onClick={() => {
              // TODO: Trigger location share
              alert("Location sharing feature");
            }}
            className="w-full h-12 text-base"
          >
            <MapPin className="w-5 h-5 mr-2" />
            Share Meet-Up Ideas
          </Button>
        </div>

        <DialogFooter className="sm:justify-center border-t pt-4">
          <button
            onClick={onConfirm}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Just end call
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
