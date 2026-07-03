"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { HistoricalCollection, HistoricalFeatureProps } from "@/types/historicalGeo";
import { filterByYear } from "@/lib/filterByYear";
import { STATUS_FILL_EXPRESSION } from "@/lib/globeColors";

const DARK_STYLE = {
  version: 8 as const,
  name: "dark-historical-globe",
  sources: {} as Record<string, never>,
  layers: [
    {
      id: "ocean",
      type: "background" as const,
      paint: { "background-color": "#060e1a" },
    },
  ],
};

interface GlobeMapProps {
  year: number;
  onEntityClick: (entity: HistoricalFeatureProps | null) => void;
}

export default function GlobeMap({ year, onEntityClick }: GlobeMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const dataRef = useRef<HistoricalCollection | null>(null);
  const hoveredIdRef = useRef<string | number | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  // Load GeoJSON once
  useEffect(() => {
    fetch("/data/historical/sample.geojson")
      .then((r) => r.json())
      .then((data: HistoricalCollection) => { dataRef.current = data; })
      .catch(() => setStatus("error"));
  }, []);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      style: DARK_STYLE as any,
      center: [15, 25],
      zoom: 1.4,
      attributionControl: false,
      minZoom: 0.5,
      maxZoom: 8,
    });

    mapRef.current = map;

    map.on("load", () => {
      // Enable globe projection
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (map as any).setProjection({ name: "globe" });
      } catch {
        // Falls back gracefully to mercator if globe not supported
      }

      const tryAddSource = () => {
        if (!dataRef.current) { setTimeout(tryAddSource, 100); return; }

        const yearData = filterByYear(dataRef.current, year);

        map.addSource("borders", {
          type: "geojson",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: yearData as any,
          generateId: true,
        });

        map.addLayer({
          id: "borders-fill",
          type: "fill",
          source: "borders",
          paint: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            "fill-color": STATUS_FILL_EXPRESSION as any,
            "fill-opacity": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              0.88,
              0.72,
            ],
          },
        });

        map.addLayer({
          id: "borders-line",
          type: "line",
          source: "borders",
          paint: {
            "line-color": "#c9c4b5",
            "line-width": 0.6,
            "line-opacity": 0.45,
          },
        });

        setStatus("ready");
      };

      tryAddSource();
    });

    map.on("click", "borders-fill", (e) => {
      if (e.features?.length) {
        onEntityClick(e.features[0].properties as HistoricalFeatureProps);
        e.originalEvent.stopPropagation();
      }
    });

    // Click on ocean clears panel
    map.on("click", (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ["borders-fill"] });
      if (!features.length) onEntityClick(null);
    });

    map.on("mousemove", "borders-fill", (e) => {
      if (!e.features?.length) return;
      const id = e.features[0].id;
      if (hoveredIdRef.current !== null && hoveredIdRef.current !== id) {
        map.setFeatureState({ source: "borders", id: hoveredIdRef.current }, { hover: false });
      }
      hoveredIdRef.current = id ?? null;
      if (id !== undefined) map.setFeatureState({ source: "borders", id }, { hover: true });
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", "borders-fill", () => {
      if (hoveredIdRef.current !== null) {
        map.setFeatureState({ source: "borders", id: hoveredIdRef.current }, { hover: false });
      }
      hoveredIdRef.current = null;
      map.getCanvas().style.cursor = "";
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: true, showZoom: true }),
      "top-right"
    );

    return () => {
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update visible data when year changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !dataRef.current) return;
    const src = map.getSource("borders") as maplibregl.GeoJSONSource | undefined;
    if (!src) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    src.setData(filterByYear(dataRef.current, year) as any);
  }, [year]);

  return (
    <div className="relative w-full h-full">
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#060e1a] z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm tracking-wide">Loading globe...</p>
          </div>
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#060e1a] z-10">
          <p className="text-red-400 text-sm">Failed to load historical data.</p>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
