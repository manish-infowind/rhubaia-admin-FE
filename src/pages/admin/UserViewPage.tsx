import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
    User,
    Mail,
    Smartphone,
    MapPin,
    Calendar,
    Shield,
    Star,
    ArrowLeft,
    Edit,
    GraduationCap,
    Target,
    Mic,
    FileText,
} from "lucide-react";
import { useUserManagement } from "@/api/hooks/useUserManagement";
import PageLoader from "@/components/common/PageLoader";
import RetryPage from "@/components/common/RetryPage";

// Helper function to format gender
const formatGender = (gender: 'm' | 'f' | 'o'): string => {
    const genderMap = {
        'm': 'Male',
        'f': 'Female',
        'o': 'Other'
    };
    return genderMap[gender] || gender;
};

// Helper function to get account status name and description
const getAccountStatusInfo = (status: number): { name: string; description: string } => {
    const statusMap: Record<number, { name: string; description: string }> = {
        0: { name: 'MOBILE_VERIFICATION_PENDING', description: 'Mobile verification pending - New signup, OTP not verified' },
        1: { name: 'MOBILE_VERIFIED', description: 'Mobile verified - Phone verified, ready for profile completion' },
        2: { name: 'BASIC_INFO_COLLECTED', description: 'Basic info collected - Basic info submitted, email not verified' },
        3: { name: 'EMAIL_VERIFIED', description: 'Email verified - Email verified, ready for face verification' },
        4: { name: 'FACE_VERIFIED', description: 'Face verified - Face verified, account almost complete' },
        5: { name: 'COMPLETED', description: 'Completed - All verifications done; user is active' },
    };
    return statusMap[status] || { name: `STATUS_${status}`, description: `Account status: ${status}` };
};

const getStatusBadgeVariant = (status: number, isPaused: boolean, isDeleted: boolean) => {
    if (isDeleted) return 'destructive';
    if (isPaused) return 'secondary';
    if (status === 5) return 'default';
    if (status >= 3) return 'secondary';
    return 'outline';
};

const formatDateTime = (value?: string | null): string => {
    if (!value) return 'N/A';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'N/A';
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    return `${day}/${month}/${year}`;
};

const UserViewPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const userId = id || '';

    const { data: userResponse, isLoading, error } = useUserManagement().useUserDetails(userId);

    const backToUserHandler = () => {
        navigate('/admin/users');
    };

    // Extract user data from API response
    const user = userResponse?.data;
    const connectionHistory = user?.connectionHistory;
    const hasConnectionHistory = Boolean(
        connectionHistory &&
        (
            connectionHistory.summary.sharedClosetWithUserByOthers > 0 ||
            connectionHistory.summary.sharedClosetByUserWithOthers > 0 ||
            connectionHistory.summary.delegatedToUserByOthers > 0 ||
            connectionHistory.summary.delegatedByUserToOthers > 0
        )
    );
    const hasProfileData = Boolean(
        user?.profile &&
        (
            user.profile.height ||
            user.profile.education ||
            user.profile.relationshipGoal ||
            user.profile.voiceUrl ||
            user.profile.bio
        )
    );

    if (isLoading) {
        return (
            <PageLoader pagename="user" />
        );
    };

    if (error || !user) {
        return (
            <RetryPage
                message="Failed to load user details"
                btnName="Back to Users"
                onRetry={backToUserHandler}
            />
        );
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/admin/users')}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <h1 className="text-2xl font-semibold flex items-center gap-2">
                        <User className="h-6 w-6" />
                        User Details
                    </h1>
                </div>
                <Button
                    variant="outline"
                    onClick={() => navigate(`/admin/users/${userId}/edit`)}
                >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                </Button>
            </div>

            <div className="space-y-6">
                {/* User Header */}
                <div className="flex items-center gap-4 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="w-24 h-24 bg-brand-green/20 rounded-full flex items-center justify-center overflow-hidden">
                        {user.profilePic ? (
                            <img
                                src={user.profilePic}
                                alt={`${user.firstName} ${user.lastName}`}
                                className="w-full h-full object-cover object-top"
                            />
                        ) : (
                            <User className="h-12 w-12 text-brand-green" />
                        )}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-2xl font-semibold">
                            {user.firstName || 'N/A'} {user.lastName || ''}
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-2">
                            <Mail className="h-4 w-4" />
                            {user.email || 'No email'}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Smartphone className="h-4 w-4" />
                            {user.countryCode} {user.phone}
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Badge
                            variant={getStatusBadgeVariant(
                                user.accountCurrentStatus,
                                user.isAccountPaused,
                                user.isDeleted
                            )}
                            className="text-sm"
                        >
                            {user.accountStatusName || getAccountStatusInfo(user.accountCurrentStatus).name}
                        </Badge>
                        <Badge variant={user.isAccountPaused ? 'destructive' : 'default'}>
                            {user.isAccountPaused ? 'Paused' : 'Active'}
                        </Badge>
                        {user.isPausedByUser && (
                            <Badge variant="outline" className="text-xs">
                                Paused by User
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Basic Information */}
                <div className="space-y-4 p-6 border rounded-lg">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Basic Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">UUID</p>
                            <p className="font-medium break-all">{user.uuid}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Gender</p>
                            <p className="font-medium">{formatGender(user.gender)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Date of Birth
                            </p>
                            <p className="font-medium">
                                {user.dob ? new Date(user.dob).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Account Status</p>
                            <p className="font-medium">
                                {user.accountStatusDescription || getAccountStatusInfo(user.accountCurrentStatus).description}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Email Verified</p>
                            <Badge variant={user.isEmailVerified ? 'default' : 'secondary'}>
                                {user.isEmailVerified ? 'Yes' : 'No'}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Phone Verified</p>
                            <Badge variant={user.isPhoneVerified ? 'default' : 'secondary'}>
                                {user.isPhoneVerified ? 'Yes' : 'No'}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Created At</p>
                            <p className="font-medium">
                                {formatDateTime(user.createdAt)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Paused By User</p>
                            <Badge variant={user.isPausedByUser ? 'destructive' : 'secondary'}>
                                {user.isPausedByUser ? 'Yes' : 'No'}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Deleted</p>
                            <Badge variant={user.isDeleted ? 'destructive' : 'secondary'}>
                                {user.isDeleted ? 'Yes' : 'No'}
                            </Badge>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Profile and Address sections */}
                <div className="space-y-4">
                        {/* Profile Information */}
                        {hasProfileData && (
                            <div className="space-y-4 p-6 border rounded-lg">
                                <h4 className="font-semibold text-lg flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Profile Information
                                </h4>
                                {user.profileImages && user.profileImages.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">Profile Images</p>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {user.profileImages.map((imageUrl, index) => (
                                                <div
                                                    key={`${imageUrl}-${index}`}
                                                    className="rounded-md overflow-hidden border bg-muted/20"
                                                >
                                                    <img
                                                        src={imageUrl}
                                                        alt={`Profile image ${index + 1}`}
                                                        className="w-full h-36 object-cover object-top"
                                                        loading="lazy"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {user.profile.height && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Height</p>
                                            <p className="font-medium">{user.profile.height} cm</p>
                                        </div>
                                    )}
                                    {user.profile.education && (
                                        <div>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                <GraduationCap className="h-3 w-3" />
                                                Education
                                            </p>
                                            <p className="font-medium">{user.profile.education}</p>
                                        </div>
                                    )}
                                    {user.profile.relationshipGoal && (
                                        <div>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Target className="h-3 w-3" />
                                                Relationship Goal
                                            </p>
                                            <p className="font-medium">{user.profile.relationshipGoal}</p>
                                        </div>
                                    )}
                                    {user.profile.voiceUrl && (
                                        <div>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Mic className="h-3 w-3" />
                                                Voice Recording
                                            </p>
                                            <audio controls className="w-full mt-1">
                                                <source src={user.profile.voiceUrl} type="audio/mpeg" />
                                            </audio>
                                        </div>
                                    )}
                                    {user.profile.bio && (
                                        <div className="md:col-span-2">
                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                <FileText className="h-3 w-3" />
                                                Bio
                                            </p>
                                            <p className="font-medium mt-1">{user.profile.bio}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Address Information */}
                        {user.address && (
                            <div className="space-y-4 p-6 border rounded-lg">
                                <h4 className="font-semibold text-lg flex items-center gap-2">
                                    <MapPin className="h-5 w-5" />
                                    Address Information
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {user.address.cityName && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">City</p>
                                            <p className="font-medium">{user.address.cityName}</p>
                                        </div>
                                    )}
                                    {user.address.location && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Location</p>
                                            <p className="font-medium">{user.address.location}</p>
                                        </div>
                                    )}
                                    {user.address.lat && user.address.long && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Coordinates</p>
                                            <p className="font-medium">
                                                {String(user.address.lat)}, {String(user.address.long)}
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm text-muted-foreground">Verified</p>
                                        <Badge variant={user.address.isVerified ? 'default' : 'secondary'}>
                                            {user.address.isVerified ? 'Yes' : 'No'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        )}
                </div>

                <Separator />

                {/* First Plan / Primary Plan */}
                {user.firstPlan && (
                    <div className="space-y-4 p-6 border rounded-lg">
                        <h4 className="font-semibold text-lg flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Primary Plan
                        </h4>
                        <div className="p-4 border-2 border-primary rounded-lg space-y-2 bg-primary/5">
                            <div className="flex items-center justify-between">
                                <p className="font-semibold text-lg">{user.firstPlan.planName}</p>
                                <Badge variant={user.firstPlan.status === 'active' ? 'default' : 'secondary'}>
                                    {user.firstPlan.status}
                                </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Price</p>
                                    <p className="font-medium">${user.firstPlan.planPrice}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Duration</p>
                                    <p className="font-medium">{user.firstPlan.planDuration}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Start Date</p>
                                    <p className="font-medium">
                                        {new Date(user.firstPlan.startDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">End Date</p>
                                    <p className="font-medium">
                                        {new Date(user.firstPlan.endDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Auto Renew</p>
                                    <Badge variant={user.firstPlan.autoRenew ? 'default' : 'secondary'}>
                                        {user.firstPlan.autoRenew ? 'Yes' : 'No'}
                                    </Badge>
                                </div>
                            </div>
                            {user.firstPlan.planFeatures && user.firstPlan.planFeatures.length > 0 && (
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">Features</p>
                                    <div className="flex flex-wrap gap-1">
                                        {user.firstPlan.planFeatures.map((feature, idx) => {
                                            const featureObj = typeof feature === 'string'
                                                ? { label: feature, limit: undefined, period: undefined }
                                                : (feature as any);

                                            const featureLabel = featureObj.label || 'Unknown Feature';
                                            let featureText = featureLabel;

                                            if (featureObj.limit !== undefined && featureObj.limit !== null) {
                                                if (featureObj.limit === -1) {
                                                    featureText += ' (Unlimited)';
                                                } else if (featureObj.limit > 0) {
                                                    featureText += ` (${featureObj.limit}`;
                                                    if (featureObj.period) {
                                                        featureText += `/${featureObj.period}`;
                                                    }
                                                    featureText += ')';
                                                }
                                            }

                                            return (
                                                <Badge
                                                    key={idx}
                                                    variant={featureObj.accessible === false ? 'secondary' : 'outline'}
                                                    className="text-xs"
                                                >
                                                    {featureText}
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <Separator />

                {/* Subscriptions */}
                {user.subscriptions && user.subscriptions.length > 0 && (
                    <div className="space-y-4 p-6 border rounded-lg">
                        <h4 className="font-semibold text-lg flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            All Subscriptions ({user.subscriptions.length})
                        </h4>
                        <div className="space-y-3">
                            {user.subscriptions.map((subscription) => (
                                <div
                                    key={subscription.id}
                                    className="p-4 border rounded-lg space-y-2"
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold">{subscription.planName}</p>
                                        <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                                            {subscription.status}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Price</p>
                                            <p className="font-medium">${subscription.planPrice}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Duration</p>
                                            <p className="font-medium">{subscription.planDuration}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Start Date</p>
                                            <p className="font-medium">
                                                {new Date(subscription.startDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">End Date</p>
                                            <p className="font-medium">
                                                {new Date(subscription.endDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Auto Renew</p>
                                            <Badge variant={subscription.autoRenew ? 'default' : 'secondary'}>
                                                {subscription.autoRenew ? 'Yes' : 'No'}
                                            </Badge>
                                        </div>
                                    </div>
                                    {subscription.planFeatures && subscription.planFeatures.length > 0 && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Features</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {subscription.planFeatures.map((feature, idx) => {
                                                    const featureObj = typeof feature === 'string'
                                                        ? { label: feature, limit: undefined, period: undefined }
                                                        : (feature as any);

                                                    const featureLabel = featureObj.label || 'Unknown Feature';
                                                    let featureText = featureLabel;

                                                    if (featureObj.limit !== undefined && featureObj.limit !== null) {
                                                        if (featureObj.limit === -1) {
                                                            featureText += ' (Unlimited)';
                                                        } else if (featureObj.limit > 0) {
                                                            featureText += ` (${featureObj.limit}`;
                                                            if (featureObj.period) {
                                                                featureText += `/${featureObj.period}`;
                                                            }
                                                            featureText += ')';
                                                        }
                                                    }

                                                    return (
                                                        <Badge
                                                            key={idx}
                                                            variant={featureObj.accessible === false ? 'secondary' : 'outline'}
                                                            className="text-xs"
                                                        >
                                                            {featureText}
                                                        </Badge>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <Separator />

                {/* Connection History */}
                {hasConnectionHistory && connectionHistory && (
                    <div className="space-y-4 p-6 border rounded-lg">
                        <h4 className="font-semibold text-lg flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Connection History
                        </h4>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="p-3 rounded-md bg-muted/40">
                                <p className="text-muted-foreground">Shared with user</p>
                                <p className="text-lg font-semibold">{connectionHistory.summary.sharedClosetWithUserByOthers}</p>
                            </div>
                            <div className="p-3 rounded-md bg-muted/40">
                                <p className="text-muted-foreground">Shared by user</p>
                                <p className="text-lg font-semibold">{connectionHistory.summary.sharedClosetByUserWithOthers}</p>
                            </div>
                            <div className="p-3 rounded-md bg-muted/40">
                                <p className="text-muted-foreground">Delegated to user</p>
                                <p className="text-lg font-semibold">{connectionHistory.summary.delegatedToUserByOthers}</p>
                            </div>
                            <div className="p-3 rounded-md bg-muted/40">
                                <p className="text-muted-foreground">Delegated by user</p>
                                <p className="text-lg font-semibold">{connectionHistory.summary.delegatedByUserToOthers}</p>
                            </div>
                        </div>

                        <Accordion type="multiple" className="w-full">
                            <AccordionItem value="shared-with-user">
                                <AccordionTrigger>
                                    Shared closet with user by others ({connectionHistory.sharedClosetWithUserByOthers.length})
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-2">
                                        {connectionHistory.sharedClosetWithUserByOthers.map((item) => (
                                            <div key={item.connectionUuid} className="p-3 border rounded-md flex gap-3">
                                                <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
                                                    {item.connectedUser.avatarUrl ? (
                                                        <img src={item.connectedUser.avatarUrl} alt={item.connectedUser.fullName || 'User'} className="w-full h-full object-cover object-top" loading="lazy" />
                                                    ) : (
                                                        <User className="h-5 w-5 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{item.connectedUser.fullName || item.connectedUser.username || 'Unknown User'}</p>
                                                    <p className="text-sm text-muted-foreground">{item.connectedUser.email || 'No email'}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Scope: {item.shareScope || 'N/A'} | Access: {item.accessType || 'N/A'} | Status: {item.invitationStatus || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="shared-by-user">
                                <AccordionTrigger>
                                    Shared closet by user with others ({connectionHistory.sharedClosetByUserWithOthers.length})
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-2">
                                        {connectionHistory.sharedClosetByUserWithOthers.map((item) => (
                                            <div key={item.connectionUuid} className="p-3 border rounded-md flex gap-3">
                                                <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
                                                    {item.connectedUser.avatarUrl ? (
                                                        <img src={item.connectedUser.avatarUrl} alt={item.connectedUser.fullName || 'User'} className="w-full h-full object-cover object-top" loading="lazy" />
                                                    ) : (
                                                        <User className="h-5 w-5 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{item.connectedUser.fullName || item.connectedUser.username || 'Unknown User'}</p>
                                                    <p className="text-sm text-muted-foreground">{item.connectedUser.email || 'No email'}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Scope: {item.shareScope || 'N/A'} | Access: {item.accessType || 'N/A'} | Status: {item.invitationStatus || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="delegated-to-user">
                                <AccordionTrigger>
                                    Delegated to user by others ({connectionHistory.delegatedToUserByOthers.length})
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-2">
                                        {connectionHistory.delegatedToUserByOthers.map((item) => (
                                            <div key={item.connectionUuid} className="p-3 border rounded-md flex gap-3">
                                                <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
                                                    {item.connectedUser.avatarUrl ? (
                                                        <img src={item.connectedUser.avatarUrl} alt={item.connectedUser.fullName || 'User'} className="w-full h-full object-cover object-top" loading="lazy" />
                                                    ) : (
                                                        <User className="h-5 w-5 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{item.connectedUser.fullName || item.connectedUser.username || 'Unknown User'}</p>
                                                    <p className="text-sm text-muted-foreground">{item.connectedUser.email || 'No email'}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Status: {item.status || 'N/A'} | Revoked: {item.isRevoked ? 'Yes' : 'No'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="delegated-by-user">
                                <AccordionTrigger>
                                    Delegated by user to others ({connectionHistory.delegatedByUserToOthers.length})
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-2">
                                        {connectionHistory.delegatedByUserToOthers.map((item) => (
                                            <div key={item.connectionUuid} className="p-3 border rounded-md flex gap-3">
                                                <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
                                                    {item.connectedUser.avatarUrl ? (
                                                        <img src={item.connectedUser.avatarUrl} alt={item.connectedUser.fullName || 'User'} className="w-full h-full object-cover object-top" loading="lazy" />
                                                    ) : (
                                                        <User className="h-5 w-5 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{item.connectedUser.fullName || item.connectedUser.username || 'Unknown User'}</p>
                                                    <p className="text-sm text-muted-foreground">{item.connectedUser.email || 'No email'}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Status: {item.status || 'N/A'} | Revoked: {item.isRevoked ? 'Yes' : 'No'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserViewPage;

