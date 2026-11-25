"use client";

import { useEffect, useState } from "react";
import { SubscriptionUsagePanel } from "@/components/subscription/SubscriptionUsagePanel";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Home,
  Search,
  Heart,
  MessageCircle,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { CurrentPlanCard } from "@/components/CurrentPlanCard";
import { Feature, Plan, SUBSCRIPTION_FEATURES } from "@/config/subscription-features";
import { useAuth } from "@/stores/auth";
import { SUBSCRIPTION_TIER_PRICING } from "@shared/types";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { EnterpriseSidebar } from "@/components/dashboard/EnterpriseSidebar";
import { MobileEnterpriseDrawer } from "@/components/dashboard/MobileEnterpriseDrawer";


export default function MySubscriptionPage() {
  const router = useRouter();
  const { accessToken, refresh, hydrate, isHydrated } = useAuth();
  const [downgradeOpen, setDowngradeOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Plan>("FREE");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [features, setFeatures] = useState<Feature[]>(
    SUBSCRIPTION_FEATURES.map((feature) => ({ ...feature, adminEnabled: false }))
  );
  const [planStatus, setPlanStatus] = useState<string>("");
  const [invoices, setInvoices] = useState<
    Array<{ id: string; amountPaid: number | null; status: string; createdAt: string; hostedInvoiceUrl: string | null }>
  >([]);

  const getCookieToken = () => {
    const match = document.cookie.match(/(?:^|; )dp_access=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  };

  const normalizePlan = (plan: string | null | undefined): Plan => {
    if (plan === "FREE" || plan === "PREMIUM" || plan === "ELITE") return plan;
    return "FREE";
  };

  const handlePlanChange = async (plan: Plan) => {
    const token = accessToken ?? (await refresh()) ?? getCookieToken();
    if (!token) {
      setPlanStatus("Please sign in to change your plan.");
      return;
    }
    router.push(`/dashboard/checkout?plan=${plan}`);
  };

  const handleSwitch = async () => {
    if (!selectedPlan) {
      setPlanStatus("Select a plan first, then click switch to continue.");
      return;
    }
    await handlePlanChange(selectedPlan);
  };

  const primaryLabel =
    currentPlan === "ELITE"
      ? "Downgrade to Free"
      : currentPlan === "PREMIUM"
        ? "Upgrade to Elite"
        : "Upgrade to Premium";

  const primaryTarget: Plan =
    currentPlan === "ELITE" ? "FREE" : currentPlan === "PREMIUM" ? "ELITE" : "PREMIUM";

  const switchTarget = selectedPlan ?? "FREE";

  useEffect(() => {
    if (!isHydrated) {
      hydrate();
    }

    const loadFeatures = async () => {
      try {
        const token = accessToken ?? (await refresh()) ?? getCookieToken();
        const res = await fetch("/api/subscriptions/features", {
          cache: "no-store",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (!res.ok) {
          return;
        }

        const data = await res.json();
        if (data?.plan) {
          setCurrentPlan(normalizePlan(data.plan));
        }
        if (Array.isArray(data?.features) && data.features.length > 0) {
          setFeatures(data.features);
        }
      } catch (error) {
        console.error("Failed to load subscription features", error);
      }
    };

    loadFeatures();

    const loadInvoices = async () => {
      try {
        const token = accessToken ?? (await refresh()) ?? getCookieToken();
        const res = await fetch("/api/subscriptions/invoices", {
          cache: "no-store",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data?.invoices)) {
          setInvoices(data.invoices);
        }
      } catch (error) {
        console.error("Failed to load billing history", error);
      }
    };

    loadInvoices();
  }, [accessToken, refresh, hydrate, isHydrated]);

  useEffect(() => {
    if (selectedPlan === currentPlan) {
      setSelectedPlan(null);
    }
  }, [currentPlan, selectedPlan]);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 text-white">
      <div className="flex min-h-screen">
        <MobileEnterpriseDrawer />
        <EnterpriseSidebar />

        <main className="flex-1 p-6 lg:p-12">
          <div className="min-h-screen bg-gradient-to-br from-[#1b102c] via-[#12091f] to-black p-8 flex items-center justify-center">
            <div className="w-full max-w-7xl rounded-[28px] bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl p-8 text-white">
              <h1 className="text-4xl font-semibold text-pink-400 mb-8">My Subscription</h1>
              {planStatus ? (
                <div className="mb-6 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
                  {planStatus}
                </div>
              ) : null}

              <SubscriptionUsagePanel />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <CurrentPlanCard plan={currentPlan} features={features} />

                <Card className="bg-white/10 border-white/20 rounded-2xl">
                  <CardContent className="grid grid-cols-2 divide-x divide-white/20 pt-6">
                    <div className="space-y-3 pr-4">
                      <h3 className="text-xl font-semibold">PREMIUM</h3>
                      <p className="text-gray-300">{SUBSCRIPTION_TIER_PRICING.PREMIUM.displayPrice}</p>
                      <p className="text-gray-200">Unlimited matching</p>
                      <p className="text-gray-200">Chat and voice calls</p>
                      <p className="text-pink-400 font-semibold">Upgrade tier</p>
                    </div>

                    <div className="space-y-3 pl-4">
                      <h3 className="text-xl font-semibold">ELITE</h3>
                      <p className="text-gray-300">{SUBSCRIPTION_TIER_PRICING.ELITE.displayPrice}</p>
                      <p className="text-gray-200">Everything in Premium</p>
                      <p className="text-gray-200">Video and priority access</p>
                      <p className="text-gray-400">Highest tier</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 border-white/20 rounded-2xl flex flex-col justify-between">
                  <CardHeader>
                    <CardTitle className="text-lg">Upgrade Plan</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 flex flex-col items-center">
                    <Button
                      variant="secondary"
                      className="w-full bg-white/20 text-white hover:bg-white/30 text-center"
                      onClick={() => {
                        setSelectedPlan("PREMIUM");
                        setPlanStatus("");
                      }}
                      disabled={currentPlan === "PREMIUM"}
                    >
                      {selectedPlan === "PREMIUM" ? "Premium Selected" : "Select Premium"}
                    </Button>
                    <Button
                      variant="secondary"
                      className="w-full bg-white/20 text-white hover:bg-white/30 text-center"
                      onClick={() => {
                        setSelectedPlan("ELITE");
                        setPlanStatus("");
                      }}
                      disabled={currentPlan === "ELITE"}
                    >
                      {selectedPlan === "ELITE" ? "Elite Selected" : "Select Elite"}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="bg-white/10 border-white/20 rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg">Billing History</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-gray-200">
                      <span>Switch to</span>
                      <Badge className="bg-white/20">
                        {selectedPlan ? switchTarget : "Select a plan"}
                      </Badge>
                    </div>
                    <SelectPlanButton
                      label={selectedPlan ? `Proceed to payment (${switchTarget})` : "Choose plan above"}
                      onClick={handleSwitch}
                      isActive={false}
                      disabled={!selectedPlan}
                    />
                  </CardContent>
                </Card>

                <Card className="bg-white/10 border-white/20 rounded-2xl lg:col-span-2">
                  <CardContent className="pt-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-gray-400">
                              No billing history yet.
                            </TableCell>
                          </TableRow>
                        ) : (
                          invoices.map((invoice) => (
                            <TableRow key={invoice.id} className="hover:bg-white/5">
                              <TableCell>{new Date(invoice.createdAt).toLocaleDateString()}</TableCell>
                              <TableCell>Subscription</TableCell>
                              <TableCell>
                                {invoice.amountPaid != null ? `$${invoice.amountPaid.toFixed(2)}` : "—"}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    invoice.status === "paid"
                                      ? "bg-green-500 text-black"
                                      : "bg-yellow-500 text-black"
                                  }
                                >
                                  {invoice.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
      </div>
      <DowngradeModal
        open={downgradeOpen}
        onClose={() => setDowngradeOpen(false)}
        onConfirm={() => setDowngradeOpen(false)}
      />
    </>
  );
}

function SelectPlanButton({
  isActive,
  onClick,
  emphasis = "normal",
  label,
  disabled,
}: {
  isActive?: boolean;
  onClick?: () => void;
  emphasis?: "normal" | "strong";
  label?: string;
  disabled?: boolean;
}) {
  const isDisabled = Boolean(isActive || disabled);
  return (
    <Button
      disabled={isDisabled}
      onClick={onClick}
      className={cn(
        "w-full rounded-full transition",
        isDisabled
          ? "bg-white/20 text-gray-300 cursor-not-allowed"
          : "bg-gradient-to-r from-pink-500 to-rose-500 text-white",
        emphasis === "strong"
          ? "h-12 font-semibold shadow-xl shadow-pink-500/40"
          : "h-11 font-medium shadow-lg shadow-pink-500/30",
        !isDisabled && "hover:brightness-110"
      )}
    >
      {isActive ? "Current Plan" : label ?? "Select Plan"}
    </Button>
  );
}

function DowngradeModal({
  open,
  onConfirm,
  onClose,
}: {
  open: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Downgrade to BASIC?</AlertDialogTitle>
          <AlertDialogDescription>
            You will lose premium features immediately.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={onConfirm}>
            Downgrade
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function PulsingCTA({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      animate={{ scale: [1, 1.03, 1] }}
      transition={{
        duration: 2.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}

