import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AiUsageGraphPoint, AiUsageOperationsTotals } from "@/api/types";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, CartesianGrid, Line, LineChart, BarChart, XAxis, YAxis } from "recharts";

interface AiUsageGraphProps {
  points: AiUsageGraphPoint[];
  summary: AiUsageOperationsTotals | null;
  loading?: boolean;
  title: string;
  chartType?: "line" | "bar";
}

const chartConfig = {
  total_runs: { label: "Total Runs", color: "#0f766e" },
  successful_runs: { label: "Successful Runs", color: "#16a34a" },
  failed_runs: { label: "Failed Runs", color: "#dc2626" },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value || 0);

export function AiUsageGraph({
  points,
  summary,
  loading = false,
  title,
  chartType = "line",
}: AiUsageGraphProps) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Daily AI usage trend across total, successful, and failed runs.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <div className="text-muted-foreground">Runs</div>
              <div className="font-medium">{summary?.total_runs ?? 0}</div>
            </div>
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <div className="text-muted-foreground">Success</div>
              <div className="font-medium">{summary?.successful_runs ?? 0}</div>
            </div>
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <div className="text-muted-foreground">Tokens</div>
              <div className="font-medium">{summary?.total_tokens ?? 0}</div>
            </div>
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <div className="text-muted-foreground">Cost</div>
              <div className="font-medium">{formatCurrency(summary?.total_cost_usd ?? 0)}</div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[340px] items-center justify-center text-sm text-muted-foreground">
            Loading graph...
          </div>
        ) : points.length === 0 ? (
          <div className="flex h-[340px] items-center justify-center text-sm text-muted-foreground">
            No graph data found for the current filters.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[340px] w-full">
            {chartType === "bar" ? (
              <BarChart data={points}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="total_runs"
                  fill="var(--color-total_runs)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="successful_runs"
                  fill="var(--color-successful_runs)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="failed_runs"
                  fill="var(--color-failed_runs)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            ) : (
              <LineChart data={points}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  type="monotone"
                  dataKey="total_runs"
                  stroke="var(--color-total_runs)"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="successful_runs"
                  stroke="var(--color-successful_runs)"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="failed_runs"
                  stroke="var(--color-failed_runs)"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            )}
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
