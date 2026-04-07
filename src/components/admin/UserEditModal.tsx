import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
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
import { Loader2, X } from "lucide-react";
import { UserDetails, UpdateUserRequest } from "@/api/types";

interface UserEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserDetails | null;
    onSave: (id: number, data: UpdateUserRequest) => void;
    isLoading?: boolean;
}

export function UserEditModal({
    isOpen,
    onClose,
    user,
    onSave,
    isLoading = false,
}: UserEditModalProps) {
    const [formData, setFormData] = useState<UpdateUserRequest>({});

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
                accountCurrentStatus: user.accountCurrentStatus,
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
            const cleanedData: UpdateUserRequest = {};
            Object.entries(formData).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    cleanedData[key as keyof UpdateUserRequest] = value;
                }
            });
            onSave(user.id, cleanedData);
        }
    };

    if (!user) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl font-semibold">
                            Edit User: {user.firstName} {user.lastName}
                        </DialogTitle>
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h4 className="font-semibold">Basic Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                    id="firstName"
                                    value={formData.firstName || ''}
                                    onChange={(e) => handleChange('firstName', e.target.value)}
                                    placeholder="Enter first name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    value={formData.lastName || ''}
                                    onChange={(e) => handleChange('lastName', e.target.value)}
                                    placeholder="Enter last name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email || ''}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    placeholder="Enter email"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone || ''}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    placeholder="Enter phone number"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="countryCode">Country Code</Label>
                                <Input
                                    id="countryCode"
                                    value={formData.countryCode || ''}
                                    onChange={(e) => handleChange('countryCode', e.target.value)}
                                    placeholder="+1"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dob">Date of Birth</Label>
                                <Input
                                    id="dob"
                                    type="date"
                                    value={formData.dob || ''}
                                    onChange={(e) => handleChange('dob', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gender">Gender</Label>
                                <Select
                                    value={formData.gender || "all"}
                                    onValueChange={(value) => handleChange('gender', value === "all" ? undefined : value as 'm' | 'f' | 'o')}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Select Gender</SelectItem>
                                        <SelectItem value="m">Male</SelectItem>
                                        <SelectItem value="f">Female</SelectItem>
                                        <SelectItem value="o">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Verification Status */}
                    {/* Verification Status removed from Admin UI */}

                    {/* Account Status */}
                    <div className="space-y-4">
                        <h4 className="font-semibold">Account Status</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <Label htmlFor="isAccountPaused">Account Paused</Label>
                                <Switch
                                    id="isAccountPaused"
                                    checked={formData.isAccountPaused || false}
                                    onCheckedChange={(checked) => handleChange('isAccountPaused', checked)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="accountCurrentStatus">Account Status (0-5)</Label>
                                <Input
                                    id="accountCurrentStatus"
                                    type="number"
                                    min="0"
                                    max="5"
                                    value={formData.accountCurrentStatus ?? ''}
                                    onChange={(e) => handleChange('accountCurrentStatus', e.target.value ? parseInt(e.target.value) : undefined)}
                                    placeholder="0-5"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

