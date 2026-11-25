"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Eye, Lock, Clock, Database, Shield, Info } from "lucide-react";
import Link from "next/link";

export default function TrackingTransparencyPage() {
  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Eye className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Data Transparency</h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            We believe in transparency. Here's exactly what we track and how we use your data.
          </p>
        </div>

        {/* Important Notice */}
        <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-r">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900 dark:text-blue-100">What We Collect</p>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                We track work-related activities to help manage operations, improve performance, and ensure service quality. Your privacy is important to us.
              </p>
            </div>
          </div>
        </div>

        {/* What We Track */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              What We Track
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              {
                category: "Ticket Activity",
                icon: "📋",
                tracked: [
                  "Tickets you view, update, or resolve",
                  "Time spent on each ticket",
                  "Status changes and notes you add",
                  "Customer feedback on your resolutions",
                ],
                retention: "12 months",
                whoCanSee: ["Admin", "Your Manager"],
              },
              {
                category: "Performance Metrics",
                icon: "📊",
                tracked: [
                  "Tickets resolved per day/week/month",
                  "Average Handle Time (AHT)",
                  "Customer Satisfaction (CSAT) scores",
                  "First Contact Resolution (FCR) rate",
                  "Average Response Time",
                ],
                retention: "24 months (for trends)",
                whoCanSee: ["Admin", "Your Manager", "You (personal metrics)"],
              },
              {
                category: "System Activity",
                icon: "🔐",
                tracked: [
                  "Login and logout times",
                  "Pages you access",
                  "Features you use",
                  "Search queries",
                  "Session duration",
                ],
                retention: "6 months",
                whoCanSee: ["Admin", "Security Team"],
              },
              {
                category: "Communication",
                icon: "💬",
                tracked: [
                  "Chat messages with customers",
                  "Internal notes you add",
                  "Notes about customer interactions",
                  "Escalations and transfers you make",
                ],
                retention: "12 months",
                whoCanSee: ["Admin", "Your Manager", "Relevant Departments"],
              },
              {
                category: "Professional Development",
                icon: "🎓",
                tracked: [
                  "Training completion status",
                  "Certifications and skills",
                  "Feedback from manager",
                  "Performance improvement plans",
                ],
                retention: "Duration of employment + 1 year",
                whoCanSee: ["Admin", "HR", "Your Manager"],
              },
            ].map((item) => (
              <div
                key={item.category}
                className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white">{item.category}</h3>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-2">
                      Tracked Data
                    </p>
                    <ul className="space-y-1">
                      {item.tracked.map((data) => (
                        <li key={data} className="text-sm text-slate-700 dark:text-slate-300">
                          • {data}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                        Data Retention
                      </p>
                      <Badge variant="secondary" className="mt-1">
                        {item.retention}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                        Who Can See
                      </p>
                      <div className="mt-1 space-y-1">
                        {item.whoCanSee.map((person) => (
                          <Badge key={person} variant="outline" className="text-xs">
                            {person}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* What We DON'T Track */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              What We DON'T Track
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Your personal browsing outside work hours",
                "Personal phone calls or messages",
                "Your location (unless using GPS-enabled device)",
                "Your camera or microphone",
                "Personal social media",
                "Medical or financial information",
                "Personal device usage",
                "Your home network",
              ].map((item) => (
                <div key={item} className="flex gap-3">
                  <span className="text-green-600 mt-1">✓</span>
                  <p className="text-slate-700 dark:text-slate-300">{item}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Your Rights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Your Rights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Right to Access</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  You have the right to request and see all data we hold about you. Submit a request via your admin panel.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Data Portability</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  You can request a copy of your data in a common format. Contact HR to initiate.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Dispute & Appeal</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  If you believe data about you is inaccurate, you can dispute it. We'll investigate within 30 days.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Data Deletion</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Upon request and after retention period, your data will be securely deleted.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security & Privacy */}
        <Card>
          <CardHeader>
            <CardTitle>Security & Privacy Practices</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {[
                "Data is encrypted in transit and at rest",
                "Access to data is role-based and logged",
                "Regular security audits are conducted",
                "We comply with GDPR, CCPA, and local regulations",
                "Data breaches are reported within 72 hours",
                "Backups are encrypted and geographically distributed",
                "Only authorized personnel can access raw data",
                "We never sell or share your data with third parties",
              ].map((item) => (
                <li key={item} className="flex gap-3 text-slate-700 dark:text-slate-300">
                  <span className="text-green-600 font-bold">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Data Request Form */}
        <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Request Your Data or Report a Concern
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Need to request your data, report a concern, or ask about tracking practices?
            </p>
            <div className="flex gap-2">
              <Button variant="default">Request Your Data</Button>
              <Button variant="outline">Report a Concern</Button>
              <Button variant="outline">Privacy Inquiry</Button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              All requests are handled by our Privacy Team and processed within 30 days.
            </p>
          </CardContent>
        </Card>

        {/* Back Button */}
        <Link href="/staff">
          <Button variant="outline">← Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
