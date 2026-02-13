import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { LucideIcon, Loader2 } from "lucide-react";
import { ChartFilters, ChartConfig } from "./ChartFilters";
import { ChartRenderer } from "./ChartRenderer";

interface ChartData {
  name: string;
  [key: string]: string | number;
}

interface ChartCardProps {
  title: string;
  icon: LucideIcon;
  iconColor?: string;
  config: ChartConfig;
  onConfigChange: (config: ChartConfig) => void;
  data: ChartData[];
  dataKeys: string[];
  delay?: number;
  originalData?: any; // Original analytics data for year breakdown
  loading?: boolean; // Loading state for the chart
  /** When true, hide the gender filter (e.g. Feed Response Time - no male/female) */
  hideGenderFilter?: boolean;
}

export function ChartCard({
  title,
  icon: Icon,
  iconColor = "text-brand-green",
  config,
  onConfigChange,
  data,
  dataKeys,
  delay = 0.2,
  originalData,
  loading = false,
  hideGenderFilter = false
}: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg mb-4">
            <Icon className={`h-5 w-5 ${iconColor}`} />
            {title}
          </CardTitle>
          <div className="w-full">
            <ChartFilters
              config={config}
              onConfigChange={onConfigChange}
              title={title}
              iconColor={iconColor}
              hideGenderFilter={hideGenderFilter}
            />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-[400px] relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-md z-50">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-brand-green" />
                  <p className="text-sm text-muted-foreground">Loading chart data...</p>
                </div>
              </div>
            ) : null}
            <div className={loading ? 'opacity-30 pointer-events-none' : ''}>
              <ChartRenderer
                data={data}
                chartType={config.chartType}
                dataKeys={dataKeys}
                height={400}
                isMultiYearMonthly={config.timeRange === 'monthly' && config.selectedYears && config.selectedYears.length > 1 && config.chartType === 'pie'}
                selectedYears={config.selectedYears}
                originalData={originalData}
                conversionType={title === "Conversion Insights Analytics" ? (config as any).conversionType : undefined}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

