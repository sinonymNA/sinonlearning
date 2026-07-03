"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { HistoricalCollection, HistoricalFeatureProps } from "@/types/historicalGeo";
import { filterByYear } from "@/lib/filterByYear";
import { STATUS_FILL_EXPRESSION } from "@/lib/globeColors";

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

  // Pre-fetch historical data
  useEffect(() => {
    fetch("/data/historical/sample.geojson")
      .then((r) => r.json())
      .then((data: HistoricalCollection) => { dataRef.current = data; })
      .catch(() => setStatus("error"));
  }, []);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [15, 20],
      zoom: 1.8,
      attributionControl: false,
      minZoom: 0.5,
      maxZoom: 10,
    });

    mapRef.current = map;

    map.on("load", () => {
      // Enforce globe projection (style.projection is the primary mechanism in v5,
      // but calling setProjection after load ensures it applies even if style parsing differs)
      map.setProjection({ type: "globe" });

      // ── Historical data ───────────────────────────────────────────────────────
      const tryAddSource = () => {
        if (!dataRef.current) { setTimeout(tryAddSource, 80); return; }

        const yearData = filterByYear(dataRef.current, year);

        map.addSource("borders", {
          type: "geojson",
          data: yearData as GeoJSON.FeatureCollection,
          generateId: true,
        });

        map.addLayer({
          id: "borders-fill",
          type: "fill",
          source: "borders",
          paint: {
            "fill-color": STATUS_FILL_EXPRESSION as maplibregl.ExpressionSpecification,
            "fill-opacity": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              0.9,
              0.78,
            ],
          },
        });

        map.addLayer({
          id: "borders-line",
          type: "line",
          source: "borders",
          paint: {
            "line-color": "#d4cfbf",
            "line-width": 0.7,
            "line-opacity": 0.5,
          },
        });

        setStatus("ready");
      };

      tryAddSource();
    });

    // ── Interactions ──────────────────────────────────────────────────────────

    map.on("click", "borders-fill", (e) => {
      if (e.features?.length) {
        onEntityClick(e.features[0].properties as HistoricalFeatureProps);
      }
    });

    map.on("click", (e) => {
      const hit = map.queryRenderedFeatures(e.point, { layers: ["borders-fill"] });
      if (!hit.length) onEntityClick(null);
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

    return () => { map.remove(); mapRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update historical layer when year changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !dataRef.current) return;
    const src = map.getSource("borders") as maplibregl.GeoJSONSource | undefined;
    if (!src) return;
    src.setData(filterByYear(dataRef.current, year) as GeoJSON.FeatureCollection);
  }, [year]);

  return (
    <div className="relative w-full h-full">
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-sky-200 z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-600 text-sm tracking-wide">Loading globe...</p>
          </div>
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-sky-200 z-10">
          <p className="text-red-600 text-sm">Failed to load historical data.</p>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
