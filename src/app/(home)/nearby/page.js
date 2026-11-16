"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { MapPin, RefreshCw, Eye, EyeOff, Navigation, ShieldAlert, UserPlus } from "lucide-react";
import api from "@/utils/axios";
import DynamicMap from "@/components/map/DynamicMap";

export default function PeopleNearbyPage() {
  const [mapConfig, setMapConfig] = useState(null);
  const [discoverable, setDiscoverable] = useState(false);
  const [coords, setCoords] = useState(null);
  const [radiusKm, setRadiusKm] = useState(5);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [mutualRequiredErr, setMutualRequiredErr] = useState(false);

  // Load map config from admin runtime_configs and user's opt-in setting
  useEffect(() => {
    const init = async () => {
      try {
        const [cfgRes, locSettingRes] = await Promise.allSettled([
          api.get("/v1/public/client-configs/map"),
          api.get("/v1/users/me/location-settings"),
        ]);
        if (cfgRes.status === "fulfilled" && cfgRes.value?.data?.body) {
          const cfg = cfgRes.value.data.body;
          setMapConfig(cfg);
          if (cfg.nearbyMaxRadiusKm && radiusKm > cfg.nearbyMaxRadiusKm) {
            setRadiusKm(cfg.nearbyMaxRadiusKm);
          }
        }
        if (locSettingRes.status === "fulfilled" && locSettingRes.value?.data?.body) {
          setDiscoverable(Boolean(locSettingRes.value.data.body.discoverableNearby));
        }
      } catch {
        // Fallback defaults handled by DynamicMap
      }
    };
    init();
  }, []);

  const fetchNearby = useCallback(
    async (lat, lng, radius) => {
      setLoading(true);
      setMutualRequiredErr(false);
      try {
        const res = await api.get("/v1/recommendations/nearby", {
          params: { lat, lng, radiusKm: radius, limit: 50 },
        });
        const list = res.data?.body || res.data?.data || [];
        setUsers(Array.isArray(list) ? list : []);
      } catch (err) {
        if (err?.response?.status === 403 && err?.response?.data?.message === "ENABLE_NEARBY_TO_DISCOVER") {
          setMutualRequiredErr(true);
          setUsers([]);
        } else {
          toast.error("Không thể tải danh sách Người quanh đây");
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const requestLocationAndLoad = useCallback(
    (overrideRadius) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        setGeoError("Trình duyệt không hỗ trợ định vị GPS.");
        return;
      }
      setGeoError("");
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const accuracy = pos.coords.accuracy;
          setCoords({ lat, lng });

          try {
            await api.put("/v1/users/me/location", {
              lat,
              lng,
              accuracy,
              source: "gps",
              eventType: "nearby_ping",
            });
          } catch {
            // Non-blocking if location update is throttled
          }
          await fetchNearby(lat, lng, overrideRadius ?? radiusKm);
        },
        (err) => {
          setLoading(false);
          setGeoError(
            err.code === 1
              ? "Bạn chưa cấp quyền truy cập vị trí. Hãy cho phép vị trí trên trình duyệt để tìm người quanh đây."
              : "Không thể lấy tọa độ GPS hiện tại."
          );
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );
    },
    [fetchNearby, radiusKm]
  );

  useEffect(() => {
    requestLocationAndLoad();
  }, []);

  const handleToggleDiscoverable = async () => {
    const nextVal = !discoverable;
    try {
      await api.patch("/v1/users/me/location-settings", {
        discoverableNearby: nextVal,
      });
      setDiscoverable(nextVal);
      if (nextVal) {
        toast.success("Đã bật hiển thị vị trí của bạn (tự ẩn sau 15 phút)");
        if (coords) {
          await api.put("/v1/users/me/location", {
            lat: coords.lat,
            lng: coords.lng,
            source: "gps",
            eventType: "nearby_toggle",
          });
          await fetchNearby(coords.lat, coords.lng, radiusKm);
        } else {
          requestLocationAndLoad();
        }
      } else {
        await api.delete("/v1/users/me/location");
        toast.success("Đã ẩn vị trí của bạn khỏi Người quanh đây");
      }
    } catch {
      toast.error("Không thể cập nhật trạng thái hiển thị");
    }
  };

  const radiusOptions = useMemo(() => {
    const maxR = mapConfig?.nearbyMaxRadiusKm || 10;
    return [1, 3, 5, 10, 25, 50].filter((r) => r <= maxR);
  }, [mapConfig?.nearbyMaxRadiusKm]);

  const mapMarkers = useMemo(
    () =>
      users.map((u) => ({
        id: u.userId || u.id,
        lat: u.lat,
        lng: u.lng,
        label: [u.givenName, u.familyName].filter(Boolean).join(" ") || u.username,
        avatar: u.profilePictureUrl || u.avatar || "/defaultAvatar.png",
        distanceLabel: u.distanceLabel,
        raw: u,
      })),
    [users]
  );

  if (mapConfig && mapConfig.nearbyEnabled === false) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="p-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] text-center space-y-2">
          <ShieldAlert className="w-8 h-8 mx-auto text-[var(--muted-foreground)]" />
          <h1 className="text-lg font-semibold">Tính năng Người quanh đây đang tạm tắt</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Quản trị viên hiện đang tắt tính năng khám phá theo vị trí.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      {/* Header & Opt-In Controls */}
      <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[var(--accent)]" />
            <h1 className="text-xl font-bold">Người quanh đây</h1>
            {mapConfig?.provider && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-mono">
                {mapConfig.provider}
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            Khoảng cách được làm tròn để bảo vệ quyền riêng tư. Bạn có toàn quyền bật/tắt hiển thị vị trí của mình.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleToggleDiscoverable}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors border ${
              discoverable
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40"
                : "bg-[var(--background)] text-[var(--muted-foreground)] border-[var(--border)]"
            }`}
          >
            {discoverable ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>{discoverable ? "Đang hiển thị vị trí của tôi" : "Đang ẩn vị trí của tôi"}</span>
          </button>

          <select
            value={radiusKm}
            onChange={(e) => {
              const nextR = Number(e.target.value);
              setRadiusKm(nextR);
              if (coords) fetchNearby(coords.lat, coords.lng, nextR);
            }}
            className="px-3 py-2 rounded-xl text-xs font-medium bg-[var(--background)] border border-[var(--border)]"
          >
            {radiusOptions.map((r) => (
              <option key={r} value={r}>
                Bán kính {r} km
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={loading}
            onClick={() => requestLocationAndLoad(radiusKm)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--accent)] text-white flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {geoError && (
        <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-sm text-amber-700 dark:text-amber-300 flex items-center justify-between gap-3">
          <span>{geoError}</span>
          <button
            type="button"
            onClick={() => requestLocationAndLoad(radiusKm)}
            className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold shrink-0"
          >
            Thử lại GPS
          </button>
        </div>
      )}

      {mutualRequiredErr && (
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm flex items-center justify-between gap-3">
          <span>Quản trị viên yêu cầu bạn bật &quot;Hiển thị vị trí của tôi&quot; để khám phá người quanh đây.</span>
          <button
            type="button"
            onClick={handleToggleDiscoverable}
            className="px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold shrink-0"
          >
            Bật hiển thị ngay
          </button>
        </div>
      )}

      {/* Map View */}
      <DynamicMap
        mapConfig={mapConfig}
        center={coords || mapConfig?.defaultCenter}
        selfLocation={coords}
        markers={mapMarkers}
        onSelectMarker={(m) => setSelectedUser(m.raw)}
      />

      {selectedUser && (
        <div className="p-4 rounded-2xl border border-[var(--accent)]/40 bg-[var(--card)] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={selectedUser.profilePictureUrl || selectedUser.avatar || "/defaultAvatar.png"}
              alt={selectedUser.username}
              className="w-12 h-12 rounded-full object-cover border border-[var(--border)]"
            />
            <div>
              <p className="font-semibold text-sm">
                {[selectedUser.givenName, selectedUser.familyName].filter(Boolean).join(" ") || selectedUser.username}
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                @{selectedUser.username} • {selectedUser.distanceLabel}
              </p>
            </div>
          </div>
          <Link
            href={`/profile/${selectedUser.username}`}
            className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold"
          >
            Xem trang cá nhân
          </Link>
        </div>
      )}

      {/* Nearby Users List */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--muted-foreground)] flex items-center gap-2">
          <Navigation className="w-4 h-4" />
          <span>Tìm thấy {users.length} người quanh đây</span>
        </h2>

        {users.length === 0 && !loading ? (
          <div className="p-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] text-center text-sm text-[var(--muted-foreground)]">
            Chưa có người dùng nào đang bật hiển thị trong bán kính {radiusKm} km.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {users.map((u) => {
              const fullName = [u.givenName, u.familyName].filter(Boolean).join(" ") || u.username;
              return (
                <Link
                  key={u.userId || u.id}
                  href={`/profile/${u.username}`}
                  className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/60 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={u.profilePictureUrl || u.avatar || "/defaultAvatar.png"}
                      alt={u.username}
                      className="w-11 h-11 rounded-full object-cover border border-[var(--border)] shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{fullName}</p>
                      <p className="text-xs text-[var(--muted-foreground)] truncate">@{u.username}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs font-semibold text-[var(--accent)]">{u.distanceLabel}</span>
                    {!u.isFriend && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-[var(--muted-foreground)]">
                        <UserPlus className="w-3 h-3" /> Kết nối
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
