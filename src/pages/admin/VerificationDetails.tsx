import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, User, Mail, Phone, History } from 'lucide-react';
import { useVerificationDetails, useApproveOrRejectVerification } from '@/api/hooks/useFaceVerification';
import { StatusBadge } from '@/components/admin/face-verification/StatusBadge';
import { ScoreIndicator } from '@/components/admin/face-verification/ScoreIndicator';
import { VideoPlayer } from '@/components/admin/face-verification/VideoPlayer';
import { ImageGallery } from '@/components/admin/face-verification/ImageGallery';
import { ApprovalModal } from '@/components/admin/face-verification/ApprovalModal';
import { ManualVerificationModal } from '@/components/admin/face-verification/ManualVerificationModal';
import { format } from 'date-fns';
import { ApprovalData, RetryAttempt } from '@/api/types';
import { cn } from '@/lib/utils';
import RetryPage from '@/components/common/RetryPage';
import PageHeader from '@/components/common/PageHeader';
import PageLoader from '@/components/common/PageLoader';

export default function VerificationDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const verificationId = id ? parseInt(id, 10) : 0;

  const { data: verificationData, isLoading, error, refetch } = useVerificationDetails(verificationId);
  const approveOrRejectMutation = useApproveOrRejectVerification();

  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedAttemptIndex, setSelectedAttemptIndex] = useState<number | null>(null);
  const [isManualVerificationModalOpen, setIsManualVerificationModalOpen] = useState(false);

  const verification = verificationData?.data;

  // Auto-select the latest attempt when verification data loads
  useEffect(() => {
    if (verification?.retryAttempts && verification.retryAttempts.length > 0) {
      // Select the last attempt (latest)
      setSelectedAttemptIndex(verification.retryAttempts.length - 1);
    } else {
      setSelectedAttemptIndex(null);
    }
  }, [verification]);

  // Get the currently selected attempt or use main verification data
  const currentAttempt: RetryAttempt | null =
    selectedAttemptIndex !== null && verification?.retryAttempts
      ? verification.retryAttempts[selectedAttemptIndex]
      : null;

  // Use current attempt data if available, otherwise use main verification
  const displayData = currentAttempt || verification;

  const handleApprove = useCallback(() => {
    setIsApprovalModalOpen(true);
  }, []);

  const handleReject = useCallback(() => {
    setIsApprovalModalOpen(true);
  }, []);

  const handleApproveSubmit = useCallback((data: ApprovalData) => {
    if (verification) {
      approveOrRejectMutation.mutate(
        { id: verification.id, data },
        {
          onSuccess: () => {
            setIsApprovalModalOpen(false);
          },
        }
      );
    }
  }, [verification, approveOrRejectMutation]);

  const handleRejectSubmit = useCallback((data: ApprovalData) => {
    if (verification) {
      approveOrRejectMutation.mutate(
        { id: verification.id, data: { ...data, isApproved: false } },
        {
          onSuccess: () => {
            setIsApprovalModalOpen(false);
          },
        }
      );
    }
  }, [verification, approveOrRejectMutation]);

  const handleCancel = () => {
    navigate('/admin/face-verifications');
  };

  const manualVerificationModal = useCallback(() => {
    setIsManualVerificationModalOpen(true);
  }, []);

  if (isLoading) {
    return (
      <PageLoader pagename="face verification" />
    );
  }

  if (error || !verification) {
    return (
      <RetryPage
        message="Failed to load verification details"
        btnName="Back to List"
        onRetry={handleCancel}
      />
    );
  }

  const user = verification?.user;
  const userInitials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`?.toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        page="flaggedusers"
        heading={`Verification Details #${verification?.id}`}
        subHeading={`Request ID: ${verification?.requestId}
        ${verification?.verificationGroupId ? ` | Group ID: ${verification?.verificationGroupId}` : ''}${verification?.retryCount > 1 ? ` | Retry Count: ${verification?.retryCount} attempts` : ''}`}
        isLoading={isLoading}
        fetchHandler={refetch}
        handleBack={handleCancel}
        verification={verification}
        manualVerificationModal={manualVerificationModal}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Retry Attempts Selector */}
        {verification.retryAttempts && verification.retryAttempts.length > 1 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Retry Attempts ({verification.retryAttempts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${verification.retryAttempts.length}, 1fr)` }}>
                {verification.retryAttempts.map((attempt, index) => (
                  <Button
                    key={attempt.id}
                    variant={selectedAttemptIndex === index ? 'default' : 'outline'}
                    className={cn(
                      'flex flex-col items-center gap-2 h-auto py-3',
                      selectedAttemptIndex === index && 'ring-2 ring-primary'
                    )}
                    onClick={() => setSelectedAttemptIndex(index)}
                  >
                    <span className="font-semibold">Attempt {attempt.attemptNumber}</span>
                    <StatusBadge status={attempt.status} />
                    <span className="text-xs text-muted-foreground">
                      {typeof attempt.overallScore === 'string'
                        ? parseFloat(attempt.overallScore).toFixed(1)
                        : attempt.overallScore.toFixed(1)}%
                    </span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Information */}
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.profilePic} alt={`${user.firstName} ${user.lastName}`} />
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {user.firstName} {user.lastName}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {user.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {user.phone}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.isFaceVerified ? 'default' : 'secondary'}>
                        {user.isFaceVerified ? 'Face Verified' : 'Not Verified'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/users/${(user as any).uuid || user.id}`)}
                      >
                        <User className="h-4 w-4 mr-2" />
                        View Profile
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Video Verification */}
            {displayData?.videoUrl && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Video Verification
                    {currentAttempt && (
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        (Attempt {currentAttempt.attemptNumber})
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <VideoPlayer videoUrl={displayData.videoUrl} />
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Duration:</span> {displayData.videoDuration || 0}s
                    </div>
                    <div>
                      <span className="font-medium">Frames Extracted:</span> {displayData.framesExtracted || 0}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Source Images */}
            {displayData?.sourceImages && displayData.sourceImages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Source Images ({displayData.sourceImageCount || displayData.sourceImages.length})
                    {currentAttempt && (
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        (Attempt {currentAttempt.attemptNumber})
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ImageGallery images={displayData.sourceImages} />
                </CardContent>
              </Card>
            )}

            {/* Processing Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Processing Timeline
                  {currentAttempt && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      (Attempt {currentAttempt.attemptNumber})
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Frame Extraction</span>
                    </div>
                    <span className="font-medium">
                      {displayData?.processingMetadata?.frameExtractionTime || 0}ms
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Face Comparison</span>
                    </div>
                    <span className="font-medium">
                      {displayData?.processingMetadata?.comparisonTime || 0}ms
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Scoring</span>
                    </div>
                    <span className="font-medium">
                      {displayData?.processingMetadata?.scoringTime || 0}ms
                    </span>
                  </div>
                  <div className="border-t pt-3 flex items-center justify-between">
                    <span className="font-semibold">Total Processing Time</span>
                    <span className="font-bold text-lg">
                      {displayData?.totalProcessingTime || 0}ms
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error Information for Current Attempt */}
            {currentAttempt?.errorMessage && (
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive">Error Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p><strong>Error:</strong> {currentAttempt.errorMessage}</p>
                    {currentAttempt.errorCode && (
                      <p><strong>Error Code:</strong> {currentAttempt.errorCode}</p>
                    )}
                    {currentAttempt.errorType && (
                      <p><strong>Error Type:</strong> {currentAttempt.errorType}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Status & Actions */}
          <div className="space-y-6">
            {/* Verification Status */}
            <Card>
              <CardHeader>
                <CardTitle>Verification Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentAttempt && (
                  <div className="mb-4 p-2 bg-muted rounded-md">
                    <p className="text-xs text-muted-foreground mb-1">Viewing Attempt</p>
                    <p className="text-sm font-semibold">Attempt {currentAttempt.attemptNumber}</p>
                  </div>
                )}
                <div>
                  <StatusBadge status={displayData?.status || verification.status} />
                </div>
                <ScoreIndicator
                  score={displayData?.overallScore || verification.overallScore}
                  label="Overall Score"
                  showValue={true}
                />
                <ScoreIndicator
                  score={displayData?.confidence || verification.confidence}
                  label="Confidence"
                  showValue={true}
                />
                <div className="pt-2 border-t">
                  <div className="text-sm text-muted-foreground">
                    Matches: <span className="font-semibold text-foreground">
                      {displayData?.matchCount || verification.matchCount}/{displayData?.totalComparisons || verification.totalComparisons}
                    </span>
                  </div>
                  {currentAttempt && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Is Verified: <Badge variant={currentAttempt.isVerified ? 'default' : 'secondary'} className="ml-1">
                        {currentAttempt.isVerified ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="pt-2 border-t space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Created:</span>{' '}
                    <span className="font-medium">
                      {format(new Date(displayData?.createdAt || verification.createdAt), 'PPp')}
                    </span>
                  </div>
                  {(displayData?.completedAt || verification.completedAt) && (
                    <div>
                      <span className="text-muted-foreground">Completed:</span>{' '}
                      <span className="font-medium">
                        {format(new Date(displayData?.completedAt || verification.completedAt!), 'PPp')}
                      </span>
                    </div>
                  )}
                  {currentAttempt?.requestId && (
                    <div>
                      <span className="text-muted-foreground">Request ID:</span>{' '}
                      <span className="font-medium text-xs">{currentAttempt.requestId}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Admin Actions */}
            {verification.verificationStatus === 'pending' && (
              <Card>
                <CardHeader>
                  <CardTitle>Admin Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={handleApprove}
                    disabled={approveOrRejectMutation.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve Verification
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleReject}
                    disabled={approveOrRejectMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Verification
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Security Metadata */}
            {verification.securityMetadata?.adminNotes && (
              <Card>
                <CardHeader>
                  <CardTitle>Admin Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{verification.securityMetadata.adminNotes}</p>
                  {verification.securityMetadata.adminActionAt && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(verification.securityMetadata.adminActionAt), 'PPp')}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Additional Info */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Provider:</span>{' '}
                  <span className="font-medium">{verification.provider}</span>
                </div>
                {verification.ipAddress && (
                  <div>
                    <span className="text-muted-foreground">IP Address:</span>{' '}
                    <span className="font-medium">{verification.ipAddress}</span>
                  </div>
                )}
                {verification.location && (
                  <div>
                    <span className="text-muted-foreground">Location:</span>{' '}
                    <span className="font-medium">{verification.location}</span>
                  </div>
                )}
                {verification.deviceId && (
                  <div>
                    <span className="text-muted-foreground">Device ID:</span>{' '}
                    <span className="font-medium">{verification.deviceId}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>

      {/* Approval Modal */}
      <ApprovalModal
        verification={verification}
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        onApprove={handleApproveSubmit}
        onReject={handleRejectSubmit}
        isLoading={approveOrRejectMutation.isPending}
      />

      {/* Manual Verification Modal */}
      <ManualVerificationModal
        userId={verification.userId}
        userName={`${verification.user.firstName} ${verification.user.lastName}`}
        userEmail={verification.user.email}
        currentStatus={verification.user.isFaceVerified}
        isAccountPaused={false} // TODO: Add isAccountPaused to user object if available
        isOpen={isManualVerificationModalOpen}
        onClose={() => setIsManualVerificationModalOpen(false)}
        onSuccess={() => {
          // Refetch verification details to get updated data
          refetch();
        }}
      />
    </div>
  );
}

