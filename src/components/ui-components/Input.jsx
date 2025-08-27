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
}) {
  const [showPassword, setShowPassword] = useState(false)
  const inputType = type === "password" && showPassword ? "text" : type
  const inputId = useId()

  return (
    <div
      className={`
        w-[80%] sm:w-[40%] md:w-[100%]
        border-b-2 border-[var(--border)]
        text-sm text-[var(--foreground)]
        relative flex items-center
        ${className}
      `}
    >
      <label
        htmlFor={inputId}
        className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none w-[72px] text-sm font-medium text-gray-500"
      > 
        {label}
      </label>

      <input
        id={inputId}
        type={inputType}
        value={value}
        onChange={onChange}
        name={name}
        placeholder={placeholder}
        className="pl-[80px] pr-8 py-2 w-full bg-transparent outline-none"
        autoComplete="off"
      />

      {type === "password" && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  )
}
