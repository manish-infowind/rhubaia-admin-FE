import React, { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import RetryPage from "@/components/common/RetryPage";
import PaginationControls from "@/components/ui/paginationComp";
import { ActivityLogsGraph } from "@/components/admin/activity-logs/ActivityLogsGraph";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useActivityLogs, useActivityLogsGraph, useAdminUsers } from "@/api/hooks/useActivityLogs";
import type { ActivityLogQueryParams, ActivityType, HttpMethod } from "@/api/types";

const ActivityLogs = () => {
  const [viewMode, setViewMode] = useState<"table" | "graph">("table");
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [adminIdFilter, setAdminIdFilter] = useState<string>("all");
  const [httpMethodFilter, setHttpMethodFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [sortBy, setSortBy] = useState<"timestamp" | "admin_id">("timestamp");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [graphChartType, setGraphChartType] = useState<"line" | "bar">("line");
  const [graphTimeRange, setGraphTimeRange] = useState<"daily" | "weekly" | "monthly">("daily");

  const { users: adminUsers, isLoading: isLoadingAdminUsers } = useAdminUsers();

  useEffect(() => {
    const timer = setTimeout(
      () => {
        setDebouncedSearchText(searchText);
        setCurrentPage(1);
      },
      searchText ? 500 : 0,
    );
    return () => clearTimeout(timer);
  }, [searchText]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const pageSizeOptions = [10, 20, 50, 100];

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const queryParams = useMemo<ActivityLogQueryParams>(() => {
    const params: ActivityLogQueryParams = {
      page: currentPage,
      limit: pageSize,
      sortBy,
      sortOrder,
    };

    if (adminIdFilter && adminIdFilter !== "all") params.adminId = adminIdFilter;
    if (httpMethodFilter && httpMethodFilter !== "all")
      params.httpMethod = httpMethodFilter as HttpMethod;
    if (debouncedSearchText.trim()) params.search = debouncedSearchText.trim();

    if (startDate) {
      const start = new Date(startDate);
      start.setUTCHours(0, 0, 0, 0);
      params.startDate = start.toISOString();
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);
      params.endDate = end.toISOString();
    }

    return params;
  }, [
    currentPage,
    pageSize,
    adminIdFilter,
    httpMethodFilter,
    debouncedSearchText,
    startDate,
    endDate,
    sortBy,
    sortOrder,
  ]);

  const { logs, pagination, isLoading, error, refetch } = useActivityLogs(queryParams);

  const graphParams = useMemo(() => {
    const params: Record<string, any> = {};
    if (adminIdFilter && adminIdFilter !== "all") params.adminId = adminIdFilter;
    if (httpMethodFilter && httpMethodFilter !== "all") params.httpMethod = httpMethodFilter;
    if (debouncedSearchText.trim()) params.search = debouncedSearchText.trim();
    params.timeRange = graphTimeRange;
    if (startDate) {
      const start = new Date(startDate);
      start.setUTCHours(0, 0, 0, 0);
      params.startDate = start.toISOString();
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);
      params.endDate = end.toISOString();
    }
    // Default: last 30 days when no date range specified.
    if (!params.startDate && !params.endDate) {
      params.days = 30;
    }
    return params as {
      adminId?: string;
      httpMethod?: string;
      search?: string;
      timeRange?: "daily" | "weekly" | "monthly";
      startDate?: string;
      endDate?: string;
      days?: number;
    };
  }, [adminIdFilter, httpMethodFilter, debouncedSearchText, graphTimeRange, startDate, endDate]);

  const {
    graph,
    isLoading: graphLoading,
    error: graphError,
    refetch: refetchGraph,
  } = useActivityLogsGraph(graphParams, { enabled: viewMode === "graph" });

  const hasActiveFilters = useMemo(() => {
    return !!(
      (adminIdFilter && adminIdFilter !== "all") ||
      (httpMethodFilter && httpMethodFilter !== "all") ||
      startDate ||
      endDate ||
      debouncedSearchText.trim()
    );
  }, [adminIdFilter, httpMethodFilter, startDate, endDate, debouncedSearchText]);

  const clearAllFilters = useCallback(() => {
    setAdminIdFilter("all");
    setHttpMethodFilter("all");
    setStartDate(undefined);
    setEndDate(undefined);
    setSearchText("");
    setCurrentPage(1);
  }, []);

  const toUtcDayString = (date: Date) => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const normalizeGraphDay = (value: string) => {
    if (!value) return value;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);
    return toUtcDayString(parsed);
  };

  const toNumber = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const startOfUtcDay = (value: string | undefined, fallback: Date) => {
    const base = value ? new Date(value) : fallback;
    return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
  };

  const graphSeries = useMemo(() => graph?.series || [], [graph?.series]);

  const toggleRowExpansion = useCallback((logId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(logId)) next.delete(logId);
      else next.add(logId);
      return next;
    });
  }, []);

  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "MMM dd, yyyy HH:mm:ss");
    } catch {
      return timestamp;
    }
  };

  const getActivityTypeBadge = (type: ActivityType) => {
    const config: Record<
      ActivityType,
      { variant: "default" | "secondary" | "destructive" | "outline"; label: string }
    > = {
      create: { variant: "default", label: "Create" },
      update: { variant: "secondary", label: "Update" },
      delete: { variant: "destructive", label: "Delete" },
      view: { variant: "outline", label: "View" },
      login: { variant: "default", label: "Login" },
      logout: { variant: "outline", label: "Logout" },
      other: { variant: "secondary", label: "Other" },
    };
    const badgeConfig = config[type] || config.other;
    return <Badge variant={badgeConfig.variant}>{badgeConfig.label}</Badge>;
  };

  const getHttpMethodBadge = (method?: HttpMethod) => {
    if (!method) return null;
    const config: Record<
      HttpMethod,
      { variant: "default" | "secondary" | "destructive" | "outline"; className: string }
    > = {
      GET: { variant: "default", className: "bg-blue-100 text-blue-800" },
      POST: { variant: "default", className: "bg-green-100 text-green-800" },
      PUT: { variant: "secondary", className: "bg-yellow-100 text-yellow-800" },
      PATCH: { variant: "secondary", className: "bg-orange-100 text-orange-800" },
      DELETE: { variant: "destructive", className: "bg-red-100 text-red-800" },
      OPTIONS: { variant: "outline", className: "bg-gray-100 text-gray-800" },
      HEAD: { variant: "outline", className: "bg-gray-100 text-gray-800" },
    };
    const badgeConfig = config[method] || config.GET;
    return (
      <Badge variant={badgeConfig.variant} className={badgeConfig.className}>
        {method}
      </Badge>
    );
  };

  const getStatusCodeBadge = (statusCode?: number) => {
    if (!statusCode) return null;
    let variant: "default" | "secondary" | "destructive" | "outline" = "default";
    let className = "bg-green-100 text-green-800";

    if (statusCode >= 300 && statusCode < 400) {
      variant = "secondary";
      className = "bg-blue-100 text-blue-800";
    } else if (statusCode >= 400 && statusCode < 500) {
      variant = "destructive";
      className = "bg-yellow-100 text-yellow-800";
    } else if (statusCode >= 500) {
      variant = "destructive";
      className = "bg-red-100 text-red-800";
    }

    return (
      <Badge variant={variant} className={className}>
        {statusCode}
      </Badge>
    );
  };

  const handleSort = (field: "timestamp" | "admin_id") => {
    if (sortBy === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  if (error) {
    return (
      <RetryPage
        message="Failed to load activity logs"
        btnName="Retry"
        onRetry={() => refetch()}
      />
    );
  }

  if (graphError && viewMode === "graph") {
    return (
      <RetryPage
        message="Failed to load activity graph"
        btnName="Retry"
        onRetry={() => refetchGraph()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/admin">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Activity Logs</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        page="activityLogs"
        heading="Activity Logs"
        subHeading="View and monitor admin actions across the system"
      />

      <div className="bg-card rounded-lg border p-4 space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              onClick={() => setViewMode("table")}
              className={viewMode === "table" ? "bg-brand-teal text-white hover:bg-brand-teal/90" : ""}
            >
              Table
            </Button>
            <Button
              variant={viewMode === "graph" ? "default" : "outline"}
              onClick={() => setViewMode("graph")}
              className={viewMode === "graph" ? "bg-brand-teal text-white hover:bg-brand-teal/90" : ""}
            >
              Click to see activity graph
            </Button>
          </div>

          <div className="min-w-[220px]">
            <Select value={adminIdFilter} onValueChange={setAdminIdFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Admins" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Admins</SelectItem>
                {isLoadingAdminUsers ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : (
                  adminUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.fullName || user.email}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by admin name/email..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="min-w-[140px]">
            <Select value={httpMethodFilter} onValueChange={setHttpMethodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="OPTIONS">OPTIONS</SelectItem>
                <SelectItem value="HEAD">HEAD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "min-w-[200px] justify-start text-left font-normal",
                    !startDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Start Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "min-w-[200px] justify-start text-left font-normal",
                    !endDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "End Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearAllFilters}>
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
          )}

          {viewMode === "graph" && (
            <div className="flex items-center gap-2">
              <Select
                value={graphTimeRange}
                onValueChange={(v) => setGraphTimeRange(v as "daily" | "weekly" | "monthly")}
              >
                <SelectTrigger className="min-w-[160px]">
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Date-wise</SelectItem>
                  <SelectItem value="weekly">Week-wise</SelectItem>
                  <SelectItem value="monthly">Month-wise</SelectItem>
                </SelectContent>
              </Select>
              <Select value={graphChartType} onValueChange={(v) => setGraphChartType(v as "line" | "bar")}>
                <SelectTrigger className="min-w-[140px]">
                  <SelectValue placeholder="Chart Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {viewMode === "graph" ? (
        <ActivityLogsGraph
          series={graphSeries}
          summary={graph?.summary || null}
          loading={graphLoading}
          title="Admin Activity Trend"
          chartType={graphChartType}
          xKey="bucket"
        />
      ) : isLoading ? (
        <PageLoader pagename="activity logs" />
      ) : (
        <div className="bg-card rounded-lg border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]" />
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("timestamp")}
                      className="h-8 px-2"
                    >
                      Timestamp
                      {sortBy === "timestamp" &&
                        (sortOrder === "asc" ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        ))}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("admin_id")}
                      className="h-8 px-2"
                    >
                      Admin
                      {sortBy === "admin_id" &&
                        (sortOrder === "asc" ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        ))}
                    </Button>
                  </TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Feature</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Response Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No activity logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => {
                    const isExpanded = expandedRows.has(log.id);
                    const adminId = typeof (log as any).adminId === "string" ? (log as any).adminId : "";
                    const adminLabel =
                      adminUsers.find((u) => u.id === adminId)?.fullName ||
                      adminUsers.find((u) => u.id === adminId)?.email ||
                      (adminId ? `${adminId.substring(0, 8)}...` : "Unknown");

                    return (
                      <React.Fragment key={log.id}>
                        <TableRow
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => toggleRowExpansion(log.id)}
                        >
                          <TableCell>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {formatTimestamp(log.timestamp)}
                          </TableCell>
                          <TableCell className="text-sm">{adminLabel}</TableCell>
                          <TableCell>
                            <div className="max-w-[240px] truncate" title={log.action}>
                              {log.action}
                            </div>
                          </TableCell>
                          <TableCell>{getActivityTypeBadge(log.type)}</TableCell>
                          <TableCell>
                            <div className="max-w-[160px] truncate" title={log.feature}>
                              {log.feature || "N/A"}
                            </div>
                          </TableCell>
                          <TableCell>{getHttpMethodBadge(log.httpMethod)}</TableCell>
                          <TableCell>{getStatusCodeBadge(log.statusCode)}</TableCell>
                          <TableCell>
                            {log.responseTimeMs !== undefined ? `${log.responseTimeMs}ms` : "N/A"}
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={9} className="bg-muted/30">
                              <div className="p-4 space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <div className="text-sm font-semibold mb-1">Details</div>
                                    <div className="text-sm text-muted-foreground">
                                      {log.details || "N/A"}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold mb-1">Entity</div>
                                    <div className="text-sm text-muted-foreground">
                                      {log.entity
                                        ? `${log.entity}${log.entityName ? `: ${log.entityName}` : ""}`
                                        : "N/A"}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold mb-1">Endpoint</div>
                                    <div className="text-sm text-muted-foreground font-mono">
                                      {log.endpoint || "N/A"}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold mb-1">IP Address</div>
                                    <div className="text-sm text-muted-foreground font-mono">
                                      {log.ipAddress || "N/A"}
                                    </div>
                                  </div>
                                  <div className="md:col-span-2">
                                    <div className="text-sm font-semibold mb-1">User Agent</div>
                                    <div className="text-sm text-muted-foreground font-mono text-xs break-all">
                                      {log.userAgent || "N/A"}
                                    </div>
                                  </div>
                                </div>

                                {log.requestBody && Object.keys(log.requestBody).length > 0 && (
                                  <div>
                                    <div className="text-sm font-semibold mb-1">Request Body</div>
                                    <pre className="text-xs bg-background p-2 rounded border overflow-x-auto">
                                      {JSON.stringify(log.requestBody, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {pagination && (
            <div className="p-4 border-t">
              <PaginationControls
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                pageSize={pageSize}
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
        </div>
      )}
    </div>
  );
};

export default ActivityLogs;

