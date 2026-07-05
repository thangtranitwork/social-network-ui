"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, ArrowDown, ArrowLeftRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import useMeasure from "react-use-measure";
import MotionContainer from "@/components/ui-components/MotionContainer";
import Button from "@/components/ui-components/Button";
import Link from "next/link";
import api, { setAuthToken } from "@/utils/axios";
import { parseApiError } from "@/utils/errorCodes";
import { jwtDecode } from "jwt-decode";
import { useTranslations } from "next-intl";

// Helper functions
const validateForm = (mode, formData, t) => {
  const { email, password, confirmPassword, givenName, familyName, birthdate } = formData;

  if (!email || !password) return `❌ ${t('validation.fillAllFields')}`;

  if (mode === "register") {
    if (password !== confirmPassword) return `❌ ${t('validation.passwordNotMatch')}`;
    if (!givenName || !familyName || !birthdate) return `❌ ${t('validation.fillAllFields')}`;
  }

  return null;
};

const formatLockoutTime = (timeString) => {
  try {
    return new Date(timeString).toLocaleString(undefined, {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  } catch {
    return timeString;
  }
};

// Message Component
const MessageDisplay = ({ message, verifyMessage, verifying, t }) => {
  const getMessageClass = (msg) => {
    if (msg?.includes("✅")) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (msg?.includes("⚠️")) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    if (msg?.includes("🔒")) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  };

  return (
    <>
      {verifyMessage && <div className={`p-3 text-sm rounded mb-4 ${getMessageClass(verifyMessage)}`}>{verifyMessage}</div>}
      {message && <div className={`p-3 text-sm rounded mb-4 ${getMessageClass(message)}`}>{message}</div>}
      {verifying && <div className="p-3 text-sm rounded mb-4 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">🔄 {t('register.emailVerifying')}</div>}
    </>
  );
};

// Form Fields Component
const FormFields = ({ mode, formData, setFormData, showPassword, setShowPassword, loading, verifying, showConfirmPassword, setShowConfirmPassword, showResendButton, onResend, show2FAField, t }) => {
  const handleInputChange = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));
  const isDisabled = loading || verifying;

  return (
    <>
      {/* Email */}
      <div className="space-y-2 mb-2">
        <h4 className="text-sm font-medium text-muted-foreground">{t('register.email')}</h4>
        <input
          type="email" value={formData.email} onChange={handleInputChange("email")}
          className="w-full bg-transparent border-b border-input px-0 py-1 focus:outline-none focus:border-primary text-foreground"
          required disabled={isDisabled}
        />
      </div>

      {/* Register fields */}
      {mode === "register" && (
        <div className="space-y-4">
          <div className="flex space-x-4">
            <div className="space-y-2 flex-1">
              <h4 className="text-sm font-medium text-muted-foreground">{t('register.givenName')}</h4>
              <input type="text" value={formData.givenName} onChange={handleInputChange("givenName")}
                className="w-full bg-transparent border-b border-input px-0 py-1 focus:outline-none focus:border-primary text-foreground"
                required disabled={loading} />
            </div>
            <div className="space-y-2 flex-1">
              <h4 className="text-sm font-medium text-muted-foreground">{t('register.familyName')}</h4>
              <input type="text" value={formData.familyName} onChange={handleInputChange("familyName")}
                className="w-full bg-transparent border-b border-input px-0 py-1 focus:outline-none focus:border-primary text-foreground"
                required disabled={loading} />
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">{t('register.birthdate')}</h4>
            <input type="date" value={formData.birthdate} onChange={handleInputChange("birthdate")}
              className="w-full bg-transparent border-b border-input px-0 py-1 focus:outline-none focus:border-primary text-foreground"
              required disabled={loading} />
          </div>
        </div>
      )}

      {/* Password */}
      <div className="space-y-2 relative">
        <h4 className="text-sm font-medium text-muted-foreground">{t('register.password')}</h4>
        <input
          type={showPassword ? "text" : "password"} value={formData.password} onChange={handleInputChange("password")}
          className="w-full bg-transparent border-b border-input px-0 py-1 focus:outline-none focus:border-primary pr-10 text-foreground"
          required minLength={8} disabled={isDisabled}
        />
        {mode === "register" && (
          <p className="text-gray-500 text-xs mt-1">
            {t('register.passwordHint')}
          </p>
        )}
        <button type="button" className="absolute right-0 top-7 p-1 text-muted-foreground hover:text-foreground"
          onClick={() => setShowPassword(prev => !prev)} tabIndex={-1} disabled={isDisabled} title={showPassword ? t('register.hidePassword') : t('register.showPassword')}>
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>

      {/* Confirm password */}
      {mode === "register" && (
          <div className="space-y-2 relative">
            <h4 className="text-sm font-medium text-muted-foreground">{t('register.confirmPassword')}</h4>
            <input
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleInputChange("confirmPassword")}
                className="w-full bg-transparent border-b border-input px-0 py-1 focus:outline-none focus:border-primary pr-10 text-foreground"
                required minLength={6} disabled={loading}
            />
            <button type="button" className="absolute right-0 top-7 p-1 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirmPassword(prev => !prev)} tabIndex={-1} disabled={loading} title={showConfirmPassword ? t('register.hidePassword') : t('register.showPassword')}>
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
      )}

      {/* 2FA Verification Code */}
      {mode === "login" && show2FAField && (
        <div className="space-y-2 mb-2">
          <h4 className="text-sm font-medium text-muted-foreground">{t('login.twoFactorCode')}</h4>
          <input
            type="text" value={formData.twoFactorCode || ""} onChange={handleInputChange("twoFactorCode")}
            className="w-full bg-transparent border-b border-input px-0 py-1 focus:outline-none focus:border-primary text-foreground font-mono tracking-widest text-center text-lg"
            placeholder="123456"
            maxLength={6}
            required disabled={isDisabled}
            autoFocus
          />
        </div>
      )}
    </>
  );
};


// Loading component để hiển thị khi đang load search params
const AuthPageLoading = () => (
  <div className="min-h-screen bg-background text-foreground flex flex-col">
    <main className="flex-grow flex flex-col md:flex-row h-full">
      {/* Left Side */}
      <div className="w-full md:w-1/2 h-screen flex items-center justify-center bg-muted relative">
        <Image src="/Connect.png" alt="Network illustration" width={400} height={400}
          className="max-w-full h-auto object-contain" priority />
      </div>

      {/* Right Side */}
      <div className="w-full md:w-1/2 min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md text-card-foreground rounded-xl p-8 shadow-xl bg-[var(--card)]">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Đang tải...</span>
          </div>
        </div>
      </div>
    </main>
  </div>
);

// Main component tách riêng để có thể wrap trong Suspense
function AuthPageContent() {
  const tAuth = useTranslations('auth');
  const tError = useTranslations('error');
  const tCommon = useTranslations('common');
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [showResendButton, setShowResendButton] = useState(false);
  const [show2FAField, setShow2FAField] = useState(false);
  const [formData, setFormData] = useState({
    email: "", password: "", confirmPassword: "", givenName: "", familyName: "", birthdate: "", twoFactorCode: "",
  });
  const [messages, setMessages] = useState({ verify: "", general: "" });
  const [status, setStatus] = useState({ verifying: false, loading: false });

  const formRef = useRef(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [formBoundsRef, { height }] = useMeasure();

  const clearForm = () => {
    setFormData({ email: "", password: "", confirmPassword: "", givenName: "", familyName: "", birthdate: "", twoFactorCode: "" });
    setShowResendButton(false);
    setShow2FAField(false);
  };

  const handleResend = async () => {
    const email = searchParams.get("email") || formData.email;
    if (!email) {
      setMessages(prev => ({ ...prev, general: `❌ ${tAuth('register.resendPrompt')}` }));
      return;
    }

    setStatus(prev => ({ ...prev, loading: true }));
    try {
      const res = await api.post(`/v1/register/resend-email?email=${email}`);
      if (res.data.code === 200) {
        setMessages(prev => ({ ...prev, general: `✅ ${tAuth('register.resendSuccess')}` }));
        setShowResendButton(false);
      }
    } catch (error) {
      setMessages(prev => ({ ...prev, general: `❌ ${tAuth('register.resendFailed', { error: parseApiError(error, tError) })}` }));
    } finally {
      setStatus(prev => ({ ...prev, loading: false }));
    }
  };

  // Google OAuth Auto-login
  useEffect(() => {
    const oauthStatus = searchParams.get("oauth");
    const token = searchParams.get("token");
    const userId = searchParams.get("userId");
    const userName = searchParams.get("userName");

    if (oauthStatus === "success") {
      const syncOAuthSession = async () => {
        setStatus(prev => ({ ...prev, loading: true }));
        setMessages(prev => ({ ...prev, general: `✅ ${tAuth('login.success')}` }));

        try {
          const res = await api.post("/v1/auth/refresh", {}, { skipAuth: true });
          const newToken = res.data?.body?.token;
          if (!newToken) throw new Error("No access token returned from refresh");

          const decoded = jwtDecode(newToken);
          const decodedUserId = decoded.sub || decoded.user_id;
          const decodedUserName = decoded.username || "";

          localStorage.setItem("role", decoded.scope || decoded.role || "USER");
          localStorage.setItem("accessToken", newToken);
          localStorage.setItem("userId", decodedUserId);
          localStorage.setItem("userName", decodedUserName);

          if (setAuthToken(newToken, decodedUserId, decodedUserName)) {
            window.history.replaceState({}, document.title, window.location.pathname);
            setTimeout(() => window.location.href = "/home", 500);
          } else {
            throw new Error("Failed to sync auth token");
          }
        } catch (error) {
          setMessages(prev => ({ ...prev, general: `⚠️ ${tAuth('login.syncError')}` }));
          setTimeout(() => router.push("/register"), 1200);
        } finally {
          setStatus(prev => ({ ...prev, loading: false }));
        }
      };

      syncOAuthSession();
      return;
    }

    if (token && userId && userName) {
      setStatus(prev => ({ ...prev, loading: true }));
      setMessages(prev => ({ ...prev, general: `✅ ${tAuth('login.success')}` }));

      // Store auth data
      localStorage.setItem("role", "USER");
      localStorage.setItem("accessToken", token);
      localStorage.setItem("userId", userId);
      localStorage.setItem("userName", userName);

      if (setAuthToken(token, userId, userName)) {
        setTimeout(() => window.location.href = "/home", 500);
      } else {
        setMessages(prev => ({ ...prev, general: `⚠️ ${tAuth('login.syncError')}` }));
        setTimeout(() => router.push("/register"), 1200);
      }
    }
  }, [searchParams, router, tAuth]);

  // Email verification
  useEffect(() => {
    const verifyEmail = async () => {
      const emailParam = searchParams.get("email");
      const codeParam = searchParams.get("code");
      if (!emailParam || !codeParam) return;

      setStatus(prev => ({ ...prev, verifying: true }));
      try {
        const res = await api.patch("/v1/register/verify",
          { email: emailParam, code: codeParam },
          { headers: { "Content-Type": "application/json" }, timeout: 10000 }
        );

        if (res.data.code === 200) {
          setMessages(prev => ({ ...prev, verify: `✅ ${tAuth('register.emailVerificationSuccess')}` }));
          setMode("login");
        }
      } catch (error) {
        if (error.response?.data?.code === 1009) {
          setMessages(prev => ({ ...prev, verify: `❌ ${tAuth('register.invalidCode')}` }));
          setShowResendButton(true);
        } else {
          setMessages(prev => ({ ...prev, verify: `❌ ${tAuth('register.emailVerificationFailed', { error: parseApiError(error, tError) })}` }));
        }
      } finally {
        setStatus(prev => ({ ...prev, verifying: false }));
      }
    };

    verifyEmail();
  }, [searchParams]);

  const handleRegister = async () => {
    setStatus(prev => ({ ...prev, loading: true }));
    try {
      const res = await api.post("/v1/register", {
        email: formData.email, password: formData.password,
        givenName: formData.givenName, familyName: formData.familyName, birthdate: formData.birthdate,
      });

      if (res.data.code === 200) {
        setMessages(prev => ({ ...prev, general: `✅ ${tAuth('register.success')}` }));
        setMode("login");
        clearForm();
      }
    } catch (error) {
      const code = error.response?.data?.code;
      if (code === 2009) {
        setMessages(prev => ({ ...prev, general: `❌ ${tAuth('register.resendPrompt')}` })); // Reuse prompt or add specific
        setShowResendButton(true);
      } else if (code === 1012) {
        setMessages(prev => ({ ...prev, general: `❌ ${tAuth('register.emailAlreadyExists')}` }));
      } else {
        setMessages(prev => ({ ...prev, general: `❌ ${tAuth('register.resendFailed', { error: parseApiError(error, tError) })}` }));
      }
    } finally {
      setStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const handleLogin = async () => {
    setStatus(prev => ({ ...prev, loading: true }));
    try {
      const res = await api.post("/v1/auth/login", {
        email: formData.email,
        password: formData.password,
        twoFactorCode: show2FAField ? formData.twoFactorCode : "",
      });

      if (res.data.code === 200 && res.data.body.token) {
        const token = res.data.body.token;
        const decoded = jwtDecode(token);

        // Store auth data
        const authData = { role: decoded.scope, accessToken: token, userId: decoded.sub, userName: decoded.username };
        Object.entries(authData).forEach(([key, value]) => localStorage.setItem(key, value));

        if (setAuthToken(token, decoded.sub, decoded.username)) {
          setMessages(prev => ({ ...prev, general: `✅ ${tAuth('login.success')}` }));
          setFormData(prev => ({ ...prev, email: "", password: "", twoFactorCode: "" }));
          setTimeout(() => window.location.href = "/home", 500);
        } else {
          setMessages(prev => ({ ...prev, general: `⚠️ ${tAuth('login.syncError')}` }));
          setTimeout(() => router.push("/index"), 1200);
        }
      } else if (res.data.code === 1003) {
        const remainingAttempts = res.data.body?.remainingAttempts || 0;
        setMessages(prev => ({ ...prev, general: `❌ ${tAuth('login.invalidCredentials', { attempts: remainingAttempts })}` }));
      } else if (res.data.code === 1002) {
        const lockoutTime = formatLockoutTime(res.data.body?.time);
        setMessages(prev => ({ ...prev, general: `🔒 ${tAuth('login.accountLocked', { time: lockoutTime })}` }));
      } else {
        setMessages(prev => ({ ...prev, general: `❌ ${res.data.message || tAuth('login.loginFailed', { error: '' })}` }));
      }
    } catch (error) {
      const errorData = error.response?.data;
      if (errorData?.message === "2FA_REQUIRED") {
        setShow2FAField(true);
        setMessages(prev => ({ ...prev, general: `🔑 ${tAuth('login.twoFactorRequired')}` }));
      } else if (errorData?.message === "INVALID_2FA_CODE") {
        setMessages(prev => ({ ...prev, general: `❌ ${tAuth('login.invalid2FACode')}` }));
      } else if (errorData?.code === 1003) {
        const remainingAttempts = errorData.body?.remainingAttempts || 0;
        setMessages(prev => ({ ...prev, general: `❌ ${tAuth('login.invalidCredentials', { attempts: remainingAttempts })}` }));
      } else if (errorData?.code === 1002) {
        const lockoutTime = formatLockoutTime(errorData.body?.time);
        setMessages(prev => ({ ...prev, general: `🔒 ${tAuth('login.accountLocked', { time: lockoutTime })}` }));
      } else {
        setMessages(prev => ({ ...prev, general: `❌ ${tAuth('login.loginFailed', { error: parseApiError(error, tError) })}` }));
      }
    } finally {
      setStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessages(prev => ({ ...prev, general: "" }));

    const validationError = validateForm(mode, formData, tAuth);
    if (validationError) {
      setMessages(prev => ({ ...prev, general: validationError }));
      return;
    }

    mode === "register" ? await handleRegister() : await handleLogin();
  };

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth" });
  const toggleMode = () => {
    setMode(prev => prev === "login" ? "register" : "login");
    setMessages({ verify: "", general: "" });
    setShowResendButton(false);
    setShow2FAField(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main className="flex-grow flex flex-col md:flex-row h-full">
        {/* Left Side */}
        <div className="w-full md:w-1/2 h-screen flex items-center justify-center bg-muted relative">
          <Image src="/Connect.png" alt="Network illustration" width={400} height={400}
            className="max-w-full h-auto object-contain" priority />
          <div className="absolute bottom-10 left-0 right-0 flex justify-center md:hidden">
            <button onClick={scrollToForm}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-lg hover:opacity-90 transition-opacity">
              {mode === "login" ? tAuth('login.title') : tAuth('register.title')} <ArrowDown className="h-4 w-4" />
            </button>
          </div>
          <div className="absolute bottom-10 left-10 right-10 text-center md:text-left hidden md:block">
            <h2 className="text-3xl font-bold mb-4">{tAuth('register.hello')}</h2>
            <p className="text-gray-500 text-sm">
              {tCommon('metadata.description')}
            </p>
          </div>
        </div>

        {/* Right Side */}
        <div ref={formRef} className="w-full md:w-1/2 min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="w-full max-w-md text-card-foreground rounded-xl p-8 shadow-xl bg-[var(--card)]" style={{ overflow: "hidden" }}>
            <div>
              {showResendButton ? (
                <h1 className="text-2xl font-bold mb-4">{tAuth('register.emailVerifying')}</h1>
              ) : <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">{mode === "login" ? tAuth('login.title') : tAuth('register.title')}</h1>
                <button onClick={toggleMode} className="text-sm text-muted-foreground hover:text-foreground transition">
                  <ArrowLeftRight className="inline-block w-4 h-4 mr-1" />
                  {mode === "login" ? tAuth('register.submit') : tAuth('login.submit')}
                </button>
              </div>}
              <MessageDisplay message={messages.general} verifyMessage={messages.verify} verifying={status.verifying} t={tAuth} />
            </div>

            {showResendButton ? (
              <div className="flex flex-col items-center gap-2">
                <Button onClick={handleResend} className=" w-full text-md text-white bg-black px-3 py-2 rounded hover:underline">
                  {tAuth('register.resendEmail')}
                </Button>
                <p className="text-sm">{tAuth('register.or')}</p>
                <Button onClick={() => {
                  setMode("login");
                  setShowResendButton(false);
                }} className="w-full py-2">
                  {tAuth('login.submit')}
                </Button>
              </div>
            ) : <motion.div animate={{ height }} transition={{ duration: 0.3, ease: "easeInOut" }} style={{ overflow: "hidden" }}>
              <div ref={formBoundsRef}>
                <AnimatePresence mode="wait">
                  <MotionContainer key={mode} modeKey={mode} effect="fadeUp">
                    
                    <div className="space-y-4">
                      <Button onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/v1/auth/google/login`} className="w-full bg-white text-black border border-gray-300 py-2 rounded flex items-center justify-center gap-2">
                        {tAuth("login.signInWithGoogle")}
                      </Button>
                      <div className="text-center text-sm text-gray-500">or</div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <FormFields
                          mode={mode}
                          formData={formData}
                          setFormData={setFormData}
                          showPassword={showPassword}
                          setShowPassword={setShowPassword}
                          showConfirmPassword={showConfirmPassword}
                          setShowConfirmPassword={setShowConfirmPassword}
                          loading={status.loading}
                          verifying={status.verifying}
                          show2FAField={show2FAField}
                          t={tAuth}
                      />

                      <Button type="submit" disabled={status.loading || status.verifying} className="w-full py-2">
                        {status.loading ? tCommon('loading') : mode === "login" ? tAuth('login.submit') : tAuth('register.submit')}
                      </Button>

                      <div className="mt-6 text-center text-sm text-muted-foreground space-y-2">
                        <div>
                          {tAuth('login.forgotPassword')}{" "}
                          <Link href="/forgot-password" className="text-blue-500 dark:text-blue-400 hover:underline">
                            {tAuth('login.createNewPassword')}
                          </Link>
                        </div>
                        <div className="pt-2 border-t border-[var(--border)]/20">
                          <Link href="/about" className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors">
                            {tAuth('login.aboutLink')}
                          </Link>
                        </div>
                      </div>
                    </form>
                  </MotionContainer>
                </AnimatePresence>
              </div>
            </motion.div>}
          </div>
        </div >
      </main >
    </div >
  );
}

// Export default component với Suspense wrapper
export default function AuthPage() {
  return (
    <Suspense fallback={<AuthPageLoading />}>
      <AuthPageContent />
    </Suspense>
  );
}
