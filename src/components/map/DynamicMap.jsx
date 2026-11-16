"use client";

import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

function buildGoogleTileUrls(template) {
  const tpl =
    template || "https://mt{s}.google.com/vt/lyrs=r&x={x}&y={y}&z={z}&hl=vi";
  if (tpl.includes("{s}")) {
    return ["0", "1", "2", "3"].map((s) => tpl.replace("{s}", s));
  }
  return [tpl];
}

function resolveMapLibreStyle(mapConfig) {
  const provider = mapConfig?.provider || "carto";
  const stylePref = mapConfig?.style || "auto";

  if (provider === "google_tiles") {
    return {
      version: 8,
      sources: {
        "google-tiles": {
          type: "raster",
          tiles: buildGoogleTileUrls(mapConfig?.googleTilesUrl),
          tileSize: 256,
        },
      },
      layers: [
        {
          id: "google-tiles-layer",
          type: "raster",
          source: "google-tiles",
          minzoom: 0,
          maxzoom: 22,
        },
      ],
    };
  }

  if (provider === "osm") {
    return {
      version: 8,
      sources: {
        "osm-tiles": {
          type: "raster",
          tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
          tileSize: 256,
          attribution: "© OpenStreetMap contributors",
        },
      },
      layers: [
        {
          id: "osm-tiles-layer",
          type: "raster",
          source: "osm-tiles",
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    };
  }

  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");
  let cartoStyle = stylePref;
  if (cartoStyle === "auto" || !["voyager", "positron", "dark-matter"].includes(cartoStyle)) {
    cartoStyle = isDark ? "dark-matter" : "voyager";
  }
  return `https://basemaps.cartocdn.com/gl/${cartoStyle}-gl-style/style.json`;
}

export default function DynamicMap({
  mapConfig,
  center,
  selfLocation,
  markers = [],
  onSelectMarker,
  className = "w-full h-[420px] rounded-2xl overflow-hidden border border-[var(--border)]",
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRefs = useRef([]);

  const provider = mapConfig?.provider || "carto";

  useEffect(() => {
    if (!containerRef.current || provider === "disabled") return;

    const initialCenter = center || mapConfig?.defaultCenter || { lat: 10.7769, lng: 106.7009 };
    const initialZoom = mapConfig?.defaultCenter?.zoom || 13;

    // If google_sdk is selected without a key, gracefully fall back to Carto
    const effectiveConfig =
      provider === "google_sdk" && !mapConfig?.googleApiKey
        ? { ...mapConfig, provider: "carto" }
        : mapConfig;

    if (effectiveConfig?.provider === "google_sdk" && effectiveConfig?.googleApiKey) {
      let cancelled = false;
      const scriptId = "pocpoc-google-maps-sdk";
      const initGoogleMap = () => {
        if (cancelled || !containerRef.current || !window.google?.maps) return;
        const gmap = new window.google.maps.Map(containerRef.current, {
          center: { lat: initialCenter.lat, lng: initialCenter.lng },
          zoom: initialZoom,
          mapTypeId: mapConfig?.style === "satellite" ? "satellite" : "roadmap",
          disableDefaultUI: false,
        });
        mapRef.current = { type: "google", instance: gmap };

        if (selfLocation) {
          new window.google.maps.Marker({
            position: { lat: selfLocation.lat, lng: selfLocation.lng },
            map: gmap,
            title: "Bạn",
          });
        }

        markers.forEach((m) => {
          const gm = new window.google.maps.Marker({
            position: { lat: m.lat, lng: m.lng },
            map: gmap,
            title: `${m.label} (${m.distanceLabel})`,
          });
          gm.addListener("click", () => onSelectMarker?.(m));
        });
      };

      if (window.google?.maps) {
        initGoogleMap();
      } else if (!document.getElementById(scriptId)) {
        const s = document.createElement("script");
        s.id = scriptId;
        s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(effectiveConfig.googleApiKey)}`;
        s.async = true;
        s.onload = initGoogleMap;
        document.head.appendChild(s);
      }

      return () => {
        cancelled = true;
      };
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: resolveMapLibreStyle(effectiveConfig),
      center: [initialCenter.lng, initialCenter.lat],
      zoom: initialZoom,
      attributionControl: provider !== "google_tiles",
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = { type: "maplibre", instance: map };

    return () => {
      markerRefs.current.forEach((mk) => mk.remove());
      markerRefs.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [provider, mapConfig?.style, mapConfig?.googleTilesUrl, mapConfig?.googleApiKey]);

  // Sync center & markers on MapLibre instance without recreating the map
  useEffect(() => {
    const current = mapRef.current;
    if (!current || current.type !== "maplibre") return;
    const map = current.instance;

    if (center?.lat && center?.lng) {
      map.flyTo({ center: [center.lng, center.lat], essential: true, duration: 600 });
    }

    markerRefs.current.forEach((mk) => mk.remove());
    markerRefs.current = [];

    if (selfLocation?.lat && selfLocation?.lng) {
      const el = document.createElement("div");
      el.className = "w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg ring-4 ring-blue-500/30";
      el.title = "Vị trí của bạn";
      const selfMk = new maplibregl.Marker({ element: el })
        .setLngLat([selfLocation.lng, selfLocation.lat])
        .addTo(map);
      markerRefs.current.push(selfMk);
    }

    markers.forEach((m) => {
      const wrapper = document.createElement("button");
      wrapper.type = "button";
      wrapper.className = "group flex flex-col items-center cursor-pointer focus:outline-none";

      const avatarBox = document.createElement("div");
      avatarBox.className =
        "w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md bg-zinc-200 dark:bg-zinc-800 group-hover:scale-110 transition-transform";
      const img = document.createElement("img");
      img.src = m.avatar || "/defaultAvatar.png";
      img.alt = m.label || "User";
      img.className = "w-full h-full object-cover";
      avatarBox.appendChild(img);

      const badge = document.createElement("span");
      badge.className =
        "mt-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-black/75 text-white whitespace-nowrap shadow";
      badge.textContent = m.distanceLabel || "";

      wrapper.appendChild(avatarBox);
      if (m.distanceLabel) wrapper.appendChild(badge);
      wrapper.addEventListener("click", () => onSelectMarker?.(m));

      const mk = new maplibregl.Marker({ element: wrapper, anchor: "bottom" })
        .setLngLat([m.lng, m.lat])
        .addTo(map);
      markerRefs.current.push(mk);
    });
  }, [center?.lat, center?.lng, selfLocation?.lat, selfLocation?.lng, markers, onSelectMarker]);

  if (provider === "disabled") {
    return (
      <div className={`${className} flex items-center justify-center bg-[var(--card)] text-sm text-[var(--muted-foreground)]`}>
        Bản đồ hiện đang được quản trị viên tạm tắt (chế độ danh sách).
      </div>
    );
  }

  return <div ref={containerRef} className={className} />;
}
