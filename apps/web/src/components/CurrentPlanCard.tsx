"use client";

import { motion } from "framer-motion";
import { Check, Lock } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SUBSCRIPTION_FEATURES, Plan, Feature } from "@/config/subscription-features";

export function CurrentPlanCard({
  plan,
  features = SUBSCRIPTION_FEATURES,
}: {
  plan: Plan;
  features?: Feature[];
}) {
  return (
    <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <h3 className="text-lg font-semibold">Current Plan</h3>
        <Badge className="bg-pink-500 px-3 py-1 rounded-full">{plan}</Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        {features.map((feature) => {
          const enabled = feature.plans.includes(plan) && feature.adminEnabled;

          return (
            <FeatureRow key={feature.key} label={feature.label} enabled={enabled} />
          );
        })}
      </CardContent>
    </Card>
  );
}

function FeatureRow({
  label,
  enabled,
}: {
  label: string;
  enabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${enabled ? "text-gray-200" : "text-gray-500"}`}>
        {label}
      </span>

      {enabled ? (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500"
        >
          <Check className="h-3 w-3 text-black" />
        </motion.span>
      ) : (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
          <Lock className="h-3 w-3 text-gray-400" />
        </span>
      )}
    </div>
  );
}
