"use client"

import { useState, useEffect } from "react"
import { Megaphone, Save, Trash2, Eye } from "lucide-react"
import toast from "react-hot-toast"
import adminApi from "@/utils/adminInterception"

export default function AnnouncementsPage() {
  const [announcementText, setAnnouncementText] = useState("")
  const [isActive, setIsActive] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load announcement from backend on mount
  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const res = await adminApi.get("/v1/announcement")
        if (res.data.code === 200 && res.data.body) {
          setAnnouncementText(res.data.body.text || "")
          setIsActive(res.data.body.active || false)
        }
      } catch (err) {
        console.error("Failed to fetch announcement:", err)
        toast.error("Không thể tải thông tin thông báo từ hệ thống")
      } finally {
        setLoading(false)
      }
    }
    fetchAnnouncement()
  }, [])

  const handleSave = async () => {
    if (isActive && !announcementText.trim()) {
      toast.error("Vui lòng nhập nội dung thông báo trước khi kích hoạt!")
      return
    }

    try {
      const res = await adminApi.post("/v1/admin/announcement", {
        text: announcementText.trim(),
        active: isActive
      })

      if (res.data.code === 200) {
        // Also keep localStorage updated for immediate reactive changes in layout
        localStorage.setItem("system_announcement", announcementText.trim())
        localStorage.setItem("system_announcement_active", isActive ? "true" : "false")
        
        // Notify other components in the same window
        window.dispatchEvent(new Event("announcementUpdated"))
        toast.success("Đã lưu cấu hình thông báo hệ thống!")
      } else {
        toast.error("Không thể lưu thông báo: " + res.data.message)
      }
    } catch (err) {
      console.error("Failed to save announcement:", err)
      toast.error("Lỗi hệ thống khi lưu thông báo")
    }
  }

  const handleClear = async () => {
    try {
      const res = await adminApi.delete("/v1/admin/announcement")
      if (res.data.code === 200) {
        setAnnouncementText("")
        setIsActive(false)
        localStorage.removeItem("system_announcement")
        localStorage.setItem("system_announcement_active", "false")
        
        window.dispatchEvent(new Event("announcementUpdated"))
        toast.success("Đã xóa thông báo hệ thống!")
      } else {
        toast.error("Không thể xóa thông báo: " + res.data.message)
      }
    } catch (err) {
      console.error("Failed to delete announcement:", err)
      toast.error("Lỗi hệ thống khi xóa thông báo")
    }
  }

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
        <span className="ml-2 text-[var(--muted-foreground)]">Đang tải cấu hình...</span>
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 animate-fade-up">
      {/* Configuration Card */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-[var(--border)]">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-subtle)] text-[var(--accent)] flex items-center justify-center border border-[var(--accent)]/20">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--foreground)]">Cấu hình Thông báo Marquee</h2>
            <p className="text-xs text-[var(--muted-foreground)]">Thiết lập thông báo chạy chữ hiển thị trực tiếp dưới thanh tiêu đề của người dùng.</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-1.5">
              Nội dung thông báo
              <span className="text-xs font-normal text-[var(--muted-foreground)]">(Hỗ trợ text và emoji)</span>
            </label>
            <textarea
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              placeholder="Ví dụ: 📣 Bảo trì hệ thống định kỳ từ 02:00 đến 04:00 ngày mai. Vui lòng lưu các bài viết dang dở. Trân trọng!"
              rows={4}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] text-[var(--foreground)] transition-colors resize-none"
            />
          </div>

          {/* Toggle Active Switch */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--card-elevated)]/20">
            <div className="space-y-0.5">
              <span className="text-sm font-semibold text-[var(--foreground)]">Kích hoạt hiển thị</span>
              <p className="text-xs text-[var(--muted-foreground)]">Nếu bật, thông báo sẽ hiển thị ngay lập tức với người dùng.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-300 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]"></div>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border)] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-200 dark:hover:border-red-900/50 transition-colors text-sm font-semibold"
          >
            <Trash2 className="w-4 h-4" />
            Xóa trắng
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-95 transition-opacity text-sm font-semibold shadow-md shadow-[var(--accent)]/10"
          >
            <Save className="w-4 h-4" />
            Lưu & áp dụng
          </button>
        </div>
      </div>

      {/* Live Preview Card */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
          <Eye className="w-4 h-4 text-[var(--accent)]" />
          <span>Live Preview (Xem trước giao diện người dùng - Phù hợp với Theme)</span>
        </div>

        {/* Mock User Header & Marquee Container */}
        <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--background)] shadow-inner">
          {/* Mock Header */}
          <div className="h-12 border-b border-[var(--border)] bg-[var(--card)] flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs">Poc<span className="text-[var(--accent)]">Poc</span></span>
            </div>
            <div className="w-20 h-5 rounded-full bg-[var(--muted)]/50" />
          </div>

          {/* Mock Marquee Bar */}
          {isActive && announcementText.trim() ? (
            <div className="relative h-8 flex items-center bg-[var(--card)] text-[var(--foreground)] border-b border-[var(--border)] text-[10px] font-semibold overflow-hidden select-none">
              <div className="absolute left-0 top-0 bottom-0 bg-[var(--background)] z-10 px-2 flex items-center border-r border-[var(--border)]">
                <Megaphone className="w-3 h-3 text-[var(--foreground)]" />
              </div>
              <div className="w-full pl-10 pr-4 overflow-hidden relative">
                <div className="animate-marquee-preview inline-block whitespace-nowrap">
                  {announcementText}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-8 flex items-center justify-center text-[10px] text-[var(--muted-foreground)] italic bg-[var(--muted)]/20">
              Chưa có thông báo hệ thống nào được bật
            </div>
          )}

          {/* Mock Content */}
          <div className="p-4 space-y-2">
            <div className="h-3 w-1/3 rounded bg-[var(--muted)]/40" />
            <div className="h-2 w-full rounded bg-[var(--muted)]/20" />
            <div className="h-2 w-3/4 rounded bg-[var(--muted)]/20" />
          </div>
        </div>
      </div>

      {/* Styled JSX for Preview Marquee */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marqueePreview {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee-preview {
          display: inline-block;
          animation: marqueePreview 12s linear infinite;
        }
      `}} />
    </div>
  )
}
