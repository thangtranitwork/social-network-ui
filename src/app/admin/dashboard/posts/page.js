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
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import {
  FileText,
  Heart,
  MessageCircle,
  Share2,
  Paperclip,
  TrendingUp,
  Calendar,
  Clock,
  Globe,
  Lock,
  Eye,
  Award,
  Filter
} from "lucide-react"
import { useRouter } from "next/navigation"
import adminApi from "@/utils/adminInterception"

const PIE_COLORS = ["#8B5CF6", "#6366F1", "#3B82F6"] // Amethyst, Electric Indigo, Cobalt Blue

export default function PostsPage() {
  const [postsData, setPostsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()
  const [week, setWeek] = useState("")
  const [month, setMonth] = useState("")
  const [year, setYear] = useState("")
  const [date, setDate] = useState("")

  const fetchPostsStatistics = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await adminApi.get("/v2/statistics/posts")
      setPostsData(res.data.body)
    } catch (err) {
      setError(`Không thể tải thống kê posts: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPostsStatistics()
  }, [])

  useEffect(() => {
    if (week !== "") {
      const fetchData = async () => {
        try {
          const res = await adminApi.get(`/v2/statistics/posts/week?week=${week}`)
          if (res.data.code === 200) {
            setPostsData((pre) => ({
              ...pre,
              thisWeekStatistics: res.data.body,
            }))
          }
        } catch (error) {
          console.error("Lỗi khi lấy thống kê bài viết tuần:", error)
        }
      }
      fetchData()
    }
  }, [week])

  useEffect(() => {
    if (month !== "") {
      const fetchData = async () => {
        try {
          const res = await adminApi.get(`/v2/statistics/posts/month?month=${month}`)
          if (res.data.code === 200) {
            setPostsData((pre) => ({
              ...pre,
              thisMonthStatistics: res.data.body,
            }))
          }
        } catch (error) {
          console.error("Lỗi khi lấy thống kê bài viết tháng:", error)
        }
      }
      fetchData()
    }
  }, [month])

  useEffect(() => {
    if (date !== "") {
      const fetchData = async () => {
        try {
          const res = await adminApi.get(`/v2/statistics/posts/online?date=${date}`)
          if (res.data.code === 200) {
            setPostsData((pre) => ({
              ...pre,
              onlineStatistics: res.data.body,
            }))
          }
        } catch (error) {
          console.error("Lỗi khi lấy thống kê trực tuyến ngày:", error)
        }
      }
      fetchData()
    }
  }, [date])

  useEffect(() => {
    if (year !== "") {
      const fetchData = async () => {
        try {
          const res = await adminApi.get(`/v2/statistics/posts/year?year=${year}`)
          if (res.data.code === 200) {
            setPostsData((pre) => ({
              ...pre,
              thisYearStatistics: res.data.body,
            }))
          }
        } catch (error) {
          console.error("Lỗi khi lấy thống kê năm bài viết:", error)
        }
      }
      fetchData()
    }
  }, [year])

  const transformData = {
    weekly: (data) => {
      if (!data) return []
      const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]
      return days.map((day) => ({
        day: day.substring(0, 3),
        value: data[day] ?? 0,
      }))
    },
    monthly: (data) => {
      if (!data) return []
      return Object.entries(data).map(([date, value]) => ({
        date: `Ngày ${date}`,
        value: value === null ? 0 : value,
      }))
    },
    yearly: (data) => {
      if (!data) return []
      return Object.entries(data)
        .filter(([month, value]) => value !== null)
        .map(([month, value]) => ({
          month: month.substring(0, 3),
          value: value,
        }))
    }
  }

  // Glass Stat Card Component
  const StatCard = ({ title, value, icon: Icon, glowColor, trend, onClick }) => (
    <div
      className={`admin-card relative overflow-hidden p-6 rounded-2xl hover:shadow-lg transition-all duration-300 group transform hover:-translate-y-1 ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      {/* Glow highlight background */}
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

  // Custom sleek glassmorphic Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="admin-card p-3 rounded-xl shadow-lg text-[var(--foreground)] text-xs">
          <p className="font-semibold text-[var(--muted-foreground)] mb-1 uppercase tracking-wider">{label}</p>
          <p className="text-sm font-bold text-[var(--accent)] flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mr-2 animate-pulse"></span>
            <span>{payload[0].value.toLocaleString()} bài viết</span>
          </p>
        </div>
      )
    }
    return null
  }

  // Engagement post display card
  const HottestPost = ({ post }) => (
    <div className="admin-card p-5 rounded-2xl relative overflow-hidden group hover:border-[var(--accent)]/30 transition-all duration-300">
      
      {/* Decorative Glow accent */}
      <div className="absolute -right-12 -bottom-12 w-32 h-32 rounded-full blur-3xl opacity-10 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] pointer-events-none" />

      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] rounded-full flex items-center justify-center text-white font-bold shadow-md shadow-black/5">
            {post.author?.givenName?.[0] || "?"}
          </div>
          <div>
            <p className="font-bold text-sm text-[var(--foreground)]">
              {post.author?.givenName} {post.author?.familyName}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              @{post.author?.username}
            </p>
          </div>
          <div className={`w-2 h-2 rounded-full ${post.author?.isOnline ? "bg-green-500" : "bg-gray-400"}`} />
        </div>
        <div className="flex items-center space-x-2">
          {post.privacy === "PUBLIC" ? (
            <Globe className="w-4 h-4 text-green-500" />
          ) : (
            <Lock className="w-4 h-4 text-yellow-500" />
          )}
          <span className="text-xs text-[var(--muted-foreground)] font-medium">
            {new Date(post.createdAt).toLocaleDateString("vi-VN")}
          </span>
        </div>
      </div>

      {post.content && (
        <p className="mb-4 p-3.5 rounded-xl text-sm leading-relaxed text-[var(--foreground)] admin-inset whitespace-pre-wrap">
          {post.content}
        </p>
      )}
      
      {post.files && post.files.length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent)]/10">
          <div className="flex items-center text-[var(--accent)] font-semibold text-xs">
            <Paperclip className="w-4 h-4 mr-1.5" />
            <span>Đã đính kèm {post.files.length} tệp tin media</span>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
        <div className="flex items-center space-x-5">
          <div className="flex items-center text-pink-500 font-medium text-xs">
            <Heart className="w-4.5 h-4.5 mr-1.5 fill-pink-500/10" />
            <span>{post.likeCount?.toLocaleString()}</span>
          </div>
          <div className="flex items-center text-blue-500 font-medium text-xs">
            <MessageCircle className="w-4.5 h-4.5 mr-1.5 fill-blue-500/10" />
            <span>{post.commentCount?.toLocaleString()}</span>
          </div>
          <div className="flex items-center text-green-500 font-medium text-xs">
            <Share2 className="w-4.5 h-4.5 mr-1.5" />
            <span>{post.shareCount?.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  )

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
            onClick={fetchPostsStatistics}
            className="mt-4 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  const pieData = [
    { name: "Riêng tư", value: postsData.privatePostCount || 0 },
    { name: "Công khai", value: postsData.publicPostCount || 0 },
    { name: "Bạn bè", value: postsData.friendPostCount || 0 },
  ]

  return (
    <div className="space-y-8 animate-fade-up">
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng bài viết"
          value={postsData.totalPosts?.toLocaleString()}
          icon={FileText}
          glowColor="from-[#8B5CF6] to-[#6366F1]"
          trend={`+${postsData.newPostsThisMonth} tháng này`}
          onClick={() => router.push('/admin/dashboard/viewposts')}
        />
        <StatCard 
          title="Tổng lượt Thích" 
          value={postsData.totalLikes?.toLocaleString()} 
          icon={Heart} 
          glowColor="from-pink-500 to-rose-600" 
        />
        <StatCard 
          title="Tổng bình luận" 
          value={postsData.totalComments?.toLocaleString()} 
          icon={MessageCircle} 
          glowColor="from-blue-500 to-cyan-600" 
        />
        <StatCard 
          title="Tổng lượt chia sẻ" 
          value={postsData.totalShares?.toLocaleString()} 
          icon={Share2} 
          glowColor="from-[#10B981] to-[#059669]" 
        />
        <StatCard 
          title="Tệp tin phương tiện" 
          value={postsData.totalFiles?.toLocaleString()} 
          icon={Paperclip} 
          glowColor="from-amber-500 to-orange-600" 
        />
        <StatCard 
          title="Bài viết đã xóa" 
          value={postsData.deletedPostCount?.toLocaleString()} 
          icon={FileText} 
          glowColor="from-red-500 to-rose-700" 
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Weekly Chart */}
        <div className="p-6 rounded-2xl admin-card shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <h3 className="text-base font-bold flex items-center text-[var(--foreground)]">
              <Calendar className="w-5 h-5 mr-2 text-[var(--accent)]" />
              Bài viết mới trong tuần
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
              <BarChart data={transformData.weekly(postsData.thisWeekStatistics)}>
                <defs>
                  <linearGradient id="postsWeeklyColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.15 }} />
                <Bar dataKey="value" fill="url(#postsWeeklyColor)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Yearly Chart */}
        <div className="p-6 rounded-2xl admin-card shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <h3 className="text-base font-bold flex items-center text-[var(--foreground)]">
              <Clock className="w-5 h-5 mr-2 text-[#8B5CF6]" />
              Bài viết trong năm
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
              <LineChart data={transformData.yearly(postsData.thisYearStatistics)}>
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

      {/* Monthly Area Chart */}
      <div className="p-6 rounded-2xl admin-card shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h3 className="text-base font-bold flex items-center text-[var(--foreground)]">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
            Số lượng bài đăng trong tháng
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
            <AreaChart data={transformData.monthly(postsData.thisMonthStatistics)}>
              <defs>
                <linearGradient id="postsMonthlyColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.0} />
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
              <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2.5} fill="url(#postsMonthlyColor)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Engagement Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Engagement Pie Chart */}
        <div className="admin-card p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <h3 className="text-base font-bold text-[var(--foreground)] mb-4">
            Quyền riêng tư bài viết
          </h3>
          
          <div className="w-full h-[250px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    color: "var(--card-foreground)",
                    fontSize: "11px",
                    borderRadius: "10px"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Engagement Highlight Post */}
        <div className="admin-card lg:col-span-2 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center space-x-2 mb-4">
            <Award className="w-5 h-5 text-yellow-500" />
            <h3 className="text-base font-bold text-[var(--foreground)]">
              Bài đăng nổi bật hệ thống
            </h3>
          </div>

          {postsData.hottestPost ? (
            <HottestPost post={postsData.hottestPost} />
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-[var(--border)] border-dashed">
              <p className="text-sm text-[var(--muted-foreground)]">Chưa có bài viết nổi bật hôm nay</p>
            </div>
          )}
        </div>
      </div>
      
    </div>
  )
}
