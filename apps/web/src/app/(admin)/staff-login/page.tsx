"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { showToast } from "@/lib/toast";
import { useAuth } from "@/stores/auth";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

export default function StaffLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginSucceeded, setIsLoginSucceeded] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const { setTokens } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoginSucceeded(false);
    setIsLoading(true);

    try {
      const emailValue = email.trim();
      const passwordValue = password.trim();

      const res = await fetch("/api/auth/staff-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: emailValue, 
          password: passwordValue 
        }),
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.message || "Login failed. Please check your credentials.");
        return;
      }

      // Get the response data
      const data = await res.json();
      if (data.requiresOtp) {
        router.push(`/auth/verify-otp?userId=${encodeURIComponent(data.userId)}&tempToken=${encodeURIComponent(data.tempToken)}`);
        return;
      }
      if (data.mustSetupMfa) {
        router.push(`/auth/setup-mfa?userId=${encodeURIComponent(data.userId)}&tempToken=${encodeURIComponent(data.tempToken)}`);
        return;
      }
      setTokens(data.accessToken, data.refreshToken || null);

      // Store staff profile in localStorage
      const staffProfile = {
        name: data.name,
        staffId: data.staffId,
        image: data.image,
        email: data.email,
        status: "active",
        loginTime: new Date().toISOString(),
      };
      localStorage.setItem("staffProfile", JSON.stringify(staffProfile));

      // Clear form and redirect
      setEmail("");
      setPassword("");
      setIsLoginSucceeded(true);
      showToast(`Welcome, ${data.name}!`, { variant: "success" });
      const nextPath = searchParams?.get("next") || "/staff";
      if (typeof window !== "undefined") {
        window.location.assign(nextPath);
        return;
      }
      router.push(nextPath);
    } catch (err) {
      console.error("Login error:", err);
      setIsLoginSucceeded(false);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    showToast("Google SSO login coming soon", { variant: "success" });
  };

  const handleMicrosoftLogin = () => {
    showToast("Microsoft SSO login coming soon", { variant: "success" });
  };

  const handleForgotPassword = () => {
    if (!email) {
      showToast("Please enter your email address first", { variant: "error" });
      return;
    }
    showToast(`Password reset link sent to ${email}`, { variant: "success" });
  };

  const handleRememberMe = (checked: boolean) => {
    setRememberMe(checked);
    showToast(
      checked ? "Login credentials will be remembered" : "Login credentials will not be remembered",
      { variant: "info" }
    );
  };
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-950 to-black">
      <style jsx global>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-background-clip: text;
          -webkit-text-fill-color: #ffffff;
          transition: background-color 5000s ease-in-out 0s;
          box-shadow: inset 0 0 20px 20px #0a0f1e !important;
        }
      `}</style>
      {/* Header / Branding */}
      <header className="border-b border-slate-800 bg-slate-950/60 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-blue-500" />
            <span className="text-xl font-bold text-white">DateBuk Staff</span>
          </div>
          <div className="text-sm text-slate-400">
            Secure Access Only
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-slate-800 bg-slate-900/70 backdrop-blur-md text-slate-100 shadow-2xl">
          <CardHeader className="space-y-4 pb-6">
            <div className="flex flex-col items-center gap-3">
              <Image
                src="/datebuk_Staff.png"
                alt="DateBuk Staff Logo"
                width={80}
                height={80}
                className="rounded-lg"
              />
              <CardTitle className="text-2xl font-bold text-center">
                Staff Login
              </CardTitle>
            </div>
            <CardDescription className="text-center text-slate-400">
              Sign in to access the support dashboard, moderation tools, and user management
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id="email"
                    placeholder="staff@datebuk.com"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 bg-slate-950 border-slate-700 focus:border-blue-600 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Password Field with visibility toggle */}
              <PasswordField password={password} setPassword={setPassword} />

              {error && (
                <div className="text-red-400 text-sm font-medium p-3 bg-red-500/10 border border-red-500/30 rounded-md">
                  {error}
                </div>
              )}

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="remember" 
                    checked={rememberMe}
                    onCheckedChange={handleRememberMe}
                    className="border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" 
                  />
                  <Label htmlFor="remember" className="text-sm font-medium leading-none text-slate-300">
                    Remember me
                  </Label>
                </div>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              <Button 
                type="submit"
                disabled={isLoading || isLoginSucceeded}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoginSucceeded ? "Login succeeded, redirecting..." : isLoading ? "Signing in..." : "Sign In"}
              </Button>

              {isLoginSucceeded ? (
                <p className="text-sm text-green-400 text-center">Login succeeded, redirecting...</p>
              ) : null}
            </form>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <Separator className="bg-slate-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-2 text-slate-500">or continue with</span>
              </div>
            </div>

            {/* SSO / Alternative login (optional) */}
            <div className="grid grid-cols-2 gap-4">
              <Button 
                type="button"
                variant="outline" 
                onClick={handleGoogleLogin}
                className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300 font-medium"
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </Button>
              <Button 
                type="button"
                variant="outline" 
                onClick={handleMicrosoftLogin}
                className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300 font-medium"
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 23 23">
                  <rect x="1" y="1" width="10" height="10" fill="#f25022"/>
                  <rect x="12" y="1" width="10" height="10" fill="#00a4ef"/>
                  <rect x="1" y="12" width="10" height="10" fill="#7fba00"/>
                  <rect x="12" y="12" width="10" height="10" fill="#ffb900"/>
                </svg>
                Microsoft
              </Button>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col items-center justify-center text-sm text-slate-500 pt-2 pb-6">
            <p>Protected by reCAPTCHA and Google Privacy Policy & Terms apply.</p>
            <Link
              href={`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/login`}
              className="mt-1 text-blue-400 hover:underline"
            >
              ← Back to Sign-in as Administrator
            </Link>
          </CardFooter>
        </Card>
      </main>

      <footer className="py-6 text-center text-sm text-slate-600 border-t border-slate-800">
        © {new Date().getFullYear()} DateBuk • Staff Access Only • All rights reserved
      </footer>
    </div>
  );
}

// Extracted component for better readability
function PasswordField({ 
  password, 
  setPassword 
}: { 
  password: string; 
  setPassword: (value: string) => void; 
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor="password">Password</Label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input
          id="password"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="pl-10 pr-10 bg-slate-950 border-slate-700 focus:border-blue-600 text-white placeholder:text-slate-500"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-slate-400" />
          ) : (
            <Eye className="h-4 w-4 text-slate-400" />
          )}
          <span className="sr-only">
            {showPassword ? "Hide password" : "Show password"}
          </span>
        </Button>
      </div>
    </div>
  );
}
