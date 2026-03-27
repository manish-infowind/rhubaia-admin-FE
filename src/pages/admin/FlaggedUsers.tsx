import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle, User, RotateCcw } from 'lucide-react';
import { useFlaggedUsers, useTriggerReverification } from '@/api/hooks/useFaceVerification';
import { FlaggedUser } from '@/api/types';
import { useToast } from '@/hooks/use-toast';
import PaginationControls from '@/components/ui/paginationComp';
import { formatDistanceToNow } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import RetryPage from '@/components/common/RetryPage';
import PageHeader from '@/components/common/PageHeader';
import PageLoader from '@/components/common/PageLoader';

export default function FlaggedUsers() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Filters
  const [minFailedAttempts, setMinFailedAttempts] = useState(2);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Re-verification modal
  const [selectedUser, setSelectedUser] = useState<FlaggedUser | null>(null);
  const [isReverifyModalOpen, setIsReverifyModalOpen] = useState(false);
  const [reverifyReason, setReverifyReason] = useState('');
  const [reverifyPriority, setReverifyPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');

  // Build query params
  const queryParams = useMemo(() => {
    return {
      page: currentPage,
      limit: pageSize,
      minFailedAttempts,
    };
  }, [currentPage, pageSize, minFailedAttempts]);

  const { flaggedUsers, pagination, isLoading, error, refetch } = useFlaggedUsers(queryParams);
  const triggerReverificationMutation = useTriggerReverification();

  const handleTriggerReverification = useCallback((user: FlaggedUser) => {
    setSelectedUser(user);
    setIsReverifyModalOpen(true);
  }, []);

  const handleReverifySubmit = useCallback(() => {
    if (selectedUser) {
      triggerReverificationMutation.mutate(
        {
          userId: selectedUser.id,
          data: {
            reason: reverifyReason.trim() || undefined,
            priority: reverifyPriority,
          },
        },
        {
          onSuccess: () => {
            setIsReverifyModalOpen(false);
            setSelectedUser(null);
            setReverifyReason('');
            setReverifyPriority('normal');
            toast({
              title: 'Re-verification Triggered',
              description: 'User will need to submit a new verification video.',
            });
          },
        }
      );
    }
  }, [selectedUser, reverifyReason, reverifyPriority, triggerReverificationMutation, toast]);

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
        message="Failed to load flagged users details"
        btnName="Retry"
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        page="flaggedusers"
        heading="Flagged Users"
        subHeading="Users with multiple failed face verification attempts"
        isLoading={isLoading}
        fetchHandler={refetch}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Filter */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="space-y-2 flex-1 max-w-xs">
                <Label htmlFor="minFailedAttempts">Minimum Failed Attempts</Label>
                <Input
                  id="minFailedAttempts"
                  type="number"
                  min="1"
                  value={minFailedAttempts}
                  onChange={(e) => setMinFailedAttempts(parseInt(e.target.value) || 1)}
                />
              </div>
              {pagination && (
                <div className="text-sm text-muted-foreground">
                  {pagination.total} user{pagination.total !== 1 ? 's' : ''} flagged
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Flagged Users List */}
        {isLoading ? (
          <PageLoader pagename="flaged user" />
        ) : flaggedUsers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No flagged users found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Users with {minFailedAttempts} or more failed attempts will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {flaggedUsers.map((user) => {
                const userInitials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
                return (
                  <Card key={user.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={user.profilePic} alt={`${user.firstName} ${user.lastName}`} />
                            <AvatarFallback>{userInitials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {user.firstName} {user.lastName}
                            </h3>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <p className="text-xs text-muted-foreground">{user.phone}</p>
                          </div>
                        </div>
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {user.failedAttempts} Failed
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <span className="text-muted-foreground">Last Updated:</span>{' '}
                          <span className="font-medium">
                            {formatDistanceToNow(new Date(user.updatedAt), { addSuffix: true })}
                          </span>
                        </div>
                        <Badge variant={user.isFaceVerified ? 'default' : 'secondary'}>
                          {user.isFaceVerified ? 'Verified' : 'Not Verified'}
                        </Badge>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/users/${(user as any).uuid || user.id}`)}
                          className="flex-1"
                        >
                          <User className="h-4 w-4 mr-2" />
                          View Profile
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleTriggerReverification(user)}
                          className="flex-1"
                          disabled={triggerReverificationMutation.isPending}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Re-verify
                        </Button>
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

      {/* Re-verification Modal */}
      <Dialog open={isReverifyModalOpen} onOpenChange={setIsReverifyModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trigger Re-verification</DialogTitle>
            <DialogDescription>
              This will reset the user's face verification status and require them to submit a new verification video.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-medium mb-1">User</p>
                <p className="text-sm">
                  {selectedUser.firstName} {selectedUser.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Enter reason for re-verification..."
                  value={reverifyReason}
                  onChange={(e) => setReverifyReason(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={reverifyPriority}
                  onValueChange={(value) => setReverifyPriority(value as any)}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsReverifyModalOpen(false);
                setSelectedUser(null);
                setReverifyReason('');
                setReverifyPriority('normal');
              }}
              disabled={triggerReverificationMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReverifySubmit}
              disabled={triggerReverificationMutation.isPending}
            >
              {triggerReverificationMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Trigger Re-verification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

