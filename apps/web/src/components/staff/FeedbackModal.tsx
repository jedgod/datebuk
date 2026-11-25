"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, MessageSquare, Lightbulb, AlertCircle, CheckCircle } from "lucide-react";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [feedbackType, setFeedbackType] = useState<"feature" | "bug" | "feedback">("feature");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Store feedback in localStorage for now
    const feedback = {
      id: Date.now(),
      type: feedbackType,
      title,
      description,
      submittedAt: new Date().toISOString(),
      status: "pending",
    };

    const existingFeedback = JSON.parse(localStorage.getItem("staff_feedback") || "[]");
    localStorage.setItem("staff_feedback", JSON.stringify([...existingFeedback, feedback]));

    setSubmitting(false);
    setSubmitted(true);

    // Reset form after 3 seconds
    setTimeout(() => {
      setTitle("");
      setDescription("");
      setFeedbackType("feature");
      setSubmitted(false);
      onClose();
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Send Feedback & Feature Requests
          </CardTitle>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>

        <CardContent>
          {submitted ? (
            <div className="text-center space-y-4 py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                Thank you for your feedback!
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                We've received your {feedbackType}. Our team will review it and get back to you soon.
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                Reference ID: #{Date.now()}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Feedback Type */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">
                  What type of feedback?
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: "feature" as const, label: "Feature Request", icon: Lightbulb },
                    { value: "bug" as const, label: "Bug Report", icon: AlertCircle },
                    { value: "feedback" as const, label: "General Feedback", icon: MessageSquare },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFeedbackType(value)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                        feedbackType === value
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  placeholder={`e.g., "Add dark mode" or "Fix login issue"`}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  placeholder="Tell us more about your feedback..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={5}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-slate-700 dark:text-slate-300">
                <p className="font-semibold mb-1">💡 Tips for better feedback:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Be specific and clear about what you're requesting</li>
                  <li>• Include examples or steps to reproduce (for bugs)</li>
                  <li>• Explain why this would help you work better</li>
                  <li>• Be respectful and constructive</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || !title || !description}>
                  {submitting ? "Sending..." : "Send Feedback"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
