import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store/store";
import { canPerformAction } from "@/lib/permissions";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import RetryPage from "@/components/common/RetryPage";
import BlockPage from "@/components/common/BlockPage";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import PaginationControls from "@/components/ui/paginationComp";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Search } from "lucide-react";
import { useContactSupportList } from "@/api/hooks/useContactSupport";
import type { ContactSupportStatusFilter } from "@/api/types";

const ContactSupportList = () => {
  const navigate = useNavigate();
  const loginState = useSelector((state: RootState) => state.auth.loginState);
  const canRead = canPerformAction(loginState as any, "contact_support", "read");

  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContactSupportStatusFilter>("unresolved");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageSizeOptions = [10, 20, 50, 100];

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
      setCurrentPage(1);
    }, searchText ? 400 : 0);
    return () => clearTimeout(timer);
  }, [searchText]);

  const queryParams = useMemo(() => {
    return {
      page: currentPage,
      limit: pageSize,
      sortBy: "created_at" as const,
      sortOrder: "desc" as const,
      status: statusFilter,
      search: debouncedSearchText.trim() || undefined,
    };
  }, [currentPage, pageSize, statusFilter, debouncedSearchText]);

  const { data, isLoading, error, refetch } = useContactSupportList(queryParams);
  const items = data?.data?.items ?? [];
  const pagination = data?.data?.pagination;

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value as ContactSupportStatusFilter);
  }, []);

  const getStatusBadge = (isResolved: boolean) => {
    return isResolved ? (
      <Badge variant="secondary">Resolved</Badge>
    ) : (
      <Badge variant="default" className="bg-brand-green text-white">
        Unresolved
      </Badge>
    );
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "—";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "—";
    return parsed.toLocaleString();
  };

  const formatLastRepliedBy = (value?: any | null) => {
    if (!value) return "—";
    const name = String(value?.adminName ?? "").trim();
    const email = String(value?.adminEmail ?? "").trim();
    if (name && email) return `${name} (${email})`;
    return name || email || "—";
  };

  if (!canRead) {
    return <BlockPage message="Access denied. You don't have permission to view contact support tickets." />;
  }

  if (error) {
    return (
      <RetryPage
        message="Failed to load contact support tickets"
        btnName="Retry"
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        page="contactSupport"
        heading="Contact Support"
        subHeading="View support tickets, reply to users, and track resolution status"
      />

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search by name, email, or message..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unresolved">Unresolved</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-card rounded-lg border"
      >
        {isLoading ? (
          <PageLoader pagename="contact support" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created at</TableHead>
                  <TableHead>Last reply at</TableHead>
                  <TableHead>Last replied by</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                      No tickets found
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((ticket) => (
                    <TableRow key={ticket.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{ticket.id}</TableCell>
                      <TableCell>{ticket.name}</TableCell>
                      <TableCell>{ticket.email}</TableCell>
                      <TableCell>
                        <div className="max-w-[420px] line-clamp-2" title={ticket.message}>
                          {ticket.message}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(Boolean(ticket.isResolved))}</TableCell>
                      <TableCell>{formatDate(ticket.createdAt)}</TableCell>
                      <TableCell>{formatDate(ticket.lastReplyAt)}</TableCell>
                      <TableCell>
                        <div className="max-w-[260px] truncate" title={formatLastRepliedBy(ticket.lastRepliedBy)}>
                          {formatLastRepliedBy(ticket.lastRepliedBy)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Eye
                          className="h-5 w-5 inline cursor-pointer text-muted-foreground hover:text-blue-600"
                          onClick={() => navigate(`/admin/contact-support/${ticket.id}`)}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {pagination && (
          <div className="p-4 border-t">
            <PaginationControls
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              pageSize={pagination.limit}
              totalItems={pagination.total}
              pageSizeOptions={pageSizeOptions}
              startItem={(pagination.page - 1) * pagination.limit + 1}
              endItem={Math.min(pagination.page * pagination.limit, pagination.total)}
              visiblePages={[]}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ContactSupportList;

