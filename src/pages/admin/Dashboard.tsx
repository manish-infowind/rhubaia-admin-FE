import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  TrendingUp,
  DollarSign,
  MessageSquare,
  Shield,
  MapPin,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { productStore } from "@/lib/productStore";
import { DashboardService } from "@/api/services/dashboardService";
import { useToast } from "@/hooks/use-toast";
import { ChartCard } from "@/components/admin/dashboard/ChartCard";
import { ChartConfig } from "@/components/admin/dashboard/ChartFilters";
import { useChartData } from "@/hooks/useChartData";
import { useDashboardStatsSummary } from "@/hooks/useDashboardStatsSummary";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import { ActivityMap } from "@/components/admin/dashboard/ActivityMap";

// Helper function to create initial chart config
const createChartConfig = (): ChartConfig => {
  const today = new Date();
  return {
    chartType: 'bar',
    timeRange: 'monthly',
    gender: 'all',
    dateRange: {
      from: (() => { const d = new Date(); d.setMonth(d.getMonth() - 3); return d; })(),
      to: today,
    },
    isDatePickerOpen: false,
    calendarMonth: (() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d; })(),
    selectedMonth: today.getMonth(),
    selectedYear: today.getFullYear(),
    selectedYears: [today.getFullYear()],
  };
};

// Helper function to format dates using UTC to avoid timezone shifts
const formatDateUTC = (date: Date, format: 'daily' | 'weekly' | 'monthly'): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  if (format === 'daily') {
    const day = date.getUTCDate().toString().padStart(2, '0');
    const month = months[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    return `${month} ${day}, ${year}`;
  } else if (format === 'weekly') {
    const month = months[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    // Calculate week number: get the day of the month and divide by 7, rounding up
    // Week 1 is days 1-7, Week 2 is days 8-14, etc.
    const dayOfMonth = date.getUTCDate();
    const weekNum = Math.ceil(dayOfMonth / 7);
    return `Week ${weekNum} (${month} ${year})`;
  } else {
    // Monthly format
    const month = months[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    return `${month} ${year}`;
  }
};

export default function Dashboard() {
  const { toast } = useToast();

  const [products, setProducts] = useState(productStore.getProducts());
  const [syncing, setSyncing] = useState(false);

  // Separate state for each chart
  const [userGrowthChart, setUserGrowthChart] = useState<ChartConfig>(createChartConfig());
  const [activeUsersChart, setActiveUsersChart] = useState<ChartConfig>(createChartConfig());
  const [conversionChart, setConversionChart] = useState<ChartConfig>({
    ...createChartConfig(),
    conversionType: 'subscription', // Default conversion type
  });
  const [revenueChart, setRevenueChart] = useState<ChartConfig>(createChartConfig());
  const [conversationChart, setConversationChart] = useState<ChartConfig>(createChartConfig());
  const [appStoreInstallStatsChart, setAppStoreInstallStatsChart] = useState<ChartConfig>(createChartConfig());
  const [safetyChart, setSafetyChart] = useState<ChartConfig>(createChartConfig());
  // Use custom hook for chart data
  // Fetch stats independently (NO FILTERS - stats remain static)
  const { data: statsSummary, isLoading: statsLoading } = useDashboardStatsSummary();
  
  // Use the new dedicated User Growth API for user growth chart
  const { data: userGrowthData, loading: userGrowthLoading } = useChartData(userGrowthChart, 'userGrowth');
  // Use the new dedicated Active Users API for active users chart
  const { data: activeUsersData, loading: activeUsersLoading } = useChartData(activeUsersChart, 'activeUsers');
  // Use the new dedicated Conversions API for conversion insights chart
  const { data: conversionData, loading: conversionLoading } = useChartData(conversionChart, 'conversions');
  // Use the new dedicated Revenue API for revenue analytics chart
  const { data: revenueData, loading: revenueLoading } = useChartData(revenueChart, 'revenue');
  // Use the new dedicated Conversation Analytics API for conversation analytics chart
  const { data: conversationData, loading: conversationLoading } = useChartData(conversationChart, 'conversationAnalytics');
  // Use the new dedicated App Store Install Stats API for install to signup ratio chart
  const { data: appStoreInstallStatsData, loading: appStoreInstallStatsLoading } = useChartData(appStoreInstallStatsChart, 'appStoreInstallStats');
  // Use the new dedicated Safety Metrics API for safety metrics chart
  const { data: safetyMetricsData, loading: safetyMetricsLoading } = useChartData(safetyChart, 'safetyMetrics');

  useEffect(() => {
    const unsubscribe = productStore.subscribe(() => {
      setProducts(productStore.getProducts());
    });
    return unsubscribe;
  }, []);

  // Handle sync user growth data
  const handleSyncUserGrowth = async () => {
    try {
      setSyncing(true);
      const response = await DashboardService.syncUserGrowth();

      if (response.success && response.data) {
        toast({
          title: "Sync Successful",
          description: `User growth analytics synced successfully for ${response.data.date}`,
        });

        // Force refresh user growth data by updating the chart config
        // This will trigger the useChartData hook to refetch
        setUserGrowthChart(prev => ({
          ...prev,
          // Update dateRange to trigger refresh
          dateRange: {
            from: prev.dateRange.from,
            to: new Date(), // Update to current date to trigger refresh
          },
        }));
      } else {
        toast({
          title: "Sync Failed",
          description: response.message || "Failed to sync user growth analytics",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error syncing user growth:', error);
      toast({
        title: "Sync Error",
        description: error.message || "An error occurred while syncing data",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };


  // Create stats cards from API data (independent from filters)

  const stats = statsSummary ? [
    {
      title: "Total Users",
      value: statsSummary.totalUsers.toLocaleString(),
      change: "All time",
      icon: Users,
      color: "bg-brand-green",
    },
    {
      title: "Daily Active Users",
      value: statsSummary.dailyActiveUsers.toLocaleString(),
      change: "Last 24 hours",
      icon: TrendingUp,
      color: "bg-brand-teal",
    },
    {
      title: "Monthly Active Users",
      value: statsSummary.monthlyActiveUsers.toLocaleString(),
      change: "Last 30 days",
      icon: Users,
      color: "bg-brand-teal",
    },
    {
      title: "User Growth",
      value: statsSummary.newUsersThisMonth.toString(),
      change: "New users this month",
      icon: TrendingUp,
      color: "bg-brand-green",
    }
  ] : [];

  // Prepare chart data for each chart
  const userGrowthChartData = useMemo(() => {
    if (!userGrowthData) return [];

    // Handle multi-year monthly comparison
    if (userGrowthChart.timeRange === 'monthly' && userGrowthChart.selectedYears && userGrowthChart.selectedYears.length > 1) {
      // Group data by month and create year-based keys
      const monthDataMap = new Map<string, Record<string, string | number>>();

      userGrowthData.userGrowth.forEach(item => {
        // Parse "Jan 2024" format
        const parts = item.date.split(' ');
        if (parts.length === 2) {
          const month = parts[0]; // "Jan"
          const year = parts[1]; // "2024"

          if (!monthDataMap.has(month)) {
            monthDataMap.set(month, { name: month });
          }

          const monthData = monthDataMap.get(month)!;
          monthData[`${year} - Total Users`] = item.users;
          monthData[`${year} - New Users`] = item.newUsers;
        }
      });

      // Convert map to array and sort by month order
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return Array.from(monthDataMap.values()).sort((a, b) => {
        const aName = typeof a.name === 'string' ? a.name : '';
        const bName = typeof b.name === 'string' ? b.name : '';
        return months.indexOf(aName) - months.indexOf(bName);
      }) as Array<{ name: string; [key: string]: string | number }>;
    }

    // Standard format for single year or other time ranges
    return userGrowthData.userGrowth.map(item => ({
      name: item.date,
      'Total Users': item.users,
      'New Users': item.newUsers,
    }));
  }, [userGrowthData, userGrowthChart.timeRange, userGrowthChart.selectedYears]);

  const activeUsersChartData = useMemo(() => {
    if (!activeUsersData) return [];

    // Handle multi-year monthly comparison
    if (activeUsersChart.timeRange === 'monthly' && activeUsersChart.selectedYears && activeUsersChart.selectedYears.length > 1) {
      const monthDataMap = new Map<string, Record<string, string | number>>();

      activeUsersData.activeUsers.forEach(item => {
        const parts = item.date.split(' ');
        if (parts.length === 2) {
          const month = parts[0];
          const year = parts[1];

          if (!monthDataMap.has(month)) {
            monthDataMap.set(month, { name: month });
          }

          const monthData = monthDataMap.get(month)!;
          monthData[`${year} - Daily Active`] = item.dailyActive;
          monthData[`${year} - Monthly Active`] = item.monthlyActive;
        }
      });

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return Array.from(monthDataMap.values()).sort((a, b) => {
        const aName = typeof a.name === 'string' ? a.name : '';
        const bName = typeof b.name === 'string' ? b.name : '';
        return months.indexOf(aName) - months.indexOf(bName);
      }) as Array<{ name: string; [key: string]: string | number }>;
    }

    return activeUsersData.activeUsers.map(item => ({
      name: item.date,
      'Daily Active': item.dailyActive,
      'Monthly Active': item.monthlyActive,
    }));
  }, [activeUsersData, activeUsersChart.timeRange, activeUsersChart.selectedYears]);
  // here i need to change to align the months in correct order
  const conversionChartData = useMemo(() => {
    if (!conversionData) return [];

    // For monthly multi-year comparison (bar, line, or pie), show grouped by month
    // with months on the X-axis (Jan, Feb, ...) and one series per year.
    if (
      conversionChart.timeRange === 'monthly' &&
      conversionChart.selectedYears &&
      conversionChart.selectedYears.length > 1
    ) {
      const monthDataMap = new Map<string, { name: string; [key: string]: number | string }>();

      const conversions = conversionData.conversions || [];

      conversions.forEach((item) => {
        const raw = item.metric;
        if (!raw) return;
        
        const parts = raw.split(' ');
        if(parts.length !==2 ) return;

        let monthLabel = parts[0];
        let yearNum = Number(parts[1]);

        if(isNaN(yearNum)) return;
        //removed the ISO parsing of date when we already have months name comming in API response so I used that 
        if (
          conversionChart.selectedYears &&
          !conversionChart.selectedYears.includes(yearNum)
        ) {
          return;
        }

        const monthKey = monthLabel;
        const yearKey = `${yearNum} - value`;

        const existing = monthDataMap.get(monthKey) || { name: monthLabel };
        const currentValue =
          typeof existing[yearKey] === 'number'
            ? (existing[yearKey] as number)
            : Number(existing[yearKey]) || 0;

        existing[yearKey] = currentValue + (item.value || 0);
        monthDataMap.set(monthKey, existing);
      });

      const monthsOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      return Array.from(monthDataMap.values()).sort((a, b) => {
        const aIndex = monthsOrder.indexOf(String(a.name));
        const bIndex = monthsOrder.indexOf(String(b.name));
        return aIndex - bIndex;
      });
    }

    // Default: single series using value over date/metric
    const items = conversionData.conversions || [];

    // Sort by actual date (if available) so months are always in proper sequence
    const withTime = items.map(item => {
      const raw = item.date || item.metric;
      const parsed = raw ? new Date(raw) : null;
      const time = parsed && !isNaN(parsed.getTime()) ? parsed.getTime() : 0;
      return { item, time };
    });

    withTime.sort((a, b) => a.time - b.time);

    return withTime.map(({ item }) => ({
      // Use metric for X-axis label (formatted label like "Jan 2024", "Week 1", etc.)
      // date is used for sorting only (as per API documentation)
      name: item.metric || item.date || '',
      value: item.value,
      percentage: item.percentage,
    }));
  }, [
    conversionData,
    conversionChart.timeRange,
    conversionChart.selectedYears,
    conversionChart.chartType,
  ]);
  const revenueChartData = useMemo((): Array<{ name: string; [key: string]: string | number }> => {
    if (!revenueData || !revenueData.revenueAnalytics) return [];

    const revenueAnalytics = revenueData.revenueAnalytics;

    // Handle multi-year monthly comparison
    if (revenueChart.timeRange === 'monthly' && revenueChart.selectedYears && revenueChart.selectedYears.length > 1) {
      const monthDataMap = new Map<string, { name: string; [key: string]: string | number }>();

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      revenueAnalytics.forEach(item => {
        // Parse ISO date string through UTC function 
        const parsed = new Date(item.date);
        if (isNaN(parsed.getTime())) return;

        const monthShort = months[parsed.getUTCMonth()];
        const yearNum = parsed.getUTCFullYear();

        if (!revenueChart.selectedYears || !revenueChart.selectedYears.includes(yearNum)) {
          return;
        }

        if (!monthDataMap.has(monthShort)) {
          monthDataMap.set(monthShort, { name: monthShort });
        }

        const monthData = monthDataMap.get(monthShort)!;
        monthData[`${yearNum} - Average Revenue Per User`] = item.averageRevenuePerUser;
        monthData[`${yearNum} - Average Revenue Per Paying User`] = item.averageRevenuePerPayingUser;
        monthData[`${yearNum} - Churn Rate`] = item.churnRate;
        monthData[`${yearNum} - Free to Paid Rate`] = item.freeToPaidRate;
        if (item.averageLtv !== undefined) {
          monthData[`${yearNum} - Inactive Users Life Time Value`] = item.averageLtv;
        }
      });

      // Convert map to array and sort by month order
      // const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return Array.from(monthDataMap.values()).sort((a, b) => {
        const aName = typeof a.name === 'string' ? a.name : '';
        const bName = typeof b.name === 'string' ? b.name : '';
        return months.indexOf(aName) - months.indexOf(bName);
      }) as Array<{ name: string; [key: string]: string | number }>;
    }

    // Standard format for single year or other time ranges
    return revenueAnalytics.map(item => {
      // Format date for display using UTC to avoid timezone shifts
      const parsed = new Date(item.date);
      let dateLabel = '';
      if (!isNaN(parsed.getTime())) {
        if (revenueChart.timeRange === 'daily' || revenueChart.timeRange === 'custom') {
          // For daily and custom ranges, use UTC formatting to avoid timezone shifts
          dateLabel = formatDateUTC(parsed, 'daily');
        } else if (revenueChart.timeRange === 'weekly') {
          // For weekly, use UTC formatting
          dateLabel = formatDateUTC(parsed, 'weekly');
        } else {
          // Monthly format: "Jan 2024" - use UTC formatting
          dateLabel = formatDateUTC(parsed, 'monthly');
        }
      } else {
        dateLabel = item.date;
      }

      const chartData: { name: string; [key: string]: string | number } = {
        name: dateLabel,
        'Average Revenue Per User': item.averageRevenuePerUser,
        'Average Revenue Per Paying User': item.averageRevenuePerPayingUser,
        'Churn Rate': item.churnRate,
        'Free to Paid Rate': item.freeToPaidRate,
      };
      
      if (item.averageLtv !== undefined) {
        chartData['Inactive Users Life Time Value'] = item.averageLtv;
      }
      
      return chartData;
    });
  }, [revenueData, revenueChart.timeRange, revenueChart.selectedYears]);

  const conversationChartData = useMemo((): Array<{ name: string; [key: string]: string | number }> => {
    if (!conversationData || !conversationData.conversationAnalytics) return [];

    const conversationAnalytics = conversationData.conversationAnalytics;

    // Handle multi-year monthly comparison
    if (conversationChart.timeRange === 'monthly' && conversationChart.selectedYears && conversationChart.selectedYears.length > 1) {
      const monthDataMap = new Map<string, { name: string; [key: string]: string | number }>();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      conversationAnalytics.forEach(item => {
        // Parse ISO date string through UTC function 
        const parsed = new Date(item.date);
        if (isNaN(parsed.getTime())) return;

        const monthShort = months[parsed.getUTCMonth()];
        const yearNum = parsed.getUTCFullYear();

        if (!conversationChart.selectedYears || !conversationChart.selectedYears.includes(yearNum)) {
          return;
        }

        if (!monthDataMap.has(monthShort)) {
          monthDataMap.set(monthShort, { name: monthShort });
        }

        const monthData = monthDataMap.get(monthShort)!;
        monthData[`${yearNum} - Conversation Initiation Rate`] = item.conversationInitiationRate;
        monthData[`${yearNum} - Messages Per Match`] = item.messagesPerMatch;
        monthData[`${yearNum} - Ghosting Rate`] = item.ghostingRate;
        if (item.swipeToMatchRate !== undefined) {
          monthData[`${yearNum} - Swipe to Match Rate`] = item.swipeToMatchRate;
        }
      });

      // Convert map to array and sort by month order
      
      return Array.from(monthDataMap.values()).sort((a, b) => {
        const aName = typeof a.name === 'string' ? a.name : '';
        const bName = typeof b.name === 'string' ? b.name : '';
        return months.indexOf(aName) - months.indexOf(bName);
      });
    }

    // Standard format for single year or other time ranges
    return conversationAnalytics.map(item => {
      // Format date for display using UTC to avoid timezone shifts
      const parsed = new Date(item.date);
      let dateLabel = '';
      if (!isNaN(parsed.getTime())) {
        if (conversationChart.timeRange === 'daily' || conversationChart.timeRange === 'custom') {
          // For daily and custom ranges, use UTC formatting to avoid timezone shifts
          dateLabel = formatDateUTC(parsed, 'daily');
        } else if (conversationChart.timeRange === 'weekly') {
          // For weekly, use UTC formatting
          dateLabel = formatDateUTC(parsed, 'weekly');
        } else {
          // Monthly format: "Jan 2024" - use UTC formatting
          dateLabel = formatDateUTC(parsed, 'monthly');
        }
      } else {
        dateLabel = item.date;
      }

      const chartData: { name: string; [key: string]: string | number } = {
        name: dateLabel,
        'Conversation Initiation Rate': item.conversationInitiationRate,
        'Messages Per Match': item.messagesPerMatch,
        'Ghosting Rate': item.ghostingRate,
      };
      
      if (item.swipeToMatchRate !== undefined) {
        chartData['Swipe to Match Rate'] = item.swipeToMatchRate;
      }
      
      return chartData;
    });
  }, [conversationData, conversationChart.timeRange, conversationChart.selectedYears]);

  const appStoreInstallStatsChartData = useMemo((): Array<{ name: string; [key: string]: string | number }> => {
    if (!appStoreInstallStatsData || !appStoreInstallStatsData.appStoreInstallStats) return [];

    const appStoreInstallStats = appStoreInstallStatsData.appStoreInstallStats;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Handle multi-year monthly comparison
    if (appStoreInstallStatsChart.timeRange === 'monthly' && appStoreInstallStatsChart.selectedYears && appStoreInstallStatsChart.selectedYears.length > 1) {
      const monthDataMap = new Map<string, { name: string; [key: string]: string | number }>();

      appStoreInstallStats.forEach(item => {
        // Parse date string - handle both "Jan 21, 2026" and "Jan 2026" formats
        const parts = item.date.split(' ');
        if (parts.length === 2) {
          // Monthly format: "Jan 2026"
          const month = parts[0];
          const year = parseInt(parts[1]);

          if (isNaN(year) || !appStoreInstallStatsChart.selectedYears?.includes(year)) {
            return;
          }

          if (!monthDataMap.has(month)) {
            monthDataMap.set(month, { name: month });
          }

          const monthData = monthDataMap.get(month)!;
          monthData[`${year} - Signup Percentage`] = item.signupPercentage;
        } else if (parts.length === 3) {
          // Daily format: "Jan 21, 2026" - extract month and year
          const month = parts[0];
          const year = parseInt(parts[2]);

          if (isNaN(year) || !appStoreInstallStatsChart.selectedYears?.includes(year)) {
            return;
          }

          if (!monthDataMap.has(month)) {
            monthDataMap.set(month, { name: month });
          }

          const monthData = monthDataMap.get(month)!;
          // For daily data in monthly view, we might want to aggregate or use the latest value
          // For now, we'll use the latest value for that month
          const existingValue = monthData[`${year} - Signup Percentage`] as number | undefined;
          if (existingValue === undefined || item.signupPercentage > existingValue) {
            monthData[`${year} - Signup Percentage`] = item.signupPercentage;
          }
        }
      });

      // Convert map to array and sort by month order
      return Array.from(monthDataMap.values()).sort((a, b) => {
        const aName = typeof a.name === 'string' ? a.name : '';
        const bName = typeof b.name === 'string' ? b.name : '';
        return months.indexOf(aName) - months.indexOf(bName);
      });
    }

    // Standard format for single year or other time ranges
    return appStoreInstallStats.map(item => {
      // Use the date as-is from API (already formatted as "Jan 21, 2026" or "Jan 2026")
      // For daily/weekly/custom, the date should already be in the correct format
      let dateLabel = item.date;

      // If we need to format it differently for display, parse and reformat
      if (appStoreInstallStatsChart.timeRange === 'daily' || appStoreInstallStatsChart.timeRange === 'custom') {
        // Try to parse and ensure consistent format using UTC to avoid timezone shifts
        const parsed = new Date(item.date);
        if (!isNaN(parsed.getTime())) {
          dateLabel = formatDateUTC(parsed, 'daily');
        }
      } else if (appStoreInstallStatsChart.timeRange === 'weekly') {
        // Check if the date is already in "Week X (Month YYYY)" format from API
        const weekPattern = /^Week \d+ \([A-Za-z]{3} \d{4}\)$/;
        if (weekPattern.test(item.date)) {
          // Use the date as-is if it's already in the correct format
          dateLabel = item.date;
        } else {
          // Try to parse as a date and format it using UTC
          const parsed = new Date(item.date);
          if (!isNaN(parsed.getTime())) {
            dateLabel = formatDateUTC(parsed, 'weekly');
          }
        }
      }
      // For monthly, use the date as-is (should be "Jan 2026" format)

      return {
        name: dateLabel,
        'Signup Percentage': item.signupPercentage,
      };
    });
  }, [appStoreInstallStatsData, appStoreInstallStatsChart.timeRange, appStoreInstallStatsChart.selectedYears]);

  const safetyMetricsChartData = useMemo((): Array<{ name: string; [key: string]: string | number }> => {
    if (!safetyMetricsData || !safetyMetricsData.safetyMetrics) return [];

    const safetyMetrics = safetyMetricsData.safetyMetrics;
    
    // Helper function to check if an item should use totals
    const shouldUseTotals = (item: typeof safetyMetrics[0]) => {
      return item.totalReports !== undefined && 
             item.totalBannedAccounts !== undefined &&
             typeof item.totalReports === 'number' &&
             typeof item.totalBannedAccounts === 'number';
    };
    
    // Helper function to check if reportRate/banRate are valid numbers (not "no sufficient data")
    const hasValidRates = (item: typeof safetyMetrics[0]) => {
      return (typeof item.reportRate === 'number' && !isNaN(item.reportRate)) &&
             (typeof item.banRate === 'number' && !isNaN(item.banRate));
    };

    // Handle multi-year monthly comparison
    if (safetyChart.timeRange === 'monthly' && safetyChart.selectedYears && safetyChart.selectedYears.length > 1) {
      const monthDataMap = new Map<string, { name: string; [key: string]: string | number }>();

      safetyMetrics.forEach(item => {
        // Parse date string - handle both "Jan 01, 2024" and "Jan 2024" formats
        const parts = item.date.split(' ');
        if (parts.length === 2) {
          // Monthly format: "Jan 2024"
          const month = parts[0];
          const year = parseInt(parts[1]);

          if (isNaN(year) || !safetyChart.selectedYears?.includes(year)) {
            return;
          }

          if (!monthDataMap.has(month)) {
            monthDataMap.set(month, { name: month });
          }

          const monthData = monthDataMap.get(month)!;
          // Use totals if available, otherwise use rates if they are valid numbers
          if (shouldUseTotals(item)) {
            monthData[`${year} - Total Reports`] = item.totalReports!;
            monthData[`${year} - Total Banned Accounts`] = item.totalBannedAccounts!;
          } else if (hasValidRates(item)) {
            monthData[`${year} - Report Rate`] = item.reportRate as number;
            monthData[`${year} - Ban Rate`] = item.banRate as number;
          }
          monthData[`${year} - Moderation Backlog`] = item.moderationBacklog;
        } else if (parts.length === 3) {
          // Daily format: "Jan 01, 2024" - extract month and year
          const month = parts[0];
          const year = parseInt(parts[2]);

          if (isNaN(year) || !safetyChart.selectedYears?.includes(year)) {
            return;
          }

          if (!monthDataMap.has(month)) {
            monthDataMap.set(month, { name: month });
          }

          const monthData = monthDataMap.get(month)!;
          // For daily data in monthly view, aggregate or use the latest value
          // Use totals if available, otherwise use rates if they are valid numbers
          if (shouldUseTotals(item)) {
            monthData[`${year} - Total Reports`] = item.totalReports!;
            monthData[`${year} - Total Banned Accounts`] = item.totalBannedAccounts!;
          } else if (hasValidRates(item)) {
            monthData[`${year} - Report Rate`] = item.reportRate as number;
            monthData[`${year} - Ban Rate`] = item.banRate as number;
          }
          monthData[`${year} - Moderation Backlog`] = item.moderationBacklog;
        }
      });

      // Convert map to array and sort by month order
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return Array.from(monthDataMap.values()).sort((a, b) => {
        const aName = typeof a.name === 'string' ? a.name : '';
        const bName = typeof b.name === 'string' ? b.name : '';
        return months.indexOf(aName) - months.indexOf(bName);
      });
    }

    // Standard format for single year or other time ranges
    // Use the backend-provided date string directly (already formatted and UTC-based)
    return safetyMetrics.map(item => {
      const baseData: { name: string; [key: string]: string | number } = {
        name: item.date,
        'Moderation Backlog': item.moderationBacklog,
      };
      
      // Use totals if available, otherwise use rates if they are valid numbers
      if (shouldUseTotals(item)) {
        baseData['Total Reports'] = item.totalReports!;
        baseData['Total Banned Accounts'] = item.totalBannedAccounts!;
      } else if (hasValidRates(item)) {
        baseData['Report Rate'] = item.reportRate as number;
        baseData['Ban Rate'] = item.banRate as number;
      }
      
      return baseData;
    });
  }, [safetyMetricsData, safetyChart.timeRange, safetyChart.selectedYears]);

  // Memoize the dataKeys for Safety Metrics chart
  // Include all possible keys since different dates might have different data structures
  const safetyMetricsDataKeys = useMemo(() => {
    if (safetyChart.timeRange === 'monthly' && safetyChart.selectedYears && safetyChart.selectedYears.length > 1) {
      return safetyChart.selectedYears.flatMap(year => [
        `${year.toString()} - Total Reports`,
        `${year.toString()} - Total Banned Accounts`,
        `${year.toString()} - Report Rate`,
        `${year.toString()} - Ban Rate`,
        `${year.toString()} - Moderation Backlog`
      ]);
    }
    // Include all possible keys - the chart will only show bars for keys that have data
    return ['Total Reports', 'Total Banned Accounts', 'Report Rate', 'Ban Rate', 'Moderation Backlog'];
  }, [safetyChart.timeRange, safetyChart.selectedYears]);

  if (statsLoading) {
    return (
      <PageLoader pagename="dashboard" />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        page="dashboard"
        heading="Dashboard"
        subHeading="Welcome to your Pinaypal admin panel. Manage your website content from here"
      />

      {/* Stats Cards */}
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
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div
                  className={`h-8 w-8 rounded-lg ${stat.color} flex items-center justify-center`}
                >
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

      {/* Analytics Charts Section - Stacked Vertically */}
      <div className="space-y-6">
        {/* User Growth Chart */}
        <ChartCard
          title="User Growth Analytics"
          icon={Users}
          iconColor="text-brand-green"
          config={userGrowthChart}
          onConfigChange={setUserGrowthChart}
          data={userGrowthChartData}
          dataKeys={
            userGrowthChart.timeRange === 'monthly' && userGrowthChart.selectedYears && userGrowthChart.selectedYears.length > 1
              ? userGrowthChart.selectedYears.flatMap(year => [`${year.toString()} - Total Users`, `${year.toString()} - New Users`])
              : ['Total Users', 'New Users']
          }
          delay={0.2}
          originalData={userGrowthData}
          loading={userGrowthLoading}
        />

        {/* Active Users Chart */}
        <ChartCard
          title="Active Users Analytics"
          icon={TrendingUp}
          iconColor="text-brand-teal"
          config={activeUsersChart}
          onConfigChange={setActiveUsersChart}
          data={activeUsersChartData}
          dataKeys={
            activeUsersChart.timeRange === 'monthly' && activeUsersChart.selectedYears && activeUsersChart.selectedYears.length > 1
              ? activeUsersChart.selectedYears.flatMap(year => [`${year.toString()} - Daily Active`, `${year.toString()} - Monthly Active`])
              : ['Daily Active', 'Monthly Active']
          }
          delay={0.3}
          originalData={activeUsersData}
          loading={activeUsersLoading}
        />

        {/* Conversion Insights Chart */}
        <ChartCard
          title="Conversion Insights Analytics"
          icon={TrendingUp}
          iconColor="text-brand-blue"
          config={conversionChart}
          onConfigChange={setConversionChart}
          data={conversionChartData}
          dataKeys={
            conversionChart.timeRange === 'monthly' && conversionChart.selectedYears && conversionChart.selectedYears.length > 1
              ? conversionChart.selectedYears.map(year => `${year.toString()} - value`)
              : ['value']
          }
          delay={0.4}
          originalData={conversionData}
          loading={conversionLoading}
        />

        {/* Monetization and Finance Analytics Chart */}
        <ChartCard
          title="Monetization and Finance Analytics"
          icon={DollarSign}
          iconColor="text-brand-green"
          config={revenueChart}
          onConfigChange={setRevenueChart}
          data={revenueChartData}
          dataKeys={
            revenueChart.timeRange === 'monthly' && revenueChart.selectedYears && revenueChart.selectedYears.length > 1
              ? revenueChart.selectedYears.flatMap(year => [
                  `${year.toString()} - Average Revenue Per User`,
                  `${year.toString()} - Average Revenue Per Paying User`,
                  `${year.toString()} - Churn Rate`,
                  `${year.toString()} - Free to Paid Rate`,
                  `${year.toString()} - Inactive Users Life Time Value`
                ])
              : ['Average Revenue Per User', 'Average Revenue Per Paying User', 'Churn Rate', 'Free to Paid Rate', 'Inactive Users Life Time Value']
          }
          delay={0.5}
          originalData={revenueData}
          loading={revenueLoading}
        />

        {/* Conversation Analytics Chart */}
        <ChartCard
          title="Conversation Analytics"
          icon={MessageSquare}
          iconColor="text-brand-blue"
          config={conversationChart}
          onConfigChange={setConversationChart}
          data={conversationChartData}
          dataKeys={
            conversationChart.timeRange === 'monthly' && conversationChart.selectedYears && conversationChart.selectedYears.length > 1
              ? conversationChart.selectedYears.flatMap(year => [
                  `${year.toString()} - Conversation Initiation Rate`,
                  `${year.toString()} - Messages Per Match`,
                  `${year.toString()} - Ghosting Rate`,
                  `${year.toString()} - Swipe to Match Rate`
                ])
              : ['Conversation Initiation Rate', 'Messages Per Match', 'Ghosting Rate', 'Swipe to Match Rate']
          }
          delay={0.6}
          originalData={conversationData}
          loading={conversationLoading}
        />

        {/* Install to Signup Ratio Chart */}
        <ChartCard
          title="Install to Signup Ratio"
          icon={TrendingUp}
          iconColor="text-brand-green"
          config={appStoreInstallStatsChart}
          onConfigChange={setAppStoreInstallStatsChart}
          data={appStoreInstallStatsChartData}
          dataKeys={
            appStoreInstallStatsChart.timeRange === 'monthly' && appStoreInstallStatsChart.selectedYears && appStoreInstallStatsChart.selectedYears.length > 1
              ? appStoreInstallStatsChart.selectedYears.map(year => `${year.toString()} - Signup Percentage`)
              : ['Signup Percentage']
          }
          delay={0.7}
          originalData={appStoreInstallStatsData}
          loading={appStoreInstallStatsLoading}
        />

        {/* Safety Metrics Chart */}
        <ChartCard
          title="Safety Metrics"
          icon={Shield}
          iconColor="text-red-500"
          config={safetyChart}
          onConfigChange={setSafetyChart}
          data={safetyMetricsChartData}
          dataKeys={safetyMetricsDataKeys}
          delay={0.8}
          originalData={safetyMetricsData}
          loading={safetyMetricsLoading}
        />

        {/* User Activity Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg mb-4">
                <MapPin className="h-5 w-5 text-brand-teal" />
                User Activity Map
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ActivityMap />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
