"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { ArrowDown, ArrowLeft } from "lucide-react"
import Button from "@/components/ui-components/Button"
import { motion } from "framer-motion"
import useMeasure from "react-use-measure"
import MotionContainer from "@/components/ui-components/MotionContainer"
import api from "@/utils/axios"
import { parseApiError } from "@/utils/errorCodes"
import Link from "next/link"
import { useTranslations } from "next-intl"

export default function ForgotPasswordPage() {
  const tAuth = useTranslations('auth');
  const tError = useTranslations('error');
  const tCommon = useTranslations('common');
  const [email, setEmail] = useState("")
  const formRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage("")

    if (!email) {
      setMessage(`❌ ${tAuth('forgotPassword.emailRequired')}`)
      return
    }

    setLoading(true)
    try {
      const origin = window.location.origin
      const res = await api.post("/v1/update-password", null, {
        params: { email },
        headers: {
          "X-Continue-Page": `${origin}/reset-password`,
        },
      })
      console.log(res)

      setMessage(`✅ ${tAuth('forgotPassword.success')}`)
    } catch (error) {
      setMessage(`❌ ${tAuth('forgotPassword.failed', { error: parseApiError(error, tError) })}`)
    } finally {
      setLoading(false)
    }
  }

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const [formBoundsRef, { height }] = useMeasure()

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main className="flex-grow flex flex-col md:flex-row h-full">
        {/* Left Side (Image) */}
        <div className="w-full md:w-1/2 h-screen flex items-center justify-center bg-muted relative">
          <Image
            src="/Connect.png"
            alt="Network illustration"
            width={400}
            height={400}
            className="max-w-full h-auto object-contain"
            priority
          />
          <div className="absolute bottom-10 left-0 right-0 flex justify-center md:hidden">
            <button
              onClick={scrollToForm}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-lg hover:opacity-90 transition-opacity"
            >
              {tAuth('forgotPassword.title')}
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>
          <div className="absolute bottom-10 left-10 right-10 text-center md:text-left hidden md:block">
            <h2 className="text-3xl font-bold mb-4">{tAuth('register.hello')}</h2>
            <p className="text-gray-500 text-sm">
              {tCommon('metadata.description')}
            </p>
          </div>
        </div>

        {/* Right Side (Form) */}
        <div
          ref={formRef}
          className="w-full md:w-1/2 min-h-screen flex items-center justify-center p-6 bg-background"
        >
          <div
            className="w-full max-w-md text-card-foreground rounded-xl p-8 shadow-xl bg-[var(--card)]"
            style={{ overflow: "hidden" }}
          >
            <div className="flex items-center mb-6">
              <Link
                href="/register"
                className="mr-4 text-muted-foreground hover:text-foreground transition"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-2xl font-bold">{tAuth('forgotPassword.title')}</h1>
            </div>

            <motion.div
              animate={{ height }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
            >
              <div ref={formBoundsRef}>
                <MotionContainer modeKey="forgot" effect="fadeUp">
                  <div className="mb-6 text-sm text-muted-foreground">
                    {tAuth('forgotPassword.instruction')}
                  </div>

                  {message && (
                    <div
                      className={`p-3 text-sm rounded mb-4 ${
                        message.includes("✅")
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {message}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">{tAuth('register.email')}</h4>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-transparent border-b border-input px-0 py-1 focus:outline-none focus:border-primary text-foreground"
                        placeholder={tAuth('forgotPassword.emailPlaceholder')}
                        required
                      />
                    </div>

                    <div className="flex justify-center">
                      <Button type="submit" disabled={loading} className="w-full max-w-xs text-center">
                        {loading ? tAuth('forgotPassword.sending') : tAuth('forgotPassword.submit')}
                      </Button>
                    </div>

                    <div className="mt-6 text-center text-sm text-muted-foreground">
                      <div>
                        {tAuth('forgotPassword.rememberPassword')}{" "}
                        <Link
                          href="/register"
                          className="text-blue-500 dark:text-blue-400 hover:underline"
                        >
                          {tAuth('forgotPassword.backToLogin')}
                        </Link>
                      </div>
                    </div>
                  </form>
                </MotionContainer>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}
