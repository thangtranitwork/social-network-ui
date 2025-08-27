// components/ui/Textarea.jsx
"use client"

export default function Textarea({
  label,
  value,
  onChange,
  name,
  placeholder,
  rows = 4,
  field = false,
  className = "",
}) {
  const baseClass = field
    ? "w-full border-0 border-b-2 border-[var(--border)] bg-transparent text-sm text-[var(--foreground)] placeholder-gray-400 outline-none focus:border-[var(--primary)]"
    : "w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder-gray-400 outline-none focus:ring-2 focus:ring-[var(--primary)]"

  return (
    <div className={`w-full ${className}`}>
      {label && <label className="text-sm font-medium mb-1 block">{label}</label>}
      <textarea
        value={value}
        onChange={onChange}
        name={name}
        placeholder={placeholder}
        rows={rows}
        className={baseClass + (field ? " py-1 px-0" : "")}
      />
    </div>
  )
}