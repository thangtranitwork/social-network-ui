"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { 
  LogOut, 
  Menu, 
  X, 
  Users, 
  BarChart3, 
  UserCheck, 
  FileText, 
  LayoutDashboard 
} from "lucide-react"
import adminApi, { clearAdminSession } from "@/utils/adminInterception"
import ThemeToggle from "@/components/ui-components/Themetoggle"

export default function AdminLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await adminApi.delete("/v1/auth/logout")
    } catch (err) {
      console.error("Logout failed:", err.response?.data || err.message)
    } finally {
      clearAdminSession()
      localStorage.removeItem("admin_role")
      router.push("/admin/login")
    }
  }

  const menuItems = [
    {
      href: "/admin/dashboard/users",
      label: "Thống kê User",
      icon: Users,
      active: pathname === "/admin/dashboard/users",
      description: "Thống kê & phân tích người dùng"
    },
    {
      href: "/admin/dashboard/posts",
      label: "Thống kê Post",
      icon: BarChart3,
      active: pathname === "/admin/dashboard/posts",
      description: "Thống kê bài viết & tương tác"
    },
    {
      href: "/admin/dashboard/viewusers",
      label: "Quản lý User",
      icon: UserCheck,
      active: pathname === "/admin/dashboard/viewusers",
      description: "Danh sách & trạng thái người dùng"
    },
    {
      href: "/admin/dashboard/viewposts",
      label: "Quản lý Post",
      icon: FileText,
      active: pathname === "/admin/dashboard/viewposts",
      description: "Quản lý danh sách bài viết"
    }
  ]

  const getPageTitle = () => {
    if (pathname.includes("/viewusers")) {
      return { title: "👤 Quản lý người dùng", subtitle: "Danh sách và quản trị tài khoản người dùng" }
    } else if (pathname.includes("/viewposts")) {
      return { title: "📝 Quản lý bài viết", subtitle: "Danh sách bài đăng và bình luận hệ thống" }
    } else if (pathname.includes("/users")) {
      return { title: "👥 Thống kê người dùng", subtitle: "Thống kê số lượng truy cập, đăng ký và hoạt động" }
    } else if (pathname.includes("/posts")) {
      return { title: "📊 Thống kê bài viết", subtitle: "Thống kê tương tác, lượt chia sẻ và phân loại bài viết" }
    }
    return { title: "📈 Admin Control Center", subtitle: "Hệ thống quản trị và phân tích PocPoc" }
  }

  const { title, subtitle } = getPageTitle()

  return (
    <div className="min-h-screen flex bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      
      {/* Sidebar - Desktop Glassmorphism */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 admin-sidebar
        flex flex-col justify-between p-6
        transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static md:h-screen
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-6 border-b border-[var(--border)]">
            <Link href="/admin/dashboard/users" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6366F1]/20">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <span className="logo-brand text-2xl font-bold tracking-tight">
                PocPoc <span className="logo-accent text-[var(--accent)] font-black">Admin</span>
              </span>
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)} 
              className="md:hidden p-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Menu Navigation */}
          <nav className="mt-8 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center space-x-4 px-4 py-3.5 rounded-xl transition-all duration-200 group
                    ${item.active 
                      ? "bg-[var(--accent-subtle)] text-[var(--accent)] font-semibold shadow-sm" 
                      : "hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${item.active ? "text-[var(--accent)]" : "text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]"}`} />
                  <div>
                    <p className="text-sm font-medium leading-none">{item.label}</p>
                    <p className="text-[10px] opacity-75 mt-1 font-normal hidden lg:block">{item.description}</p>
                  </div>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-6 border-t border-[var(--border)] space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs text-[var(--muted-foreground)] font-medium">Giao diện</span>
            <ThemeToggle />
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-medium border border-[var(--border)] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-200 dark:hover:border-red-900/50 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        
        {/* Top Navbar */}
        <header className="sticky top-0 z-40 admin-header px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--foreground)]">
                {title}
              </h1>
              <p className="text-xs md:text-sm text-[var(--muted-foreground)] hidden sm:block mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Quick Info & Actions */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-[var(--accent-subtle)] text-[var(--accent)] font-semibold text-xs rounded-full border border-[var(--accent)]/10">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse"></span>
              <span>Hệ thống trực tuyến</span>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto animate-fade-up">
          {children}
        </main>
      </div>

      {/* Backdrop for mobile menu */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          className="fixed inset-0 z-45 bg-black/40 backdrop-blur-sm md:hidden"
        />
      )}
    </div>
  )
}

