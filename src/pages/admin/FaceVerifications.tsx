import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Eye, CheckCircle2, XCircle, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFaceVerifications, useApproveOrRejectVerification } from '@/api/hooks/useFaceVerification';
import { ComputedStatus, FaceVerification, ApprovalData } from '@/api/types';
import { FilterBar } from '@/components/admin/face-verification/FilterBar';
import { StatusBadge } from '@/components/admin/face-verification/StatusBadge';
import { ScoreIndicator } from '@/components/admin/face-verification/ScoreIndicator';
import { ApprovalModal } from '@/components/admin/face-verification/ApprovalModal';
import { RetryHistoryModal } from '@/components/admin/face-verification/RetryHistoryModal';
import PaginationControls from '@/components/ui/paginationComp';
import { useVerificationStatistics } from '@/api/hooks/useFaceVerification';
import { format } from 'date-fns';
import PageHeader from '@/components/common/PageHeader';
import PageLoader from '@/components/common/PageLoader';
import RetryPage from '@/components/common/RetryPage';

export default function FaceVerifications() {
  const navigate = useNavigate();

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ComputedStatus | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minScore, setMinScore] = useState('');
  const [maxScore, setMaxScore] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Build query params
  const queryParams = useMemo(() => {
    const params: any = {
      page: currentPage,
      limit: pageSize,
    };

    if (search.trim()) params.search = search.trim();
    if (status) params.status = status;
    if (startDate) params.startDate = new Date(startDate).toISOString();
    if (endDate) params.endDate = new Date(endDate).toISOString();
    if (minScore) params.minScore = parseFloat(minScore);
    if (maxScore) params.maxScore = parseFloat(maxScore);

    return params;
  }, [search, status, startDate, endDate, minScore, maxScore, currentPage, pageSize]);

  const { verifications, pagination, isLoading, error, refetch } = useFaceVerifications(queryParams);
  const { statistics } = useVerificationStatistics();
  const approveOrRejectMutation = useApproveOrRejectVerification();

  // Modal state
  const [selectedVerification, setSelectedVerification] = useState<FaceVerification | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [isRetryHistoryOpen, setIsRetryHistoryOpen] = useState(false);

  const handleResetFilters = useCallback(() => {
    setSearch('');
    setStatus('');
    setStartDate('');
    setEndDate('');
    setMinScore('');
    setMaxScore('');
    setCurrentPage(1);
  }, []);

  const handleViewDetails = useCallback((id: number) => {
    navigate(`/admin/face-verifications/${id}`);
  }, [navigate]);

  const handleApprove = useCallback((verification: FaceVerification) => {
    setSelectedVerification(verification);
    setIsApprovalModalOpen(true);
  }, []);

  const handleReject = useCallback((verification: FaceVerification) => {
    setSelectedVerification(verification);
    setIsApprovalModalOpen(true);
  }, []);

  const handleApproveSubmit = useCallback((data: ApprovalData) => {
    if (selectedVerification) {
      approveOrRejectMutation.mutate(
        { id: selectedVerification.id, data },
        {
          onSuccess: () => {
            setIsApprovalModalOpen(false);
            setSelectedVerification(null);
          },
        }
      );
    }
  }, [selectedVerification, approveOrRejectMutation]);

  const handleRejectSubmit = useCallback((data: ApprovalData) => {
    if (selectedVerification) {
      approveOrRejectMutation.mutate(
        { id: selectedVerification.id, data: { ...data, isApproved: false } },
        {
          onSuccess: () => {
            setIsApprovalModalOpen(false);
            setSelectedVerification(null);
          },
        }
      );
    }
  }, [selectedVerification, approveOrRejectMutation]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  if (error) {
    return (
      <RetryPage
        message="Failed to load verifications details"
        btnName="Retry"
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        page="faceverify"
        heading="Face Verifications"
        subHeading="Manage and review face verification requests"
        isLoading={isLoading}
        fetchHandler={refetch}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{statistics.pending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Success</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{statistics.success}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.successRate.toFixed(1)}%</div>
                <ScoreIndicator
                  score={statistics.successRate}
                  label=""
                  showValue={false}
                  className="mt-2"
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={setStatus}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          minScore={minScore}
          onMinScoreChange={setMinScore}
          maxScore={maxScore}
          onMaxScoreChange={setMaxScore}
          onReset={handleResetFilters}
        />

        {/* Verifications List */}
        {isLoading ? (
          <PageLoader pagename="face -verification" />
        ) : verifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No verifications found</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {verifications.map((verification) => {
                const user = verification.user;
                const userInitials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
                return (
                  <Card key={verification.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.profilePic} alt={`${user.firstName} ${user.lastName}`} />
                            <AvatarFallback>{userInitials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm text-muted-foreground">#{verification.id}</div>
                            <div
                              className="font-medium cursor-pointer hover:underline"
                              onClick={() => navigate(`/admin/users/${user.uuid || user.id}`)}
                            >
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={verification.status} />
                          {verification.retryCount > 1 ? (
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                              {verification.retryCount} Attempts
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-700">
                              First Attempt
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Overall Score</p>
                          <ScoreIndicator score={verification.overallScore} label="" showValue={true} />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                          <ScoreIndicator score={verification.confidence} label="" showValue={true} />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Created At</p>
                          <p className="text-sm">{format(new Date(verification.createdAt), 'PPp')}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-end gap-2">
                        {verification.retryCount > 1 && verification.verificationGroupId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedGroupId(verification.verificationGroupId);
                              setIsRetryHistoryOpen(true);
                            }}
                            title="View Retry History"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(verification.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {verification.verificationStatus === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(verification)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReject(verification)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={pagination.totalPages}
                  pageSize={pageSize}
                  totalItems={pagination.total}
                  pageSizeOptions={[10, 20, 50]}
                  startItem={(currentPage - 1) * pageSize + 1}
                  endItem={Math.min(currentPage * pageSize, pagination.total)}
                  visiblePages={[]}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Approval Modal */}
      <ApprovalModal
        verification={selectedVerification}
        isOpen={isApprovalModalOpen}
        onClose={() => {
          setIsApprovalModalOpen(false);
          setSelectedVerification(null);
        }}
        onApprove={handleApproveSubmit}
        onReject={handleRejectSubmit}
        isLoading={approveOrRejectMutation.isPending}
      />

      {/* Retry History Modal */}
      <RetryHistoryModal
        groupId={selectedGroupId}
        isOpen={isRetryHistoryOpen}
        onClose={() => {
          setIsRetryHistoryOpen(false);
          setSelectedGroupId(null);
        }}
      />
    </div>
  );
}

