"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Feature, FeatureCollection, Geometry, MultiPolygon, Polygon } from "geojson";
import type { HistoricalCollection, HistoricalFeatureProps } from "@/types/historicalGeo";
import { filterByYear } from "@/lib/filterByYear";

// Natural atlas style — parchment land, calm ocean, no modern political fills
const NATURAL_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  name: "natural-historical-globe",
  projection: { type: "globe" },
  sources: {},
  layers: [
    {
      id: "ocean",
      type: "background",
      paint: { "background-color": "#b8d4e8" },
    },
  ],
};

interface GlobeMapProps {
  year: number;
  onEntityClick: (entity: HistoricalFeatureProps | null) => void;
}

function mergeCollections(...collections: (HistoricalCollection | null)[]): HistoricalCollection {
  return {
    type: "FeatureCollection",
    features: collections.flatMap((c) => c?.features ?? []),
  };
}

function computeLabelSource(yearData: HistoricalCollection): FeatureCollection {
  const features: Feature[] = [];
  for (const f of yearData.features) {
    const geom = f.geometry as Geometry;
    const allCoords: number[][] = [];
    if (geom.type === "Polygon") {
      allCoords.push(...(geom as Polygon).coordinates[0]);
    } else if (geom.type === "MultiPolygon") {
      for (const poly of (geom as MultiPolygon).coordinates) {
        allCoords.push(...poly[0]);
      }
    }
    if (!allCoords.length) continue;
    const lngs = allCoords.map((c) => c[0]);
    const lats = allCoords.map((c) => c[1]);
    const cx = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    const cy = (Math.min(...lats) + Math.max(...lats)) / 2;
    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [cx, cy] },
      properties: { name: f.properties?.name ?? "" },
    });
  }
  return { type: "FeatureCollection", features };
}

export default function GlobeMap({ year, onEntityClick }: GlobeMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const ancientRef = useRef<HistoricalCollection | null>(null);
  const modernRef  = useRef<HistoricalCollection | null>(null);
  const hoveredIdRef = useRef<string | number | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  // Pre-fetch both data files in parallel
  useEffect(() => {
    const fetchJson = (url: string) =>
      fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null);

    Promise.all([
      fetchJson("/data/historical/ancient-world.geojson"),
      fetchJson("/data/historical/cshapes-2-0.geojson").then(
        (d) => d ?? fetchJson("/data/historical/sample.geojson")
      ),
    ]).then(([ancient, modern]) => {
      if (!ancient && !modern) { setStatus("error"); return; }
      ancientRef.current = ancient;
      modernRef.current  = modern;
    });
  }, []);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: NATURAL_STYLE,
      center: [15, 20],
      zoom: 1.8,
      attributionControl: false,
      minZoom: 0.5,
      maxZoom: 10,
    });

    mapRef.current = map;

    map.on("load", () => {
      map.setProjection({ type: "globe" });

      // ── Land basemap (Natural Earth 110m) ────────────────────────────────────
      map.addSource("land", {
        type: "geojson",
        data: "/data/historical/ne_110m_land.geojson",
      });

      map.addLayer({
        id: "land-fill",
        type: "fill",
        source: "land",
        paint: {
          "fill-color": "#d6c9a8",
          "fill-opacity": 1,
        },
      });

      map.addLayer({
        id: "land-line",
        type: "line",
        source: "land",
        paint: {
          "line-color": "#9aaa8a",
          "line-width": 0.7,
          "line-opacity": 0.6,
        },
      });

      // ── Historical data ───────────────────────────────────────────────────────
      const tryAddSource = () => {
        // Wait until at least one data source is available
        if (!ancientRef.current && !modernRef.current) {
          setTimeout(tryAddSource, 80);
          return;
        }

        const combined = mergeCollections(ancientRef.current, modernRef.current);
        const yearData = filterByYear(combined, year);

        map.addSource("borders", {
          type: "geojson",
          data: yearData as FeatureCollection,
          generateId: true,
        });

        map.addLayer({
          id: "borders-fill",
          type: "fill",
          source: "borders",
          paint: {
            "fill-color": ["coalesce", ["get", "color"], "#2471a3"] as maplibregl.ExpressionSpecification,
            "fill-opacity": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              0.88,
              0.72,
            ] as maplibregl.ExpressionSpecification,
          },
        });

        map.addLayer({
          id: "borders-line",
          type: "line",
          source: "borders",
          paint: {
            "line-color": "#ffffff",
            "line-width": 0.8,
            "line-opacity": 0.6,
          },
        });

        // Label source: one Point per visible entity at polygon centroid
        map.addSource("borders-labels", {
          type: "geojson",
          data: computeLabelSource(yearData),
        });

        map.addLayer({
          id: "borders-text",
          type: "symbol",
          source: "borders-labels",
          layout: {
            "text-field": ["get", "name"] as maplibregl.ExpressionSpecification,
            "text-size": 10,
            "text-font": ["Open Sans Regular"],
            "text-max-width": 8,
            "text-allow-overlap": false,
            "text-ignore-placement": false,
          },
          paint: {
            "text-color": "#1a1a1a",
            "text-halo-color": "rgba(255,255,255,0.85)",
            "text-halo-width": 1.5,
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

  // Update historical layers when year changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const bordersSrc = map.getSource("borders") as maplibregl.GeoJSONSource | undefined;
    if (!bordersSrc) return;
    const combined = mergeCollections(ancientRef.current, modernRef.current);
    const yearData = filterByYear(combined, year);
    bordersSrc.setData(yearData as FeatureCollection);
    const labelSrc = map.getSource("borders-labels") as maplibregl.GeoJSONSource | undefined;
    if (labelSrc) labelSrc.setData(computeLabelSource(yearData));
  }, [year]);

  return (
    <div className="relative w-full h-full">
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#b8d4e8] z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-700 text-sm tracking-wide">Loading globe...</p>
          </div>
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#b8d4e8] z-10">
          <p className="text-red-700 text-sm">Failed to load historical data.</p>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
