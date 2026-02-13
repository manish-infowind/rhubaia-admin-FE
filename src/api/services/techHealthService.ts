import { apiClient } from '../client';
import { API_CONFIG } from '../config';

export interface FeedResponseTimeDay {
  date: string;
  averageResponseTimeMs: number;
}

export interface FeedResponseTimeResponse {
  data: FeedResponseTimeDay[];
}

export interface CrashFreeUsersResponse {
  crashFreeUsersPercent: number;
  targetPercent: number;
  sessionUsers?: number;
  crashedUsers?: number;
}

// Get feed average response time (daily). Replace mock with API when backend is ready.
export async function getFeedResponseTimeDaily(): Promise<FeedResponseTimeResponse> {
  try {
    const response = await apiClient.get<FeedResponseTimeResponse>(
      API_CONFIG.ENDPOINTS.TECH_HEALTH.FEED_RESPONSE_TIME,
      { timeout: API_CONFIG.ANALYTICS_TIMEOUT }
    );
    if (response?.data?.data?.length) return response.data;
  } catch {
    // Fallback to mock when endpoint not implemented
  }
  return getMockFeedResponseTimeDaily();
}

function getMockFeedResponseTimeDaily(): FeedResponseTimeResponse {
  const days = 14;
  const data: FeedResponseTimeDay[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    data.push({
      date: d.toISOString().slice(0, 10),
      averageResponseTimeMs: Math.round(80 + Math.random() * 120),
    });
  }
  return { data };
}

// Get crash-free users % (current session). Replace mock with API when backend is ready.
export async function getCrashFreeUsers(): Promise<CrashFreeUsersResponse> {
  try {
    const response = await apiClient.get<CrashFreeUsersResponse>(
      API_CONFIG.ENDPOINTS.TECH_HEALTH.CRASH_FREE_USERS
    );
    if (response?.data && typeof response.data.crashFreeUsersPercent === 'number') {
      return response.data;
    }
  } catch {
    // Fallback to mock when endpoint not implemented
  }
  return getMockCrashFreeUsers();
}

function getMockCrashFreeUsers(): CrashFreeUsersResponse {
  return {
    crashFreeUsersPercent: 99.2,
    targetPercent: 99,
    sessionUsers: 12500,
    crashedUsers: 100,
  };
}
