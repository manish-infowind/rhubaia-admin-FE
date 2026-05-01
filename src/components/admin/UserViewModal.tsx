import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserManagement } from "@/api/hooks/useUserManagement";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import {
    User,
    Mail,
    Smartphone,
    MapPin,
    Calendar,
    Shield,
    Heart,
    Star,
    X,
    Edit,
    Image as ImageIcon,
    GraduationCap,
    Target,
    Mic,
    FileText,
    Loader2,
    Lock,
} from "lucide-react";
import { UserDetails } from "@/api/types";

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

interface UserViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEdit: (user: UserDetails) => void;
    user: UserDetails | null;
    isLoading?: boolean;
}

export function UserViewModal({
    isOpen,
    onClose,
    onEdit,
    user,
    isLoading = false,
}: UserViewModalProps) {
    if (!user) return null;

    const { sendPasswordResetEmail, isSendingPasswordResetEmail } = useUserManagement();

    const getStatusBadgeVariant = (status: number, isPaused: boolean, isDeleted: boolean) => {
        if (isDeleted) return 'destructive';
        if (isPaused) return 'secondary';
        if (status === 5) return 'default';
        if (status >= 3) return 'secondary';
        return 'outline';
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                            <User className="h-5 w-5" />
                            User Details
                        </DialogTitle>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => sendPasswordResetEmail({ id: user.uuid, email: user.email })}
                                disabled={!user.email || isSendingPasswordResetEmail}
                                title="Sends a reset link to the user’s email. Admin cannot view or set the password."
                            >
                                {isSendingPasswordResetEmail ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Lock className="h-4 w-4 mr-2" />
                                        Send reset email
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    onEdit(user);
                                    onClose();
                                }}
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                            <Button variant="ghost" size="sm" onClick={onClose}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Loading user details...</p>
                        </div>
                    </div>
                ) : (
                    <ScrollArea className="flex-1 pr-4">
                        <div className="space-y-6">
                            {/* User Header */}
                            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                <div className="w-20 h-20 bg-brand-green/20 rounded-full flex items-center justify-center overflow-hidden">
                                    {user.profilePic ? (
                                        <img
                                            src={user.profilePic}
                                            alt={`${user.firstName} ${user.lastName}`}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User className="h-10 w-10 text-brand-green" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold">
                                        {user.firstName || 'N/A'} {user.lastName || ''}
                                    </h3>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                        <Mail className="h-3 w-3" />
                                        {user.email || 'No email'}
                                    </p>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                        <Smartphone className="h-3 w-3" />
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
                                    >
                                        {user.accountStatusName || getAccountStatusInfo(user.accountCurrentStatus).name}
                                    </Badge>
                                    <Badge variant={user.isAccountPaused ? 'destructive' : 'default'}>
                                        {user.isAccountPaused ? 'Paused' : 'Active'}
                                    </Badge>
                                </div>
                            </div>

                            {/* Basic Information */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-lg flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    Basic Information
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">UUID</p>
                                        <p className="font-medium">{user.uuid}</p>
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
                                        <p className="text-sm text-muted-foreground">Face Verified</p>
                                        <Badge variant={user.isFaceVerified ? 'default' : 'secondary'}>
                                            {user.isFaceVerified ? 'Yes' : 'No'}
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Created At</p>
                                        <p className="font-medium">
                                            {new Date(user.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Profile Information */}
                            {user.profile && (
                                <>
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-lg flex items-center gap-2">
                                            <User className="h-5 w-5" />
                                            Profile Information
                                        </h4>
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
                                    <Separator />
                                </>
                            )}

                            {/* Address Information */}
                            {user.address && (
                                <>
                                    <div className="space-y-4">
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
                                    <Separator />
                                </>
                            )}

                            {/* Interactions */}
                            {user.interactions && (
                                <>
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-lg flex items-center gap-2">
                                            <Heart className="h-5 w-5" />
                                            Interactions
                                        </h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                                <p className="text-sm text-muted-foreground">Received Likes</p>
                                                <p className="text-2xl font-bold">{user.interactions.receivedLikes}</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                                <p className="text-sm text-muted-foreground">Given Likes</p>
                                                <p className="text-2xl font-bold">{user.interactions.givenLikes}</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                    <Star className="h-3 w-3" />
                                                    Received Super Likes
                                                </p>
                                                <p className="text-2xl font-bold">{user.interactions.receivedSuperLikes}</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                    <Star className="h-3 w-3" />
                                                    Given Super Likes
                                                </p>
                                                <p className="text-2xl font-bold">{user.interactions.givenSuperLikes}</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                                <p className="text-sm text-muted-foreground">Passes</p>
                                                <p className="text-2xl font-bold">{user.interactions.passes}</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                                <p className="text-sm text-muted-foreground">Blocks</p>
                                                <p className="text-2xl font-bold">{user.interactions.blocks}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <Separator />
                                </>
                            )}

                            {/* Profile Images Carousel */}
                            {user.profileImages && user.profileImages.length > 0 && (
                                <>
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-lg flex items-center gap-2">
                                            <ImageIcon className="h-5 w-5" />
                                            Profile Images ({user.profileImages.length})
                                        </h4>
                                        <div className="relative w-full">
                                            <Carousel className="w-full max-w-2xl mx-auto">
                                                <CarouselContent className="-ml-2 md:-ml-4">
                                                    {user.profileImages.map((image, index) => (
                                                        <CarouselItem key={index} className="pl-2 md:pl-4">
                                                            <div className="relative aspect-square rounded-lg overflow-hidden border bg-gray-100 dark:bg-gray-800">
                                                                <img
                                                                    src={image}
                                                                    alt={`Profile ${index + 1}`}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=Image+Not+Found';
                                                                    }}
                                                                />
                                                                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                                                    {index + 1} / {user.profileImages.length}
                                                                </div>
                                                            </div>
                                                        </CarouselItem>
                                                    ))}
                                                </CarouselContent>
                                                {user.profileImages.length > 1 && (
                                                    <>
                                                        <CarouselPrevious className="left-0" />
                                                        <CarouselNext className="right-0" />
                                                    </>
                                                )}
                                            </Carousel>
                                        </div>
                                    </div>
                                    <Separator />
                                </>
                            )}

                            {/* First Plan / Primary Plan */}
                            {user.firstPlan && (
                                <>
                                    <div className="space-y-4">
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
                                    <Separator />
                                </>
                            )}

                            {/* Subscriptions */}
                            {user.subscriptions && user.subscriptions.length > 0 && (
                                <div className="space-y-4">
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
                                                                // Handle both string and object formats
                                                                const featureObj = typeof feature === 'string' 
                                                                    ? { label: feature, limit: undefined, period: undefined }
                                                                    : (feature as any);
                                                                
                                                                const featureLabel = featureObj.label || 'Unknown Feature';
                                                                let featureText = featureLabel;
                                                                
                                                                // Add limit and period if available
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
                        </div>
                    </ScrollArea>
                )}
            </DialogContent>
        </Dialog>
    );
}

