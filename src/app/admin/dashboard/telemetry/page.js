"use client";

import { useEffect, useState } from "react";
import adminApi from "@/utils/adminInterception";
import {
  Activity,
  MapPin,
  MonitorSmartphone,
  Search,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const PIE_COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EC4899", "#3B82F6"];

export default function AdminTelemetryAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get("/v1/admin/analytics/telemetry");
      setData(res.data?.body || null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const telemetry = data?.telemetry || {};
  const searchCtr = data?.searchCtr || {};
  const platforms = telemetry.platforms || [];
  const cities = telemetry.cities || [];
  const topQueries = searchCtr.topQueries || [];
  const zeroClickQueries = searchCtr.zeroClickQueries || [];
  const popularUsers = searchCtr.popularUserClicks || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Telemetry &amp; Search CTR Analytics</h1>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Phân bố thiết bị, khu vực địa lý (GPS/GeoIP) và hiệu quả tìm kiếm (Search CTR / Zero-click).
          </p>
        </div>
        <button
          type="button"
          onClick={fetchAnalytics}
          disabled={loading}
          className="cursor-pointer px-3.5 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Phiên thiết bị đã ghi nhận"
          value={telemetry.totalDeviceSessions || 0}
          icon={MonitorSmartphone}
        />
        <SummaryCard
          label="Đang bật Người quanh đây"
          value={telemetry.nearbyActiveUsers || 0}
          icon={MapPin}
        />
        <SummaryCard
          label="Từ khóa có thống kê CTR"
          value={topQueries.length}
          icon={Search}
        />
        <SummaryCard
          label="Từ khóa Zero-Click"
          value={zeroClickQueries.length}
          icon={AlertTriangle}
        />
      </div>

      {/* Charts: Cities & Platforms */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-sm font-bold">Phân bố người dùng theo Thành phố</h2>
          </div>
          {cities.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-[var(--muted-foreground)]">
              Chưa có dữ liệu thành phố (user chưa cập nhật GPS/GeoIP).
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cities}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366F1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-sm font-bold">Tỉ lệ Nền tảng / Thiết bị</h2>
          </div>
          {platforms.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-[var(--muted-foreground)]">
              Chưa có dữ liệu thiết bị.
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={platforms}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    label={({ name, count }) => `${name}: ${count}`}
                  >
                    {platforms.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Search CTR & Zero-Click Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-3">
          <h2 className="text-sm font-bold">Top Từ khóa &amp; Tỉ lệ Click (CTR)</h2>
          {topQueries.length === 0 ? (
            <p className="text-xs text-[var(--muted-foreground)]">Chưa có dữ liệu Search CTR.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)] text-left">
                    <th className="py-2">Từ khóa</th>
                    <th className="py-2">Clicks</th>
                    <th className="py-2">Impressions</th>
                    <th className="py-2">CTR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {topQueries.map((q) => (
                    <tr key={q.query}>
                      <td className="py-2 font-medium">{q.query}</td>
                      <td className="py-2">{q.clicks}</td>
                      <td className="py-2">{q.impressions}</td>
                      <td className="py-2 font-semibold text-[var(--accent)]">{q.ctrPercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Zero-Click Queries &amp; Top User được click</span>
          </h2>
          {zeroClickQueries.length === 0 && popularUsers.length === 0 ? (
            <p className="text-xs text-[var(--muted-foreground)]">
              Chưa có từ khóa zero-click nào được ghi nhận.
            </p>
          ) : (
            <div className="space-y-4">
              {zeroClickQueries.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase">
                    Tìm nhiều nhưng chưa có click
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {zeroClickQueries.map((q) => (
                      <span
                        key={q.query}
                        className="px-2.5 py-1 rounded-full text-xs bg-amber-500/15 text-amber-500 border border-amber-500/30"
                      >
                        {q.query} ({q.impressions})
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {popularUsers.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase">
                    Hồ sơ được click nhiều nhất từ Search
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {popularUsers.map((u) => (
                      <span
                        key={u.resultId}
                        className="px-2.5 py-1 rounded-full text-xs bg-[var(--accent)]/15 text-[var(--accent)]"
                      >
                        @{u.resultId} ({u.clicks})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 flex items-center justify-between">
      <div>
        <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
        <p className="text-2xl font-bold mt-1">{Number(value).toLocaleString()}</p>
      </div>
      <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center">
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}
