"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { apiEndpoint } from "@/lib/config";
import { useAuth } from "@/stores/auth";

interface VerificationQueueItem {
  id: string;
  userId: string;
  displayName: string;
  photoUrl: string;
  submittedAt: string;
  status: "PENDING" | "ESCALATED";
  firstReviewerId: string | null;
}

export default function AdminVerificationPage() {
  const { accessToken: token } = useAuth();
  const queryClient = useQueryClient();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);

  const { data: queue, isLoading } = useQuery({
    queryKey: ["verification-queue"],
    queryFn: async () => {
      const res = await fetch(apiEndpoint("/admin/verification/queue"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch verification queue");
      return res.json() as Promise<VerificationQueueItem[]>;
    },
    enabled: !!token,
    refetchInterval: 30000,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, decision, reason }: { id: string; decision: "approved" | "rejected" | "escalated"; reason?: string }) => {
      const res = await fetch(apiEndpoint(`/admin/verification/${id}/review`), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ decision, reason }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || "Failed to submit review");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verification-queue"] });
      setRejectingId(null);
      setRejectReason("");
      setReviewError(null);
    },
    onError: (err: Error) => setReviewError(err.message),
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Photo Verification</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Review submitted selfies against each user's profile photos — this confirms photo resemblance only, not legal identity
          </p>
          {reviewError && <p className="text-sm text-red-600 mt-2">{reviewError}</p>}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : !queue || queue.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-slate-500">No pending verification requests.</CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {queue.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{item.displayName}</CardTitle>
                    {item.status === "ESCALATED" && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3" /> Escalated
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Submitted {new Date(item.submittedAt).toLocaleString()}
                  </p>
                  {item.status === "ESCALATED" && (
                    <p className="text-xs text-amber-700">A different reviewer must make the final call on this one.</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.photoUrl}
                    alt={`${item.displayName} verification submission`}
                    className="w-full aspect-square object-cover rounded-lg border"
                  />

                  {rejectingId === item.id ? (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Reason for rejection (shown to the user)"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="flex-1" onClick={() => setRejectingId(null)}>
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                          disabled={reviewMutation.isPending}
                          onClick={() => reviewMutation.mutate({ id: item.id, decision: "rejected", reason: rejectReason })}
                        >
                          Confirm Reject
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setRejectingId(item.id)}
                          disabled={reviewMutation.isPending}
                        >
                          <XCircle className="w-4 h-4 mr-1" /> Reject
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          disabled={reviewMutation.isPending}
                          onClick={() => reviewMutation.mutate({ id: item.id, decision: "approved" })}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" /> Approve
                        </Button>
                      </div>
                      {item.status !== "ESCALATED" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-full text-amber-700"
                          disabled={reviewMutation.isPending}
                          onClick={() => reviewMutation.mutate({ id: item.id, decision: "escalated" })}
                        >
                          <AlertTriangle className="w-4 h-4 mr-1" /> Not sure — escalate for a second reviewer
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
