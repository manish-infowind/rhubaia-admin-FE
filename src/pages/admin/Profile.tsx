import React, { useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Save,
  Upload,
  User,
  Shield,
  Mail,
  Calendar,
  Key,
  Loader2,
  Camera,
  RefreshCw,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useProfile } from "@/api/hooks/useProfile";
import PasswordChangeModal from "@/components/admin/PasswordChangeModal";

// Utility function to format relative time
const formatRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }
};

export default function Profile() {
  const {
    profile,
    loading,
    error,
    saving,
    uploadingAvatar,
    updateProfile,
    uploadAvatar,
    loadProfile,
    resetError,
  } = useProfile();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [localProfile, setLocalProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [modalType, setModalType] = useState<"changepassword" | "">("");


  // Load profile data when component mounts
  useEffect(() => {
    // Always load profile on mount/reload
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to ensure it runs on every mount/reload

  // Update local state when profile data loads
  useEffect(() => {
    if (profile) {
      setLocalProfile({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        email: profile.email || "",
      });
      // Set avatar URL with cache busting and track loading
      if (profile.avatar) {
        setImageLoading(true);
        setUploadProgress(0);
        const newAvatarUrl = `${profile.avatar}?t=${Date.now()}`;
        setAvatarUrl(newAvatarUrl);

        // Simulate realistic S3 loading progress
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += Math.random() * 15 + 5; // Random increment between 5-20
          if (progress >= 85) {
            clearInterval(progressInterval);
            setUploadProgress(85);
          } else {
            setUploadProgress(Math.round(progress));
          }
        }, 150);

        // Create image object to track actual loading
        const img = new Image();
        img.onload = () => {
          clearInterval(progressInterval);
          setUploadProgress(100);
          setTimeout(() => {
            setImageLoading(false);
            setUploadProgress(0);
          }, 800);
        };
        img.onerror = () => {
          clearInterval(progressInterval);
          setImageLoading(false);
          setUploadProgress(0);
        };
        img.src = newAvatarUrl;
      }
    }
  }, [profile]);

  const handleSave = async () => {
    await updateProfile(localProfile);
  };

  const handleAvatarUpload = async () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setUploadProgress(0);
        setImageLoading(true);

        // Pass progress callback to uploadAvatar
        await uploadAvatar(file, (progress: number) => {
          setUploadProgress(Math.round(progress));
        });

        // Update avatar URL immediately for smooth rendering
        if (file) {
          const newAvatarUrl = URL.createObjectURL(file);
          setAvatarUrl(newAvatarUrl);
        }

        // Complete the progress
        setUploadProgress(100);
        setTimeout(() => {
          setImageLoading(false);
          setUploadProgress(0);
        }, 500);

      } catch (error) {
        setImageLoading(false);
        setUploadProgress(0);
      }
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };


  const openForgotPasswordHandler = useCallback(() => {
    if (error && (error.includes('password') || error.includes('Current password is incorrect'))) {
      resetError();
    }
    setShowPasswordModal(true);
    setModalType("changepassword");
  }, []);

  const closeForgotPasswordHandler = useCallback(() => {
    // Clear any password-related errors when closing modal
    if (error && (error.includes('password') || error.includes('Current password is incorrect'))) {
      resetError();
    }
    setShowPasswordModal(false);
  }, []);

  const clearModalType = useCallback(() => {
    setModalType("");
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error && !error.includes('password') && !error.includes('Current password is incorrect')) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={resetError}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Don't return early if loading - let the loading state handle it
  if (!profile && !loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>No profile data available</p>
        <Button onClick={loadProfile} className="ml-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  // Guard clause: Don't render if profile is not loaded yet
  if (!profile) {
    return null;
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-green via-brand-teal to-brand-blue bg-clip-text text-transparent">
              Profile Settings
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your account information and preferences
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-brand-green hover:bg-brand-green/90 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Overview */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="h-full"
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 flex-1 flex flex-col">
              <div className="flex flex-col items-center text-center flex-shrink-0">
                <div className="relative">
                  <Avatar className="w-24 h-24 transition-all duration-300 ease-in-out">
                    <AvatarImage
                      src={avatarUrl}
                      alt={profile.firstName || 'User'}
                      className={`transition-opacity duration-300 ease-in-out ${uploadingAvatar || imageLoading ? 'opacity-50' : 'opacity-100'
                        }`}
                    />
                    <AvatarFallback className="bg-brand-green text-white text-xl transition-all duration-300 ease-in-out relative">
                      {(uploadingAvatar || imageLoading) && uploadProgress > 0 ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                          {/* Circular Progress Background */}
                          <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="45"
                              stroke="rgba(255,255,255,0.2)"
                              strokeWidth="4"
                              fill="none"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r="45"
                              stroke="white"
                              strokeWidth="4"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 45}`}
                              strokeDashoffset={`${2 * Math.PI * 45 * (1 - uploadProgress / 100)}`}
                              strokeLinecap="round"
                              className="transition-all duration-300 ease-in-out"
                            />
                          </svg>
                          {/* Percentage Text */}
                          <span className="text-xs font-bold z-10">
                            {uploadProgress}%
                          </span>
                        </div>
                      ) : uploadingAvatar ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        profile.firstName && profile.lastName
                          ? `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`
                          : profile.firstName
                            ? profile.firstName.charAt(0)
                            : profile.lastName
                              ? profile.lastName.charAt(0)
                              : profile.email?.charAt(0).toUpperCase() || 'U'
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 transition-all duration-200 ease-in-out"
                    onClick={handleAvatarUpload}
                    disabled={uploadingAvatar || imageLoading}
                  >
                    {(uploadingAvatar || imageLoading) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                <h3 className="text-xl font-semibold mt-4">
                  {profile.firstName || profile.lastName
                    ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
                    : profile.email?.split('@')[0] || 'User'
                  }
                </h3>
                <p className="text-muted-foreground">{profile.email || 'No email'}</p>
                {profile.role && (
                  <Badge
                    variant="secondary"
                    className="mt-2 bg-brand-green hover:bg-brand-green/90 text-white font-medium shadow-sm border-0"
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                  </Badge>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Joined</p>
                    <p className="text-sm text-muted-foreground">
                      {profile.joinDate ? new Date(profile.joinDate).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                      }) : 'Not available'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {profile.joinDate ? (
                        <>
                          {new Date(profile.joinDate).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                          })} • {formatRelativeTime(profile.joinDate)}
                        </>
                      ) : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Last Login</p>
                    <p className="text-sm text-muted-foreground">
                      {profile.lastLogin ? new Date(profile.lastLogin).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                      }) : 'Not available'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {profile.lastLogin ? (
                        <>
                          {new Date(profile.lastLogin).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                          })} • {formatRelativeTime(profile.lastLogin)}
                        </>
                      ) : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Time Zone</p>
                    <p className="text-sm text-muted-foreground">
                      {Intl.DateTimeFormat().resolvedOptions().timeZone}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`h-4 w-4 rounded-full ${profile.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-sm text-muted-foreground">
                      {profile.isActive ? 'Active' : 'Inactive'}
                      {profile.lastLogin && (
                        <span className="ml-1">
                          • Last seen {formatRelativeTime(profile.lastLogin)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Spacer to push content to top and make cards equal height */}
              <div className="flex-grow"></div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Profile Information */}
        <motion.div
          className="lg:col-span-2 h-full"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 flex-1 flex flex-col">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={localProfile.firstName}
                    onChange={(e) =>
                      setLocalProfile({ ...localProfile, firstName: e.target.value })
                    }
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={localProfile.lastName}
                    onChange={(e) =>
                      setLocalProfile({ ...localProfile, lastName: e.target.value })
                    }
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-10"
                    value={localProfile.email}
                    onChange={(e) =>
                      setLocalProfile({ ...localProfile, email: e.target.value })
                    }
                    placeholder="Enter email address"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Security Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h4 className="font-medium">Password</h4>
                <div className="space-y-2">
                  {profile.lastPasswordChange ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Last changed {profile.lastPasswordChange.timeAgo}
                      </p>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Changed by: {profile.lastPasswordChange.changedBy}</p>
                        <p>Date: {new Date(profile.lastPasswordChange.changedAt).toLocaleDateString()}</p>
                        <p>Reason: {profile.lastPasswordChange.reason}</p>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No password change history available
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={openForgotPasswordHandler}
                >
                  <Key className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Password Change Modal */}
      <PasswordChangeModal
        type={modalType}
        isOpen={showPasswordModal}
        onClose={closeForgotPasswordHandler}
        clearType={clearModalType}
      />
    </div>
  );
}
