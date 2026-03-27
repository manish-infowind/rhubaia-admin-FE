import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
    User,
    Smartphone,
    Mail,
    Pencil,
    Trash,
    Eye,
    Search,
    Pause,
    Play,
    Ban,
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { DeleteConfirmationModal } from "@/components/admin/DeleteConfirmationModal";
import { Input } from "@/components/ui/input";
import PaginationControls from "@/components/ui/paginationComp";
import SortableHeader from "@/components/ui/tableSorting";
import { useUserManagement } from "@/api/hooks/useUserManagement";
import { UserListItem } from "@/api/types";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { genderList, statusList, tableConfig } from "@/api/mockData";
import PageLoader from "@/components/common/PageLoader";
import RetryPage from "@/components/common/RetryPage";
import { UserBanSchema, UserBanRequest } from "@/validations/userBan";
import { format } from "date-fns";

// Helper function to format gender
const formatGender = (gender: 'm' | 'f' | 'o'): string => {
    const genderMap = {
        'm': 'Male',
        'f': 'Female',
        'o': 'Other'
    };
    return genderMap[gender] || gender;
};

// Helper function to get status badge variant
const getStatusBadgeVariant = (status: number, isPaused: boolean, isDeleted: boolean) => {
    if (isDeleted) return 'destructive';
    if (isPaused) return 'secondary';
    if (status === 5) return 'default';
    if (status >= 3) return 'secondary';
    return 'outline';
};

// Helper function to format date
const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        return format(date, 'MMM dd, yyyy hh:mm a');
    } catch (error) {
        return 'N/A';
    }
};

const UsersList = () => {
    const { toast } = useToast();
    const navigate = useNavigate();

    // Filters and search
    const [searchText, setSearchText] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [genderFilter, setGenderFilter] = useState<'m' | 'f' | 'o' | "">("");

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const pageSizeOptions = [10, 20, 50];

    // Modal states
    const [deleteUser, setDeleteUser] = useState<UserListItem | null>(null);
    const [deleteItemType, setDeleteItemType] = useState(false);
    const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
    const [banForm, setBanForm] = useState<{
        reasonCode: string;
        reason: string;
        relatedReportId: string;
        expiresAtPreset: string;
        customExpiresAt: string;
    }>({
        reasonCode: '',
        reason: '',
        relatedReportId: '',
        expiresAtPreset: 'permanent',
        customExpiresAt: '',
    });
    const [banFormErrors, setBanFormErrors] = useState<Record<string, string>>({});
    const [moderationDetails, setModerationDetails] = useState<any | null>(null);
    const [isLoadingModeration, setIsLoadingModeration] = useState(false);

    // Sorting
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: '', direction: 'asc' });
    const visibleTableConfig = useMemo(
        () => tableConfig.filter((col) => col.label !== "Status"),
        []
    );

    // Build query params
    const queryParams = useMemo(() => {
        const params: any = {
            page: currentPage,
            limit: pageSize,
            offset: (currentPage - 1) * pageSize,
        };

        if (searchText.trim()) {
            params.search = searchText.trim();
        }

        if (statusFilter) {
            params.status = statusFilter;
        }

        if (genderFilter) {
            params.gender = genderFilter;
        }

        return params;
    }, [currentPage, pageSize, searchText, statusFilter, genderFilter]);

    // Use the user management hook
    const {
        users,
        pagination,
        isLoading,
        error,
        refetch,
        togglePause,
        isTogglingPause,
        deleteUser: deleteUserMutation,
        isDeleting,
        banUser: banUserMutation,
        isBanning,
        unbanUser: unbanUserMutation,
        isUnbanning,
        getUserModerationActions,
    } = useUserManagement(queryParams);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchText, statusFilter, genderFilter, pageSize]);

    // Handle search with debounce
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(e.target.value);
    }, []);

    // Handle status filter change
    const handleStatusFilterChange = useCallback((value: string) => {
        setStatusFilter(value);
    }, []);

    // Handle gender filter change
    const handleGenderFilterChange = useCallback((value: string) => {
        setGenderFilter(value as 'm' | 'f' | 'o' | "");
    }, []);

    // Handle view user - navigate to view page
    const handleViewUser = useCallback((user: UserListItem) => {
        const userRouteId = user.uuid || String(user.id);
        navigate(`/admin/users/${userRouteId}`);
    }, [navigate]);

    // Handle edit user - navigate to edit page
    const handleEditUser = useCallback((user: UserListItem) => {
        const userRouteId = user.uuid || String(user.id);
        navigate(`/admin/users/${userRouteId}/edit`);
    }, [navigate]);

    // Handle delete user
    const openDeleteDialog = useCallback((user: UserListItem) => {
        setDeleteUser(user);
        setDeleteItemType(true);
    }, []);

    const closeDeleteDialog = useCallback(() => {
        setDeleteItemType(false);
        setDeleteUser(null);
    }, []);

    const handleDeleteUser = useCallback(() => {
        if (deleteUser) {
            const userRouteId = deleteUser.uuid || String(deleteUser.id);
            deleteUserMutation(
                { id: userRouteId },
                {
                    onSuccess: () => {
                        closeDeleteDialog();
                    },
                }
            );
        }
    }, [deleteUser, deleteUserMutation, closeDeleteDialog]);

    // Handle toggle pause
    const handleTogglePause = useCallback((user: UserListItem) => {
        const userRouteId = user.uuid || String(user.id);
        togglePause(userRouteId, {
            onSuccess: () => {
                toast({
                    title: user.isAccountPaused ? "User Unpaused" : "User Paused",
                    description: `${user.firstName} ${user.lastName} has been ${user.isAccountPaused ? 'unpaused' : 'paused'}.`,
                });
            },
        });
    }, [togglePause, toast]);

    // Handle ban user
    const openBanDialog = useCallback((user: UserListItem) => {
        setSelectedUser(user);
        setBanForm({
            reasonCode: '',
            reason: '',
            relatedReportId: '',
            expiresAtPreset: 'permanent',
            customExpiresAt: '',
        });
        setBanFormErrors({});
        setModerationDetails(null);

        // If user is already banned, fetch latest moderation/ban details
        if (user.isBanned) {
            setIsLoadingModeration(true);
            const userRouteId = user.uuid || String(user.id);
            getUserModerationActions(userRouteId)
                .then((response) => {
                    const data = (response as any)?.data ?? (response as any);
                    const actions = data?.actions || data?.data?.actions || [];
                    if (Array.isArray(actions) && actions.length > 0) {
                        // Prefer active ban actions
                        const activeBan = actions.find(
                            (action: any) =>
                                action.type === 'ban' &&
                                (action.status === 'active' || action.status === 'ban')
                        );
                        setModerationDetails(activeBan || actions[0]);
                    } else {
                        setModerationDetails(null);
                    }
                })
                .catch((error: any) => {
                    toast({
                        title: "Error",
                        description: error?.message || "Failed to load user moderation actions.",
                        variant: "destructive",
                    });
                    setModerationDetails(null);
                })
                .finally(() => {
                    setIsLoadingModeration(false);
                });
        }

        setIsBanDialogOpen(true);
    }, [getUserModerationActions, toast]);

    const closeBanDialog = useCallback(() => {
        setIsBanDialogOpen(false);
        setSelectedUser(null);
        setBanForm({
            reasonCode: '',
            reason: '',
            relatedReportId: '',
            expiresAtPreset: 'permanent',
            customExpiresAt: '',
        });
        setBanFormErrors({});
        setModerationDetails(null);
        setIsLoadingModeration(false);
    }, []);

    const calculateExpiresAt = useCallback((preset: string, customDate?: string): string | undefined => {
        if (preset === 'permanent') {
            return undefined;
        }
        if (preset === 'custom' && customDate) {
            return new Date(customDate).toISOString();
        }
        const now = new Date();
        switch (preset) {
            case '1day':
                now.setDate(now.getDate() + 1);
                return now.toISOString();
            case '7days':
                now.setDate(now.getDate() + 7);
                return now.toISOString();
            case '30days':
                now.setDate(now.getDate() + 30);
                return now.toISOString();
            default:
                return undefined;
        }
    }, []);

    const handleBanSubmit = useCallback(() => {
        if (!selectedUser) return;

        // Validate form
        const errors: Record<string, string> = {};
        if (!banForm.reasonCode.trim()) {
            errors.reasonCode = 'Reason code is required';
        } else if (banForm.reasonCode.length > 100) {
            errors.reasonCode = 'Reason code must be less than 100 characters';
        }
        if (banForm.reason && banForm.reason.length > 1000) {
            errors.reason = 'Reason must be less than 1000 characters';
        }
        if (banForm.relatedReportId.trim()) {
            const reportId = parseInt(banForm.relatedReportId, 10);
            if (isNaN(reportId) || reportId <= 0) {
                errors.relatedReportId = 'Report ID must be a positive integer';
            }
        }
        if (banForm.expiresAtPreset === 'custom' && !banForm.customExpiresAt) {
            errors.customExpiresAt = 'Custom expiry date is required';
        }

        if (Object.keys(errors).length > 0) {
            setBanFormErrors(errors);
            return;
        }

        setBanFormErrors({});

        // Prepare payload
        const expiresAt = calculateExpiresAt(banForm.expiresAtPreset, banForm.customExpiresAt);
        const payload: UserBanRequest = {
            actionType: 'ban',
            reasonCode: banForm.reasonCode.trim(),
            reason: banForm.reason.trim() || undefined,
            relatedReportId: banForm.relatedReportId.trim() 
                ? parseInt(banForm.relatedReportId, 10) 
                : undefined,
            expiresAt,
        };

        // Validate with Zod schema
        const validationResult = UserBanSchema.safeParse(payload);
        if (!validationResult.success) {
            const zodErrors: Record<string, string> = {};
            validationResult.error.errors.forEach((err) => {
                if (err.path.length > 0) {
                    zodErrors[err.path[0] as string] = err.message;
                }
            });
            setBanFormErrors(zodErrors);
            return;
        }

        // Call API
        banUserMutation(
            {
                id: selectedUser.uuid || String(selectedUser.id),
                data: validationResult.data as {
                    actionType: string;
                    reasonCode: string;
                    reason?: string;
                    relatedReportId: number;
                    expiresAt?: string;
                },
            },
            {
                onSuccess: () => {
                    closeBanDialog();
                },
            }
        );
    }, [selectedUser, banForm, calculateExpiresAt, banUserMutation, closeBanDialog]);

    const handleUnban = useCallback(() => {
        if (!selectedUser) return;

        unbanUserMutation(
            selectedUser.uuid || String(selectedUser.id),
            {
                onSuccess: () => {
                    closeBanDialog();
                },
            }
        );
    }, [selectedUser, unbanUserMutation, closeBanDialog]);

    // Pagination helpers
    const handlePageChange = useCallback((page: number) => {
        if (pagination && page >= 1 && page <= pagination.totalPages && page !== currentPage) {
            setCurrentPage(page);
        }
    }, [currentPage, pagination]);

    const handlePageSizeChange = useCallback((size: number) => {
        setPageSize(size);
    }, []);

    // Visible pages logic
    const visiblePages = useMemo(() => {
        if (!pagination) return [];
        const pages: (number | string)[] = [];
        const totalPages = pagination.totalPages;

        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (currentPage < totalPages - 2) pages.push('...');
            if (totalPages > 1) pages.push(totalPages);
        }
        return pages;
    }, [currentPage, pagination]);

    // Apply client-side sorting (if needed, though API should handle it)
    const sortedUsers = useMemo(() => {
        if (!sortConfig.key) return users;

        return [...users].sort((a, b) => {
            const aVal = (a as any)[sortConfig.key];
            const bVal = (b as any)[sortConfig.key];

            if (aVal == null) return 1;
            if (bVal == null) return -1;

            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sortConfig.direction === 'asc'
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            }

            return sortConfig.direction === 'asc'
                ? aVal > bVal ? 1 : -1
                : aVal < bVal ? 1 : -1;
        });
    }, [users, sortConfig]);

    const handleSort = useCallback((key: string) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    }, []);

    // Calculate pagination display values
    const startItem = pagination && pagination.total > 0 ? (currentPage - 1) * pageSize + 1 : 0;
    const endItem = pagination ? Math.min(currentPage * pageSize, pagination.total) : 0;
    const totalItems = pagination?.total || 0;
    const totalPages = pagination?.totalPages || 0;

    // Show error state
    if (error) {
        return (
             <RetryPage
                message="Failed to load users details"
                btnName="Retry"
                onRetry={refetch}
            />
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                page="systemuser"
                heading="System Users"
                subHeading="Manage and view all system users"
            />

            {/* Filters */}
            <div className="flex gap-3 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        className="pl-10"
                        placeholder="Search by name, email, or phone..."
                        value={searchText}
                        onChange={handleSearchChange}
                    />
                </div>
                <Select value={statusFilter || "all"} onValueChange={(value) => handleStatusFilterChange(value === "all" ? "" : value)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        {statusList?.map(list => (
                            <SelectItem key={list?.value} value={list?.value}>{list?.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={genderFilter || "all"} onValueChange={(value) => handleGenderFilterChange(value === "all" ? "" : value as 'm' | 'f' | 'o' | "")}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="All Genders" />
                    </SelectTrigger>
                    <SelectContent>
                        {genderList?.map(list => (
                            <SelectItem key={list?.value} value={list?.value}>{list?.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
            >
                {isLoading ? (
                    <PageLoader pagename="users" />
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {visibleTableConfig?.map((col) =>
                                    col.sortKey ? (
                                        <SortableHeader
                                            key={col.sortKey}
                                            sortKey={col.sortKey}
                                            currentSortKey={sortConfig.key}
                                            currentDirection={sortConfig.direction}
                                            onSort={handleSort}
                                        >
                                            {col.label}
                                        </SortableHeader>
                                    ) : (
                                        <TableHead key="actions">Actions</TableHead>
                                    )
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedUsers.length > 0 ? (
                                sortedUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                {user.firstName} {user.lastName}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Smartphone className="h-4 w-4 text-muted-foreground" />
                                                {user.countryCode} {user.phone}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                {user.email || 'N/A'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {user.accountStatusDescription || user.accountStatusName}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {formatGender(user.gender)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={user.isAccountPaused ? 'destructive' : 'default'}
                                            >
                                                {user.isAccountPaused ? 'Paused' : 'Active'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Eye
                                                    className="h-5 w-5 cursor-pointer text-muted-foreground hover:text-blue-600"
                                                    onClick={() => handleViewUser(user)}
                                                />
                                                <Pencil
                                                    className="h-5 w-5 cursor-pointer text-muted-foreground hover:text-amber-600"
                                                    onClick={() => handleEditUser(user)}
                                                />
                                                {user.isAccountPaused ? (
                                                    <div title="Unpause User">
                                                        <Play
                                                            className="h-5 w-5 cursor-pointer text-muted-foreground hover:text-green-600"
                                                            onClick={() => handleTogglePause(user)}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div title="Pause User">
                                                        <Pause
                                                            className="h-5 w-5 cursor-pointer text-muted-foreground hover:text-orange-600"
                                                            onClick={() => handleTogglePause(user)}
                                                        />
                                                    </div>
                                                )}
                                                {user.isBanned ? (
                                                    <div title="Unban User">
                                                        <Ban
                                                            className="h-5 w-5 cursor-pointer text-orange-600 hover:text-orange-700"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openBanDialog(user);
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div title="Ban User">
                                                        <Ban
                                                            className="h-5 w-5 cursor-pointer text-muted-foreground hover:text-orange-600"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openBanDialog(user);
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                                <Trash
                                                    className="h-5 w-5 cursor-pointer text-muted-foreground hover:text-red-600"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openDeleteDialog(user);
                                                    }}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={visibleTableConfig?.length} className="text-center py-12 text-muted-foreground">
                                        {searchText || statusFilter || genderFilter
                                            ? "No users match your filters."
                                            : "No users found."}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </motion.div>

            {/* Pagination */}
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

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={deleteItemType}
                onClose={closeDeleteDialog}
                onConfirm={handleDeleteUser}
                title="Delete User"
                message="Are you sure you want to delete this user? This will permanently remove the user from the system."
                itemName={deleteUser ? `${deleteUser.firstName} ${deleteUser.lastName}` : ''}
                isLoading={isDeleting}
            />

            {/* Ban User Dialog */}
            <Dialog open={isBanDialogOpen} onOpenChange={(open) => {
                if (!open) {
                    closeBanDialog();
                }
            }}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold">
                            {selectedUser?.isBanned ? 'User Ban Details' : 'Ban User'}
                        </DialogTitle>
                        {selectedUser && (
                            <p className="text-sm text-muted-foreground">
                                {selectedUser.isBanned ? 'User:' : 'Banning:'} {selectedUser.firstName} {selectedUser.lastName} ({selectedUser.email || selectedUser.phone})
                            </p>
                        )}
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        {selectedUser?.isBanned ? (
                            <>
                                {isLoadingModeration ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : moderationDetails ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-sm font-medium">Ban Status</Label>
                                                <p className="text-sm mt-1 text-muted-foreground">
                                                    {moderationDetails.status || 'N/A'}
                                                </p>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium">Ban Type</Label>
                                                <p className="text-sm mt-1 text-muted-foreground">
                                                    {moderationDetails.type ? moderationDetails.type.charAt(0).toUpperCase() + moderationDetails.type.slice(1) : 'Ban'}
                                                </p>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium">Reason Code</Label>
                                                <p className="text-sm mt-1 text-muted-foreground">
                                                    {moderationDetails.reasonCode || 'N/A'}
                                                </p>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium">Report ID</Label>
                                                <p className="text-sm mt-1 text-muted-foreground">
                                                    {moderationDetails.relatedReportId ||
                                                        moderationDetails.reportId ||
                                                        'N/A'}
                                                </p>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium">Banned On</Label>
                                                <p className="text-sm mt-1 text-muted-foreground">
                                                    {formatDate(moderationDetails.createdAt || moderationDetails.created_at)}
                                                </p>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium">Expiry Date</Label>
                                                <p className="text-sm mt-1 text-muted-foreground">
                                                    {formatDate(moderationDetails.expiresAt || moderationDetails.expires_at)}
                                                </p>
                                            </div>
                                        </div>
                                        {moderationDetails.reason && (
                                            <div className="space-y-1">
                                                <Label className="text-sm font-medium">Additional Details</Label>
                                                <p className="text-sm text-muted-foreground whitespace-pre-line mt-1">
                                                    {moderationDetails.reason}
                                                </p>
                                            </div>
                                        )}
                                        {moderationDetails.category && (
                                            <div className="space-y-1">
                                                <Label className="text-sm font-medium">Report Category</Label>
                                                <p className="text-sm mt-1 text-muted-foreground">{moderationDetails.category}</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No ban details found for this user.
                                    </p>
                                )}

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={closeBanDialog}
                                        disabled={isUnbanning}
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={handleUnban}
                                        disabled={isUnbanning}
                                    >
                                        {isUnbanning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                        Unban User
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Reason Code */}
                                <div className="space-y-2">
                                    <Label htmlFor="reasonCode">
                                        Ban Reason Code <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="reasonCode"
                                        value={banForm.reasonCode}
                                        onChange={(e) => {
                                            setBanForm({ ...banForm, reasonCode: e.target.value });
                                            if (banFormErrors.reasonCode) {
                                                setBanFormErrors({ ...banFormErrors, reasonCode: '' });
                                            }
                                        }}
                                        placeholder="Enter reason code (max 100 characters)"
                                        maxLength={100}
                                        className={banFormErrors.reasonCode ? 'border-destructive' : ''}
                                    />
                                    {banFormErrors.reasonCode && (
                                        <p className="text-sm text-destructive">{banFormErrors.reasonCode}</p>
                                    )}
                                </div>

                                {/* Reason */}
                                <div className="space-y-2">
                                    <Label htmlFor="reason">Additional Details (Optional)</Label>
                                    <Textarea
                                        id="reason"
                                        value={banForm.reason}
                                        onChange={(e) => {
                                            setBanForm({ ...banForm, reason: e.target.value });
                                            if (banFormErrors.reason) {
                                                setBanFormErrors({ ...banFormErrors, reason: '' });
                                            }
                                        }}
                                        placeholder="Enter detailed reason (max 1000 characters)"
                                        maxLength={1000}
                                        rows={4}
                                        className={banFormErrors.reason ? 'border-destructive' : ''}
                                    />
                                    {banFormErrors.reason && (
                                        <p className="text-sm text-destructive">{banFormErrors.reason}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        {banForm.reason.length}/1000 characters
                                    </p>
                                </div>

                                {/* Related Report ID */}
                                <div className="space-y-2">
                                    <Label htmlFor="relatedReportId">
                                        Report ID (Optional)
                                    </Label>
                                    <Input
                                        id="relatedReportId"
                                        type="number"
                                        value={banForm.relatedReportId}
                                        onChange={(e) => {
                                            setBanForm({ ...banForm, relatedReportId: e.target.value });
                                            if (banFormErrors.relatedReportId) {
                                                setBanFormErrors({ ...banFormErrors, relatedReportId: '' });
                                            }
                                        }}
                                        placeholder="Enter the report ID associated with this ban (optional)"
                                        min="1"
                                        className={banFormErrors.relatedReportId ? 'border-destructive' : ''}
                                    />
                                    {banFormErrors.relatedReportId && (
                                        <p className="text-sm text-destructive">{banFormErrors.relatedReportId}</p>
                                    )}
                                </div>

                                {/* Expires At Preset */}
                                <div className="space-y-2">
                                    <Label htmlFor="expiresAtPreset">Ban Duration</Label>
                                    <Select
                                        value={banForm.expiresAtPreset}
                                        onValueChange={(value) => {
                                            setBanForm({ ...banForm, expiresAtPreset: value, customExpiresAt: '' });
                                            if (banFormErrors.customExpiresAt) {
                                                setBanFormErrors({ ...banFormErrors, customExpiresAt: '' });
                                            }
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select ban duration" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="permanent">Permanent</SelectItem>
                                            <SelectItem value="1day">1 Day</SelectItem>
                                            <SelectItem value="7days">7 Days</SelectItem>
                                            <SelectItem value="30days">30 Days</SelectItem>
                                            <SelectItem value="custom">Custom Date</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Custom Expires At */}
                                {banForm.expiresAtPreset === 'custom' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="customExpiresAt">
                                            Custom Expiry Date <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="customExpiresAt"
                                            type="datetime-local"
                                            value={banForm.customExpiresAt}
                                            onChange={(e) => {
                                                setBanForm({ ...banForm, customExpiresAt: e.target.value });
                                                if (banFormErrors.customExpiresAt) {
                                                    setBanFormErrors({ ...banFormErrors, customExpiresAt: '' });
                                                }
                                            }}
                                            className={banFormErrors.customExpiresAt ? 'border-destructive' : ''}
                                        />
                                        {banFormErrors.customExpiresAt && (
                                            <p className="text-sm text-destructive">{banFormErrors.customExpiresAt}</p>
                                        )}
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={closeBanDialog}
                                        disabled={isBanning}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={handleBanSubmit}
                                        disabled={isBanning}
                                    >
                                        {isBanning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                        Ban User
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default React.memo(UsersList);
