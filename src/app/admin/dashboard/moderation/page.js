"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertCircle, CheckCircle, EyeOff, RefreshCw, ShieldAlert, Trash2, UserX } from "lucide-react"
import toast from "react-hot-toast"
import adminApi from "@/utils/adminInterception"

const statuses = [
  { value: "", label: "Tất cả" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "hidden", label: "Đã ẩn" },
  { value: "approved", label: "Đã duyệt" },
  { value: "deleted", label: "Đã xóa" },
  { value: "author_suspended", label: "Đã khóa tác giả" },
]

const categories = ["", "SPAM", "TOXIC", "HARASSMENT", "SEXUAL", "VIOLENCE", "SCAM", "HATE", "SELF_HARM"]

export default function ModerationPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState("")
  const [category, setCategory] = useState("")
  const [actionLoading, setActionLoading] = useState(null)

  const fetchQueue = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (status) params.set("status", status)
      if (category) params.set("category", category)
      const res = await adminApi.get(`/v1/admin/moderation/queue?${params.toString()}`)
      setItems(res.data.body || [])
    } catch (err) {
      console.error("Failed to load moderation queue:", err)
      toast.error("Không thể tải hàng đợi kiểm duyệt")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQueue()
  }, [status, category])

  const counts = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.total += 1
        if (item.status === "pending") acc.pending += 1
        if (item.status === "hidden") acc.hidden += 1
        return acc
      },
      { total: 0, pending: 0, hidden: 0 }
    )
  }, [items])

  const runAction = async (item, action) => {
    setActionLoading(`${item.id}:${action}`)
    try {
      const res = await adminApi.post(`/v1/admin/moderation/${encodeURIComponent(item.id)}/${action}`, {
        reason: "Processed from admin moderation queue",
        duration_seconds: 86400,
      })
      if (res.data.code === 200) {
        toast.success("Đã cập nhật trạng thái kiểm duyệt")
        fetchQueue()
      } else {
        toast.error(res.data.message || "Thao tác thất bại")
      }
    } catch (err) {
      console.error("Moderation action failed:", err)
      toast.error("Không thể thực hiện thao tác")
    } finally {
      setActionLoading(null)
    }
  }

  if (loading && items.length === 0) {
    return (
      <div className="w-full flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
        <span className="ml-2 text-[var(--muted-foreground)]">Đang tải hàng đợi kiểm duyệt...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard label="Tổng mục" value={counts.total} icon={ShieldAlert} tone="text-[var(--accent)] bg-[var(--accent-subtle)]" />
        <SummaryCard label="Chờ duyệt" value={counts.pending} icon={AlertCircle} tone="text-amber-500 bg-amber-500/10" />
        <SummaryCard label="Đã ẩn" value={counts.hidden} icon={EyeOff} tone="text-red-500 bg-red-500/10" />
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl admin-card">
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="admin-input px-3 py-2 rounded-xl border text-sm outline-none"
            aria-label="Lọc theo trạng thái"
          >
            {statuses.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="admin-input px-3 py-2 rounded-xl border text-sm outline-none"
            aria-label="Lọc theo nhóm vi phạm"
          >
            {categories.map((item) => (
              <option key={item || "all"} value={item}>{item || "Tất cả category"}</option>
            ))}
          </select>
        </div>
        <button
          onClick={fetchQueue}
          className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-[var(--border)] hover:bg-[var(--muted)] text-sm font-semibold transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Tải lại
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[var(--muted)] flex items-center justify-center text-[var(--muted-foreground)]">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h2 className="font-bold text-[var(--foreground)]">Không có mục cần xử lý</h2>
          <p className="text-sm text-[var(--muted-foreground)] max-w-md">Hàng đợi hiện trống theo bộ lọc đang chọn.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <ModerationItem
              key={item.id}
              item={item}
              actionLoading={actionLoading}
              onAction={runAction}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value, icon: Icon, tone }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">{label}</p>
        <p className="text-2xl font-bold text-[var(--foreground)] mt-1">{value.toLocaleString()}</p>
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${tone}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  )
}

function ModerationItem({ item, actionLoading, onAction }) {
  const categories = item.categories || []
  const confidence = Math.round((item.confidence || 0) * 100)
  const disabled = Boolean(actionLoading)

  return (
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-1 rounded-lg bg-[var(--muted)] text-xs font-semibold">{item.targetType}</span>
            <span className="font-mono text-xs text-[var(--muted-foreground)] break-all">{item.targetId}</span>
          </div>
          <h2 className="text-base font-bold text-[var(--foreground)]">Verdict: {item.verdict || "needs_review"} · {confidence}%</h2>
          <p className="text-sm text-[var(--muted-foreground)] whitespace-pre-wrap">{item.reason || "Không có lý do chi tiết."}</p>
        </div>
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-[var(--accent-subtle)] text-[var(--accent)] self-start">
          {item.status}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.length === 0 ? (
          <span className="text-xs text-[var(--muted-foreground)]">Không có category AI</span>
        ) : categories.map((category) => (
          <span key={category} className="px-2 py-1 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-semibold">
            {category}
          </span>
        ))}
        {item.reportCount > 0 && (
          <span className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-semibold">
            {item.reportCount} reports
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-3 border-t border-[var(--border)]">
        <ActionButton icon={CheckCircle} label="Approve" disabled={disabled} loading={actionLoading === `${item.id}:approve`} onClick={() => onAction(item, "approve")} />
        <ActionButton icon={EyeOff} label="Hide" disabled={disabled} loading={actionLoading === `${item.id}:hide`} onClick={() => onAction(item, "hide")} />
        <ActionButton icon={Trash2} label="Delete" disabled={disabled} loading={actionLoading === `${item.id}:delete`} onClick={() => onAction(item, "delete")} />
        <ActionButton icon={UserX} label="Suspend" disabled={disabled} loading={actionLoading === `${item.id}:suspend-author`} onClick={() => onAction(item, "suspend-author")} />
      </div>
    </article>
  )
}

function ActionButton({ icon: Icon, label, disabled, loading, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] hover:bg-[var(--muted)] disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold transition-colors"
    >
      <Icon className={`w-4 h-4 ${loading ? "animate-pulse" : ""}`} />
      {label}
    </button>
  )
}
