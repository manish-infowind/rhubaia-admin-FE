import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useActiveUsersMap } from "@/hooks/useActiveUsersMap";
import { Loader2, MapPin, Users, Palette, Layers, RefreshCw, TrendingUp, DollarSign, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ViewMode = "heatmap" | "clustering";
type ColorMode = "snapchat" | "blue" | "green" | "purple" | "fire";

interface ColorScheme {
  name: string;
  colors: string[];
}

const colorSchemes: Record<ColorMode, ColorScheme> = {
  snapchat: {
    name: "Snapchat",
    colors: [
      "rgba(255, 200, 0, 0)",
      "rgba(255, 180, 0, 0.5)",
      "rgba(255, 160, 0, 0.7)",
      "rgba(255, 140, 0, 0.85)",
      "rgba(255, 100, 0, 0.95)",
      "rgba(255, 50, 0, 1)",
      "rgba(255, 0, 0, 1)",
    ],
  },
  blue: {
    name: "Ocean",
    colors: [
      "rgba(59, 130, 246, 0)",
      "rgba(59, 130, 246, 0.4)",
      "rgba(37, 99, 235, 0.6)",
      "rgba(29, 78, 216, 0.75)",
      "rgba(30, 64, 175, 0.85)",
      "rgba(30, 58, 138, 0.95)",
      "rgba(17, 24, 39, 1)",
    ],
  },
  green: {
    name: "Nature",
    colors: [
      "rgba(34, 197, 94, 0)",
      "rgba(34, 197, 94, 0.4)",
      "rgba(22, 163, 74, 0.6)",
      "rgba(21, 128, 61, 0.75)",
      "rgba(20, 83, 45, 0.85)",
      "rgba(20, 83, 45, 0.95)",
      "rgba(5, 46, 22, 1)",
    ],
  },
  purple: {
    name: "Royal",
    colors: [
      "rgba(168, 85, 247, 0)",
      "rgba(168, 85, 247, 0.4)",
      "rgba(147, 51, 234, 0.6)",
      "rgba(126, 34, 206, 0.75)",
      "rgba(107, 33, 168, 0.85)",
      "rgba(88, 28, 135, 0.95)",
      "rgba(59, 7, 100, 1)",
    ],
  },
  fire: {
    name: "Fire",
    colors: [
      "rgba(251, 191, 36, 0)",
      "rgba(251, 191, 36, 0.5)",
      "rgba(245, 158, 11, 0.7)",
      "rgba(217, 119, 6, 0.85)",
      "rgba(194, 65, 12, 0.95)",
      "rgba(154, 52, 18, 1)",
      "rgba(127, 29, 29, 1)",
    ],
  },
};

interface ActivityMapProps {
  className?: string;
}

export function ActivityMap({ className = "" }: ActivityMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const closePopupHandlerRef = useRef<((e: maplibregl.MapMouseEvent) => void) | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("heatmap");
  const [colorMode, setColorMode] = useState<ColorMode>("snapchat");
  const [showIntelligencePanel, setShowIntelligencePanel] = useState<boolean>(true);
  const [timeWindow, setTimeWindow] = useState<number>(5);
  const { data, loading, error, refetch } = useActiveUsersMap({
    timeWindow: timeWindow,
    pollingInterval: 60000, // Poll every 60 seconds
    enabled: true,
    useMockData: false, // Use real API
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize MapLibre GL map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "raster-tiles": {
            type: "raster",
            tiles: [
              "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          },
        },
        layers: [
          {
            id: "simple-tiles",
            type: "raster",
            source: "raster-tiles",
            minzoom: 0,
            maxzoom: 22,
          },
        ],
      },
      center: [0, 20], // Global center coordinates
      zoom: 2,
      attributionControl: true,
      renderWorldCopies: false, // Prevent world from repeating horizontally
    });

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), "top-right");

    // Initialize popup with dashboard styling
    popupRef.current = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: false,
      anchor: "bottom",
      offset: [0, -10],
      className: "map-popup",
    });

    return () => {
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update map data source and layers
  useEffect(() => {
    if (!map.current || !data) return;

    const sourceId = "active-users";
    const heatmapLayerId = "active-users-heatmap";
    const heatmapClickableLayerId = "active-users-heatmap-clickable";
    const clusteringLayerId = "active-users-clustering";
    const unclusteredPointLayerId = "active-users-points";
    const clusterCountLayerId = "active-users-cluster-count";

    // Remove existing layers and source if they exist
    if (map.current.getLayer(heatmapLayerId)) {
      map.current.removeLayer(heatmapLayerId);
    }
    if (map.current.getLayer(heatmapClickableLayerId)) {
      map.current.removeLayer(heatmapClickableLayerId);
    }
    if (map.current.getLayer(clusteringLayerId)) {
      map.current.removeLayer(clusteringLayerId);
    }
    if (map.current.getLayer(unclusteredPointLayerId)) {
      map.current.removeLayer(unclusteredPointLayerId);
    }
    if (map.current.getLayer(clusterCountLayerId)) {
      map.current.removeLayer(clusterCountLayerId);
    }
    if (map.current.getSource(sourceId)) {
      map.current.removeSource(sourceId);
    }

    // Add GeoJSON source
    map.current.addSource(sourceId, {
      type: "geojson",
      data: data as any,
      cluster: viewMode === "clustering",
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });

    if (viewMode === "heatmap") {
      // Add heatmap layer
      map.current.addLayer({
        id: heatmapLayerId,
        type: "heatmap",
        source: sourceId,
        maxzoom: 15,
        paint: {
          "heatmap-weight": [
            "interpolate",
            ["linear"],
            ["get", "count"],
            0,
            0,
            1,
            0.2,
            10,
            0.4,
            50,
            0.6,
            100,
            0.8,
            200,
            1,
          ],
          "heatmap-intensity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            1.2,
            9,
            2.5,
          ],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            colorSchemes[colorMode].colors[0],
            0.1,
            colorSchemes[colorMode].colors[1],
            0.3,
            colorSchemes[colorMode].colors[2],
            0.5,
            colorSchemes[colorMode].colors[3],
            0.7,
            colorSchemes[colorMode].colors[4],
            0.9,
            colorSchemes[colorMode].colors[5],
            1,
            colorSchemes[colorMode].colors[6],
          ],
          "heatmap-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            2,
            9,
            20,
          ],
          "heatmap-opacity": 0.75,
        },
      });

      // Add invisible clickable circle layer for heatmap clicks
      map.current.addLayer({
        id: heatmapClickableLayerId,
        type: "circle",
        source: sourceId,
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            3,
            10,
            9,
            18,
          ],
          "circle-opacity": 0,
          "circle-stroke-width": 0,
        },
      });

      // Add click handler for heatmap points
      map.current.on("click", heatmapClickableLayerId, (e) => {
        const features = map.current!.queryRenderedFeatures(e.point, {
          layers: [heatmapClickableLayerId],
        });
        if (features.length === 0) return;
        
        const properties = features[0].properties;
        const city = properties?.city || "Unknown";
        const count = properties?.count || 0;
        const conversionRate = properties?.conversionRate || 0;
        const paidUsers = properties?.paidUsers || 0;
        const freeUsers = properties?.freeUsers || 0;
        const paidToFreeRatio = properties?.paidToFreeRatio || 0;
        
        if (popupRef.current) {
          const html = `
            <div style="padding: 14px; min-width: 200px; font-family: system-ui, -apple-system, sans-serif; background: white; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="font-weight: 600; font-size: 15px; margin-bottom: 10px; color: #111827; display: flex; align-items: center; gap: 6px;">
                <span style="width: 8px; height: 8px; background: #14b8a6; border-radius: 50%;"></span>
                ${city}
              </div>
              <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; padding: 6px 10px; background: #ecfdf5; border-radius: 6px; margin-bottom: 8px;">
                <span style="font-weight: 600; color: #059669; font-size: 14px;">${count}</span>
                <span style="color: #6b7280;">${count === 1 ? 'active user' : 'active users'}</span>
              </div>
              <div style="border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 8px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                  <span style="font-size: 11px; color: #6b7280;">Conversion Rate:</span>
                  <span style="font-weight: 600; color: #059669; font-size: 12px;">${conversionRate}%</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                  <span style="font-size: 11px; color: #6b7280;">Paid Users:</span>
                  <span style="font-weight: 600; color: #059669; font-size: 12px;">${paidUsers}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                  <span style="font-size: 11px; color: #6b7280;">Free Users:</span>
                  <span style="font-weight: 600; color: #6b7280; font-size: 12px;">${freeUsers}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="font-size: 11px; color: #6b7280;">Paid/Free Ratio:</span>
                  <span style="font-weight: 600; color: #059669; font-size: 12px;">${paidToFreeRatio.toFixed(2)}</span>
                </div>
              </div>
            </div>
          `;
          popupRef.current
            .setLngLat(e.lngLat)
            .setHTML(html)
            .addTo(map.current!);
        }
      });

      // Change cursor on hover for heatmap
      map.current.on("mouseenter", heatmapClickableLayerId, () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = "pointer";
        }
      });
      map.current.on("mouseleave", heatmapClickableLayerId, () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = "";
        }
      });
    } else {
      // Clustering mode
      // Add circle layer for clusters
      map.current.addLayer({
        id: clusteringLayerId,
        type: "circle",
        source: sourceId,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#14b8a6", // brand-teal for small clusters
            10,
            "#10b981", // brand-green for medium clusters
            30,
            "#059669", // darker green for large clusters
            100,
            "#047857", // darkest green for very large clusters
          ],
          "circle-radius": [
            "step",
            ["get", "point_count"],
            20,
            10,
            30,
            30,
            40,
            100,
            50,
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      });

      // Add count labels for clusters
      map.current.addLayer({
        id: clusterCountLayerId,
        type: "symbol",
        source: sourceId,
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 12,
        },
        paint: {
          "text-color": "#fff",
        },
      });

      // Add unclustered points
      map.current.addLayer({
        id: unclusteredPointLayerId,
        type: "circle",
        source: sourceId,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#14b8a6", // brand-teal color
          "circle-radius": 8,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      });

      // Add click handlers for clusters
      map.current.on("click", clusteringLayerId, (e) => {
        const features = map.current!.queryRenderedFeatures(e.point, {
          layers: [clusteringLayerId],
        });
        if (features.length === 0) return;
        
        const clusterId = features[0].properties?.cluster_id;
        const pointCount = features[0].properties?.point_count || 0;
        const source = map.current!.getSource(sourceId) as maplibregl.GeoJSONSource;
        
        // Show popup with cluster info
        if (popupRef.current) {
          const html = `
            <div style="padding: 14px; min-width: 180px; font-family: system-ui, -apple-system, sans-serif; background: white; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="font-weight: 600; font-size: 15px; margin-bottom: 8px; color: #111827; display: flex; align-items: center; gap: 6px;">
                <span style="width: 8px; height: 8px; background: #14b8a6; border-radius: 50%;"></span>
                Cluster
              </div>
              <div style="font-size: 14px; color: #059669; font-weight: 600; margin-bottom: 6px; padding: 6px 10px; background: #ecfdf5; border-radius: 6px; display: inline-block;">
                ${pointCount} ${pointCount === 1 ? 'location' : 'locations'}
              </div>
              <div style="font-size: 11px; color: #6b7280; margin-top: 6px; font-style: italic;">
                Click to zoom in
              </div>
            </div>
          `;
          popupRef.current
            .setLngLat(e.lngLat)
            .setHTML(html)
            .addTo(map.current!);
        }
        
        // Zoom into cluster
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          map.current!.easeTo({
            center: (e.lngLat as any),
            zoom: zoom,
          });
        });
      });

      // Add click handler for individual points
      map.current.on("click", unclusteredPointLayerId, (e) => {
        const features = map.current!.queryRenderedFeatures(e.point, {
          layers: [unclusteredPointLayerId],
        });
        if (features.length === 0) return;
        
        const properties = features[0].properties;
        const city = properties?.city || "Unknown";
        const count = properties?.count || 0;
        const conversionRate = properties?.conversionRate || 0;
        const paidUsers = properties?.paidUsers || 0;
        const freeUsers = properties?.freeUsers || 0;
        const paidToFreeRatio = properties?.paidToFreeRatio || 0;
        
        if (popupRef.current) {
          const html = `
            <div style="padding: 14px; min-width: 200px; font-family: system-ui, -apple-system, sans-serif; background: white; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="font-weight: 600; font-size: 15px; margin-bottom: 10px; color: #111827; display: flex; align-items: center; gap: 6px;">
                <span style="width: 8px; height: 8px; background: #14b8a6; border-radius: 50%;"></span>
                ${city}
              </div>
              <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; padding: 6px 10px; background: #ecfdf5; border-radius: 6px; margin-bottom: 8px;">
                <span style="font-weight: 600; color: #059669; font-size: 14px;">${count}</span>
                <span style="color: #6b7280;">${count === 1 ? 'active user' : 'active users'}</span>
              </div>
              <div style="border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 8px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                  <span style="font-size: 11px; color: #6b7280;">Conversion Rate:</span>
                  <span style="font-weight: 600; color: #059669; font-size: 12px;">${conversionRate}%</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                  <span style="font-size: 11px; color: #6b7280;">Paid Users:</span>
                  <span style="font-weight: 600; color: #059669; font-size: 12px;">${paidUsers}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                  <span style="font-size: 11px; color: #6b7280;">Free Users:</span>
                  <span style="font-weight: 600; color: #6b7280; font-size: 12px;">${freeUsers}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="font-size: 11px; color: #6b7280;">Paid/Free Ratio:</span>
                  <span style="font-weight: 600; color: #059669; font-size: 12px;">${paidToFreeRatio.toFixed(2)}</span>
                </div>
              </div>
            </div>
          `;
          popupRef.current
            .setLngLat(e.lngLat)
            .setHTML(html)
            .addTo(map.current!);
        }
      });

      // Change cursor on hover
      map.current.on("mouseenter", clusteringLayerId, () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = "pointer";
        }
      });
      map.current.on("mouseleave", clusteringLayerId, () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = "";
        }
      });

      // Change cursor on hover for individual points
      map.current.on("mouseenter", unclusteredPointLayerId, () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = "pointer";
        }
      });
      map.current.on("mouseleave", unclusteredPointLayerId, () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = "";
        }
      });
    }

    // Add click handler to close popup when clicking on empty map area
    closePopupHandlerRef.current = (e: maplibregl.MapMouseEvent) => {
      // Only close if clicking on the base map, not on any data layers
      const features = map.current!.queryRenderedFeatures(e.point);
      const dataLayerIds = viewMode === "heatmap" 
        ? [heatmapClickableLayerId]
        : [clusteringLayerId, unclusteredPointLayerId];
      
      const hasDataLayer = features.some((f) => 
        dataLayerIds.includes(f.layer.id)
      );
      
      if (!hasDataLayer && popupRef.current) {
        popupRef.current.remove();
      }
    };
    
    if (closePopupHandlerRef.current) {
      map.current.on("click", closePopupHandlerRef.current);
    }

    // Cleanup function
    return () => {
      if (map.current) {
        // Remove all event listeners (using type assertion for layer-specific events)
        try {
          (map.current.off as any)("click", heatmapClickableLayerId);
          (map.current.off as any)("click", clusteringLayerId);
          (map.current.off as any)("click", unclusteredPointLayerId);
          if (closePopupHandlerRef.current) {
            map.current.off("click", closePopupHandlerRef.current);
          }
          (map.current.off as any)("mouseenter", heatmapClickableLayerId);
          (map.current.off as any)("mouseleave", heatmapClickableLayerId);
          (map.current.off as any)("mouseenter", clusteringLayerId);
          (map.current.off as any)("mouseleave", clusteringLayerId);
          (map.current.off as any)("mouseenter", unclusteredPointLayerId);
          (map.current.off as any)("mouseleave", unclusteredPointLayerId);
        } catch (e) {
          // Ignore errors during cleanup
        }
        
        if (map.current.getLayer(heatmapLayerId)) {
          map.current.removeLayer(heatmapLayerId);
        }
        if (map.current.getLayer(heatmapClickableLayerId)) {
          map.current.removeLayer(heatmapClickableLayerId);
        }
        if (map.current.getLayer(clusteringLayerId)) {
          map.current.removeLayer(clusteringLayerId);
        }
        if (map.current.getLayer(unclusteredPointLayerId)) {
          map.current.removeLayer(unclusteredPointLayerId);
        }
        if (map.current.getLayer(clusterCountLayerId)) {
          map.current.removeLayer(clusterCountLayerId);
        }
        if (map.current.getSource(sourceId)) {
          map.current.removeSource(sourceId);
        }
      }
      if (popupRef.current) {
        popupRef.current.remove();
      }
    };
  }, [data, viewMode, colorMode, timeWindow]);

  return (
    <div className={`relative ${className}`}>
      {/* Enhanced Control Panel */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        {/* View Mode Toggle */}
        <div className="flex gap-1 bg-white/95 backdrop-blur-sm rounded-lg p-1 shadow-lg border border-gray-200">
          <Button
            variant={viewMode === "heatmap" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("heatmap")}
            className={`text-xs h-8 px-3 flex items-center gap-1.5 ${
              viewMode === "heatmap"
                ? "bg-brand-teal text-white hover:bg-brand-teal/90 shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Heatmap
          </Button>
          <Button
            variant={viewMode === "clustering" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("clustering")}
            className={`text-xs h-8 px-3 flex items-center gap-1.5 ${
              viewMode === "clustering"
                ? "bg-brand-teal text-white hover:bg-brand-teal/90 shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            Clusters
          </Button>
        </div>

        {/* Color Mode Selector - Only show for heatmap */}
        {viewMode === "heatmap" && (
          <div className="bg-white/95 backdrop-blur-sm rounded-lg p-2.5 shadow-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Palette className="h-3.5 w-3.5 text-brand-teal" />
              <span className="text-xs font-semibold text-gray-700">Color Theme</span>
            </div>
            <Select value={colorMode} onValueChange={(value) => setColorMode(value as ColorMode)}>
              <SelectTrigger className="h-8 w-[150px] text-xs border-gray-200 hover:border-brand-teal/50 transition-colors">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full border border-gray-300"
                    style={{ 
                      background: `linear-gradient(135deg, ${colorSchemes[colorMode].colors[2]}, ${colorSchemes[colorMode].colors[6]})` 
                    }}
                  />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="snapchat">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-400 to-red-500" />
                    <span>Standard</span>
                  </div>
                </SelectItem>
                <SelectItem value="blue">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-900" />
                    <span>Ocean</span>
                  </div>
                </SelectItem>
                <SelectItem value="green">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-green-900" />
                    <span>Nature</span>
                  </div>
                </SelectItem>
                <SelectItem value="purple">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-purple-900" />
                    <span>Royal</span>
                  </div>
                </SelectItem>
                <SelectItem value="fire">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-400 to-orange-800" />
                    <span>Fire</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Time Window Selector */}
        <div className="bg-white/95 backdrop-blur-sm rounded-lg p-2.5 shadow-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-3.5 w-3.5 text-brand-teal" />
            <span className="text-xs font-semibold text-gray-700">Time Window</span>
          </div>
          <Select 
            value={timeWindow.toString()} 
            onValueChange={(value) => {
              const newTimeWindow = parseInt(value);
              setTimeWindow(newTimeWindow);
            }}
          >
            <SelectTrigger className="h-8 w-[140px] text-xs border-gray-200 hover:border-brand-teal/50 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">Last 5 minutes</SelectItem>
              <SelectItem value="15">Last 15 minutes</SelectItem>
              <SelectItem value="30">Last 30 minutes</SelectItem>
              <SelectItem value="60">Last 60 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Refresh Button */}
        <Button
          size="sm"
          variant="outline"
          onClick={refetch}
          className="h-8 bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg hover:bg-white text-gray-700 hover:text-gray-900"
          title="Refresh map data"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Map Container */}
      <div
        ref={mapContainer}
        className="w-full h-[400px] rounded-md overflow-hidden shadow-inner border border-gray-100"
        style={{ minHeight: "400px" }}
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-md z-20">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-brand-teal" />
            <p className="text-sm text-muted-foreground">Loading map data...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-md z-20">
          <Card className="p-4 max-w-md shadow-lg">
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-sm font-medium text-red-600 mb-2">
                  Failed to load map data
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  {error.message}
                </p>
                <Button 
                  size="sm" 
                  onClick={refetch} 
                  variant="outline"
                  className="border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white"
                >
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && data && data.features.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-md z-20">
          <div className="text-center">
            <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm font-medium text-gray-600 mb-1">
              No active users
            </p>
              <p className="text-xs text-muted-foreground">
              No users were active in the last {timeWindow} {timeWindow === 1 ? 'minute' : 'minutes'}
            </p>
          </div>
        </div>
      )}

      {/* Geographic Intelligence Panel */}
      {!loading && !error && data && data.features.length > 0 && (
        <div className={`absolute left-4 top-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 transition-all duration-300 ${
          showIntelligencePanel ? 'w-[320px] max-h-[calc(400px-5rem)]' : 'w-auto'
        }`}>
          {/* Panel Header */}
          <div className="p-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand-teal" />
              <h3 className="text-sm font-semibold text-gray-900">Geographic Intelligence</h3>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowIntelligencePanel(!showIntelligencePanel)}
              className="h-6 w-6 p-0"
            >
              {showIntelligencePanel ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>

          {showIntelligencePanel && (
            <div className="max-h-[350px] overflow-y-auto">
              {/* Most Active Cities */}
              <div className="p-3 border-b border-gray-100">
                <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-brand-teal" />
                  Most Active Cities
                </h4>
                <div className="space-y-2">
                  {data.features
                    .sort((a, b) => (b.properties.count || 0) - (a.properties.count || 0))
                    .slice(0, 5)
                    .map((feature, index) => {
                      const props = feature.properties;
                      return (
                        <div
                          key={`active-${props.city}-${index}`}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => {
                            if (map.current && feature.geometry.type === "Point") {
                              const [lng, lat] = feature.geometry.coordinates;
                              map.current.flyTo({
                                center: [lng, lat],
                                zoom: 6,
                                duration: 1000,
                              });
                            }
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-500 w-4">
                              #{index + 1}
                            </span>
                            <span className="text-xs font-medium text-gray-900">
                              {props.city}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-brand-teal">
                            {props.count}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Paid vs Free Ratio by City */}
              <div className="p-3">
                <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-brand-teal" />
                  Highest Paid/Free Ratio
                </h4>
                <div className="space-y-2">
                  {data.features
                    .filter(f => {
                      const props = f.properties;
                      // Only show cities with both paid and free users data
                      return (props.paidUsers !== undefined && props.paidUsers !== null) &&
                             (props.freeUsers !== undefined && props.freeUsers !== null) &&
                             (props.freeUsers > 0) &&
                             (props.paidToFreeRatio !== undefined && props.paidToFreeRatio !== null && props.paidToFreeRatio > 0);
                    })
                    .sort((a, b) => {
                      const ratioA = a.properties.paidToFreeRatio || 0;
                      const ratioB = b.properties.paidToFreeRatio || 0;
                      return ratioB - ratioA;
                    })
                    .slice(0, 5)
                    .map((feature, index) => {
                      const props = feature.properties;
                      const ratio = props.paidToFreeRatio || 0;
                      const paidUsers = props.paidUsers || 0;
                      const freeUsers = props.freeUsers || 0;
                      return (
                        <div
                          key={`ratio-${props.city}-${index}`}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => {
                            if (map.current && feature.geometry.type === "Point") {
                              const [lng, lat] = feature.geometry.coordinates;
                              map.current.flyTo({
                                center: [lng, lat],
                                zoom: 6,
                                duration: 1000,
                              });
                            }
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-500 w-4">
                              #{index + 1}
                            </span>
                            <span className="text-xs font-medium text-gray-900">
                              {props.city}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600">
                              {paidUsers}/{freeUsers}
                            </span>
                            <span className="text-xs font-semibold text-brand-teal">
                              {ratio.toFixed(2)}x
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Stats Info */}
      {!loading && !error && data && data.features.length > 0 && (
        <div className={`absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200 transition-all ${
          showIntelligencePanel ? 'ml-[336px]' : ''
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-brand-teal/10 rounded-md">
              <Users className="h-4 w-4 text-brand-teal" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {data.features.length} {data.features.length === 1 ? "Location" : "Locations"}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                Active in last {timeWindow} {timeWindow === 1 ? 'minute' : 'minutes'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
