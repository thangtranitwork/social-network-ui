"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react"
import toast from "react-hot-toast"
import adminApi from "@/utils/adminInterception"

const allOption = { value: "", label: "Tất cả" }
const typeLabels = {
  INT: "Giá trị số",
  BOOL: "Bật/tắt",
  STRING: "Văn bản",
  DURATION: "Thời lượng",
  JSON: "Thiết lập nâng cao",
}

const scopeLabels = {
  "post-service": "Bài viết",
  "user-service": "Người dùng",
  "api-gateway": "Gateway",
  global: "Toàn hệ thống",
}

const categoryLabels = {
  limits: "Giới hạn",
  newsfeed: "Bảng tin",
  rate_limits: "Tần suất sử dụng",
  timeouts: "Thời gian chờ",
  security: "Bảo mật",
}

const configLabels = {
  "post.max_content_length": {
    title: "Độ dài bài viết tối đa",
    description: "Số ký tự tối đa người dùng được nhập khi đăng bài.",
    unit: "ký tự",
  },
  "post.max_attach_files": {
    title: "Số file đính kèm tối đa",
    description: "Số ảnh, video hoặc file người dùng được gắn vào một bài viết.",
    unit: "file",
  },
  "post.max_comment_content_length": {
    title: "Độ dài bình luận tối đa",
    description: "Số ký tự tối đa cho một bình luận.",
    unit: "ký tự",
  },
  "post.default_page_limit": {
    title: "Số bài viết tải mặc định",
    description: "Số bài viết hệ thống lấy trong một lần tải danh sách.",
    unit: "bài",
  },
  "post.max_page_limit": {
    title: "Số bài viết tải tối đa",
    description: "Giới hạn cao nhất cho một lần tải danh sách bài viết.",
    unit: "bài",
  },
  "user.max_friend_count": {
    title: "Số bạn bè tối đa",
    description: "Giới hạn số bạn bè của mỗi tài khoản.",
    unit: "người",
  },
  "user.max_block_count": {
    title: "Số người chặn tối đa",
    description: "Giới hạn số tài khoản mà một người dùng có thể chặn.",
    unit: "người",
  },
  "user.max_sent_request_count": {
    title: "Lời mời kết bạn đã gửi tối đa",
    description: "Giới hạn số lời mời kết bạn đang chờ do người dùng gửi đi.",
    unit: "lời mời",
  },
  "user.max_received_request_count": {
    title: "Lời mời kết bạn nhận tối đa",
    description: "Giới hạn số lời mời kết bạn đang chờ mà người dùng nhận được.",
    unit: "lời mời",
  },
  "user.max_given_name_length": {
    title: "Độ dài tên tối đa",
    description: "Số ký tự tối đa cho tên của người dùng.",
    unit: "ký tự",
  },
  "user.max_family_name_length": {
    title: "Độ dài họ tối đa",
    description: "Số ký tự tối đa cho họ của người dùng.",
    unit: "ký tự",
  },
  "user.max_username_length": {
    title: "Độ dài username tối đa",
    description: "Số ký tự tối đa cho tên đăng nhập công khai.",
    unit: "ký tự",
  },
  "user.min_age": {
    title: "Tuổi tối thiểu",
    description: "Độ tuổi tối thiểu để được tạo và sử dụng tài khoản.",
    unit: "tuổi",
  },
  "newsfeed.score_weights": {
    title: "Cách ưu tiên bài viết trên bảng tin",
    description: "Điều chỉnh mức ưu tiên giữa bạn bè, tương tác và bài viết đã xem.",
  },
}

const advancedValueLabels = {
  friendRelationship: "Bạn bè trực tiếp",
  secondDegreeOrRequested: "Bạn bè gián tiếp / đã gửi lời mời",
  viewForward: "Người xem đã tương tác với tác giả",
  viewBackward: "Tác giả đã tương tác với người xem",
  like: "Lượt thích",
  comment: "Bình luận",
  share: "Chia sẻ",
  loadedPenalty: "Giảm ưu tiên khi đã xem",
}

export default function RuntimeConfigsPage() {
  const [configs, setConfigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [scope, setScope] = useState("")
  const [category, setCategory] = useState("")
  const [query, setQuery] = useState("")
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)
  const [createDraft, setCreateDraft] = useState(null)
  const [saving, setSaving] = useState(false)
  const [lastSync, setLastSync] = useState(null)

  const fetchConfigs = async () => {
    setLoading(true)
    try {
      const res = await adminApi.get("/v1/admin/runtime-configs")
      setConfigs(res.data.body?.items || [])
    } catch (err) {
      console.error("Failed to load runtime configs:", err)
      toast.error(err.message || "Không thể tải cấu hình hệ thống")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfigs()
  }, [])

  const scopes = useMemo(() => {
    const values = Array.from(new Set(configs.map((item) => item.scope).filter(Boolean))).sort()
    return [allOption, ...values.map((value) => ({ value, label: displayScope(value) }))]
  }, [configs])

  const categories = useMemo(() => {
    const values = Array.from(new Set(configs.map((item) => item.category).filter(Boolean))).sort()
    return [allOption, ...values.map((value) => ({ value, label: displayCategory(value) }))]
  }, [configs])

  const filteredConfigs = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return configs.filter((item) => {
      if (scope && item.scope !== scope) return false
      if (category && item.category !== category) return false
      if (!needle) return true
      const meta = getConfigMeta(item)
      return [meta.title, meta.description, displayScope(item.scope), displayCategory(item.category)]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    })
  }, [configs, scope, category, query])

  const groupedConfigs = useMemo(() => {
    const groups = new Map()
    filteredConfigs.forEach((item) => {
      const key = `${item.scope}:${item.category}`
      if (!groups.has(key)) {
        groups.set(key, {
          id: key,
          scope: item.scope,
          category: item.category,
          items: [],
        })
      }
      groups.get(key).items.push(item)
    })
    return Array.from(groups.values()).sort((a, b) => {
      const left = `${a.scope}.${a.category}`
      const right = `${b.scope}.${b.category}`
      return left.localeCompare(right)
    })
  }, [filteredConfigs])

  const stats = useMemo(() => {
    const services = new Set(configs.map((item) => item.scope).filter(Boolean))
    return configs.reduce(
      (acc, item) => {
        acc.total += 1
        if (item.type === "JSON") acc.advanced += 1
        if (!item.isEditable) acc.locked += 1
        acc.services = services.size
        return acc
      },
      { total: 0, advanced: 0, locked: 0, services: 0 }
    )
  }, [configs])

  const openEditor = (config) => {
    setEditing({
      ...config,
      draftValue: config.type === "JSON" ? prettyJSON(config.value) : config.value ?? "",
      reason: "",
    })
  }

  const saveConfig = async () => {
    if (!editing) return
    setSaving(true)
    try {
      const res = await adminApi.patch(`/v1/admin/runtime-configs/${encodeURIComponent(editing.key)}`, {
        value: normalizeDraftValue(editing),
        reason: editing.reason,
        expectedVersion: editing.version,
      })
      const updated = res.data.body
      setConfigs((items) => items.map((item) => (item.key === updated.key ? updated : item)))
      setEditing(null)
      toast.success("Đã lưu cấu hình")
    } catch (err) {
      console.error("Failed to update runtime config:", err)
      const message = err.response?.data?.message === "RUNTIME_CONFIG_VERSION_CONFLICT"
        ? "Cấu hình đã thay đổi, vui lòng tải lại trước khi lưu"
        : err.message || "Không thể lưu cấu hình"
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const openCreator = () => {
    setCreateDraft({
      title: "",
      key: "",
      scope: "post-service",
      category: "limits",
      type: "INT",
      value: "",
      defaultValue: "",
      description: "",
      min: "",
      max: "",
      reason: "",
    })
  }

  const createConfig = async () => {
    if (!createDraft) return
    setCreating(true)
    try {
      const res = await adminApi.post("/v1/admin/runtime-configs", buildCreatePayload(createDraft))
      const created = res.data.body
      setConfigs((items) => [...items, created].sort((a, b) => `${a.scope}.${a.category}.${a.key}`.localeCompare(`${b.scope}.${b.category}.${b.key}`)))
      setCreateDraft(null)
      toast.success("Đã thêm thiết lập mới")
    } catch (err) {
      console.error("Failed to create runtime config:", err)
      const message = err.response?.data?.message === "RUNTIME_CONFIG_ALREADY_EXISTS"
        ? "Mã thiết lập này đã tồn tại"
        : err.message || "Không thể thêm thiết lập"
      toast.error(message)
    } finally {
      setCreating(false)
    }
  }

  const resetConfig = async (config) => {
    if (!window.confirm(`Đưa "${getConfigMeta(config).title}" về giá trị ban đầu?`)) return
    try {
      const res = await adminApi.post(`/v1/admin/runtime-configs/${encodeURIComponent(config.key)}/reset`, {
        reason: "Reset from admin runtime config page",
      })
      const updated = res.data.body
      setConfigs((items) => items.map((item) => (item.key === updated.key ? updated : item)))
      toast.success("Đã reset cấu hình")
    } catch (err) {
      console.error("Failed to reset runtime config:", err)
      toast.error(err.message || "Không thể reset cấu hình")
    }
  }

  const syncRedis = async () => {
    if (!window.confirm("Áp dụng lại toàn bộ cấu hình mới nhất cho hệ thống?")) return
    setSyncing(true)
    try {
      const res = await adminApi.post("/v1/admin/runtime-configs/sync", {
        reason: "Manual sync from admin runtime config page",
      })
      setLastSync(res.data.body)
      toast.success("Đã áp dụng cấu hình mới nhất")
    } catch (err) {
      console.error("Failed to sync runtime configs:", err)
      toast.error(err.message || "Không thể áp dụng cấu hình")
    } finally {
      setSyncing(false)
    }
  }

  if (loading && configs.length === 0) {
    return <RuntimeConfigSkeleton />
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-semibold text-[var(--muted-foreground)]">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
              Các thay đổi được lưu lại và có thể áp dụng ngay cho hệ thống
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">Thiết lập vận hành</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Điều chỉnh giới hạn bài viết, người dùng và cách sắp xếp bảng tin mà không cần triển khai lại hệ thống.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={openCreator}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              Thêm thiết lập
            </button>
            <button
              onClick={fetchConfigs}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-sm font-semibold transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Tải lại
            </button>
            <button
              onClick={syncRedis}
              disabled={syncing}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)] disabled:opacity-60 text-sm font-semibold transition-opacity"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
              Áp dụng cấu hình
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          <Metric label="Thiết lập" value={stats.total} icon={Settings} />
          <Metric label="Khu vực" value={stats.services} icon={SlidersHorizontal} />
          <Metric label="Nâng cao" value={stats.advanced} icon={Sparkles} />
          <Metric label="Đang lọc" value={filteredConfigs.length} icon={Search} />
        </div>

        {lastSync && (
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              Đã áp dụng {lastSync.configCount} thiết lập lúc {formatDate(lastSync.syncedAt)}.
            </span>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="grid grid-cols-1 md:grid-cols-[180px_180px_1fr] gap-3">
          <FilterSelect label="Khu vực" value={scope} onChange={setScope} options={scopes} />
          <FilterSelect label="Nhóm" value={category} onChange={setCategory} options={categories} />
          <label className="relative block">
            <span className="sr-only">Tìm kiếm cấu hình</span>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tên thiết lập hoặc mô tả..."
              className="w-full h-10 rounded-lg border border-[var(--border)] bg-[var(--background)] pl-9 pr-3 text-sm outline-none focus:border-[var(--accent)]"
            />
          </label>
        </div>
      </section>

      {filteredConfigs.length === 0 ? (
        <EmptyState onReset={() => {
          setScope("")
          setCategory("")
          setQuery("")
        }} />
      ) : (
        <div className="space-y-5">
          {groupedConfigs.map((group) => (
            <ConfigGroup
              key={group.id}
              group={group}
              onEdit={openEditor}
              onReset={resetConfig}
            />
          ))}
        </div>
      )}

      {editing && (
        <EditPanel
          config={editing}
          saving={saving}
          onChange={setEditing}
          onClose={() => setEditing(null)}
          onSave={saveConfig}
        />
      )}

      {createDraft && (
        <CreatePanel
          draft={createDraft}
          creating={creating}
          onChange={setCreateDraft}
          onClose={() => setCreateDraft(null)}
          onCreate={createConfig}
        />
      )}
    </div>
  )
}

function RuntimeConfigSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Đang tải cấu hình hệ thống">
      <div className="h-44 rounded-xl border border-[var(--border)] bg-[var(--card)] skeleton" />
      {[0, 1, 2].map((item) => (
        <div key={item} className="h-32 rounded-xl border border-[var(--border)] bg-[var(--card)] skeleton" />
      ))}
    </div>
  )
}

function FilterSelect({ label, value, options, onChange }) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus:border-[var(--accent)]"
        aria-label={label}
      >
        {options.map((option) => (
          <option key={`${label}-${option.value}`} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}

function Metric({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold text-[var(--muted-foreground)]">{label}</p>
        <p className="text-xl font-bold text-[var(--foreground)] mt-0.5">{value.toLocaleString()}</p>
      </div>
      <div className="w-9 h-9 rounded-lg bg-[var(--accent-subtle)] text-[var(--accent)] flex items-center justify-center">
        <Icon className="w-4 h-4" />
      </div>
    </div>
  )
}

function ConfigGroup({ group, onEdit, onReset }) {
  return (
    <section className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-[var(--foreground)]">
            {displayScope(group.scope)} · {displayCategory(group.category)}
          </h3>
          <p className="text-xs text-[var(--muted-foreground)]">
            {group.items.length} thiết lập
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {group.items.map((config) => (
          <ConfigCard key={config.key} config={config} onEdit={onEdit} onReset={onReset} />
        ))}
      </div>
    </section>
  )
}

function ConfigCard({ config, onEdit, onReset }) {
  const changed = String(config.value) !== String(config.defaultValue)
  const meta = getConfigMeta(config)
  return (
    <article className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-[var(--muted)] px-2 py-1 text-xs font-semibold text-[var(--foreground)]">
              {typeLabels[config.type] || config.type}
            </span>
            {changed && (
              <span className="rounded-md bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-600 dark:text-amber-300">
                Đã chỉnh
              </span>
            )}
          </div>
          <h4 className="text-base font-bold text-[var(--foreground)]">{meta.title}</h4>
          <p className="text-sm text-[var(--muted-foreground)]">{meta.description}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(config)}
            disabled={!config.isEditable}
            aria-label={`Sửa ${meta.title}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onReset(config)}
            disabled={!config.isEditable}
            aria-label={`Đưa ${meta.title} về giá trị ban đầu`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <ValuePreview config={config} />

      <div className="grid grid-cols-2 gap-2 text-xs text-[var(--muted-foreground)]">
        <InfoTile label="Giá trị ban đầu" value={formatValue(config.defaultValue, config)} />
        <InfoTile label="Cập nhật" value={formatDate(config.updatedAt)} />
      </div>
    </article>
  )
}

function ValuePreview({ config }) {
  const meta = getConfigMeta(config)

  if (config.isSensitive) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-sm font-semibold">
        Giá trị nhạy cảm đã được ẩn
      </div>
    )
  }

  if (config.type === "JSON") {
    const values = parseAdvancedValues(config.value)
    if (values.length > 0) {
      return (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
          <p className="text-xs font-semibold text-[var(--muted-foreground)]">Mức ưu tiên hiện tại</p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {values.map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2">
                <span className="text-xs text-[var(--muted-foreground)]">{item.label}</span>
                <span className="text-sm font-bold text-[var(--foreground)]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return (
      <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-xs leading-relaxed text-[var(--foreground)]">
        {prettyJSON(config.value)}
      </pre>
    )
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
      <p className="text-xs font-semibold text-[var(--muted-foreground)]">Giá trị hiện tại</p>
      <p className="mt-1 text-xl font-bold text-[var(--foreground)] break-all">
        {formatValue(config.value, config)}
        {meta.unit && <span className="ml-1 text-sm font-semibold text-[var(--muted-foreground)]">{meta.unit}</span>}
      </p>
    </div>
  )
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-lg bg-[var(--background)] border border-[var(--border)] px-3 py-2 min-w-0">
      <p className="font-semibold">{label}</p>
      <p className="mt-0.5 truncate text-[var(--foreground)]">{value}</p>
    </div>
  )
}

function EmptyState({ onReset }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-10 text-center flex flex-col items-center gap-3">
      <div className="w-11 h-11 rounded-lg bg-[var(--muted)] flex items-center justify-center text-[var(--muted-foreground)]">
        <AlertCircle className="w-5 h-5" />
      </div>
      <div>
        <h2 className="text-base font-bold text-[var(--foreground)]">Không có cấu hình phù hợp</h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">Đổi bộ lọc hoặc xóa từ khóa tìm kiếm để xem lại danh sách.</p>
      </div>
      <button
        onClick={onReset}
        className="inline-flex items-center justify-center h-10 px-4 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-sm font-semibold"
      >
        Xóa bộ lọc
      </button>
    </div>
  )
}

function CreatePanel({ draft, creating, onChange, onClose, onCreate }) {
  const update = (patch) => onChange({ ...draft, ...patch })
  const isNumberType = draft.type === "INT"

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <section className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl">
        <div className="flex items-start justify-between gap-4 p-5 border-b border-[var(--border)]">
          <div>
            <h2 className="text-base font-bold text-[var(--foreground)]">Thêm thiết lập mới</h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Dùng cho các cấu hình mới mà hệ thống đã hỗ trợ đọc theo mã thiết lập.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-142px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Tên hiển thị"
              value={draft.title}
              onChange={(value) => update({ title: value })}
              placeholder="Ví dụ: Số lượt đổi tên tối đa"
            />
            <TextField
              label="Mã thiết lập"
              value={draft.key}
              onChange={(value) => update({ key: value })}
              placeholder="vd: user.max_rename_count"
              hint="Dạng chữ thường có dấu chấm, ví dụ post.max_content_length"
            />
            <SelectField
              label="Khu vực"
              value={draft.scope}
              onChange={(value) => update({ scope: value })}
              options={[
                { value: "post-service", label: "Bài viết" },
                { value: "user-service", label: "Người dùng" },
                { value: "api-gateway", label: "Gateway" },
                { value: "global", label: "Toàn hệ thống" },
              ]}
            />
            <SelectField
              label="Nhóm"
              value={draft.category}
              onChange={(value) => update({ category: value })}
              options={[
                { value: "limits", label: "Giới hạn" },
                { value: "newsfeed", label: "Bảng tin" },
                { value: "rate_limits", label: "Tần suất sử dụng" },
                { value: "timeouts", label: "Thời gian chờ" },
                { value: "security", label: "Bảo mật" },
              ]}
            />
            <SelectField
              label="Kiểu dữ liệu"
              value={draft.type}
              onChange={(value) => update({ type: value, value: "", defaultValue: "", min: "", max: "" })}
              options={[
                { value: "INT", label: "Giá trị số" },
                { value: "BOOL", label: "Bật/tắt" },
                { value: "STRING", label: "Văn bản" },
                { value: "DURATION", label: "Thời lượng" },
                { value: "JSON", label: "Thiết lập nâng cao" },
              ]}
            />
            <ValueCreateField draft={draft} onChange={update} />
            <TextField
              label="Giá trị ban đầu"
              value={draft.defaultValue}
              onChange={(value) => update({ defaultValue: value })}
              placeholder="Bỏ trống để dùng giống giá trị hiện tại"
            />
            {isNumberType && (
              <div className="grid grid-cols-2 gap-3">
                <TextField
                  label="Tối thiểu"
                  type="number"
                  value={draft.min}
                  onChange={(value) => update({ min: value })}
                  placeholder="Không bắt buộc"
                />
                <TextField
                  label="Tối đa"
                  type="number"
                  value={draft.max}
                  onChange={(value) => update({ max: value })}
                  placeholder="Không bắt buộc"
                />
              </div>
            )}
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--foreground)]">Mô tả cho admin</span>
            <textarea
              value={draft.description}
              onChange={(e) => update({ description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)] resize-none"
              placeholder="Thiết lập này ảnh hưởng tới luồng nào, nên dùng khi nào..."
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--foreground)]">Lý do thêm thiết lập</span>
            <textarea
              value={draft.reason}
              onChange={(e) => update({ reason: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)] resize-none"
              placeholder="Ví dụ: bổ sung cấu hình cho chính sách mới"
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center h-10 px-4 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-sm font-semibold"
          >
            Hủy
          </button>
          <button
            onClick={onCreate}
            disabled={creating}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)] disabled:opacity-60 text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            Thêm thiết lập
          </button>
        </div>
      </section>
    </div>
  )
}

function TextField({ label, value, onChange, placeholder, hint, type = "text" }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-[var(--foreground)]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
      />
      {hint && <span className="block text-xs text-[var(--muted-foreground)]">{hint}</span>}
    </label>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-[var(--foreground)]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus:border-[var(--accent)]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}

function ValueCreateField({ draft, onChange }) {
  if (draft.type === "BOOL") {
    return (
      <SelectField
        label="Giá trị hiện tại"
        value={draft.value}
        onChange={(value) => onChange({ value })}
        options={[
          { value: "", label: "Chọn trạng thái" },
          { value: "true", label: "Bật" },
          { value: "false", label: "Tắt" },
        ]}
      />
    )
  }

  if (draft.type === "JSON") {
    return (
      <label className="block space-y-2">
        <span className="text-sm font-semibold text-[var(--foreground)]">Giá trị hiện tại</span>
        <textarea
          value={draft.value}
          onChange={(e) => onChange({ value: e.target.value })}
          rows={5}
          spellCheck={false}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm font-mono outline-none focus:border-[var(--accent)] resize-y"
          placeholder='{"enabled":true}'
        />
      </label>
    )
  }

  return (
    <TextField
      label="Giá trị hiện tại"
      type={draft.type === "INT" ? "number" : "text"}
      value={draft.value}
      onChange={(value) => onChange({ value })}
      placeholder={draft.type === "DURATION" ? "vd: 30s, 5m, 24h" : "Nhập giá trị"}
    />
  )
}

function EditPanel({ config, saving, onChange, onClose, onSave }) {
  const update = (patch) => onChange({ ...config, ...patch })

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <section className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl">
        <div className="flex items-start justify-between gap-4 p-5 border-b border-[var(--border)]">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[var(--foreground)]">{getConfigMeta(config).title}</h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              {displayScope(config.scope)} · {displayCategory(config.category)}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-142px)]">
          <p className="text-sm text-[var(--muted-foreground)]">{getConfigMeta(config).description}</p>
          <ValueEditor config={config} onChange={(value) => update({ draftValue: value })} />
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--foreground)]">Lý do thay đổi</span>
            <textarea
              value={config.reason}
              onChange={(e) => update({ reason: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)] resize-none"
              placeholder="Ví dụ: tăng giới hạn sau review sản phẩm"
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center h-10 px-4 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-sm font-semibold"
          >
            Hủy
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)] disabled:opacity-60 text-sm font-semibold"
          >
            <Save className="w-4 h-4" />
            Lưu thay đổi
          </button>
        </div>
      </section>
    </div>
  )
}

function ValueEditor({ config, onChange }) {
  if (config.type === "BOOL") {
    return (
      <label className="block space-y-2">
        <span className="text-sm font-semibold text-[var(--foreground)]">Giá trị</span>
        <select
          value={String(config.draftValue)}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-10 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus:border-[var(--accent)]"
        >
          <option value="true">Bật</option>
          <option value="false">Tắt</option>
        </select>
      </label>
    )
  }

  const commonClass = "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"

  if (config.type === "JSON") {
    const values = parseAdvancedValues(config.draftValue)
    if (values.length > 0) {
      return (
        <div className="space-y-3">
          <div>
            <span className="text-sm font-semibold text-[var(--foreground)]">Mức ưu tiên</span>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Số càng cao thì yếu tố đó càng được ưu tiên trên bảng tin. Giá trị âm dùng để giảm ưu tiên.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {values.map((item) => (
              <label key={item.key} className="block space-y-1 rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
                <span className="text-xs font-semibold text-[var(--muted-foreground)]">{item.label}</span>
                <input
                  type="number"
                  value={item.value}
                  onChange={(e) => onChange(updateAdvancedDraftValue(config.draftValue, item.key, e.target.value))}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-semibold outline-none focus:border-[var(--accent)]"
                />
              </label>
            ))}
          </div>
        </div>
      )
    }
  }

  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-[var(--foreground)]">Giá trị</span>
      <input
        type={config.type === "INT" ? "number" : "text"}
        value={config.draftValue}
        onChange={(e) => onChange(e.target.value)}
        className={commonClass}
      />
      {config.validation && Object.keys(config.validation).length > 0 && (
        <span className="block text-xs text-[var(--muted-foreground)]">
          Giới hạn hợp lệ: {formatValidation(config.validation, config)}
        </span>
      )}
    </label>
  )
}

function normalizeDraftValue(config) {
  if (config.type !== "JSON") return String(config.draftValue ?? "")
  return JSON.stringify(JSON.parse(config.draftValue))
}

function buildCreatePayload(draft) {
  const validation = {}
  if (draft.type === "INT") {
    if (draft.min !== "") validation.min = Number(draft.min)
    if (draft.max !== "") validation.max = Number(draft.max)
  }
  const value = draft.type === "JSON" ? JSON.stringify(JSON.parse(draft.value)) : String(draft.value ?? "")
  const defaultValue = draft.defaultValue
    ? (draft.type === "JSON" ? JSON.stringify(JSON.parse(draft.defaultValue)) : String(draft.defaultValue))
    : value

  return {
    key: draft.key.trim(),
    scope: draft.scope,
    category: draft.category,
    type: draft.type,
    value,
    defaultValue,
    description: formatCreatedDescription(draft),
    validation,
    reason: draft.reason,
  }
}

function formatValue(value, config) {
  if (config.type === "JSON") return "Thiết lập nâng cao"
  return String(value ?? "")
}

function formatValidation(validation, config) {
  const parts = []
  if (typeof validation.min !== "undefined") parts.push(`tối thiểu ${validation.min}`)
  if (typeof validation.max !== "undefined") parts.push(`tối đa ${validation.max}`)
  if (Array.isArray(validation.enum)) parts.push(`chọn một trong: ${validation.enum.join(", ")}`)
  const suffix = getConfigMeta(config).unit ? ` ${getConfigMeta(config).unit}` : ""
  return parts.length > 0 ? `${parts.join(", ")}${suffix}` : "Theo quy định hệ thống"
}

function prettyJSON(value) {
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return String(value ?? "")
  }
}

function displayScope(value) {
  return scopeLabels[value] || value || "Tất cả"
}

function displayCategory(value) {
  return categoryLabels[value] || value || "Tất cả"
}

function getConfigMeta(config) {
  const customMeta = parseCreatedDescription(config.description)
  if (customMeta.title) {
    return customMeta
  }
  const fallbackTitle = String(config.key || "")
    .split(".")
    .slice(1)
    .join(" ")
    .replace(/_/g, " ")
    .trim()
  return configLabels[config.key] || {
    title: fallbackTitle || "Thiết lập",
    description: config.description || "Điều chỉnh cách hệ thống vận hành.",
  }
}

function formatCreatedDescription(draft) {
  const title = draft.title.trim()
  const description = draft.description.trim()
  if (!title) return description
  if (!description) return title
  return `${title}: ${description}`
}

function parseCreatedDescription(description) {
  const text = String(description || "").trim()
  const index = text.indexOf(":")
  if (index <= 0 || index > 80) {
    return { title: "", description: text }
  }
  return {
    title: text.slice(0, index).trim(),
    description: text.slice(index + 1).trim() || text.slice(0, index).trim(),
  }
}

function parseAdvancedValues(value) {
  try {
    const parsed = JSON.parse(value)
    return Object.entries(parsed).map(([key, rawValue]) => ({
      key,
      label: advancedValueLabels[key] || key,
      value: rawValue,
    }))
  } catch {
    return []
  }
}

function updateAdvancedDraftValue(value, key, nextValue) {
  try {
    const parsed = JSON.parse(value)
    const numberValue = Number(nextValue)
    parsed[key] = Number.isNaN(numberValue) ? 0 : numberValue
    return JSON.stringify(parsed, null, 2)
  } catch {
    return value
  }
}

function formatDate(value) {
  if (!value) return "Chưa cập nhật"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Chưa cập nhật"
  return date.toLocaleString("vi-VN")
}
