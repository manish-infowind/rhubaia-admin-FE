import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarIcon, BarChart3, PieChart, LineChart, ChevronDown } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export interface ChartConfig {
  chartType: 'bar' | 'pie' | 'line';
  timeRange: 'daily' | 'weekly' | 'monthly' | 'custom';
  gender?: 'all' | 'm' | 'f';
  conversionType?: 'subscription' | 'message-before-match' | 'likes' | 'matches' | 'gifts';
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  isDatePickerOpen: boolean;
  calendarMonth: Date;
  selectedMonth?: number; // 0-11 for weekly/daily selection
  selectedYear?: number; // for weekly/daily selection
  selectedYears?: number[]; // for monthly multi-year selection
}

interface ChartFiltersProps {
  config: ChartConfig;
  onConfigChange: (config: ChartConfig) => void;
  title: string;
  iconColor?: string;
  /** When true, hide the gender filter (e.g. for Feed Response Time where male/female are not included) */
  hideGenderFilter?: boolean;
}

export function ChartFilters({ config, onConfigChange, title, iconColor = "text-brand-green", hideGenderFilter = false }: ChartFiltersProps) {
  const { toast } = useToast();

  const updateConfig = (updates: Partial<ChartConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  const handleDateClick = (date: Date | undefined) => {
    if (!date) return;

    const { from, to } = config.dateRange;
    
    // Normalize dates to compare only the date part (ignore time)
    const normalizeDate = (d: Date) => {
      const normalized = new Date(d);
      normalized.setHours(0, 0, 0, 0);
      return normalized;
    };

    const clickedDate = normalizeDate(date);

    // If no start date, set this as start
    if (!from) {
      updateConfig({
        dateRange: { from: date, to: undefined },
        timeRange: 'custom',
        calendarMonth: date
      });
      return;
    }

    const startDate = normalizeDate(from);

    // If we have start but no end
    if (from && !to) {
      // If clicked date is before start date, swap them
      if (clickedDate < startDate) {
        updateConfig({
          dateRange: { from: date, to: from },
          timeRange: 'custom',
          calendarMonth: from
        });
      } else {
        // If clicked date is after start, set as end
        updateConfig({
          dateRange: { from: from, to: date },
          timeRange: 'custom',
          calendarMonth: date
        });
      }
      return;
    }

    // If we have both start and end, clicking a new date:
    // Previous end becomes new start, clicked date becomes new end
    if (from && to) {
      updateConfig({
        dateRange: { from: to, to: date },
        timeRange: 'custom',
        calendarMonth: date
      });
    }
  };

  const handleTimeRangeChange = (value: string) => {
    const newTimeRange = value as 'daily' | 'weekly' | 'monthly' | 'custom';
    const today = new Date();
    let newStart: Date;
    let newEnd: Date = today;
    let selectedMonth: number | undefined;
    let selectedYear: number | undefined;
    
    if (newTimeRange === 'daily') {
      // For daily, set to current month and year
      selectedMonth = today.getMonth();
      selectedYear = today.getFullYear();
      // Set date range to first day of current month to today
      newStart = new Date(today.getFullYear(), today.getMonth(), 1);
      newEnd = today;
    } else if (newTimeRange === 'weekly') {
      // For weekly, set to current month and year
      selectedMonth = today.getMonth();
      selectedYear = today.getFullYear();
      // Set date range to first week of current month
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      newStart = startOfWeek(firstDay, { weekStartsOn: 1 }); // Monday
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      newEnd = endOfWeek(lastDay, { weekStartsOn: 1 });
    } else if (newTimeRange === 'monthly') {
      // For monthly, set to current year as default (array)
      const currentYear = today.getFullYear();
      // Set date range to first day of current year to today
      newStart = new Date(currentYear, 0, 1); // January 1st
      newEnd = today;
      updateConfig({
        timeRange: newTimeRange,
        dateRange: { from: newStart, to: newEnd },
        isDatePickerOpen: false,
        calendarMonth: today,
        selectedYears: [currentYear]
      });
      return;
    } else {
      // Custom - keep existing range or set default
      newStart = new Date(today);
      newStart.setMonth(newStart.getMonth() - 3);
      newEnd = today;
    }
    
    updateConfig({
      timeRange: newTimeRange,
      dateRange: { from: newStart, to: newEnd },
      isDatePickerOpen: false,
      calendarMonth: today,
      selectedMonth,
      selectedYear
    });
  };

  const handleMonthChange = (month: string) => {
    const monthNum = parseInt(month);
    const year = config.selectedYear || new Date().getFullYear();
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    // Validation: Prevent selecting future months
    if (year === currentYear && monthNum > currentMonth) {
      toast({
        title: "Invalid Selection",
        description: "Cannot select future months. Please select a month up to the current month.",
        variant: "destructive",
      });
      return;
    }
    
    // Validation: Prevent selecting months in future years
    if (year > currentYear) {
      toast({
        title: "Invalid Selection",
        description: "Cannot select months in future years. Please select a valid year first.",
        variant: "destructive",
      });
      return;
    }
    
    if (config.timeRange === 'weekly') {
      // For weekly: calculate week range for the month
      const firstDay = new Date(year, monthNum, 1);
      const start = startOfWeek(firstDay, { weekStartsOn: 1 });
      const lastDay = new Date(year, monthNum + 1, 0);
      const end = endOfWeek(lastDay, { weekStartsOn: 1 });
      updateConfig({
        selectedMonth: monthNum,
        dateRange: { from: start, to: end },
        calendarMonth: firstDay
      });
    } else if (config.timeRange === 'daily') {
      // For daily: first day of selected month to today (if current month/year) or last day of month
      const firstDay = new Date(year, monthNum, 1);
      const isCurrentMonth = year === currentYear && monthNum === currentMonth;
      const endDate = isCurrentMonth ? today : new Date(year, monthNum + 1, 0);
      updateConfig({
        selectedMonth: monthNum,
        dateRange: { from: firstDay, to: endDate },
        calendarMonth: firstDay
      });
    }
  };

  const handleYearChange = (year: string) => {
    const yearNum = parseInt(year);
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    // Validation: Prevent selecting future years
    if (yearNum > currentYear) {
      toast({
        title: "Invalid Selection",
        description: "Cannot select future years. Please select a year up to the current year.",
        variant: "destructive",
      });
      return;
    }
    
    if (config.timeRange === 'weekly') {
      // For weekly: calculate week range for the selected month in the year
      let month = config.selectedMonth !== undefined ? config.selectedMonth : currentMonth;
      
      // If selected month is in the future for the selected year, reset to current month
      if (yearNum === currentYear && month > currentMonth) {
        month = currentMonth;
        toast({
          title: "Month Adjusted",
          description: "Selected month was in the future. Reset to current month.",
          variant: "default",
        });
      }
      
      const firstDay = new Date(yearNum, month, 1);
      const start = startOfWeek(firstDay, { weekStartsOn: 1 });
      const lastDay = new Date(yearNum, month + 1, 0);
      const end = endOfWeek(lastDay, { weekStartsOn: 1 });
      updateConfig({
        selectedYear: yearNum,
        selectedMonth: month,
        dateRange: { from: start, to: end },
        calendarMonth: firstDay
      });
    } else if (config.timeRange === 'daily') {
      // For daily: first day of selected month/year to today (if current) or last day of month
      let month = config.selectedMonth !== undefined ? config.selectedMonth : currentMonth;
      
      // If selected month is in the future for the selected year, reset to current month
      if (yearNum === currentYear && month > currentMonth) {
        month = currentMonth;
        toast({
          title: "Month Adjusted",
          description: "Selected month was in the future. Reset to current month.",
          variant: "default",
        });
      }
      
      const firstDay = new Date(yearNum, month, 1);
      const isCurrentMonth = yearNum === currentYear && month === currentMonth;
      const endDate = isCurrentMonth ? today : new Date(yearNum, month + 1, 0);
      updateConfig({
        selectedYear: yearNum,
        selectedMonth: month,
        dateRange: { from: firstDay, to: endDate },
        calendarMonth: firstDay
      });
    } else if (config.timeRange === 'monthly') {
      // For monthly: handle multi-year selection
      const currentYears = config.selectedYears || [today.getFullYear()];
      if (currentYears.includes(yearNum)) {
        // Remove year if already selected
        const newYears = currentYears.filter(y => y !== yearNum);
        if (newYears.length > 0) {
          const minYear = Math.min(...newYears);
          const maxYear = Math.max(...newYears);
          const firstDay = new Date(minYear, 0, 1);
          const isCurrentYear = maxYear === today.getFullYear();
          const endDate = isCurrentYear ? today : new Date(maxYear, 11, 31);
          updateConfig({
            selectedYears: newYears,
            dateRange: { from: firstDay, to: endDate },
            calendarMonth: firstDay
          });
        } else {
          // Keep at least one year selected
          updateConfig({
            selectedYears: [yearNum],
            dateRange: { from: new Date(yearNum, 0, 1), to: yearNum === today.getFullYear() ? today : new Date(yearNum, 11, 31) },
            calendarMonth: new Date(yearNum, 0, 1)
          });
        }
      } else {
        // Add year to selection
        const newYears = [...currentYears, yearNum].sort();
        const minYear = Math.min(...newYears);
        const maxYear = Math.max(...newYears);
        const firstDay = new Date(minYear, 0, 1);
        const isCurrentYear = maxYear === today.getFullYear();
        const endDate = isCurrentYear ? today : new Date(maxYear, 11, 31);
        updateConfig({
          selectedYears: newYears,
          dateRange: { from: firstDay, to: endDate },
          calendarMonth: firstDay
        });
      }
    }
  };

  const handleYearToggle = (year: number) => {
    const currentYears = config.selectedYears || [new Date().getFullYear()];
    const today = new Date();
    
    if (currentYears.includes(year)) {
      // Remove year if already selected (but keep at least one)
      if (currentYears.length > 1) {
        const newYears = currentYears.filter(y => y !== year);
        const minYear = Math.min(...newYears);
        const maxYear = Math.max(...newYears);
        const firstDay = new Date(minYear, 0, 1);
        const isCurrentYear = maxYear === today.getFullYear();
        const endDate = isCurrentYear ? today : new Date(maxYear, 11, 31);
        updateConfig({
          selectedYears: newYears,
          dateRange: { from: firstDay, to: endDate },
          calendarMonth: firstDay
        });
      }
    } else {
      // Add year to selection
      const newYears = [...currentYears, year].sort();
      const minYear = Math.min(...newYears);
      const maxYear = Math.max(...newYears);
      const firstDay = new Date(minYear, 0, 1);
      const isCurrentYear = maxYear === today.getFullYear();
      const endDate = isCurrentYear ? today : new Date(maxYear, 11, 31);
      updateConfig({
        selectedYears: newYears,
        dateRange: { from: firstDay, to: endDate },
        calendarMonth: firstDay
      });
    }
  };

  const handleReset = () => {
    const newStart = new Date();
    newStart.setMonth(newStart.getMonth() - 3);
    const newEnd = new Date();
    updateConfig({
      dateRange: { from: newStart, to: newEnd },
      timeRange: 'custom',
      calendarMonth: newEnd
    });
  };

  const handleApply = () => {
    if (config.dateRange.from && config.dateRange.to) {
      updateConfig({ isDatePickerOpen: false });
    } else {
      toast({
        title: "Incomplete Selection",
        description: "Please select both start and end dates.",
        variant: "destructive",
      });
    }
  };

  // Generate month options
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate year options (last 5 years to current year)
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-11
  const years = Array.from({ length: 6 }, (_, i) => currentYear - 5 + i);

  // Check if a month should be disabled (future months in current year)
  const isMonthDisabled = (monthIndex: number, selectedYear?: number) => {
    if (!selectedYear) return false;
    // Disable future months if the selected year is the current year
    if (selectedYear === currentYear && monthIndex > currentMonth) {
      return true;
    }
    // Disable all months if the selected year is in the future
    if (selectedYear > currentYear) {
      return true;
    }
    return false;
  };

  // Check if this is the Conversion Insights chart
  const isConversionInsights = title === "Conversion Insights Analytics";
  const isGenderDisabledForConversion =
    isConversionInsights &&
    config.conversionType &&
    ['message-before-match', 'subscription', 'matches'].includes(config.conversionType);

  return (
    <div className="flex items-center gap-2 flex-wrap w-full">
      {/* Conversion Type Filter - Only for Conversion Insights */}
      {isConversionInsights && (
        <Select
          value={(config.conversionType || 'subscription')}
          onValueChange={(value) =>
            updateConfig({
              conversionType: value as ChartConfig['conversionType'],
              // When conversion type disables gender, force it back to 'all'
              ...( ['message-before-match', 'subscription', 'matches'].includes(value)
                ? { gender: 'all' as ChartConfig['gender'] }
                : {}
              ),
            })
          }
        >
          <SelectTrigger className="h-8 w-[180px] text-xs">
            <SelectValue placeholder="Select Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="subscription">Subscription</SelectItem>
            <SelectItem value="message-before-match">Message Before Match</SelectItem>
            <SelectItem value="likes">Likes</SelectItem>
            <SelectItem value="matches">Matches</SelectItem>
            <SelectItem value="gifts">Gifts</SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Gender Filter (hidden for e.g. Feed Response Time - no male/female breakdown) */}
      {!hideGenderFilter && (
        <Select
          value={(config.gender || 'all')}
          onValueChange={(value) => {
            if (isGenderDisabledForConversion) return;
            updateConfig({ gender: value as ChartConfig['gender'] });
          }}
          disabled={isGenderDisabledForConversion}
        >
          <SelectTrigger className="h-8 w-[120px] text-xs" disabled={isGenderDisabledForConversion}>
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="m">Male</SelectItem>
            <SelectItem value="f">Female</SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Daily: Month and Year Dropdowns */}
      {config.timeRange === 'daily' && (
        <div className="flex items-center gap-2">
          <Select
            value={config.selectedMonth?.toString()}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, index) => {
                const disabled = isMonthDisabled(index, config.selectedYear);
                return (
                  <SelectItem 
                    key={index} 
                    value={index.toString()}
                    disabled={disabled}
                    className={disabled ? "opacity-50 cursor-not-allowed" : ""}
                  >
                    {month}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Select
            value={config.selectedYear?.toString()}
            onValueChange={handleYearChange}
          >
            <SelectTrigger className="h-8 w-[100px] text-xs">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => {
                const isFutureYear = year > currentYear;
                return (
                  <SelectItem 
                    key={year} 
                    value={year.toString()}
                    disabled={isFutureYear}
                    className={isFutureYear ? "opacity-50 cursor-not-allowed" : ""}
                  >
                    {year}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Weekly: Month and Year Dropdowns */}
      {config.timeRange === 'weekly' && (
        <div className="flex items-center gap-2">
          <Select
            value={config.selectedMonth?.toString()}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, index) => {
                const disabled = isMonthDisabled(index, config.selectedYear);
                return (
                  <SelectItem 
                    key={index} 
                    value={index.toString()}
                    disabled={disabled}
                    className={disabled ? "opacity-50 cursor-not-allowed" : ""}
                  >
                    {month}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Select
            value={config.selectedYear?.toString()}
            onValueChange={handleYearChange}
          >
            <SelectTrigger className="h-8 w-[100px] text-xs">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => {
                const isFutureYear = year > currentYear;
                return (
                  <SelectItem 
                    key={year} 
                    value={year.toString()}
                    disabled={isFutureYear}
                    className={isFutureYear ? "opacity-50 cursor-not-allowed" : ""}
                  >
                    {year}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Monthly: Multi-Year Selection */}
      {config.timeRange === 'monthly' && (
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs whitespace-nowrap"
                type="button"
              >
                {config.selectedYears && config.selectedYears.length > 0
                  ? config.selectedYears.length === 1
                    ? `${config.selectedYears[0]}`
                    : `${config.selectedYears.length} Years Selected`
                  : 'Select Years'}
                <ChevronDown className="h-3 w-3 ml-2" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="start">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold mb-2">Select Years</h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {years.map((year) => {
                    const isSelected = config.selectedYears?.includes(year) || false;
                    const isFutureYear = year > currentYear;
                    const isDisabled = isFutureYear || (!isSelected && config.selectedYears && config.selectedYears.length === 0);
                    return (
                      <label
                        key={year}
                        className={`flex items-center space-x-2 p-2 rounded-md ${
                          isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent cursor-pointer'
                        }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleYearToggle(year)}
                          disabled={isDisabled}
                        />
                        <span className="text-sm">{year}</span>
                      </label>
                    );
                  })}
                </div>
                {config.selectedYears && config.selectedYears.length > 0 && (
                  <div className="pt-2 border-t text-xs text-muted-foreground">
                    Selected: {config.selectedYears.sort((a, b) => a - b).join(', ')}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          {config.dateRange.from && config.dateRange.to && (
            <span className="text-xs text-muted-foreground">
              {format(config.dateRange.from, 'MMM dd, yyyy')} - {format(config.dateRange.to, 'MMM dd, yyyy')}
            </span>
          )}
        </div>
      )}

      {/* Daily and Custom: Date Range Picker */}
      {(config.timeRange === 'daily' || config.timeRange === 'custom') && (
        <Popover 
          open={config.isDatePickerOpen} 
          onOpenChange={(open) => {
            if (open && config.dateRange.from) {
              onConfigChange({
                ...config,
                isDatePickerOpen: open,
                calendarMonth: config.dateRange.to || config.dateRange.from || new Date()
              });
            } else {
              onConfigChange({
                ...config,
                isDatePickerOpen: open
              });
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs whitespace-nowrap"
              type="button"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              {config.timeRange === 'custom' && config.dateRange.from && config.dateRange.to
                ? `${format(config.dateRange.from, 'MMM dd, yyyy')} - ${format(config.dateRange.to, 'MMM dd, yyyy')}`
                : config.timeRange === 'daily' && config.dateRange.from && config.dateRange.to
                ? `${format(config.dateRange.from, 'MMM dd, yyyy')} - ${format(config.dateRange.to, 'MMM dd, yyyy')}`
                : 'Select Date Range'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end" sideOffset={5}>
            <div className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">
                    {config.timeRange === 'daily' ? 'Select Date Range' : 'Select Custom Date Range'}
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={handleReset}
                  >
                    Reset
                  </Button>
                </div>
                <Calendar
                  mode="single"
                  selected={config.dateRange.from}
                  defaultMonth={config.dateRange.from || config.calendarMonth}
                  month={config.calendarMonth}
                  onMonthChange={(month) => updateConfig({ calendarMonth: month })}
                  onSelect={handleDateClick}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(23, 59, 59, 999);
                    return date > today;
                  }}
                  numberOfMonths={1}
                  className="rounded-md border-0"
                  modifiers={{
                    range_start: config.dateRange.from,
                    range_end: config.dateRange.to,
                    in_range: config.dateRange.from && config.dateRange.to ? (date: Date) => {
                      if (!config.dateRange.from || !config.dateRange.to) return false;
                      const d = new Date(date);
                      d.setHours(0, 0, 0, 0);
                      const from = new Date(config.dateRange.from);
                      from.setHours(0, 0, 0, 0);
                      const to = new Date(config.dateRange.to);
                      to.setHours(0, 0, 0, 0);
                      return d >= from && d <= to;
                    } : undefined,
                  }}
                  modifiersClassNames={{
                    range_start: "bg-primary text-primary-foreground rounded-l-md",
                    range_end: "bg-primary text-primary-foreground rounded-r-md",
                    in_range: "bg-accent text-accent-foreground",
                  }}
                />
                <div className="flex items-center justify-between gap-2 pt-2 border-t">
                  <div className="flex-1 text-xs text-muted-foreground min-w-0">
                    {config.dateRange.from && config.dateRange.to ? (
                      <span className="truncate">
                        {format(config.dateRange.from, 'MMM dd, yyyy')} - {format(config.dateRange.to, 'MMM dd, yyyy')}
                      </span>
                    ) : config.dateRange.from ? (
                      <span className="text-blue-600 font-medium">Start: {format(config.dateRange.from, 'MMM dd, yyyy')} - Click another date for end</span>
                    ) : (
                      <span>Click a date to set start date</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => updateConfig({ isDatePickerOpen: false })}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={handleApply}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Time Range Selector */}
      <Tabs value={config.timeRange} onValueChange={handleTimeRangeChange}>
        <TabsList>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Chart Type Selector */}
      <div className="flex gap-1 border rounded-lg p-1">
        <Button
          variant={config.chartType === 'bar' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => updateConfig({ chartType: 'bar' })}
          className="h-8"
        >
          <BarChart3 className="h-4 w-4 mr-1" />
          Bar
        </Button>
        <Button
          variant={config.chartType === 'line' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => updateConfig({ chartType: 'line' })}
          className="h-8"
        >
          <LineChart className="h-4 w-4 mr-1" />
          Line
        </Button>
        <Button
          variant={config.chartType === 'pie' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => updateConfig({ chartType: 'pie' })}
          className="h-8"
        >
          <PieChart className="h-4 w-4 mr-1" />
          Pie
        </Button>
      </div>
    </div>
  );
}

