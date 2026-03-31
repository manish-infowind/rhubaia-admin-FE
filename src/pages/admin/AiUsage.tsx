import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import { AiUsageSummaryCards } from "@/components/admin/ai-usage/AiUsageSummaryCards";
import { AiUsageFilters } from "@/components/admin/ai-usage/AiUsageFilters";
import { AiUsageGraph } from "@/components/admin/ai-usage/AiUsageGraph";
import { AiUsageHistoryTable } from "@/components/admin/ai-usage/AiUsageHistoryTable";
import { AiUsageDetailsModal } from "@/components/admin/ai-usage/AiUsageDetailsModal";
import { useAiUsage } from "@/api/hooks/useAiUsage";
import type { AiUsageFilterState, AiUsageHistoryItem } from "@/api/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { AiUsageGraphPoint } from "@/api/types";

const parseBooleanFilter = (value: string | null): boolean | null => {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
};

const parseFilters = (params: URLSearchParams): AiUsageFilterState => ({
  operation: params.get("operation") || undefined,
  success: parseBooleanFilter(params.get("success")),
  userId: params.get("userId") || undefined,
  from: params.get("from") || undefined,
  to: params.get("to") || undefined,
  days: Number(params.get("days") || 30),
  page: Number(params.get("page") || 1),
  limit: Number(params.get("limit") || 20),
});

const toUtcDayString = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeGraphDay = (value: string) => {
  if (!value) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value.slice(0, 10);
  }

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

const buildDailyGraphPoints = (
  points: AiUsageGraphPoint[],
  filters: AiUsageFilterState,
): AiUsageGraphPoint[] => {
  if (points.length === 0) {
    return [];
  }

  const today = new Date();
  const rangeEnd = startOfUtcDay(filters.to, today);
  const defaultStart = new Date(rangeEnd);
  defaultStart.setUTCDate(defaultStart.getUTCDate() - Math.max((filters.days || 30) - 1, 0));
  const rangeStart = startOfUtcDay(filters.from, defaultStart);

  const normalizedPoints = points.map((point) => ({
    day: normalizeGraphDay(point.day),
    total_runs: toNumber(point.total_runs),
    successful_runs: toNumber(point.successful_runs),
    failed_runs: toNumber(point.failed_runs),
    total_tokens: toNumber(point.total_tokens),
    total_cost_usd: toNumber(point.total_cost_usd),
  }));

  const pointMap = new Map(normalizedPoints.map((point) => [point.day, point]));
  const paddedPoints: AiUsageGraphPoint[] = [];

  const cursor = new Date(rangeStart);
  while (cursor <= rangeEnd) {
    const day = toUtcDayString(cursor);
    paddedPoints.push(
      pointMap.get(day) || {
        day,
        total_runs: 0,
        successful_runs: 0,
        failed_runs: 0,
        total_tokens: 0,
        total_cost_usd: 0,
      },
    );
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return paddedPoints;
};

export default function AiUsage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedItem, setSelectedItem] = useState<AiUsageHistoryItem | null>(null);
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);

  const {
    operations,
    graph,
    history,
    operationsLoading,
    graphLoading,
    historyLoading,
    operationsError,
    graphError,
    historyError,
  } = useAiUsage(filters);

  const updateFilters = (
    updates: Partial<AiUsageFilterState>,
    options?: { resetPage?: boolean },
  ) => {
    const nextFilters: AiUsageFilterState = {
      ...filters,
      ...updates,
      page: options?.resetPage === false ? updates.page ?? filters.page : 1,
    };

    const nextParams = new URLSearchParams();

    if (nextFilters.operation) nextParams.set("operation", nextFilters.operation);
    if (typeof nextFilters.success === "boolean") nextParams.set("success", String(nextFilters.success));
    if (nextFilters.userId) nextParams.set("userId", nextFilters.userId);
    if (nextFilters.from) nextParams.set("from", nextFilters.from);
    if (nextFilters.to) nextParams.set("to", nextFilters.to);
    if (!nextFilters.from && !nextFilters.to && nextFilters.days) nextParams.set("days", String(nextFilters.days));
    nextParams.set("page", String(nextFilters.page));
    nextParams.set("limit", String(nextFilters.limit));

    setSearchParams(nextParams, { replace: true });
  };

  useEffect(() => {
    if (!filters.operation && operations?.items.length) {
      updateFilters({ operation: operations.items[0].operation });
    }
  }, [filters.operation, operations]);

  const operationLabel = useMemo(() => {
    if (filters.operation === "all") return "All Operations";
    return operations?.items.find((item) => item.operation === filters.operation)?.label || "AI Usage";
  }, [filters.operation, operations]);

  const graphPoints = useMemo(
    () => buildDailyGraphPoints(graph?.points || [], filters),
    [graph?.points, filters],
  );

  const sharedError = operationsError || graphError || historyError;

  return (
    <div className="space-y-6">
      <PageHeader
        heading="AI Usage"
        subHeading="Track AI operations, usage trends, costs, and audit history."
      />

      {sharedError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to load AI usage data</AlertTitle>
          <AlertDescription>{sharedError}</AlertDescription>
        </Alert>
      ) : null}

      <AiUsageSummaryCards
        operations={operations?.items || []}
        summary={graph?.summary || operations?.totals || null}
        selectedOperation={filters.operation || "all"}
        onSelectOperation={(operation) => updateFilters({ operation })}
        loading={operationsLoading && graphLoading}
      />

      <AiUsageFilters
        filters={filters}
        operations={operations?.items || []}
        onChange={(updates) => updateFilters(updates)}
        onReset={() =>
          setSearchParams(
            new URLSearchParams({
              operation: "all",
              days: "30",
              page: "1",
              limit: "20",
            }),
            { replace: true },
          )
        }
      />

      <AiUsageGraph
        points={graphPoints}
        summary={graph?.summary || null}
        loading={graphLoading}
        title={`${operationLabel} Trend`}
      />

      <AiUsageHistoryTable
        items={history?.items || []}
        pagination={history?.pagination || null}
        loading={historyLoading}
        onPageChange={(page) => updateFilters({ page }, { resetPage: false })}
        onLimitChange={(limit) => updateFilters({ limit })}
        onSelectItem={setSelectedItem}
      />

      <AiUsageDetailsModal
        item={selectedItem}
        open={Boolean(selectedItem)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedItem(null);
          }
        }}
      />
    </div>
  );
}
