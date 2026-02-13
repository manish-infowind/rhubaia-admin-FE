import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, ExternalLink, Shield } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { ChartCard } from "@/components/admin/dashboard/ChartCard";
import { ChartConfig } from "@/components/admin/dashboard/ChartFilters";
import { useChartData } from "@/hooks/useChartData";
import { getCrashFreeUsers, type CrashFreeUsersResponse } from "@/api/services/techHealthService";
import { PM2_DASHBOARD_URL } from "@/api/config";

// Format dates using UTC only (same as Dashboard) – no toLocaleDateString to avoid timezone drift
const formatDateUTC = (date: Date, format: "daily" | "weekly" | "monthly"): string => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (format === "daily") {
    const day = date.getUTCDate().toString().padStart(2, "0");
    const month = months[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    return `${month} ${day}, ${year}`;
  }
  if (format === "weekly") {
    const month = months[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    const dayOfMonth = date.getUTCDate();
    const weekNum = Math.ceil(dayOfMonth / 7);
    return `Week ${weekNum} (${month} ${year})`;
  }
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  return `${month} ${year}`;
};

// Same initial chart config as Dashboard (date filter, bar/line/pie) – no gender (male/female not included).
// Daily default: current month (e.g. Feb 1 – today), not Nov–Feb, so API and chart stay in sync.
const createChartConfig = (): ChartConfig => {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  return {
    chartType: "line",
    timeRange: "daily",
    gender: "all",
    dateRange: {
      from: firstOfMonth,
      to: today,
    },
    isDatePickerOpen: false,
    calendarMonth: firstOfMonth,
    selectedMonth: today.getMonth(),
    selectedYear: today.getFullYear(),
    selectedYears: [today.getFullYear()],
  };
};

export default function TechHealthMonitoring() {
  const [responseTimeChart, setResponseTimeChart] = useState<ChartConfig>(createChartConfig());
  const [crashFree, setCrashFree] = useState<CrashFreeUsersResponse | null>(null);
  const [loadingCrashFree, setLoadingCrashFree] = useState(true);

  const { data: responseTimeData, loading: responseTimeLoading } = useChartData(
    responseTimeChart,
    "feedResponseTime"
  );

  // Display names for the two API response time series (from api-response-metrics endpoints)
  const RADAR_MATCHES_LABEL = "Radar (Matches)";
  const FEED_LABEL = "Feed";

  const { chartData: responseTimeChartData, dataKeys: responseTimeDataKeys } = useMemo(() => {
    const list = responseTimeData?.feedResponseTime ?? [];
    const format = responseTimeChart.timeRange === "monthly" ? "monthly" : responseTimeChart.timeRange === "weekly" ? "weekly" : "daily";
    const hasEndpoints = list.some((d) => d.endpoints && d.endpoints.length > 0);
    const data: { name: string; [key: string]: string | number }[] = list.map((d) => {
      const parsed = new Date(d.date);
      const label = Number.isNaN(parsed.getTime()) ? d.date : formatDateUTC(parsed, format);
      const row: { name: string; [key: string]: string | number } = { name: label };
      if (hasEndpoints) {
        const matchesEp = d.endpoints?.find((e) => e.endpoint.includes("matches"));
        const feedEp = d.endpoints?.find((e) => e.endpoint.includes("similar-use") || e.endpoint.includes("feed") || e.endpoint.includes("similar"));
        row[RADAR_MATCHES_LABEL] = Math.round((matchesEp?.avgResponseTimeMs ?? 0) * 100) / 100;
        row[FEED_LABEL] = Math.round((feedEp?.avgResponseTimeMs ?? 0) * 100) / 100;
      } else {
        row["Avg Response (ms)"] = Math.round(d.averageResponseTimeMs * 100) / 100;
      }
      return row;
    });
    const keys = hasEndpoints ? [RADAR_MATCHES_LABEL, FEED_LABEL] : ["Avg Response (ms)"];
    return { chartData: data, dataKeys: keys };
  }, [responseTimeData, responseTimeChart.timeRange]);

  useEffect(() => {
    let cancelled = false;
    setLoadingCrashFree(true);
    getCrashFreeUsers()
      .then((res) => {
        if (!cancelled) setCrashFree(res);
      })
      .finally(() => {
        if (!cancelled) setLoadingCrashFree(false);
      });
    const interval = setInterval(() => {
      getCrashFreeUsers().then((res) => {
        if (!cancelled) setCrashFree(res);
      });
    }, 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const crashFreePercent = crashFree?.crashFreeUsersPercent ?? 0;
  const targetPercent = crashFree?.targetPercent ?? 99;
  const meetsTarget = crashFreePercent >= targetPercent;

  return (
    <div className="space-y-6">
      <PageHeader
        page="tech-health"
        heading="Tech Health and Monitoring"
        subHeading="Feed response time, PM2 dashboard link, and crash-free users (target >99%)"
      />

      {/* Feed Average Response Time – same card/chart as dashboard (date filter, bar/line/pie), no gender */}
      <ChartCard
        title="Feed Average Response Time"
        icon={Activity}
        iconColor="text-brand-green"
        config={responseTimeChart}
        onConfigChange={setResponseTimeChart}
        data={responseTimeChartData}
        dataKeys={responseTimeDataKeys}
        delay={0.2}
        originalData={responseTimeData}
        loading={responseTimeLoading}
        hideGenderFilter
      />

      {/* Below: Crash-Free Users % and PM2 Dashboard */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield
                  className={`h-5 w-5 ${meetsTarget ? "text-brand-green" : "text-amber-500"}`}
                />
                Crash-Free Users %
              </CardTitle>
              <CardDescription>
                Real-time % of users who have not experienced a crash in the
                current session (Target: &gt;99%)
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              {loadingCrashFree ? (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground">
                  Loading...
                </div>
              ) : (
                <div className="relative w-48 h-48">
                  <svg
                    className="w-full h-full -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="hsl(var(--muted))"
                      strokeWidth="10"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke={meetsTarget ? "#10b981" : "hsl(45 93% 47%)"}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${(crashFreePercent / 100) * 264} 264`}
                      className="transition-all duration-700"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold tabular-nums">
                      {crashFreePercent.toFixed(1)}%
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      Target: {targetPercent}%
                    </span>
                    {crashFree?.sessionUsers != null && (
                      <span className="text-xs text-muted-foreground">
                        {crashFree.sessionUsers.toLocaleString()} session users
                      </span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-brand-teal" />
                PM2 Dashboard
              </CardTitle>
              <CardDescription>
                Open the PM2 process manager dashboard in a new tab to monitor
                processes, logs, and metrics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {PM2_DASHBOARD_URL ? (
                <Button asChild variant="default" className="bg-brand-teal hover:bg-brand-teal/90">
                  <a
                    href={PM2_DASHBOARD_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open PM2 Dashboard
                  </a>
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Set <code className="rounded bg-muted px-1">VITE_PM2_DASHBOARD_URL</code> in
                  your <code className="rounded bg-muted px-1">.env</code> to enable the PM2
                  dashboard link.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
