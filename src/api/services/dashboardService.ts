import { apiClient } from '../client';
import { API_CONFIG } from '../config';
import { ApiResponse } from '../types';

// Dashboard data interfaces
export interface DashboardStats {
  totalPages: number;
  totalProducts: number;
  publishedProducts: number;
  draftProducts: number;
  totalEnquiries: number;
  newEnquiriesThisWeek: number;
  activeUsers: number;
  userGrowthThisMonth: number;
}

export interface ProductStats {
  total: number;
  published: number;
  draft: number;
  archived: number;
}

export interface RecentActivity {
  action: string;
  page: string;
  time: string;
  type: string;
}

export interface RecentProduct {
  _id: string;
  name: string;
  status: string;
  isPublished: boolean;
  updatedAt: string;
}

export interface RecentProducts {
  products: RecentProduct[];
  count: number;
}

export interface SystemHealth {
  database: {
    status: string;
    message: string;
  };
  products: {
    status: string;
    message: string;
    total: number;
    published: number;
  };
  pages: {
    status: string;
    message: string;
    pages: number;
    faqs: number;
  };
  overall: boolean;
}

export interface UserGrowthData {
  date: string;
  users: number;
  newUsers: number;
}

export interface UserGrowthMetadata {
  totalRecords: number;
  startDate: string;
  endDate: string;
  timeRange: string;
  selectedYears?: number[];
}

export interface UserGrowthResponse {
  userGrowth: UserGrowthData[];
  metadata: UserGrowthMetadata;
}

export interface ActiveUsersData {
  date: string;
  dailyActive: number;
  monthlyActive: number;
}

export interface ActiveUsersMetadata {
  totalRecords: number;
  startDate: string;
  endDate: string;
  timeRange: string;
  selectedYears?: number[];
}

export interface ActiveUsersResponse {
  activeUsers: ActiveUsersData[];
  metadata: ActiveUsersMetadata;
}

export interface UserGrowthSyncResponse {
  date: string;
  synced: boolean;
  externalServiceResponse?: any;
}

// Dashboard stats summary (static, unfiltered)
export interface DashboardStatsSummary {
  totalUsers: number;
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  userGrowthThisMonth: number;  // Percentage (can be negative)
  newUsersThisMonth: number;
  swipeToMatchRate: number;  // Swipe to match rate (percentage)
  lastUpdated: string;  // ISO 8601 date string
}

// Conversion metric data point (matches API documentation)
export interface ConversionDataPoint {
  metric: string;      // e.g., "Jan 2024", "Week 1 (Jan 2024)", "Jan 01, 2024"
  date: string;         // ISO 8601: "2024-01-15T00:00:00.000Z"
  value: number;       // Numeric value for the conversion metric
  percentage: number;  // Percentage share (0-100)
}

// Legacy interface for backward compatibility
export interface ConversionData {
  // For legacy data, metric may be a label like "Sign-ups"
  // For new date-wise data, date can be provided and will be preferred on the X-axis
  metric: string;
  value: number;
  percentage: number;
  date?: string;
}

// Metadata object for conversion analytics
export interface ConversionMetadata {
  timeRange: 'daily' | 'weekly' | 'monthly' | 'custom';
  startDate: string;           // ISO 8601
  endDate: string;             // ISO 8601
  conversionType: 'subscription' | 'message-before-match' | 'likes' | 'matches' | 'gifts';
  selectedYears?: number[];     // Only for monthly timeRange
  gender?: 'm' | 'f';          // Only for likes/gifts when filter applied
}

// Complete API response for conversion analytics
export interface ConversionAnalyticsResponse {
  conversions: ConversionDataPoint[];
  metadata: ConversionMetadata;
}

// Revenue analytics data point
export interface RevenueAnalyticsData {
  date: string; // ISO 8601: "2024-12-31T18:30:00.000Z"
  averageRevenuePerUser: number;
  averageRevenuePerPayingUser: number;
  freeToPaidRate: number;
  churnRate: number;
  averageLtv?: number; // Average Lifetime Value
}

// Metadata object for revenue analytics
export interface RevenueAnalyticsMetadata {
  totalRecords: number;
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  timeRange: string;
  selectedYears?: number[];
  yearlyAverageLtv?: Record<number, number>; // Yearly average LTV by year
  monthlyAverageLtv?: Record<string, number>; // Monthly average LTV by month-year key
}

// Complete API response for revenue analytics
export interface RevenueAnalyticsResponse {
  revenueAnalytics: RevenueAnalyticsData[];
  metadata: RevenueAnalyticsMetadata;
}

// Conversation analytics data point
export interface ConversationAnalyticsData {
  date: string; // ISO 8601: "2024-12-31T18:30:00.000Z"
  conversationInitiationRate: number; // Percentage (0-100)
  messagesPerMatch: number; // Count
  ghostingRate: number; // Count
  swipeToMatchRate?: number; // Percentage (0-100)
}

// Metadata object for conversation analytics
export interface ConversationAnalyticsMetadata {
  totalRecords: number;
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  timeRange: string;
  selectedYears?: number[];
}

// Complete API response for conversation analytics
export interface ConversationAnalyticsResponse {
  conversationAnalytics: ConversationAnalyticsData[];
  metadata: ConversationAnalyticsMetadata;
}

// App store install stats data point
export interface AppStoreInstallStatsData {
  date: string; // Format: "Jan 21, 2026" for daily, "Jan 2026" for monthly
  iosInstalls?: number;
  iosSignups?: number;
  androidInstalls?: number;
  androidSignups?: number;
  totalInstalls?: number;
  totalSignups?: number;
  signupPercentage: number; // The field we need to extract
}

// Metadata object for app store install stats
export interface AppStoreInstallStatsMetadata {
  totalRecords: number;
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  timeRange: string;
  selectedYears?: number[];
}

// Complete API response for app store install stats
// The API returns: {installStats: Array, metadata: {}}
export interface AppStoreInstallStatsResponse {
  installStats: AppStoreInstallStatsData[];
  metadata?: AppStoreInstallStatsMetadata;
}

// Safety metrics data point
export interface SafetyMetricsData {
  date: string; // Formatted based on timeRange (e.g., "Jan 01, 2024")
  reportRate: number | string; // per 1000 active users or "no sufficient data"
  moderationBacklog: number; // direct count
  banRate: number | string; // per 1000 active users or "no sufficient data"
  totalReports?: number; // total number of reports (when available)
  totalBannedAccounts?: number; // total number of banned accounts (when available)
}

// Metadata object for safety metrics
export interface SafetyMetricsMetadata {
  totalRecords: number;
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  timeRange: string;
  selectedYears?: number[];
}

// Complete API response for safety metrics
export interface SafetyMetricsResponse {
  safetyMetrics: SafetyMetricsData[];
  metadata: SafetyMetricsMetadata;
}

// GeoJSON types for map visualization
export interface MapFeatureProperties {
  count: number;
  city: string;
  conversionRate?: number; // Conversion rate percentage
  paidUsers?: number; // Number of paid users
  freeUsers?: number; // Number of free users
  paidToFreeRatio?: number; // Ratio of paid to free users
}

export interface MapFeature extends GeoJSON.Feature<GeoJSON.Point, MapFeatureProperties> {
  type: 'Feature';
  properties: MapFeatureProperties;
  geometry: GeoJSON.Point;
}

export interface ActiveUsersMapResponse extends GeoJSON.FeatureCollection<GeoJSON.Point, MapFeatureProperties> {
  type: 'FeatureCollection';
  features: MapFeature[];
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  uptime: number;
  errorRate: number;
  throughput: number;
}

export interface AnalyticsData {
  userGrowth: UserGrowthData[];
  activeUsers: ActiveUsersData[];
  conversions: ConversionData[];
  performance: PerformanceMetrics;
  revenueAnalytics?: RevenueAnalyticsData[];
  conversationAnalytics?: ConversationAnalyticsData[];
  appStoreInstallStats?: AppStoreInstallStatsData[];
  safetyMetrics?: SafetyMetricsData[];
}

export interface DashboardData {
  stats: DashboardStats;
  productStats: ProductStats;
  recentActivity: RecentActivity[];
  recentProducts: RecentProducts;
  systemHealth: SystemHealth;
  analytics?: AnalyticsData;
}

export class DashboardService {
  // Get complete dashboard data
  static async getDashboard(): Promise<ApiResponse<DashboardData>> {
    try {
      const response = await apiClient.get<DashboardData>(
        API_CONFIG.ENDPOINTS.DASHBOARD.MAIN
      );
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get dashboard stats only
  static async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    try {
      const response = await apiClient.get<DashboardStats>(
        API_CONFIG.ENDPOINTS.DASHBOARD.STATS
      );
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get recent activity only
  static async getRecentActivity(): Promise<ApiResponse<RecentActivity[]>> {
    try {
      const response = await apiClient.get<RecentActivity[]>(
        API_CONFIG.ENDPOINTS.DASHBOARD.ACTIVITY
      );
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get analytics data
  static async getAnalytics(
    timeRange: 'daily' | 'weekly' | 'monthly' | 'custom' = 'monthly',
    startDate?: Date,
    endDate?: Date
  ): Promise<ApiResponse<AnalyticsData>> {
    try {
      let url = `${API_CONFIG.ENDPOINTS.DASHBOARD.MAIN}/analytics?range=${timeRange}`;
      
      if (timeRange === 'custom' && startDate && endDate) {
        url += `&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
      }
      
      const response = await apiClient.get<AnalyticsData>(url);
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get user growth analytics data
  static async getUserGrowth(
    timeRange: 'daily' | 'weekly' | 'monthly' | 'custom',
    options: {
      month?: number;
      year?: number;
      years?: number[];
      startDate?: Date;
      endDate?: Date;
      gender?: 'm' | 'f';
    }
  ): Promise<ApiResponse<UserGrowthResponse>> {
    try {
      const params = new URLSearchParams({
        timeRange,
      });

      // Add conditional parameters based on timeRange
      if (timeRange === 'daily' || timeRange === 'weekly') {
        if (options.month !== undefined) {
          params.append('month', options.month.toString());
        }
        if (options.year !== undefined) {
          params.append('year', options.year.toString());
        }
      } else if (timeRange === 'monthly') {
        if (options.years && options.years.length > 0) {
          options.years.forEach(year => {
            params.append('years', year.toString());
          });
        }
      } else if (timeRange === 'custom') {
        if (options.startDate) {
          params.append('startDate', options.startDate.toISOString());
        }
        if (options.endDate) {
          params.append('endDate', options.endDate.toISOString());
        }
      }

      // Gender filter (optional)
      if (options.gender) {
        params.append('gender', options.gender);
      }

      const url = `${API_CONFIG.ENDPOINTS.DASHBOARD.USER_GROWTH}?${params.toString()}`;
      // Use extended timeout for analytics API (2 minutes)
      const response = await apiClient.get<UserGrowthResponse>(url, {
        timeout: API_CONFIG.ANALYTICS_TIMEOUT
      });
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get active users analytics data
  static async getActiveUsers(
    timeRange: 'daily' | 'weekly' | 'monthly' | 'custom',
    options: {
      month?: number;
      year?: number;
      years?: number[];
      startDate?: Date;
      endDate?: Date;
      gender?: 'm' | 'f';
    }
  ): Promise<ApiResponse<ActiveUsersResponse>> {
    try {
      const params = new URLSearchParams({
        timeRange,
      });

      // Add conditional parameters based on timeRange
      if (timeRange === 'daily' || timeRange === 'weekly') {
        if (options.month !== undefined) {
          params.append('month', options.month.toString());
        }
        if (options.year !== undefined) {
          params.append('year', options.year.toString());
        }
      } else if (timeRange === 'monthly') {
        if (options.years && options.years.length > 0) {
          options.years.forEach(year => {
            params.append('years', year.toString());
          });
        }
      } else if (timeRange === 'custom') {
        if (options.startDate) {
          params.append('startDate', options.startDate.toISOString());
        }
        if (options.endDate) {
          params.append('endDate', options.endDate.toISOString());
        }
      }

      // Gender filter (optional)
      if (options.gender) {
        params.append('gender', options.gender);
      }

      const url = `${API_CONFIG.ENDPOINTS.DASHBOARD.ACTIVE_USERS}?${params.toString()}`;
      // Use extended timeout for analytics API (2 minutes)
      const response = await apiClient.get<ActiveUsersResponse>(url, {
        timeout: API_CONFIG.ANALYTICS_TIMEOUT
      });
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get conversion analytics data
  static async getConversions(
    timeRange: 'daily' | 'weekly' | 'monthly' | 'custom',
    conversionType: 'subscription' | 'message-before-match' | 'likes' | 'matches' | 'gifts',
    options: {
      month?: number;
      year?: number;
      years?: number[];
      startDate?: Date;
      endDate?: Date;
      gender?: 'm' | 'f';
    }
  ): Promise<ApiResponse<ConversionAnalyticsResponse>> {
    try {
      const params = new URLSearchParams({
        timeRange,
        conversionType,
      });

      // Add conditional parameters based on timeRange
      if (timeRange === 'daily' || timeRange === 'weekly') {
        if (options.month !== undefined) {
          params.append('month', options.month.toString());
        }
        if (options.year !== undefined) {
          params.append('year', options.year.toString());
        }
      } else if (timeRange === 'monthly') {
        if (options.years && options.years.length > 0) {
          options.years.forEach(year => {
            params.append('years', year.toString());
          });
        }
      } else if (timeRange === 'custom') {
        if (options.startDate) {
          params.append('startDate', options.startDate.toISOString());
        }
        if (options.endDate) {
          params.append('endDate', options.endDate.toISOString());
        }
      }

      // Gender filter (optional, only for likes and gifts)
      if (options.gender && (conversionType === 'likes' || conversionType === 'gifts')) {
        params.append('gender', options.gender);
      }

      const url = `${API_CONFIG.ENDPOINTS.DASHBOARD.CONVERSIONS}?${params.toString()}`;
      // Use extended timeout for analytics API (2 minutes)
      const response = await apiClient.get<ConversionAnalyticsResponse>(url, {
        timeout: API_CONFIG.ANALYTICS_TIMEOUT
      });
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get dashboard stats summary (static, unfiltered)
  static async getDashboardStatsSummary(): Promise<ApiResponse<DashboardStatsSummary>> {
    try {
      const response = await apiClient.get<DashboardStatsSummary>(
        API_CONFIG.ENDPOINTS.DASHBOARD.STATS_SUMMARY
      );
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get revenue analytics data
  static async getRevenue(
    timeRange: 'daily' | 'weekly' | 'monthly' | 'custom',
    options: {
      month?: number;
      year?: number;
      years?: number[];
      startDate?: Date;
      endDate?: Date;
      gender?: 'm' | 'f';
    }
  ): Promise<ApiResponse<RevenueAnalyticsResponse>> {
    try {
      const params = new URLSearchParams({
        timeRange,
      });

      // Add conditional parameters based on timeRange
      if (timeRange === 'daily' || timeRange === 'weekly') {
        if (options.month !== undefined) {
          params.append('month', options.month.toString());
        }
        if (options.year !== undefined) {
          params.append('year', options.year.toString());
        }
      } else if (timeRange === 'monthly') {
        if (options.years && options.years.length > 0) {
          options.years.forEach(year => {
            params.append('years', year.toString());
          });
        }
      } else if (timeRange === 'custom') {
        if (options.startDate) {
          params.append('startDate', options.startDate.toISOString());
        }
        if (options.endDate) {
          params.append('endDate', options.endDate.toISOString());
        }
      }

      // Gender filter (optional)
      if (options.gender) {
        params.append('gender', options.gender);
      }

      const url = `${API_CONFIG.ENDPOINTS.DASHBOARD.REVENUE}?${params.toString()}`;
      // Use extended timeout for analytics API (2 minutes)
      const response = await apiClient.get<RevenueAnalyticsResponse>(url, {
        timeout: API_CONFIG.ANALYTICS_TIMEOUT
      });
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get conversation analytics data
  static async getConversationAnalytics(
    timeRange: 'daily' | 'weekly' | 'monthly' | 'custom',
    options: {
      month?: number;
      year?: number;
      years?: number[];
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<ApiResponse<ConversationAnalyticsResponse>> {
    try {
      const params = new URLSearchParams({
        timeRange,
      });

      // Add conditional parameters based on timeRange
      if (timeRange === 'daily' || timeRange === 'weekly') {
        if (options.month !== undefined) {
          params.append('month', options.month.toString());
        }
        if (options.year !== undefined) {
          params.append('year', options.year.toString());
        }
      } else if (timeRange === 'monthly') {
        if (options.years && options.years.length > 0) {
          options.years.forEach(year => {
            params.append('years', year.toString());
          });
        }
      } else if (timeRange === 'custom') {
        if (options.startDate) {
          params.append('startDate', options.startDate.toISOString());
        }
        if (options.endDate) {
          params.append('endDate', options.endDate.toISOString());
        }
      }

      const url = `${API_CONFIG.ENDPOINTS.DASHBOARD.CONVERSATION_ANALYTICS}?${params.toString()}`;
      // Use extended timeout for analytics API (2 minutes)
      const response = await apiClient.get<ConversationAnalyticsResponse>(url, {
        timeout: API_CONFIG.ANALYTICS_TIMEOUT
      });
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Sync user growth analytics data from external service
  static async syncUserGrowth(date?: Date): Promise<ApiResponse<UserGrowthSyncResponse>> {
    try {
      let url = API_CONFIG.ENDPOINTS.DASHBOARD.USER_GROWTH_SYNC;
      
      // Add date parameter if provided
      if (date) {
        const dateStr = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        url += `?date=${dateStr}`;
      }

      // Use extended timeout for sync API (2 minutes)
      const response = await apiClient.get<UserGrowthSyncResponse>(url, {
        timeout: API_CONFIG.ANALYTICS_TIMEOUT
      });
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get app store install stats analytics data
  static async getAppStoreInstallStats(
    timeRange: 'daily' | 'weekly' | 'monthly' | 'custom',
    options: {
      month?: number;
      year?: number;
      years?: number[];
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<ApiResponse<AppStoreInstallStatsResponse>> {
    try {
      const params = new URLSearchParams({
        timeRange,
      });

      // Add conditional parameters based on timeRange
      if (timeRange === 'daily' || timeRange === 'weekly') {
        if (options.month !== undefined) {
          params.append('month', options.month.toString());
        }
        if (options.year !== undefined) {
          params.append('year', options.year.toString());
        }
      } else if (timeRange === 'monthly') {
        if (options.years && options.years.length > 0) {
          options.years.forEach(year => {
            params.append('years', year.toString());
          });
        }
      } else if (timeRange === 'custom') {
        if (options.startDate) {
          params.append('startDate', options.startDate.toISOString());
        }
        if (options.endDate) {
          params.append('endDate', options.endDate.toISOString());
        }
      }

      const url = `${API_CONFIG.ENDPOINTS.DASHBOARD.APP_STORE_INSTALL_STATS}?${params.toString()}`;
      // Use extended timeout for analytics API (2 minutes)
      const response = await apiClient.get<AppStoreInstallStatsResponse>(url, {
        timeout: API_CONFIG.ANALYTICS_TIMEOUT
      });
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get safety metrics analytics data
  static async getSafetyMetrics(
    timeRange: 'daily' | 'weekly' | 'monthly' | 'custom',
    options: {
      month?: number;
      year?: number;
      years?: number[];
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<ApiResponse<SafetyMetricsResponse>> {
    try {
      const params = new URLSearchParams({
        timeRange,
      });

      // Add conditional parameters based on timeRange
      if (timeRange === 'daily' || timeRange === 'weekly') {
        if (options.month !== undefined) {
          params.append('month', options.month.toString());
        }
        if (options.year !== undefined) {
          params.append('year', options.year.toString());
        }
      } else if (timeRange === 'monthly') {
        if (options.years && options.years.length > 0) {
          options.years.forEach(year => {
            params.append('years', year.toString());
          });
        }
      } else if (timeRange === 'custom') {
        if (options.startDate) {
          params.append('startDate', options.startDate.toISOString());
        }
        if (options.endDate) {
          params.append('endDate', options.endDate.toISOString());
        }
      }

      const url = `${API_CONFIG.ENDPOINTS.DASHBOARD.SAFETY_METRICS}?${params.toString()}`;
      // Use extended timeout for analytics API (2 minutes)
      const response = await apiClient.get<SafetyMetricsResponse>(url, {
        timeout: API_CONFIG.ANALYTICS_TIMEOUT
      });
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get active users map data (GeoJSON)
  static async getActiveUsersMap(timeWindow?: number): Promise<ApiResponse<ActiveUsersMapResponse>> {
    try {
      const params = new URLSearchParams();
      
      if (timeWindow !== undefined) {
        params.append('timeWindow', timeWindow.toString());
      }

      const url = params.toString() 
        ? `${API_CONFIG.ENDPOINTS.DASHBOARD.ACTIVE_USERS_MAP}?${params.toString()}`
        : API_CONFIG.ENDPOINTS.DASHBOARD.ACTIVE_USERS_MAP;
      
      // Use extended timeout for analytics API (2 minutes)
      const response = await apiClient.get<ActiveUsersMapResponse>(url, {
        timeout: API_CONFIG.ANALYTICS_TIMEOUT
      });
      
      return response;
    } catch (error) {
      throw error;
    }
  }
} 