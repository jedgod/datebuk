"use client";

import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { StatCard } from "@/components/admin/StatCard";
import { IpFraudTable } from "@/components/admin/IpFraudTable";
import { adminApi } from "@/lib/api";
import { Globe, Shield, Ban, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function IpMonitoringPage() {
  const token = localStorage.getItem("auth_token") || undefined;
  const [searchIp, setSearchIp] = useState("");
  const [blacklistReason, setBlacklistReason] = useState("");

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-ip-stats"],
    queryFn: () => adminApi.getFraudStats(token),
    refetchInterval: 30000,
  });

  const { data: blacklistedIps } = useQuery({
    queryKey: ["blacklisted-ips"],
    queryFn: () => adminApi.getBlacklistedIps(token),
    refetchInterval: 60000,
  });

  const handleBlacklistIp = async (ip: string) => {
    if (!ip || !blacklistReason) return;
    try {
      await adminApi.addIpToBlacklist(ip, blacklistReason, 5, token);
      alert(`IP ${ip} has been blacklisted`);
      setSearchIp("");
      setBlacklistReason("");
    } catch (error) {
      alert("Failed to blacklist IP");
    }
  };

  const handleRemoveIp = async (ip: string) => {
    try {
      await adminApi.removeIpFromBlacklist(ip, token);
      alert(`IP ${ip} has been removed from blacklist`);
    } catch (error) {
      alert("Failed to remove IP");
    }
  };

  const uniqueIps = (stats as any)?.uniqueIps ?? 0;
  const vpnDetections = (stats as any)?.vpnDetections ?? 0;
  const blacklistedCount = (blacklistedIps as any)?.count ?? 0;
  const suspiciousIps = (stats as any)?.suspiciousIps ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            IP Monitoring & Blacklist
          </h1>
          <p className="text-slate-600 mt-2">
            Track IP addresses, detect VPNs, and manage blacklist
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Unique IPs (24h)"
            value={uniqueIps}
            trend="+3.2%"
            isPositive
            icon={Globe}
          />
          <StatCard
            title="VPN Detections"
            value={vpnDetections}
            trend="+1.4%"
            variant="warning"
            icon={Shield}
          />
          <StatCard
            title="Blacklisted IPs"
            value={blacklistedCount}
            trend="+2"
            variant="destructive"
            icon={Ban}
          />
          <StatCard
            title="Suspicious IPs"
            value={suspiciousIps}
            trend="+0.8%"
            variant="warning"
            icon={AlertCircle}
          />
        </div>

        {/* IP Blacklist Management */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-xl font-semibold mb-4 text-slate-900">
            Add IP to Blacklist
          </h2>
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Enter IP address (e.g., 192.168.1.1)"
              value={searchIp}
              onChange={(e) => setSearchIp(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Reason for blacklisting"
              value={blacklistReason}
              onChange={(e) => setBlacklistReason(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={() => handleBlacklistIp(searchIp)}
              disabled={!searchIp || !blacklistReason}
              variant="secondary"
              className="whitespace-nowrap"
            >
              <Ban className="mr-2 h-4 w-4" />
              Blacklist IP
            </Button>
          </div>
        </div>

        {/* Top Risky IPs Table */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">
            High-Risk IP Addresses
          </h2>
          <IpFraudTable items={(stats as any)?.topIPs} isLoading={isLoading} />
        </div>

        {/* Currently Blacklisted IPs */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-xl font-semibold mb-4 text-slate-900">
            Currently Blacklisted IPs
          </h2>
          {(blacklistedIps as any)?.ips?.length > 0 ? (
            <div className="space-y-2">
              {(blacklistedIps as any).ips.map((item: any) => (
                <div
                  key={item.ip}
                  className="flex items-center justify-between p-3 rounded-md bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div>
                    <p className="font-mono font-semibold text-slate-900">
                      {item.ip}
                    </p>
                    <p className="text-sm text-slate-600">{item.reason}</p>
                    <p className="text-xs text-slate-500">
                      Added: {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveIp(item.ip)}
                    className="text-green-600 hover:text-green-700 border-green-600"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">
              No IPs currently blacklisted
            </p>
          )}
        </div>

        {/* IP Geolocation Map Placeholder */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-xl font-semibold mb-4 text-slate-900">
            IP Geographic Distribution
          </h2>
          <div className="aspect-video bg-slate-100 rounded-md flex items-center justify-center">
            <p className="text-slate-500">
              Map visualization would be integrated here
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
