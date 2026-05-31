"use client"

import { useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts"
import { useRouter } from "next/navigation"
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Eye, 
  UserCheck, 
  UserX,
  Filter
} from "lucide-react"
import adminApi from "@/utils/adminInterception"

export default function UsersPage() {
  const [usersData, setUsersData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()
  const [week, setWeek] = useState("")
  const [month, setMonth] = useState("")
  const [year, setYear] = useState("")
  const [date, setDate] = useState("")

  const fetchUsersStatistics = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await adminApi.get("/v2/statistics/users")
      setUsersData(res.data.body)
    } catch (err) {
      setError(`Không thể tải thống kê users: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsersStatistics()
  }, [])

  useEffect(() => {
    if (week !== "") {
      const fetchData = async () => {
        try {
          const res = await adminApi.get(`/v2/statistics/users/week?week=${week}`)
          if (res.data.code === 200) {
            setUsersData((pre) => ({
              ...pre,
              thisWeekStatistics: res.data.body,
            }))
          }
        } catch (error) {
          console.error("Lỗi khi lấy thống kê tuần:", error)
        }
      }
      fetchData()
    }
  }, [week])

  useEffect(() => {
    if (month !== "") {
      const fetchData = async () => {
        try {
          const res = await adminApi.get(`/v2/statistics/users/month?month=${month}`)
          if (res.data.code === 200) {
            setUsersData((pre) => ({
              ...pre,
              thisMonthStatistics: res.data.body,
            }))
          }
        } catch (error) {
          console.error("Lỗi khi lấy thống kê tháng:", error)
        }
      }
      fetchData()
    }
  }, [month])

  useEffect(() => {
    if (date !== "") {
      const fetchData = async () => {
        try {
          const res = await adminApi.get(`/v2/statistics/users/online?date=${date}`)
          if (res.data.code === 200) {
            setUsersData((pre) => ({
              ...pre,
              onlineStatistics: res.data.body,
            }))
          }
        } catch (error) {
          console.error("Lỗi khi lấy thống kê trực tuyến:", error)
        }
      }
      fetchData()
    }
  }, [date])

  useEffect(() => {
    if (year !== "") {
      const fetchData = async () => {
        try {
          const res = await adminApi.get(`/v2/statistics/users/year?year=${year}`)
          if (res.data.code === 200) {
            setUsersData((pre) => ({
              ...pre,
              thisYearStatistics: res.data.body,
            }))
          }
        } catch (error) {
          console.error("Lỗi khi lấy thống kê năm:", error)
        }
      }
      fetchData()
    }
  }, [year])

  const transformByMinute = (rawLogs) => {
    if (!Array.isArray(rawLogs)) return []
    const map = new Map()
    rawLogs.forEach((log) => {
      const date = log.timestamp
      map.set(date, log.onlineCount)
    })
    return Array.from(map.entries())
      .map(([date, value]) => ({
        time: date.slice(0, 16).replace("T", " "),
        value: value === null ? 0 : value,
      }))
  }

  const transformMonthlyData = (data) => {
    if (!data) return []
    return Object.entries(data).map(([date, value]) => ({
      date: `${date}`,
      value: value === null ? 0 : value,
    }))
  }

  const transformWeeklyData = (data) => {
    if (!data) return []
    return Object.entries(data).map(([day, value]) => ({
      day: day.substring(0, 3),
      value: value === null ? 0 : value,
    }))
  }

  const transformYearlyData = (data) => {
    if (!data) return []
    return Object.entries(data)
      .filter(([month, value]) => value !== null)
      .map(([month, value]) => ({
        month: month.substring(0, 3),
        value: value,
      }))
  }

  // Styled Glassmorphic Stat Card
  const StatCard = ({ title, value, icon: Icon, glowColor, trend, onClick }) => (
    <div
      className={`admin-card relative overflow-hidden p-6 rounded-2xl hover:shadow-lg transition-all duration-300 group transform hover:-translate-y-1 ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      {/* Glow highlight */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-15 dark:opacity-25 group-hover:scale-125 transition-transform duration-500 bg-gradient-to-br ${glowColor}`} />
      
      <div className="flex items-center justify-between relative z-10">
        <div className="space-y-2">
          <p className="text-[var(--muted-foreground)] text-xs md:text-sm font-medium tracking-wider uppercase">{title}</p>
          <p className="text-3xl font-extrabold tracking-tight text-[var(--foreground)]">{value}</p>
          {trend && (
            <div className="flex items-center text-xs text-[var(--accent)] font-semibold mt-1 bg-[var(--accent-subtle)] px-2.5 py-0.5 rounded-full w-max">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${glowColor} text-white shadow-md shadow-black/5`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )

  // Sleek Glassmorphic Custom Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="admin-card p-3 rounded-xl shadow-lg text-[var(--foreground)] text-xs">
          <p className="font-semibold text-[var(--muted-foreground)] mb-1 uppercase tracking-wider">{label}</p>
          <p className="text-sm font-bold text-[var(--accent)] flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mr-2 animate-pulse"></span>
            <span>{payload[0].value.toLocaleString()} người</span>
          </p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[var(--border)] border-t-[var(--accent)] mx-auto mb-4"></div>
          <p className="text-[var(--muted-foreground)] font-medium text-sm">
            Đang tải dữ liệu thống kê...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center p-8 rounded-2xl admin-card border-red-100 dark:border-red-950/20 max-w-md">
          <div className="text-red-500 text-4xl mb-3">⚠️</div>
          <p className="text-red-500 font-semibold">{error}</p>
          <button 
            onClick={fetchUsersStatistics}
            className="mt-4 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {usersData && (
        <div className="space-y-8 animate-fade-up">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Tổng người dùng"
              value={usersData.totalUsers?.toLocaleString()}
              icon={Users}
              glowColor="from-[#6366F1] to-[#3B82F6]"
              trend={`+${usersData.newUsersThisMonth} tháng này`}
              onClick={() => router.push('/admin/dashboard/viewusers')}
            />
            <StatCard
              title="Đang trực tuyến"
              value={usersData.onlineUsersNow?.toLocaleString()}
              icon={Eye}
              glowColor="from-[#10B981] to-[#059669]"
            />
            <StatCard
              title="Đăng ký hôm nay"
              value={usersData.newUsersToday?.toLocaleString()}
              icon={UserCheck}
              glowColor="from-[#8B5CF6] to-[#6366F1]"
            />
            <StatCard
              title="Chưa xác thực"
              value={usersData.notVerifiedUsers?.toLocaleString()}
              icon={UserX}
              glowColor="from-[#F59E0B] to-[#EF4444]"
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Weekly Chart */}
            <div className="p-6 rounded-2xl admin-card shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <h3 className="text-base font-bold flex items-center text-[var(--foreground)]">
                  <Calendar className="w-5 h-5 mr-2 text-[var(--accent)]" />
                  Người dùng mới trong tuần
                </h3>
                <div className="relative flex items-center">
                  <Filter className="w-3.5 h-3.5 absolute right-3 text-[var(--muted-foreground)] pointer-events-none" />
                  <input 
                    type="week" 
                    id="week" 
                    name="week" 
                    onChange={(e) => setWeek(e.target.value)} 
                    className="admin-input pl-3 pr-9 py-1.5 text-xs rounded-xl font-medium transition-all"
                  />
                </div>
              </div>
              
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={transformWeeklyData(usersData.thisWeekStatistics)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
                    <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.15 }} />
                    <Bar dataKey="value" fill="url(#weeklyColor)" radius={[4, 4, 0, 0]}>
                      <defs>
                        <linearGradient id="weeklyColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366F1" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#00A3FF" stopOpacity={0.7} />
                        </linearGradient>
                      </defs>
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Yearly Chart */}
            <div className="p-6 rounded-2xl admin-card shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <h3 className="text-base font-bold flex items-center text-[var(--foreground)]">
                  <Clock className="w-5 h-5 mr-2 text-[#8B5CF6]" />
                  Đăng ký trong năm
                </h3>
                <input
                  onChange={(e) => setYear(e.target.value)}
                  type="number"
                  id="year"
                  name="year"
                  min="2025"
                  max="2027"
                  step="1"
                  defaultValue={2025}
                  placeholder="Nhập năm"
                  className="admin-input px-3 py-1.5 text-xs rounded-xl font-medium transition-all w-28"
                />
              </div>
              
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={transformYearlyData(usersData.thisYearStatistics)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
                    <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#8B5CF6"
                      strokeWidth={3}
                      dot={{ fill: "#8B5CF6", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Daily Online Chart */}
          <div className="p-6 rounded-2xl admin-card shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <h3 className="text-base font-bold flex items-center text-[var(--foreground)]">
                <Clock className="w-5 h-5 mr-2 text-[var(--accent)]" />
                Số lượng trực tuyến hôm nay (Phút)
              </h3>
              <div className="relative flex items-center">
                <Calendar className="w-3.5 h-3.5 absolute right-3 text-[var(--muted-foreground)] pointer-events-none" />
                <input 
                  type="date" 
                  id="date" 
                  name="date" 
                  onChange={(e) => setDate(e.target.value)} 
                  className="admin-input pl-3 pr-9 py-1.5 text-xs rounded-xl font-medium transition-all"
                />
              </div>
            </div>
            
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={transformByMinute(usersData.onlineStatistics)}>
                  <defs>
                    <linearGradient id="onlineColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#6366F1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <XAxis
                    dataKey="time"
                    stroke="var(--muted-foreground)"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => value.slice(11, 16)}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={2} fill="url(#onlineColor)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Registered Chart */}
          <div className="p-6 rounded-2xl admin-card shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <h3 className="text-base font-bold flex items-center text-[var(--foreground)]">
                <TrendingUp className="w-5 h-5 mr-2 text-[#10B981]" />
                Đăng ký thành viên trong tháng
              </h3>
              <div className="relative flex items-center">
                <Calendar className="w-3.5 h-3.5 absolute right-3 text-[var(--muted-foreground)] pointer-events-none" />
                <input 
                  onChange={(e) => setMonth(e.target.value)} 
                  type="month" 
                  id="month" 
                  name="month"
                  className="admin-input pl-3 pr-9 py-1.5 text-xs rounded-xl font-medium transition-all"
                />
              </div>
            </div>
            
            <div className="w-full h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={transformMonthlyData(usersData.thisMonthStatistics)}>
                  <defs>
                    <linearGradient id="monthlyColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
                  <XAxis
                    dataKey="date"
                    angle={-45}
                    textAnchor="end"
                    height={70}
                    interval={0}
                    stroke="var(--muted-foreground)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2.5} fill="url(#monthlyColor)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}
    </>
  )
}