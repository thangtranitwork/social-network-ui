"use client"

import { useState, useId } from "react"
import { Eye, EyeOff } from "lucide-react"

export default function Input({
  label,
  type = "text",
  value,
  onChange,
  name,
  placeholder,
  className = "",
  inputClassName = "",
  icon: Icon,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false)
  const inputType = type === "password" && showPassword ? "text" : type
  const inputId = useId()

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider px-1"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center w-full">
        {Icon && (
          <div className="absolute left-3.5 text-[var(--muted-foreground)] pointer-events-none">
            <Icon size={18} />
          </div>
        )}
        
        {type === "textarea" ? (
          <textarea
            id={inputId}
            value={value}
            onChange={onChange}
            name={name}
            placeholder={placeholder}
            className={`w-full bg-[var(--background)] px-4 py-2.5 rounded-xl border border-[var(--border)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none resize-none min-h-[100px] transition-all duration-200 ${inputClassName}`}
            autoComplete="off"
            {...props}
          />
        ) : (
          <input
            id={inputId}
            type={inputType}
            value={value}
            onChange={onChange}
            name={name}
            placeholder={placeholder}
            className={`w-full bg-[var(--background)] py-2.5 rounded-xl border border-[var(--border)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none transition-all duration-200 ${
              Icon ? "pl-10" : "px-4"
            } ${
              type === "password" ? "pr-10" : "pr-4"
            } ${inputClassName}`}
            autoComplete="off"
            {...props}
          />
        )}

        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors p-1"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  )
}
