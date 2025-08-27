'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import MotionContainer from './MotionContainer' // đường dẫn đến file MotionContainer của bạn

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

if (!mounted) {
    // Trả về placeholder giữ chỗ để không làm lệch layout
    return <div className="w-12 h-12" />;
  }
  const currentTheme = resolvedTheme === 'dark' ? 'dark' : 'light'

  const toggleTheme = () => {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 w-12 h-12 bg-[var(--card)] rounded-full hover:opacity-90 transition-opacity flex items-center justify-center overflow-hidden"
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        <MotionContainer
          key={currentTheme}
          modeKey={currentTheme}
          effect="slideRight" // thử đổi sang zoom, fadeUp, v.v.
          duration={0.4}
        >
          {currentTheme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </MotionContainer>
      </AnimatePresence>
    </button>
  )
}
