import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import type { ActivityLogsGraphSeries, ActivityLogsGraphSummary } from "@/api/types";
import { cn } from "@/lib/utils";

interface ActivityLogsGraphProps {
  series: ActivityLogsGraphSeries[];
  summary: ActivityLogsGraphSummary | null;
  loading?: boolean;
  title: string;
  chartType?: "line" | "bar";
  xKey?: string;
}

const SERIES_COLORS = [
  "#0f766e",
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#9333ea",
];

type FlatPointRow = {
  bucket: string;
  [seriesKey: string]: string | number | null;
};

const parseBucketToSortKey = (bucket: string): number => {
  // daily: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(bucket)) {
    const t = Date.parse(`${bucket}T00:00:00.000Z`);
    return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY;
  }

  // monthly: YYYY-MM
  if (/^\d{4}-\d{2}$/.test(bucket)) {
    const t = Date.parse(`${bucket}-01T00:00:00.000Z`);
    return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY;
  }

  // weekly: YYYY-Www (ISO week-like label)
  const weekMatch = /^(\d{4})-W(\d{2})$/.exec(bucket);
  if (weekMatch) {
    const year = Number(weekMatch[1]);
    const week = Number(weekMatch[2]);
    // Sort by (year, week) without strict ISO date conversion.
    return year * 100 + week;
  }

  // fallback: stable string ordering
  return Number.POSITIVE_INFINITY;
};

export function ActivityLogsGraph({
  series,
  summary,
  loading = false,
  title,
  chartType = "line",
  xKey = "bucket",
}: ActivityLogsGraphProps) {
  const safeSeries = series.filter((s) => Boolean(s?.adminId));

  const [hoveredAdminId, setHoveredAdminId] = useState<string | null>(null);

  const chartConfig = useMemo(
    () =>
      safeSeries.reduce<Record<string, { label: string; color: string }>>((acc, s, idx) => {
        acc[s.adminId] = {
          label: s.adminLabel || s.adminId,
          color: SERIES_COLORS[idx % SERIES_COLORS.length],
        };
        return acc;
      }, {}),
    [safeSeries],
  );

  const bucketOrder: string[] = [];
  const bucketSet = new Set<string>();

  for (const s of safeSeries) {
    for (const p of s.points || []) {
      if (!bucketSet.has(p.bucket)) {
        bucketSet.add(p.bucket);
        bucketOrder.push(p.bucket);
      }
    }
  }

  // Always show from old -> new on X-axis
  bucketOrder.sort((a, b) => {
    const ak = parseBucketToSortKey(a);
    const bk = parseBucketToSortKey(b);
    if (ak !== bk) return ak - bk;
    return a.localeCompare(b);
  });

  const pointsByAdminByBucket = new Map<
    string,
    Map<string, { total: number; create: number; read: number; update: number; delete: number }>
  >();

  for (const s of safeSeries) {
    for (const p of s.points || []) {
      const bucket = p.bucket;
      const byAdmin =
        pointsByAdminByBucket.get(bucket) ||
        new Map<string, { total: number; create: number; read: number; update: number; delete: number }>();
      byAdmin.set(s.adminId, {
        total: Number(p.total_actions || 0),
        create: Number(p.create || 0),
        read: Number(p.read || 0),
        update: Number(p.update || 0),
        delete: Number(p.delete || 0),
      });
      pointsByAdminByBucket.set(bucket, byAdmin);
    }
  }

  const data: FlatPointRow[] = bucketOrder.map((bucket) => {
    const row: FlatPointRow = { bucket };
    for (const s of safeSeries) {
      const found = s.points?.find((p) => p.bucket === bucket);
      // Use null for missing buckets so the line does not imply "0 activity".
      row[s.adminId] = found ? Number(found.total_actions || 0) : null;
    }
    return row;
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    const resolvedAdminId =
      hoveredAdminId ||
      (payload.find((p: any) => typeof p?.dataKey === "string")?.dataKey as string | undefined) ||
      "";

    const hovered =
      payload.find((p: any) => p?.dataKey === resolvedAdminId) ||
      payload.find((p: any) => typeof p?.dataKey === "string") ||
      payload[0];

    const adminId: string = hovered?.dataKey;
    const cfg = chartConfig?.[adminId];
    const bucket = label as string;
    const breakdown = pointsByAdminByBucket.get(bucket)?.get(adminId);

    if (!adminId || !cfg) return null;

    return (
      <div className="grid min-w-[10rem] gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-2 text-xs shadow-xl">
        <div className="font-medium">{bucket}</div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: cfg.color }} />
          <span className="font-medium">{cfg.label}</span>
        </div>
        <div className={cn("grid gap-1 pt-1 text-muted-foreground")}>
          <div className="flex justify-between gap-4">
            <span>Total</span>
            <span className="font-mono tabular-nums text-foreground">{breakdown?.total ?? hovered?.value ?? 0}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Create</span>
            <span className="font-mono tabular-nums text-foreground">{breakdown?.create ?? 0}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Update</span>
            <span className="font-mono tabular-nums text-foreground">{breakdown?.update ?? 0}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Delete</span>
            <span className="font-mono tabular-nums text-foreground">{breakdown?.delete ?? 0}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Admin actions trend across total, create, update, and delete events.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <div className="text-muted-foreground">Total</div>
              <div className="font-medium">{summary?.total_actions ?? 0}</div>
            </div>
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <div className="text-muted-foreground">Create</div>
              <div className="font-medium">{summary?.create ?? 0}</div>
            </div>
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <div className="text-muted-foreground">Update</div>
              <div className="font-medium">{summary?.update ?? 0}</div>
            </div>
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <div className="text-muted-foreground">Delete</div>
              <div className="font-medium">{summary?.delete ?? 0}</div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[340px] items-center justify-center text-sm text-muted-foreground">
            Loading graph...
          </div>
        ) : safeSeries.length === 0 || data.length === 0 ? (
          <div className="flex h-[340px] items-center justify-center text-sm text-muted-foreground">
            No graph data found for the current filters.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[340px] w-full">
            {chartType === "bar" ? (
              <BarChart data={data}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey={xKey} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <ChartTooltip content={<CustomTooltip />} shared={false} />
                <ChartLegend content={<ChartLegendContent />} />
                {safeSeries.map((s) => (
                  <Bar
                    key={s.adminId}
                    dataKey={s.adminId}
                    fill={chartConfig[s.adminId]?.color || "#64748b"}
                    radius={[4, 4, 0, 0]}
                    onMouseEnter={() => setHoveredAdminId(s.adminId)}
                    onMouseLeave={() => setHoveredAdminId(null)}
                  />
                ))}
              </BarChart>
            ) : (
              <LineChart data={data}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey={xKey} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <ChartTooltip content={<CustomTooltip />} shared={false} />
                <ChartLegend content={<ChartLegendContent />} />
                {safeSeries.map((s) => (
                  <Line
                    key={s.adminId}
                    type="monotone"
                    dataKey={s.adminId}
                    stroke={chartConfig[s.adminId]?.color || "#64748b"}
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    connectNulls={true}
                    onMouseEnter={() => setHoveredAdminId(s.adminId)}
                    onMouseLeave={() => setHoveredAdminId(null)}
                  />
                ))}
              </LineChart>
            )}
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

