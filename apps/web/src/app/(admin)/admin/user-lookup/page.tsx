"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, User, Mail, Calendar, Shield } from "lucide-react";
import Link from "next/link";

interface UserSearchResult {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  status: string;
  verifiedEmail: boolean;
}

export default function UserLookupPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setIsSearching(true);
    
    // Mock search - replace with actual API call
    setTimeout(() => {
      setSearchResults([
        {
          id: "user-1",
          email: "user@example.com",
          name: "John Doe",
          createdAt: new Date().toISOString(),
          status: "active",
          verifiedEmail: true,
        },
      ]);
      setIsSearching(false);
    }, 500);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">User Lookup</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Search and view user profiles
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by email, name, or user ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="mt-6 space-y-4">
                <h3 className="font-semibold">Search Results</h3>
                {searchResults.map((user) => (
                  <Link key={user.id} href={`/admin/user-lookup/${user.id}`}>
                    <div className="p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                            <User className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                          </div>
                          <div>
                            <div className="font-medium">{user.name || "No name"}</div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              {user.email}
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">View Profile</Button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
