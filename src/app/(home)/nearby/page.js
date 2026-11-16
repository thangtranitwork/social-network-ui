"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  MapPin,
  RefreshCw,
  Eye,
  EyeOff,
  Navigation,
  ShieldAlert,
  UserPlus,
  Compass,
  CheckCircle2,
  X,
  ArrowUpRight,
} from "lucide-react";
import api from "@/utils/axios";
import DynamicMap from "@/components/map/DynamicMap";

export default function PeopleNearbyPage() {
  const [mapConfig, setMapConfig] = useState(null);
  const [discoverable, setDiscoverable] = useState(false);
  const [coords, setCoords] = useState(null);
  const [radiusKm, setRadiusKm] = useState(5);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filterMode, setFilterMode] = useState("all"); // all | strangers | friends
  const [loading, setLoading] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [mutualRequiredErr, setMutualRequiredErr] = useState(false);

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

  const fetchNearby = useCallback(async (lat, lng, radius) => {
    setLoading(true);
    setMutualRequiredErr(false);
    try {
      const res = await api.get("/v1/recommendations/nearby", {
        params: { lat, lng, radiusKm: radius, limit: 50 },
      });
      const list = res.data?.body || res.data?.data || [];
      setUsers(Array.isArray(list) ? list : []);
    } catch (err) {
      if (
        err?.response?.status === 403 &&
        err?.response?.data?.message === "ENABLE_NEARBY_TO_DISCOVER"
      ) {
        setMutualRequiredErr(true);
        setUsers([]);
      } else if (err?.response?.status !== 401) {
        toast.error("Không thể tải danh sách Người quanh đây");
      }
    } finally {
      setLoading(false);
    }
  }, []);

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
            // Non-blocking if throttled or unauthenticated
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
      toast.error("Vui lòng đăng nhập để thay đổi trạng thái hiển thị");
    }
  };

  const radiusOptions = useMemo(() => {
    const maxR = mapConfig?.nearbyMaxRadiusKm || 10;
    return [1, 3, 5, 10, 25, 50].filter((r) => r <= maxR);
  }, [mapConfig?.nearbyMaxRadiusKm]);

  const filteredUsers = useMemo(() => {
    if (filterMode === "strangers") return users.filter((u) => !u.isFriend);
    if (filterMode === "friends") return users.filter((u) => u.isFriend);
    return users;
  }, [users, filterMode]);

  const mapMarkers = useMemo(
    () =>
      filteredUsers.map((u) => ({
        id: u.userId || u.id,
        lat: u.lat,
        lng: u.lng,
        label: [u.givenName, u.familyName].filter(Boolean).join(" ") || u.username,
        avatar: u.profilePictureUrl || u.avatar || "/defaultAvatar.png",
        distanceLabel: u.distanceLabel,
        raw: u,
      })),
    [filteredUsers]
  );

  if (mapConfig && mapConfig.nearbyEnabled === false) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] text-center space-y-3 shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-[var(--muted)] flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6 text-[var(--muted-foreground)]" />
          </div>
          <h1 className="text-lg font-semibold">Tính năng Người quanh đây đang tạm tắt</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Quản trị viên hiện đang tắt tính năng khám phá theo vị trí.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col lg:flex-row overflow-hidden bg-[var(--background)]">
      {/* Left / Main Full-Bleed Map Viewport */}
      <div className="relative flex-1 min-h-[48vh] lg:min-h-0 lg:h-full overflow-hidden">
        <DynamicMap
          mapConfig={mapConfig}
          center={coords || mapConfig?.defaultCenter}
          selfLocation={coords}
          markers={mapMarkers}
          onSelectMarker={(m) => setSelectedUser(m.raw)}
          className="w-full h-full"
        />

        {/* Floating Top-Left Glassmorphic Controls */}
        <div className="absolute top-4 left-4 right-16 z-10 pointer-events-none flex flex-col gap-2.5 max-w-xl">
          <div className="pointer-events-auto rounded-2xl border border-[var(--border)] bg-[var(--card)]/85 backdrop-blur-xl shadow-lg p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center shrink-0">
                <Compass className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold tracking-tight truncate">Người quanh đây</h1>
                  {mapConfig?.provider && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] font-mono uppercase tracking-wider">
                      {mapConfig.provider}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[var(--muted-foreground)] truncate">
                  Khoảng cách làm tròn để bảo vệ quyền riêng tư
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleDiscoverable}
                className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 border ${
                  discoverable
                    ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/40 hover:bg-emerald-500/25"
                    : "bg-[var(--card-elevated)] text-[var(--muted-foreground)] border-[var(--border)] hover:text-[var(--foreground)]"
                }`}
              >
                {discoverable ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{discoverable ? "Đang hiện vị trí" : "Đang ẩn vị trí"}</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => requestLocationAndLoad(radiusKm)}
                title="Làm mới GPS"
                className="cursor-pointer px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--accent)] hover:opacity-90 text-white flex items-center gap-1.5 transition-opacity disabled:opacity-50 shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Làm mới</span>
              </button>
            </div>
          </div>

          {/* Radius Segmented Pills */}
          <div className="pointer-events-auto inline-flex w-fit items-center gap-1 p-1 rounded-xl border border-[var(--border)] bg-[var(--card)]/85 backdrop-blur-xl shadow-md">
            <span className="text-[11px] font-medium text-[var(--muted-foreground)] px-2">
              Bán kính:
            </span>
            {radiusOptions.map((r) => {
              const active = radiusKm === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRadiusKm(r);
                    if (coords) fetchNearby(coords.lat, coords.lng, r);
                  }}
                  className={`cursor-pointer px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    active
                      ? "bg-[var(--accent)] text-white shadow-sm"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--card-elevated)]"
                  }`}
                >
                  {r} km
                </button>
              );
            })}
          </div>

          {geoError && (
            <div className="pointer-events-auto p-3 rounded-xl border border-amber-500/40 bg-amber-500/15 backdrop-blur-md text-xs text-amber-300 flex items-center justify-between gap-3">
              <span>{geoError}</span>
              <button
                type="button"
                onClick={() => requestLocationAndLoad(radiusKm)}
                className="cursor-pointer px-2.5 py-1 rounded-lg bg-amber-500 text-white font-semibold shrink-0"
              >
                Thử lại
              </button>
            </div>
          )}

          {mutualRequiredErr && (
            <div className="pointer-events-auto p-3 rounded-xl border border-[var(--accent)]/40 bg-[var(--card)]/90 backdrop-blur-md text-xs flex items-center justify-between gap-3">
              <span>Bật &quot;Đang hiện vị trí&quot; để khám phá người dùng quanh bạn.</span>
              <button
                type="button"
                onClick={handleToggleDiscoverable}
                className="cursor-pointer px-3 py-1 rounded-lg bg-[var(--accent)] text-white font-semibold shrink-0"
              >
                Bật ngay
              </button>
            </div>
          )}
        </div>

        {/* Floating Selected Pin Preview Card */}
        {selectedUser && (
          <div className="absolute bottom-5 left-4 right-4 sm:right-auto sm:w-80 z-10 rounded-2xl border border-[var(--accent)]/40 bg-[var(--card)]/95 backdrop-blur-xl p-4 shadow-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={selectedUser.profilePictureUrl || selectedUser.avatar || "/defaultAvatar.png"}
                alt={selectedUser.username}
                className="w-11 h-11 rounded-full object-cover border border-[var(--border)] shrink-0"
              />
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">
                  {[selectedUser.givenName, selectedUser.familyName].filter(Boolean).join(" ") ||
                    selectedUser.username}
                </p>
                <p className="text-xs text-[var(--muted-foreground)] truncate">
                  @{selectedUser.username} • <span className="text-[var(--accent)] font-semibold">{selectedUser.distanceLabel}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Link
                href={`/profile/${selectedUser.username}`}
                className="p-2 rounded-xl bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
                title="Xem trang cá nhân"
              >
                <ArrowUpRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="cursor-pointer p-2 rounded-xl bg-[var(--card-elevated)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Discovery Panel */}
      <aside className="w-full lg:w-[380px] xl:w-[420px] h-[44vh] lg:h-full border-t lg:border-t-0 lg:border-l border-[var(--border)] bg-[var(--card)] flex flex-col shrink-0">
        <div className="p-4 border-b border-[var(--border)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-[var(--accent)]" />
              <h2 className="text-sm font-bold">
                Gần bạn ({filteredUsers.length})
              </h2>
            </div>
            <Link
              href="/settings/privacy"
              className="text-[11px] font-medium text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors"
            >
              Quyền riêng tư →
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[var(--background)] border border-[var(--border)]">
            {[
              { id: "all", label: "Tất cả" },
              { id: "strangers", label: "Mới quen" },
              { id: "friends", label: "Bạn bè" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterMode(tab.id)}
                className={`cursor-pointer py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filterMode === tab.id
                    ? "bg-[var(--card-elevated)] text-[var(--foreground)] shadow-sm"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredUsers.length === 0 && !loading ? (
            <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center px-4 py-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold">
                  Chưa có ai quanh đây trong {radiusKm} km
                </p>
                <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                  {discoverable
                    ? "Thử mở rộng bán kính hoặc quay lại sau ít phút."
                    : "Bật hiển thị vị trí để xuất hiện trên bản đồ và kết nối với mọi người."}
                </p>
              </div>
              {!discoverable ? (
                <button
                  type="button"
                  onClick={handleToggleDiscoverable}
                  className="cursor-pointer px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  Bật hiển thị vị trí của tôi
                </button>
              ) : (
                radiusKm < (mapConfig?.nearbyMaxRadiusKm || 10) && (
                  <button
                    type="button"
                    onClick={() => {
                      const maxR = mapConfig?.nearbyMaxRadiusKm || 10;
                      setRadiusKm(maxR);
                      if (coords) fetchNearby(coords.lat, coords.lng, maxR);
                    }}
                    className="cursor-pointer px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] text-xs font-semibold hover:border-[var(--accent)]/50 transition-colors"
                  >
                    Mở rộng lên {mapConfig?.nearbyMaxRadiusKm || 10} km
                  </button>
                )
              )}
            </div>
          ) : (
            filteredUsers.map((u) => {
              const fullName =
                [u.givenName, u.familyName].filter(Boolean).join(" ") || u.username;
              const isSelected = selectedUser?.username === u.username;
              return (
                <div
                  key={u.userId || u.id}
                  onClick={() => setSelectedUser(u)}
                  className={`cursor-pointer p-3 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                    isSelected
                      ? "border-[var(--accent)] bg-[var(--accent)]/10"
                      : "border-[var(--border)] bg-[var(--background)]/60 hover:bg-[var(--card-elevated)] hover:border-[var(--accent)]/40"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={u.profilePictureUrl || u.avatar || "/defaultAvatar.png"}
                      alt={u.username}
                      className="w-11 h-11 rounded-full object-cover border border-[var(--border)] shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{fullName}</p>
                      <p className="text-xs text-[var(--muted-foreground)] truncate">
                        @{u.username}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)]">
                      {u.distanceLabel}
                    </span>
                    <Link
                      href={`/profile/${u.username}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    >
                      {u.isFriend ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>Bạn bè</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3 h-3" />
                          <span>Xem hồ sơ</span>
                        </>
                      )}
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </div>
  );
}
