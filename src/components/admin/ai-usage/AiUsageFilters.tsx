import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AiUsageFilterState, AiUsageOperationSummary } from "@/api/types";
import { FilterX } from "lucide-react";

interface AiUsageFiltersProps {
  filters: AiUsageFilterState;
  operations: AiUsageOperationSummary[];
  onChange: (updates: Partial<AiUsageFilterState>) => void;
  onReset: () => void;
  hideUserId?: boolean;
}

const isoToDateTimeLocal = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

const localDateTimeToIso = (value: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

export function AiUsageFilters({
  filters,
  operations,
  onChange,
  onReset,
  hideUserId = false,
}: AiUsageFiltersProps) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>AI Usage</CardTitle>
          <Button variant="outline" size="sm" onClick={onReset}>
            <FilterX className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <div className="space-y-2">
          <Label>Operation</Label>
          <Select
            value={filters.operation || "all"}
            onValueChange={(value) => onChange({ operation: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All operations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All operations</SelectItem>
              {operations.map((item) => (
                <SelectItem key={item.operation} value={item.operation}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={
              filters.success === true
                ? "success"
                : filters.success === false
                  ? "failed"
                  : "all"
            }
            onValueChange={(value) =>
              onChange({
                success:
                  value === "success" ? true : value === "failed" ? false : null,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="success">Success only</SelectItem>
              <SelectItem value="failed">Failed only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!hideUserId ? (
          <div className="space-y-2">
            <Label>User ID</Label>
            <Input
              value={filters.userId || ""}
              onChange={(event) => onChange({ userId: event.target.value || undefined })}
              placeholder="Filter by UUID"
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <Label>From</Label>
          <Input
            type="datetime-local"
            value={isoToDateTimeLocal(filters.from)}
            onChange={(event) => onChange({ from: localDateTimeToIso(event.target.value) })}
          />
        </div>

        <div className="space-y-2">
          <Label>To</Label>
          <Input
            type="datetime-local"
            value={isoToDateTimeLocal(filters.to)}
            onChange={(event) => onChange({ to: localDateTimeToIso(event.target.value) })}
          />
        </div>

        <div className="space-y-2">
          <Label>Days preset</Label>
          <Select
            value={String(filters.days || 30)}
            onValueChange={(value) => onChange({ days: Number(value) })}
            disabled={Boolean(filters.from || filters.to)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Last 30 days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="180">Last 180 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
