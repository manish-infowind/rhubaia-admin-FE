import { useState, useMemo } from "react";
import { BarChart, Bar, LineChart as RechartsLineChart, Line, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ArrowLeft } from "lucide-react";

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6'];

interface ChartData {
  name: string;
  [key: string]: string | number;
}

interface ChartRendererProps {
  data: ChartData[];
  chartType: 'bar' | 'line';
  dataKeys: string[];
  height?: number;
  isMultiYearMonthly?: boolean;
  selectedYears?: number[];
  originalData?: any; // Original analytics data for year breakdown
  conversionType?: string; // For conversion insights chart
}

export function ChartRenderer({ data, chartType, dataKeys, height = 400, isMultiYearMonthly = false, selectedYears, originalData, conversionType }: ChartRendererProps) {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  
  // Helper function to check if we should format Y-axis ticks as percentages
  const shouldFormatAsPercentage = (keys: string[]) => {
    return keys.some(key => 
      (key.includes('Report Rate') && !key.includes('Total Reports')) ||
      (key.includes('Ban Rate') && !key.includes('Total Banned Accounts'))
    );
  };
  
  // Y-axis tick formatter for percentage metrics
  const formatYAxisTick = (value: number) => {
    if (shouldFormatAsPercentage(dataKeys)) {
      return `${value}%`;
    }
    return value.toString();
  };
  
  // Custom tooltip formatter to add dollar signs to revenue metrics and percentage to rate metrics
  const formatTooltipValue = (value: number, dataKey: string | undefined, name: string | undefined) => {
    if (value === undefined || value === null || isNaN(value)) {
      return 'N/A';
    }
    // Check if this is a revenue metric that should have dollar signs
    const keyToCheck = dataKey || name || '';
    if (keyToCheck && (
      keyToCheck.includes('Average Revenue Per User') || 
      keyToCheck.includes('Average Revenue Per Paying User') ||
      keyToCheck.includes('Inactive Users Life Time Value')
    )) {
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    // Response time metrics (ms) – e.g. Radar (Matches), Feed, Avg Response (ms)
    if (keyToCheck && (keyToCheck.includes('Radar') || keyToCheck.includes('Feed') || keyToCheck.includes('Avg Response (ms)'))) {
      return `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ms`;
    }
    // Check if this is a rate metric that should have percentage symbol (but not Total Reports or Total Banned Accounts)
    if (keyToCheck && (
      keyToCheck.includes('Churn Rate') || 
      keyToCheck.includes('Free to Paid Rate') ||
      keyToCheck.includes('Conversation Initiation Rate') ||
      keyToCheck.includes('Ghosting Rate') ||
      keyToCheck.includes('Swipe to Match Rate') ||
      (keyToCheck.includes('Report Rate') && !keyToCheck.includes('Total Reports')) ||
      (keyToCheck.includes('Ban Rate') && !keyToCheck.includes('Total Banned Accounts'))
    )) {
      return `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
    }
    // Default formatting for other metrics (including Total Reports and Total Banned Accounts)
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Custom tooltip component (bar/line)
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
          <p className="font-semibold mb-2">{payload[0].payload.name}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="mb-1">
              {entry.name}: {formatTooltipValue(entry.value, entry.dataKey, entry.name)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Pie tooltip: show date + Report Rate, Moderation Backlog, Ban Rate (same as line graph for Safety Metrics)
  const formatPieMetricValue = (v: string | number | undefined): string => {
    if (v === undefined) return '—';
    if (typeof v === 'string') return v;
    if (typeof v === 'number' && !isNaN(v)) return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return '—';
  };
  const PieTooltipContent = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const p = payload[0].payload;
    const hasMetrics = p['Report Rate'] !== undefined || p['Moderation Backlog'] !== undefined || p['Ban Rate'] !== undefined || p['Total Reports'] !== undefined || p['Total Banned Accounts'] !== undefined;
    if (!hasMetrics) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
          <p className="font-semibold mb-2">{p.name}</p>
          <p className="text-muted-foreground">Total: {formatPieMetricValue(p.value)}</p>
        </div>
      );
    }
    const reportRateValid = typeof p['Report Rate'] === 'number' && !isNaN(p['Report Rate']);
    const banRateValid = typeof p['Ban Rate'] === 'number' && !isNaN(p['Ban Rate']);
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
        <p className="font-semibold mb-2">{p.name}</p>
        {reportRateValid ? (
          <p className="mb-1"><span className="text-muted-foreground">Report Rate:</span> {formatPieMetricValue(p['Report Rate'])}%</p>
        ) : (
          <p className="mb-1"><span className="text-muted-foreground">Total Reports:</span> {formatPieMetricValue(p['Total Reports'])}</p>
        )}
        <p className="mb-1"><span className="text-muted-foreground">Moderation Backlog:</span> {formatPieMetricValue(p['Moderation Backlog'])}</p>
        {banRateValid ? (
          <p className="mb-1"><span className="text-muted-foreground">Ban Rate:</span> {formatPieMetricValue(p['Ban Rate'])}%</p>
        ) : (
          <p className="mb-1"><span className="text-muted-foreground">Total Banned Accounts:</span> {formatPieMetricValue(p['Total Banned Accounts'])}</p>
        )}
      </div>
    );
  };
  
  // Calculate if we need dual Y-axis (when values have very different scales)
  // This must be called before any early returns to follow Rules of Hooks
  const needsDualAxis = useMemo(() => {
    if (dataKeys.length < 2 || !data || data.length === 0) return false;
    
    // Get max values for each data key
    const maxValues = dataKeys.map(key => {
      const values = data.map(item => {
        const val = item[key];
        return typeof val === 'number' ? val : Number(val) || 0;
      });
      return Math.max(...values, 0);
    });
    
    // If the ratio between max values is greater than 10, use dual axis
    const maxMax = Math.max(...maxValues);
    const minMax = Math.min(...maxValues.filter(v => v > 0));
    if (minMax === 0) return false;
    
    return maxMax / minMax > 10;
  }, [data, dataKeys]);
  
  // Early return if no data (after all hooks)
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">No data available</p>
        </div>
      </div>
    );
  }

  if (chartType === 'bar') {
    if (needsDualAxis && dataKeys.length === 2) {
      // Use dual Y-axis for bar chart when values have very different scales
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
              tick={{ fontSize: 11 }}
              stroke="#6b7280"
            />
            <YAxis 
              yAxisId="left"
              stroke={CHART_COLORS[0]}
              label={{ value: dataKeys[0], angle: -90, position: 'insideLeft' }}
              tickFormatter={formatYAxisTick}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke={CHART_COLORS[1]}
              label={{ value: dataKeys[1], angle: 90, position: 'insideRight' }}
              tickFormatter={formatYAxisTick}
            />
            <Tooltip 
              content={<CustomTooltip />}
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar 
              yAxisId="left"
              dataKey={dataKeys[0]} 
              fill={CHART_COLORS[0]} 
              radius={[4, 4, 0, 0]} 
            />
            <Bar 
              yAxisId="right"
              dataKey={dataKeys[1]} 
              fill={CHART_COLORS[1]} 
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        </ResponsiveContainer>
      );
    }
    
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={100}
            interval={0}
            tick={{ fontSize: 11 }}
            stroke="#6b7280"
          />
          <YAxis stroke="#6b7280" />
          <Tooltip 
            content={<CustomTooltip />}
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
          />
          <Legend />
          {dataKeys.map((key, index) => (
            <Bar 
              key={key} 
              dataKey={key} 
              fill={CHART_COLORS[index % CHART_COLORS.length]} 
              radius={[4, 4, 0, 0]} 
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === 'line') {
    if (needsDualAxis && dataKeys.length === 2) {
      // Use dual Y-axis for line chart when values have very different scales
      return (
        <ResponsiveContainer width="100%" height={height}>
          <RechartsLineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
              tick={{ fontSize: 11 }}
              stroke="#6b7280"
            />
            <YAxis 
              yAxisId="left"
              stroke={CHART_COLORS[0]}
              label={{ value: dataKeys[0], angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
              tickFormatter={formatYAxisTick}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke={CHART_COLORS[1]}
              label={{ value: dataKeys[1], angle: 90, position: 'insideRight', style: { textAnchor: 'middle' } }}
              tickFormatter={formatYAxisTick}
            />
            <Tooltip 
              content={<CustomTooltip />}
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone"
              dataKey={dataKeys[0]} 
              stroke={CHART_COLORS[0]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              yAxisId="right"
              type="monotone"
              dataKey={dataKeys[1]} 
              stroke={CHART_COLORS[1]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      );
    }
    
    return (
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={100}
            interval={0}
            tick={{ fontSize: 11 }}
            stroke="#6b7280"
          />
          <YAxis 
            stroke="#6b7280"
            tickFormatter={formatYAxisTick}
          />
          <Tooltip 
            content={<CustomTooltip />}
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
          />
          <Legend />
          {dataKeys.map((key, index) => (
            <Line 
              key={key} 
              type="monotone"
              dataKey={key} 
              stroke={CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    );
  }

  // Get year breakdown for selected month
  const getYearBreakdown = (monthName: string) => {
    if (!isMultiYearMonthly || !selectedYears || !monthName) return [];
    
    const yearData: Array<{ name: string; value: number }> = [];
    const monthData = data.find(d => d.name === monthName);
    
    if (monthData) {
      selectedYears.forEach((year) => {
        // For conversion insights, use "value" key; for others use "Total Users"
        const key = conversionType ? `${year} - value` : `${year} - Total Users`;
        const value = monthData[key];
        if (value !== undefined) {
          yearData.push({
            name: year.toString(),
            value: typeof value === 'number' ? value : Number(value) || 0
          });
        }
      });
    }
    
    return yearData;
  };

  // If month is selected, show year breakdown, otherwise show monthly data
  const yearBreakdownData = selectedMonth ? getYearBreakdown(selectedMonth) : [];
  
  // Pie chart: date-wise like other charts (one slice per date/row). For multiple dataKeys (e.g. Safety Metrics),
  // use sum of all metric values for that row so each date has one slice with a sensible value.
  const pieData = selectedMonth && yearBreakdownData.length > 0
    ? yearBreakdownData.map(item => ({
        name: item.name,
        value: item.value,
        originalName: item.name // For consistency
      }))
    : data.map(item => {
        const name = item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name;
        let value = 0;
        if (isMultiYearMonthly && selectedYears) {
          selectedYears.forEach((year) => {
            const key = conversionType ? `${year} - value` : `${year} - Total Users`;
            const yearValue = item[key];
            if (yearValue !== undefined) {
              value += typeof yearValue === 'number' ? yearValue : Number(yearValue) || 0;
            }
          });
        } else if (dataKeys && dataKeys.length > 0) {
          // Date-wise: one value per row. Single dataKey → use that key; multiple (e.g. Safety) → sum all metrics for that date
          if (dataKeys.length === 1) {
            const v = item[dataKeys[0]];
            value = typeof v === 'number' && !isNaN(v) ? v : Number(v) || 0;
          } else {
            value = dataKeys.reduce((sum, key) => {
              const v = item[key];
              return sum + (typeof v === 'number' && !isNaN(v) ? v : Number(v) || 0);
            }, 0);
          }
          if (value === 0 && item['value'] !== undefined) {
            value = typeof item['value'] === 'number' ? item['value'] : Number(item['value']) || 0;
          }
        }
        const slice: Record<string, string | number | undefined> = { name, value, originalName: item.name };
        // Attach metric breakdown for pie tooltip (Safety Metrics: rates + totals when "no sufficient data")
        if (dataKeys && dataKeys.length > 1) {
          const reportRate = item['Report Rate'];
          const moderationBacklog = item['Moderation Backlog'];
          const banRate = item['Ban Rate'];
          slice['Report Rate'] = reportRate !== undefined ? (typeof reportRate === 'number' && !isNaN(reportRate) ? reportRate : (reportRate as string)) : undefined;
          slice['Moderation Backlog'] = moderationBacklog !== undefined ? (typeof moderationBacklog === 'number' && !isNaN(moderationBacklog) ? moderationBacklog : (moderationBacklog as string)) : undefined;
          slice['Ban Rate'] = banRate !== undefined ? (typeof banRate === 'number' && !isNaN(banRate) ? banRate : (banRate as string)) : undefined;
          slice['Total Reports'] = item['Total Reports'] !== undefined ? (typeof item['Total Reports'] === 'number' ? item['Total Reports'] : Number(item['Total Reports']) || 0) : undefined;
          slice['Total Banned Accounts'] = item['Total Banned Accounts'] !== undefined ? (typeof item['Total Banned Accounts'] === 'number' ? item['Total Banned Accounts'] : Number(item['Total Banned Accounts']) || 0) : undefined;
        }
        return slice;
      }).filter(item => (item.value as number) > 0);

  // If no data, show empty state
  if (pieData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ height: `${height}px` }}>
      {selectedMonth && (
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between z-10 mb-3 px-1">
          <button
            onClick={() => setSelectedMonth(null)}
            className="flex items-center gap-1.5 px-2.5 h-8 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 text-xs font-medium text-gray-700 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <div className="px-2.5 h-8 bg-white border border-gray-300 rounded-md shadow-sm text-xs font-semibold text-gray-800 flex items-center">
            {selectedMonth} by Year
          </div>
          <div className="w-[85px]"></div> {/* Spacer for alignment */}
        </div>
      )}
      <ResponsiveContainer width="100%" height={selectedMonth ? height - 40 : height}>
        <RechartsPieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy={selectedMonth ? "48%" : "50%"}
            labelLine={false}
            label={({ name }) => name}
            outerRadius={selectedMonth ? 110 : 120}
            fill="#8884d8"
            dataKey="value"
            activeIndex={undefined}
            activeShape={false}
            onClick={isMultiYearMonthly && !selectedMonth ? (data, index, e) => {
              // Click to show year breakdown (only for monthly multi-year view, and only when showing months)
              const monthName = data.originalName || data.name;
              if (monthName) {
                setSelectedMonth(monthName);
              }
            } : undefined}
          >
            {pieData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={CHART_COLORS[index % CHART_COLORS.length]}
                style={{ 
                  cursor: isMultiYearMonthly && !selectedMonth ? 'pointer' : 'default',
                  outline: 'none'
                }}
              />
            ))}
          </Pie>
          <Tooltip 
            content={<PieTooltipContent />}
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
              padding: '8px 12px'
            }}
          />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}

