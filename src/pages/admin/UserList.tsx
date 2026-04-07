import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
import PageHeader from "@/components/common/PageHeader";
import { statusList, tableConfig } from "@/api/mockData";
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

const UsersList = () => {
    const navigate = useNavigate();

    // Filters and search
    const [searchText, setSearchText] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("active");

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const pageSizeOptions = [10, 20, 50];

    // Modal states
    const [deleteUser, setDeleteUser] = useState<UserListItem | null>(null);
    const [deleteItemType, setDeleteItemType] = useState(false);
    

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

        return params;
    }, [currentPage, pageSize, searchText, statusFilter]);

    // Use the user management hook
    const {
        users,
        pagination,
        isLoading,
        error,
        refetch,
        deleteUser: deleteUserMutation,
        isDeleting,
    } = useUserManagement(queryParams);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchText, statusFilter, pageSize]);

    // Handle search with debounce
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(e.target.value);
    }, []);

    // Handle status filter change
    const handleStatusFilterChange = useCallback((value: string) => {
        setStatusFilter(value);
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
                        placeholder="Search by name, email, or username..."
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
                                        <TableHead key={col.label}>{col.label}</TableHead>
                                    )
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedUsers.length > 0 ? (
                                sortedUsers.map((user) => (
                                    <TableRow key={user.uuid || user.id}>
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
                                            <Badge
                                                variant={user.isDeleted ? 'destructive' : 'secondary'}
                                            >
                                                {user.isDeleted ? 'Deleted' : 'Not Deleted'}
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
                                        {searchText || statusFilter
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
        </div>
    );
};

export default React.memo(UsersList);
