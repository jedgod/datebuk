"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, User, Shield, Mail, Lock, Save, Eye, EyeOff, Upload, Check } from "lucide-react";
import { showToast } from "@/lib/toast";

export default function SettingsPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState("https://github.com/shadcn.png");
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileData, setProfileData] = useState({
    firstName: "Agent",
    lastName: "Smith",
    email: "agent@datebuk.com",
    phone: "+1 (555) 987-6543",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notifications, setNotifications] = useState({
    newTickets: true,
    mentions: true,
    chatMessages: true,
    systemAlerts: true,
  });

  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [compactMode, setCompactMode] = useState(false);

  // Profile Settings Handlers
  const handleChangePhoto = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast("File size must be less than 2MB", { variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
        showToast("Profile photo updated successfully", { variant: "success" });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleOnlineStatus = () => {
    setOnlineStatus(!onlineStatus);
    showToast(
      onlineStatus ? "Status set to Offline - Not accepting tickets" : "Status set to Online - Accepting tickets",
      { variant: "success" }
    );
  };

  const handleSaveProfile = () => {
    showToast("Profile settings saved successfully", { variant: "success" });
    // You can add API call here to save profile data
  };

  // Notification Handlers
  const handleUpdateNotifications = () => {
    const enabledCount = Object.values(notifications).filter(Boolean).length;
    showToast(`Notification preferences updated - ${enabledCount} notifications enabled`, { variant: "success" });
    // You can add API call here to save notification preferences
  };

  // Security Handlers
  const handleEnable2FA = () => {
    if (twoFaEnabled) {
      setTwoFaEnabled(false);
      showToast("Two-Factor Authentication disabled", { variant: "success" });
    } else {
      // Simulate 2FA setup
      const code = Math.floor(100000 + Math.random() * 900000);
      showToast(`2FA Code sent to your phone: ${code}`, { variant: "success" });
      setTimeout(() => {
        setTwoFaEnabled(true);
        showToast("Two-Factor Authentication enabled successfully", { variant: "success" });
      }, 1500);
    }
  };

  const handleUpdatePassword = () => {
    if (!passwordData.currentPassword) {
      showToast("Please enter your current password", { variant: "destructive" });
      return;
    }
    if (!passwordData.newPassword) {
      showToast("Please enter a new password", { variant: "destructive" });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast("New passwords do not match", { variant: "destructive" });
      return;
    }
    if (passwordData.newPassword.length < 8) {
      showToast("Password must be at least 8 characters long", { variant: "destructive" });
      return;
    }

    showToast("Password updated successfully", { variant: "success" });
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    // You can add API call here to update password
  };

  // Appearance Handlers
  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    showToast(`Theme changed to ${newTheme}`, { variant: "success" });
    // You can add logic here to apply theme to the document
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (newTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      // System theme - check user's system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  const handleCompactModeToggle = () => {
    setCompactMode(!compactMode);
    showToast(
      compactMode ? "Compact mode disabled" : "Compact mode enabled - Showing more content",
      { variant: "success" }
    );
    // You can add logic here to apply compact styles
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <CardTitle>Profile Settings</CardTitle>
          </div>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profilePhoto} />
              <AvatarFallback>AG</AvatarFallback>
            </Avatar>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/jpeg,image/png,image/gif"
                className="hidden"
              />
              <Button size="sm" onClick={handleChangePhoto}>
                <Upload className="mr-2 h-4 w-4" />
                Change Photo
              </Button>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG or GIF. Max size 2MB.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input 
                id="firstName" 
                placeholder="John" 
                value={profileData.firstName}
                onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input 
                id="lastName" 
                placeholder="Doe" 
                value={profileData.lastName}
                onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="agent@example.com" 
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input 
              id="phone" 
              type="tel" 
              placeholder="+1 (555) 123-4567" 
              value={profileData.phone}
              onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <Badge className={onlineStatus ? "bg-green-600" : "bg-gray-600"}>
                {onlineStatus ? "Online" : "Offline"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {onlineStatus ? "Currently accepting tickets" : "Not accepting tickets"}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={handleToggleOnlineStatus}>
              Toggle Status
            </Button>
          </div>

          <Button className="w-full" onClick={handleSaveProfile}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notification Preferences</CardTitle>
          </div>
          <CardDescription>Choose what notifications you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">New Tickets</p>
              <p className="text-sm text-muted-foreground">Get notified when new tickets are assigned to you</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.newTickets}
              onChange={(e) => setNotifications({ ...notifications, newTickets: e.target.checked })}
              className="h-4 w-4"
              aria-label="Enable new tickets notifications"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Mentions</p>
              <p className="text-sm text-muted-foreground">Get notified when someone mentions you</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.mentions}
              onChange={(e) => setNotifications({ ...notifications, mentions: e.target.checked })}
              className="h-4 w-4"
              aria-label="Enable mentions notifications"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Chat Messages</p>
              <p className="text-sm text-muted-foreground">Get notified for new chat messages</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.chatMessages}
              onChange={(e) => setNotifications({ ...notifications, chatMessages: e.target.checked })}
              className="h-4 w-4"
              aria-label="Enable chat messages notifications"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">System Alerts</p>
              <p className="text-sm text-muted-foreground">Get notified about system updates and maintenance</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.systemAlerts}
              onChange={(e) => setNotifications({ ...notifications, systemAlerts: e.target.checked })}
              className="h-4 w-4"
              aria-label="Enable system alerts notifications"
            />
          </div>

          <Button className="w-full" variant="secondary" onClick={handleUpdateNotifications}>
            <Save className="mr-2 h-4 w-4" />
            Update Preferences
          </Button>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Security Settings</CardTitle>
          </div>
          <CardDescription>Manage your password and security preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Enter current password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => setShowPassword(!showPassword)}
                type="button"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Enter new password (min 8 characters)"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
            />
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
              </div>
              <Badge variant={twoFaEnabled ? "default" : "outline"} className={twoFaEnabled ? "bg-green-600" : ""}>
                {twoFaEnabled ? (
                  <span className="flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Enabled
                  </span>
                ) : (
                  "Not Enabled"
                )}
              </Badge>
            </div>
            <Button 
              variant={twoFaEnabled ? "destructive" : "secondary"} 
              className="w-full"
              onClick={handleEnable2FA}
            >
              <Lock className="mr-2 h-4 w-4" />
              {twoFaEnabled ? "Disable 2FA" : "Enable 2FA"}
            </Button>
          </div>

          <Button className="w-full" onClick={handleUpdatePassword}>
            <Save className="mr-2 h-4 w-4" />
            Update Password
          </Button>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how the dashboard looks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Theme</Label>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <Button 
                variant={theme === "light" ? "default" : "outline"} 
                className="justify-start"
                onClick={() => handleThemeChange("light")}
              >
                Light
              </Button>
              <Button 
                variant={theme === "dark" ? "default" : "outline"} 
                className="justify-start"
                onClick={() => handleThemeChange("dark")}
              >
                Dark
              </Button>
              <Button 
                variant={theme === "system" ? "default" : "outline"} 
                className="justify-start"
                onClick={() => handleThemeChange("system")}
              >
                System
              </Button>
            </div>
          </div>

          <div>
            <Label>Compact Mode</Label>
            <div className="flex items-center justify-between mt-2">
              <p className="text-sm text-muted-foreground">Show more content on screen</p>
              <input 
                type="checkbox" 
                className="h-4 w-4 cursor-pointer" 
                aria-label="Enable compact mode"
                checked={compactMode}
                onChange={handleCompactModeToggle}
              />
            </div>
          </div>

          <Button className="w-full" variant="secondary" onClick={() => {
            showToast(`Appearance settings applied - Theme: ${theme}, Compact: ${compactMode ? 'On' : 'Off'}`, { variant: "success" });
          }}>
            <Save className="mr-2 h-4 w-4" />
            Apply Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
