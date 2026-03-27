import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import { useUserManagement } from "@/api/hooks/useUserManagement";
import { UpdateUserRequest } from "@/api/types";
import RetryPage from "@/components/common/RetryPage";
import PageLoader from "@/components/common/PageLoader";

const UserEditPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const userId = id || '';

    const { useUserDetails, updateUser, isUpdating } = useUserManagement();
    const { data: userResponse, isLoading: isLoadingUser } = useUserDetails(userId);

    // Extract user data from API response
    const user = userResponse?.data;

    const [formData, setFormData] = useState<UpdateUserRequest>({});

    const isSaving = isUpdating;

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || undefined,
                lastName: user.lastName || undefined,
                email: user.email || undefined,
                phone: user.phone || undefined,
                countryCode: user.countryCode || undefined,
                dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : undefined,
                gender: user.gender || undefined,
                isEmailVerified: user.isEmailVerified,
                isPhoneVerified: user.isPhoneVerified,
                isFaceVerified: user.isFaceVerified,
                isAccountPaused: user.isAccountPaused,
                // accountCurrentStatus: user.accountCurrentStatus,
            });
        }
    }, [user]);

    const handleChange = (field: keyof UpdateUserRequest, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (user) {
            // Clean up undefined values
            const cleanedData: Partial<UpdateUserRequest> = {};
            (Object.keys(formData) as Array<keyof UpdateUserRequest>).forEach((key) => {
                const value = formData[key];
                if (value !== undefined && value !== null && value !== '') {
                    (cleanedData as Record<string, any>)[key] = value;
                }
            });

            updateUser(
                { id: userId, data: cleanedData },
                {
                    onSuccess: (response) => {
                        if (response?.success) {
                            navigate('/admin/users');
                        }
                    },
                    onError: (error: any) => {
                        // Error toast is already handled by the hook
                        console.error('Update error:', error);
                    },
                }
            );
        }
    };

    const handleCancel = () => {
        navigate('/admin/users');
    };

    if (isLoadingUser) {
        return (
            <PageLoader pagename="user" />
        );
    }

    if (!user) {
        return (
            <RetryPage
                message="Failed to load user details"
                btnName="Back to Users"
                onRetry={handleCancel}
            />
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                        disabled={isSaving}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <h1 className="text-2xl font-semibold">
                        Edit User: {user.firstName} {user.lastName}
                    </h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4 p-6 border rounded-lg">
                    <h4 className="font-semibold text-lg mb-4">Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                                id="firstName"
                                value={formData.firstName || ''}
                                onChange={(e) => handleChange('firstName', e.target.value)}
                                placeholder="First Name"
                                disabled={isSaving}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                                id="lastName"
                                value={formData.lastName || ''}
                                onChange={(e) => handleChange('lastName', e.target.value)}
                                placeholder="Last Name"
                                disabled={isSaving}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email || ''}
                                onChange={(e) => handleChange('email', e.target.value)}
                                placeholder="Email"
                                disabled={isSaving}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                value={formData.phone || ''}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                placeholder="Phone"
                                disabled={isSaving}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="countryCode">Country Code</Label>
                            <Input
                                id="countryCode"
                                value={formData.countryCode || ''}
                                onChange={(e) => handleChange('countryCode', e.target.value)}
                                placeholder="+1"
                                disabled={isSaving}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dob">Date of Birth</Label>
                            <Input
                                id="dob"
                                type="date"
                                value={formData.dob || ''}
                                onChange={(e) => handleChange('dob', e.target.value)}
                                disabled={isSaving}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gender">Gender</Label>
                            <Select
                                value={formData.gender || ''}
                                onValueChange={(value) => handleChange('gender', value)}
                                disabled={isSaving}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="m">Male</SelectItem>
                                    <SelectItem value="f">Female</SelectItem>
                                    <SelectItem value="o">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {/* <div className="space-y-2">
                            <Label htmlFor="accountCurrentStatus">Account Status</Label>
                            <Select
                                value={formData.accountCurrentStatus?.toString() || ''}
                                onValueChange={(value) => handleChange('accountCurrentStatus', parseInt(value, 10))}
                                disabled={isSaving}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Mobile Verification Pending</SelectItem>
                                    <SelectItem value="1">Mobile Verified</SelectItem>
                                    <SelectItem value="2">Basic Info Collected</SelectItem>
                                    <SelectItem value="3">Email Verified</SelectItem>
                                    <SelectItem value="4">Face Verified</SelectItem>
                                    <SelectItem value="5">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div> */}
                    </div>
                </div>

                {/* Verification Status */}
                <div className="space-y-4 p-6 border rounded-lg">
                    <h4 className="font-semibold text-lg mb-4">Verification Status</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="isEmailVerified">Email Verified</Label>
                            <Switch
                                id="isEmailVerified"
                                checked={formData.isEmailVerified || false}
                                onCheckedChange={(checked) => handleChange('isEmailVerified', checked)}
                                disabled={isSaving}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="isPhoneVerified">Phone Verified</Label>
                            <Switch
                                id="isPhoneVerified"
                                checked={formData.isPhoneVerified || false}
                                onCheckedChange={(checked) => handleChange('isPhoneVerified', checked)}
                                disabled={isSaving}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="isFaceVerified">Face Verified</Label>
                            <Switch
                                id="isFaceVerified"
                                checked={formData.isFaceVerified || false}
                                onCheckedChange={(checked) => handleChange('isFaceVerified', checked)}
                                disabled={isSaving}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="isAccountPaused">Account Paused</Label>
                            <Switch
                                id="isAccountPaused"
                                checked={formData.isAccountPaused || false}
                                onCheckedChange={(checked) => handleChange('isAccountPaused', checked)}
                                disabled={isSaving}
                            />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-4 p-6 border rounded-lg bg-gray-50 dark:bg-gray-900">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSaving}
                    >
                        {isSaving ? (
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
            </form>
        </div>
    );
};

export default UserEditPage;

