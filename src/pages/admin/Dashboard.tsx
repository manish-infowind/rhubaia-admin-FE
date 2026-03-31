import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, DollarSign, Sparkles, BarChart3, LineChart as LineChartIcon } from "lucide-react";
import { ChartCard } from "@/components/admin/dashboard/ChartCard";
import type { ChartConfig } from "@/components/admin/dashboard/ChartFilters";
import { useChartData } from "@/hooks/useChartData";
import { useDashboardStatsSummary } from "@/hooks/useDashboardStatsSummary";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import { AiUsageGraph } from "@/components/admin/ai-usage/AiUsageGraph";
import { AiUsageFilters } from "@/components/admin/ai-usage/AiUsageFilters";
import { useAiUsage } from "@/api/hooks/useAiUsage";
import type { AiUsageFilterState } from "@/api/types";

const DEFAULT_AI_USAGE_FILTERS: AiUsageFilterState = {
  operation: "all",
  success: null,
  userId: undefined,
  from: undefined,
  to: undefined,
  days: 30,
  page: 1,
  limit: 20,
};

const createChartConfig = (): ChartConfig => {
  const today = new Date();
  return {
    chartType: "line",
    timeRange: "monthly",
    gender: "all",
    dateRange: {
      from: (() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 3);
        return d;
      })(),
      to: today,
    },
    isDatePickerOpen: false,
    calendarMonth: (() => {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      return d;
    })(),
    selectedMonth: today.getMonth(),
    selectedYear: today.getFullYear(),
    selectedYears: [today.getFullYear()],
  };
};

const formatDateUTC = (date: Date, format: "daily" | "weekly" | "monthly"): string => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  if (format === "daily") {
    return `${months[date.getUTCMonth()]} ${String(date.getUTCDate()).padStart(2, "0")}, ${date.getUTCFullYear()}`;
  }

  if (format === "weekly") {
    return `Week ${Math.ceil(date.getUTCDate() / 7)} (${months[date.getUTCMonth()]} ${date.getUTCFullYear()})`;
  }

  return `${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
};

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
  if (Number.isNaN(parsed.getTime())) {
    return value.slice(0, 10);
  }

  return toUtcDayString(parsed);
};

export default function Dashboard() {
  const { data: statsSummary, isLoading: statsLoading } = useDashboardStatsSummary();

  const [userGrowthChart, setUserGrowthChart] = useState<ChartConfig>(createChartConfig());
  const [activeUsersChart, setActiveUsersChart] = useState<ChartConfig>(createChartConfig());
  const [revenueChart, setRevenueChart] = useState<ChartConfig>(createChartConfig());
  const [aiUsageFilters, setAiUsageFilters] = useState<AiUsageFilterState>(DEFAULT_AI_USAGE_FILTERS);
  const [aiUsageChartType, setAiUsageChartType] = useState<"bar" | "line">("line");

  const { data: userGrowthData, loading: userGrowthLoading } = useChartData(userGrowthChart, "userGrowth");
  const { data: activeUsersData, loading: activeUsersLoading } = useChartData(activeUsersChart, "activeUsers");
  const { data: revenueData, loading: revenueLoading } = useChartData(revenueChart, "revenue");
  const {
    operations: aiUsageOperations,
    graph: aiUsageGraph,
    graphLoading: aiUsageGraphLoading,
  } = useAiUsage(aiUsageFilters);

  const stats = useMemo(
    () =>
      statsSummary
        ? [
            {
              title: "Total Users",
              value: Number(statsSummary.totalUsers ?? 0).toLocaleString(),
              change: "All time",
              icon: Users,
              color: "bg-brand-green",
            },
            {
              title: "Daily Active Users",
              value: Number(statsSummary.dailyActiveUsers ?? 0).toLocaleString(),
              change: "Last 24 hours",
              icon: TrendingUp,
              color: "bg-brand-teal",
            },
            {
              title: "Monthly Active Users",
              value: Number(statsSummary.monthlyActiveUsers ?? 0).toLocaleString(),
              change: "Last 30 days",
              icon: Users,
              color: "bg-brand-teal",
            },
            {
              title: "User Growth",
              value: Number(statsSummary.newUsersThisMonth ?? 0).toLocaleString(),
              change: "New users this month",
              icon: TrendingUp,
              color: "bg-brand-green",
            },
          ]
        : [],
    [statsSummary],
  );

  const userGrowthChartData = useMemo(() => {
    const points = Array.isArray(userGrowthData?.userGrowth) ? userGrowthData.userGrowth : [];
    if (!points.length) return [];

    if (userGrowthChart.timeRange === "monthly" && userGrowthChart.selectedYears && userGrowthChart.selectedYears.length > 1) {
      const monthDataMap = new Map<string, Record<string, string | number>>();
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      points.forEach((item) => {
        const parts = item.date.split(" ");
        if (parts.length === 2) {
          const month = parts[0];
          const year = parts[1];
          if (!monthDataMap.has(month)) monthDataMap.set(month, { name: month });
          const monthData = monthDataMap.get(month)!;
          monthData[`${year} - Total Users`] = item.users;
          monthData[`${year} - New Users`] = item.newUsers;
        }
      });

      return Array.from(monthDataMap.values()).sort(
        (a, b) => months.indexOf(String(a.name)) - months.indexOf(String(b.name)),
      ) as Array<{ name: string; [key: string]: string | number }>;
    }

    return points.map((item) => ({
      name: item.date,
      "Total Users": item.users,
      "New Users": item.newUsers,
    }));
  }, [userGrowthData, userGrowthChart.timeRange, userGrowthChart.selectedYears]);

  const activeUsersChartData = useMemo(() => {
    const points = Array.isArray(activeUsersData?.activeUsers) ? activeUsersData.activeUsers : [];
    if (!points.length) return [];

    if (activeUsersChart.timeRange === "monthly" && activeUsersChart.selectedYears && activeUsersChart.selectedYears.length > 1) {
      const monthDataMap = new Map<string, Record<string, string | number>>();
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      points.forEach((item) => {
        const parts = item.date.split(" ");
        if (parts.length === 2) {
          const month = parts[0];
          const year = parts[1];
          if (!monthDataMap.has(month)) monthDataMap.set(month, { name: month });
          const monthData = monthDataMap.get(month)!;
          monthData[`${year} - Daily Active`] = item.dailyActive;
          monthData[`${year} - Monthly Active`] = item.monthlyActive;
        }
      });

      return Array.from(monthDataMap.values()).sort(
        (a, b) => months.indexOf(String(a.name)) - months.indexOf(String(b.name)),
      ) as Array<{ name: string; [key: string]: string | number }>;
    }

    return points.map((item) => ({
      name: item.date,
      "Daily Active": item.dailyActive,
      "Monthly Active": item.monthlyActive,
    }));
  }, [activeUsersData, activeUsersChart.timeRange, activeUsersChart.selectedYears]);

  const revenueChartData = useMemo((): Array<{ name: string; [key: string]: string | number }> => {
    const analytics = Array.isArray(revenueData?.revenueAnalytics) ? revenueData.revenueAnalytics : [];
    if (!analytics.length) return [];

    if (revenueChart.timeRange === "monthly" && revenueChart.selectedYears && revenueChart.selectedYears.length > 1) {
      const monthDataMap = new Map<string, { name: string; [key: string]: string | number }>();
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      analytics.forEach((item) => {
        const parsed = new Date(item.date);
        if (Number.isNaN(parsed.getTime())) return;
        const monthShort = months[parsed.getUTCMonth()];
        const yearNum = parsed.getUTCFullYear();
        if (!revenueChart.selectedYears?.includes(yearNum)) return;

        if (!monthDataMap.has(monthShort)) {
          monthDataMap.set(monthShort, { name: monthShort });
        }

        const monthData = monthDataMap.get(monthShort)!;
        monthData[`${yearNum} - Average Revenue Per User`] = item.averageRevenuePerUser;
        monthData[`${yearNum} - Average Revenue Per Paying User`] = item.averageRevenuePerPayingUser;
        monthData[`${yearNum} - Free to Paid Rate`] = item.freeToPaidRate;
      });

      return Array.from(monthDataMap.values()).sort(
        (a, b) => months.indexOf(String(a.name)) - months.indexOf(String(b.name)),
      );
    }

    return analytics.map((item) => {
      const parsed = new Date(item.date);
      const dateLabel = Number.isNaN(parsed.getTime())
        ? item.date
        : revenueChart.timeRange === "weekly"
          ? formatDateUTC(parsed, "weekly")
          : revenueChart.timeRange === "monthly"
            ? formatDateUTC(parsed, "monthly")
            : formatDateUTC(parsed, "daily");

      const chartData: { name: string; [key: string]: string | number } = {
        name: dateLabel,
        "Average Revenue Per User": item.averageRevenuePerUser,
        "Average Revenue Per Paying User": item.averageRevenuePerPayingUser,
        "Free to Paid Rate": item.freeToPaidRate,
      };

      return chartData;
    });
  }, [revenueData, revenueChart.timeRange, revenueChart.selectedYears]);

  const aiUsagePoints = useMemo(() => {
    const points = aiUsageGraph?.points ?? [];
    return points.map((point) => ({
      ...point,
      day: normalizeGraphDay(point.day),
    }));
  }, [aiUsageGraph]);

  if (statsLoading) {
    return <PageLoader pagename="dashboard" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        page="dashboard"
        heading="Dashboard"
        subHeading="Welcome to your Rhubaia admin panel. Manage your website content from here"
      />

      <motion.div
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.color}`}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="space-y-6">
        <ChartCard
          title="User Growth Analytics"
          icon={Users}
          iconColor="text-brand-green"
          config={userGrowthChart}
          onConfigChange={setUserGrowthChart}
          data={userGrowthChartData}
          dataKeys={
            userGrowthChart.timeRange === "monthly" && userGrowthChart.selectedYears && userGrowthChart.selectedYears.length > 1
              ? userGrowthChart.selectedYears.flatMap((year) => [`${year} - Total Users`, `${year} - New Users`])
              : ["Total Users", "New Users"]
          }
          delay={0.2}
          originalData={userGrowthData}
          loading={userGrowthLoading}
        />

        <ChartCard
          title="Active Users Analytics"
          icon={TrendingUp}
          iconColor="text-brand-teal"
          config={activeUsersChart}
          onConfigChange={setActiveUsersChart}
          data={activeUsersChartData}
          dataKeys={
            activeUsersChart.timeRange === "monthly" && activeUsersChart.selectedYears && activeUsersChart.selectedYears.length > 1
              ? activeUsersChart.selectedYears.flatMap((year) => [`${year} - Daily Active`, `${year} - Monthly Active`])
              : ["Daily Active", "Monthly Active"]
          }
          delay={0.3}
          originalData={activeUsersData}
          loading={activeUsersLoading}
        />

        <ChartCard
          title="Monetization and Finance Analytics"
          icon={DollarSign}
          iconColor="text-brand-green"
          config={revenueChart}
          onConfigChange={setRevenueChart}
          data={revenueChartData}
          dataKeys={
            revenueChart.timeRange === "monthly" && revenueChart.selectedYears && revenueChart.selectedYears.length > 1
              ? revenueChart.selectedYears.flatMap((year) => [
                  `${year} - Average Revenue Per User`,
                  `${year} - Average Revenue Per Paying User`,
                  `${year} - Free to Paid Rate`,
                ])
              : [
                  "Average Revenue Per User",
                  "Average Revenue Per Paying User",
                  "Free to Paid Rate",
                ]
          }
          delay={0.5}
          originalData={revenueData}
          loading={revenueLoading}
        />

        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg mb-4">
              <Sparkles className="h-5 w-5 text-brand-green" />
              AI Usage Analytics
            </CardTitle>
            <AiUsageFilters
              filters={aiUsageFilters}
              operations={aiUsageOperations?.items || []}
              hideUserId
              onChange={(updates) =>
                setAiUsageFilters((prev) => ({
                  ...prev,
                  ...updates,
                  page: 1,
                }))
              }
              onReset={() => setAiUsageFilters(DEFAULT_AI_USAGE_FILTERS)}
            />
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="flex w-fit items-center gap-1 rounded-lg border p-1">
              <button
                type="button"
                onClick={() => setAiUsageChartType("bar")}
                className={`flex h-8 items-center gap-1 rounded-md px-3 text-sm ${
                  aiUsageChartType === "bar" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Bar
              </button>
              <button
                type="button"
                onClick={() => setAiUsageChartType("line")}
                className={`flex h-8 items-center gap-1 rounded-md px-3 text-sm ${
                  aiUsageChartType === "line" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                }`}
              >
                <LineChartIcon className="h-4 w-4" />
                Line
              </button>
            </div>

            <AiUsageGraph
              title={
                aiUsageFilters.operation === "all"
                  ? "AI Usage Trend (All Operations)"
                  : `AI Usage Trend (${aiUsageOperations?.items.find((item) => item.operation === aiUsageFilters.operation)?.label || "AI Usage"})`
              }
              points={aiUsagePoints}
              summary={aiUsageGraph?.summary || null}
              loading={aiUsageGraphLoading}
              chartType={aiUsageChartType}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
