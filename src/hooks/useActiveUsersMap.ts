import { useState, useEffect, useRef, useCallback } from "react";
import { DashboardService, ActiveUsersMapResponse } from "@/api/services/dashboardService";

interface UseActiveUsersMapOptions {
  timeWindow?: number; // Time window in minutes (default: 5)
  pollingInterval?: number; // Polling interval in milliseconds (default: 60000 = 60 seconds)
  enabled?: boolean; // Whether polling is enabled (default: true)
  useMockData?: boolean; // Use mock data instead of API (default: true for now)
}

interface UseActiveUsersMapReturn {
  data: ActiveUsersMapResponse | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Generate mock GeoJSON data with global cities
const generateMockData = (): ActiveUsersMapResponse => {
  // Major cities from around the world with coordinates [longitude, latitude] and user counts
  const cities = [
    // North America
    { city: "New York", lng: -74.0060, lat: 40.7128, count: 250 },
    { city: "Los Angeles", lng: -118.2437, lat: 34.0522, count: 180 },
    { city: "Chicago", lng: -87.6298, lat: 41.8781, count: 120 },
    { city: "Toronto", lng: -79.3832, lat: 43.6532, count: 95 },
    { city: "San Francisco", lng: -122.4194, lat: 37.7749, count: 110 },
    { city: "Miami", lng: -80.1918, lat: 25.7617, count: 85 },
    { city: "Mexico City", lng: -99.1332, lat: 19.4326, count: 140 },
    { city: "Vancouver", lng: -123.1216, lat: 49.2827, count: 65 },
    
    // South America
    { city: "São Paulo", lng: -46.6333, lat: -23.5505, count: 200 },
    { city: "Rio de Janeiro", lng: -43.1729, lat: -22.9068, count: 150 },
    { city: "Buenos Aires", lng: -58.3816, lat: -34.6037, count: 130 },
    { city: "Lima", lng: -77.0428, lat: -12.0464, count: 90 },
    { city: "Bogotá", lng: -74.0721, lat: 4.7110, count: 75 },
    
    // Europe
    { city: "London", lng: -0.1278, lat: 51.5074, count: 220 },
    { city: "Paris", lng: 2.3522, lat: 48.8566, count: 190 },
    { city: "Berlin", lng: 13.4050, lat: 52.5200, count: 160 },
    { city: "Madrid", lng: -3.7038, lat: 40.4168, count: 140 },
    { city: "Rome", lng: 12.4964, lat: 41.9028, count: 125 },
    { city: "Amsterdam", lng: 4.9041, lat: 52.3676, count: 100 },
    { city: "Barcelona", lng: 2.1734, lat: 41.3851, count: 110 },
    { city: "Moscow", lng: 37.6173, lat: 55.7558, count: 170 },
    { city: "Istanbul", lng: 28.9784, lat: 41.0082, count: 135 },
    
    // Asia
    { city: "Tokyo", lng: 139.6503, lat: 35.6762, count: 280 },
    { city: "Delhi", lng: 77.2090, lat: 28.6139, count: 240 },
    { city: "Mumbai", lng: 72.8777, lat: 19.0760, count: 210 },
    { city: "Shanghai", lng: 121.4737, lat: 31.2304, count: 260 },
    { city: "Beijing", lng: 116.4074, lat: 39.9042, count: 250 },
    { city: "Singapore", lng: 103.8198, lat: 1.3521, count: 120 },
    { city: "Bangkok", lng: 100.5018, lat: 13.7563, count: 145 },
    { city: "Seoul", lng: 126.9780, lat: 37.5665, count: 180 },
    { city: "Hong Kong", lng: 114.1694, lat: 22.3193, count: 150 },
    { city: "Dubai", lng: 55.2708, lat: 25.2048, count: 130 },
    { city: "Jakarta", lng: 106.8451, lat: -6.2088, count: 165 },
    { city: "Manila", lng: 120.9842, lat: 14.5995, count: 110 },
    { city: "Bangalore", lng: 77.5946, lat: 12.9716, count: 95 },
    { city: "Hyderabad", lng: 78.4867, lat: 17.3850, count: 85 },
    
    // Africa
    { city: "Lagos", lng: 3.3792, lat: 6.5244, count: 155 },
    { city: "Cairo", lng: 31.2357, lat: 30.0444, count: 140 },
    { city: "Johannesburg", lng: 28.0473, lat: -26.2041, count: 100 },
    { city: "Nairobi", lng: 36.8219, lat: -1.2921, count: 80 },
    { city: "Casablanca", lng: -7.5898, lat: 33.5731, count: 70 },
    
    // Oceania
    { city: "Sydney", lng: 151.2093, lat: -33.8688, count: 125 },
    { city: "Melbourne", lng: 144.9631, lat: -37.8136, count: 115 },
    { city: "Auckland", lng: 174.7633, lat: -36.8485, count: 60 },
  ];

  // Add some random variation to counts and calculate geographic intelligence metrics
  const features = cities.map((city) => {
    const baseCount = city.count + Math.floor(Math.random() * 10) - 5;
    // Calculate paid/free distribution (30-50% paid users typically)
    const paidPercentage = 0.3 + Math.random() * 0.2; // 30-50%
    const paidUsers = Math.floor(baseCount * paidPercentage);
    const freeUsers = baseCount - paidUsers;
    const paidToFreeRatio = freeUsers > 0 ? paidUsers / freeUsers : 0;
    // Conversion rate (5-25% typically)
    const conversionRate = 5 + Math.random() * 20; // 5-25%
    
    return {
      type: "Feature" as const,
      properties: {
        count: baseCount,
        city: city.city,
        conversionRate: Math.round(conversionRate * 10) / 10, // Round to 1 decimal
        paidUsers,
        freeUsers,
        paidToFreeRatio: Math.round(paidToFreeRatio * 100) / 100, // Round to 2 decimals
      },
      geometry: {
        type: "Point" as const,
        coordinates: [city.lng, city.lat] as [number, number],
      },
    };
  });

  return {
    type: "FeatureCollection",
    features,
  };
};

export function useActiveUsersMap(
  options: UseActiveUsersMapOptions = {}
): UseActiveUsersMapReturn {
  const {
    timeWindow = 5,
    pollingInterval = 60000, // 60 seconds
    enabled = true,
    useMockData = false, // Use real API by default
  } = options;

  const [data, setData] = useState<ActiveUsersMapResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const fetchData = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      setError(null);
      
      if (useMockData) {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        const mockData = generateMockData();
        setData(mockData);
      } else {
        const response = await DashboardService.getActiveUsersMap(timeWindow);

        if (response.success && response.data) {
          setData(response.data);
        } else {
          throw new Error(response.message || "Failed to fetch active users map data");
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        const error = err instanceof Error ? err : new Error("Unknown error occurred");
        setError(error);
        console.error("Error fetching active users map:", error);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [useMockData, timeWindow]);

  const refetch = async () => {
    setLoading(true);
    await fetchData();
  };

  useEffect(() => {
    isMountedRef.current = true;

    // Initial fetch
    fetchData();

    // Set up polling if enabled
    if (enabled && pollingInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchData();
      }, pollingInterval);
    }

    // Cleanup
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchData, pollingInterval, enabled, timeWindow]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}
