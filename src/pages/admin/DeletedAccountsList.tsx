import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Loader2, Mail, RotateCcw, User } from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PaginationControls from "@/components/ui/paginationComp";
import PageLoader from "@/components/common/PageLoader";
import RetryPage from "@/components/common/RetryPage";
import { useDeletedAccounts, useRecoverDeletedAccount } from "@/api/hooks/useAccountRecovery";
import type { DeletedAccountItem } from "@/api/types";
import { canPerformAction } from "@/lib/permissions";

const formatDeletedDate = (value?: string | null): string => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return format(parsed, "MMM dd, yyyy HH:mm");
};

const StatusPill = ({ value }: { value: boolean }) => (
  <Badge variant={value ? "outline" : "destructive"}>{value ? "Yes" : "No"}</Badge>
);

const isAccountRecovered = (account: DeletedAccountItem): boolean =>
  account.recovered_by_admin === true;

const isAccountRecoverable = (account: DeletedAccountItem): boolean => {
  if (isAccountRecovered(account)) return false;

  if (account.retention_until) {
    const retentionEnd = new Date(account.retention_until);
    if (!Number.isNaN(retentionEnd.getTime()) && retentionEnd < new Date()) {
      return false;
    }
  }

  return account.can_recover === true || account.is_recoverable === true;
};

const DeletedAccountsList = () => {
  const loginState = useSelector((state: RootState) => state.auth.loginState);
  const canRecover = canPerformAction(loginState as any, "user_management", "update");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const pageSizeOptions = [10, 20, 50];

  const queryParams = useMemo(
    () => ({
      page: currentPage,
      limit: pageSize,
    }),
    [currentPage, pageSize],
  );

  const { items, pagination, isLoading, error, refetch } = useDeletedAccounts(queryParams);
  const { mutate: recoverAccount, isPending: isRecovering } = useRecoverDeletedAccount();
  const [accountToRecover, setAccountToRecover] = useState<DeletedAccountItem | null>(null);
  const [recoveringId, setRecoveringId] = useState<string | null>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  const handlePageChange = useCallback(
    (page: number) => {
      if (pagination && page >= 1 && page <= pagination.totalPages && page !== currentPage) {
        setCurrentPage(page);
      }
    },
    [currentPage, pagination],
  );

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
  }, []);

  const visiblePages = useMemo(() => {
    if (!pagination) return [];
    const pages: (number | string)[] = [];
    const totalPages = pagination.totalPages;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      if (totalPages > 1) pages.push(totalPages);
    }
    return pages;
  }, [currentPage, pagination]);

  const getRecoverId = (account: DeletedAccountItem) => account.uuid || String(account.id);

  const handleRecoverClick = useCallback((account: DeletedAccountItem) => {
    setAccountToRecover(account);
  }, []);

  const handleConfirmRecover = useCallback(() => {
    if (!accountToRecover) return;
    const recoverId = getRecoverId(accountToRecover);
    setRecoveringId(recoverId);
    recoverAccount(recoverId, {
      onSettled: () => setRecoveringId(null),
      onSuccess: (response) => {
        if (response.success) {
          setAccountToRecover(null);
          refetch();
        }
      },
    });
  }, [accountToRecover, recoverAccount, refetch]);

  const startItem = pagination && pagination.total > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = pagination ? Math.min(currentPage * pageSize, pagination.total) : 0;
  const totalItems = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 0;

  if (error) {
    return (
      <RetryPage
        message="Failed to load deleted accounts"
        btnName="Retry"
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {isLoading ? (
          <PageLoader pagename="deleted accounts" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Deleted On</TableHead>
                <TableHead>Recovered</TableHead>
                <TableHead>Recoverable</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length > 0 ? (
                items.map((account) => {
                  const recovered = isAccountRecovered(account);
                  const recoverable = isAccountRecoverable(account);
                  return (
                    <TableRow key={account.uuid || account.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {account.user?.full_name || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {account.user?.email || "—"}
                        </div>
                      </TableCell>
                      <TableCell>{account.user?.username || "—"}</TableCell>
                      <TableCell>{formatDeletedDate(account.created_at)}</TableCell>
                      <TableCell>
                        <StatusPill value={recovered} />
                      </TableCell>
                      <TableCell>
                        <StatusPill value={recoverable} />
                      </TableCell>
                      <TableCell className="text-right">
                        {recoverable && canRecover ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            disabled={isRecovering}
                            onClick={() => handleRecoverClick(account)}
                          >
                            {recoveringId === getRecoverId(account) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RotateCcw className="h-4 w-4" />
                            )}
                            Recover
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No deleted accounts found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </motion.div>

      <AlertDialog
        open={Boolean(accountToRecover)}
        onOpenChange={(open) => {
          if (!open && !isRecovering) setAccountToRecover(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recover account</AlertDialogTitle>
            <AlertDialogDescription>
              Restore{" "}
              <span className="font-medium text-foreground">
                {accountToRecover?.user?.full_name || accountToRecover?.user?.email || "this account"}
              </span>
              ? The user will be able to sign in again after recovery.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRecovering}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-brand-green hover:bg-brand-green/90"
              disabled={isRecovering}
              onClick={(e) => {
                e.preventDefault();
                handleConfirmRecover();
              }}
            >
              {isRecovering ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Recovering...
                </>
              ) : (
                "Confirm recover"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {totalItems > 0 && !isLoading && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          pageSizeOptions={pageSizeOptions}
          startItem={startItem}
          endItem={endItem}
          visiblePages={visiblePages}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  );
};

export default React.memo(DeletedAccountsList);
