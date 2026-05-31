"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Eye, EyeOff, Shield, ArrowLeftRight } from "lucide-react";
import { useRouter } from "next/navigation";
import adminApi, {
  setAdminAuthToken,
  clearAdminSession,
  getAdminAuthInfo,
  isAdminTokenValid
} from "@/utils/adminInterception";
import { jwtDecode } from "jwt-decode";
import { useTranslations } from "next-intl";

// Constants


export default function AdminLoginPage() {
  const t = useTranslations('admin.login');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [status, setStatus] = useState({
    loading: false,
    checking: true // Add checking state
  });
  const [messages, setMessages] = useState({
    general: ""
  });

  // Check authentication properly
  const checkAuthentication = useCallback(() => {
    if (!isClient) return false;

    try {
      const authInfo = getAdminAuthInfo();
      const tokenValid = isAdminTokenValid();

      console.log('🔍 Admin auth check:', {
        hasAuthInfo: !!authInfo,
        tokenValid,
        authInfo: authInfo ? {
          hasToken: !!authInfo.token,
          hasUserId: !!authInfo.userId,
          hasUserName: !!authInfo.userName
        } : null
      });

      return authInfo && tokenValid;
    } catch (error) {
      console.error('❌ Error checking authentication:', error);
      return false;
    }
  }, [isClient]);

  // Ensure component is mounted on client side
  useEffect(() => {
    setIsClient(true);

    // Only check authentication after client is ready
    const checkTimer = setTimeout(() => {
      const isAuthenticated = checkAuthentication();

      if (isAuthenticated) {
        console.log('🔐 Admin already authenticated, redirecting to dashboard...');
        // router.push('/admin/dashboard/posts');
      } else {
        console.log('🔓 No valid admin authentication, staying on login page');
        // Clear any invalid auth data
        clearAdminSession();
      }

      setStatus(prev => ({ ...prev, checking: false }));
    }, 100); // Small delay to ensure hydration

    return () => clearTimeout(checkTimer);
  }, [router, checkAuthentication]);

  // Hàm parse lỗi từ adminInterception
  const parseApiError = (error) => {
    // adminInterception đã xử lý error format
    if (error.userMessage) {
      return error.userMessage;
    }

    if (error?.response) {
      return (
          error.response.data?.message ||
          error.response.data?.error ||
          `${tCommon("error")} (${error.response.status})`
      );
    } else if (error?.request) {
      return tCommon("networkError");
    } else {
      return error.message || tCommon("unknown");
    }
  };

  const handleLogout = async () => {
    try {
      await adminApi.delete("/v1/auth/logout");
    } catch (err) {
      console.error("Admin logout failed:", err.response?.data || err.message);
    } finally {
      clearAdminSession();
      // Force reload to ensure clean state
      window.location.reload();
    }
  };

  const handleAdminLogin = useCallback(async () => {
    // Check if we're on client side
    if (!isClient) {
      console.warn('Attempted to login before client hydration');
      return;
    }

    setStatus(prev => ({ ...prev, loading: true }));
    setMessages(prev => ({ ...prev, general: "" }));

    // Validation
    if (!formData.email || !formData.password) {
      setMessages(prev => ({
        ...prev,
        general: `❌ ${t("fillAll")}`
      }));
      setStatus(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      // Clear any existing auth data before login
      clearAdminSession();

      // Gửi request login-admin với skipAuth flag
      const res = await adminApi.post("/v1/auth/login-admin", {
        email: formData.email,
        password: formData.password,
      }, {
        skipAuth: true // Bỏ qua auth cho login endpoint
      });

      console.log('🔐 Admin login response:', res);

      if (res.data.code === 200 && res.data.body.token) {
        const token = res.data.body.token;
        console.log('🔐 Admin login success, token:', token.substring(0, 20) + '...');

        // Decode token để lấy thông tin user
        let decoded;
        try {
          decoded = jwtDecode(token);
          console.log('🔓 Decoded admin token:', decoded);
        } catch (decodeError) {
          console.error('❌ Error decoding token:', decodeError);
          throw new Error('Invalid token format');
        }

        // Validate decoded token has required fields
        if (!decoded.sub) {
          throw new Error('Token missing required user ID');
        }

        // Sử dụng adminInterception để set auth token
        const authSuccess = setAdminAuthToken(
            token,
            decoded.sub,
            decoded.username || decoded.email || 'Admin'
        );
        localStorage.setItem("admin_role", decoded.scope);

        if (authSuccess) {
          console.log('✅ Admin authentication set successfully');

          // Verify authentication was set correctly
          const verifyAuth = checkAuthentication();
          if (verifyAuth) {
            setMessages(prev => ({
              ...prev,
              general: `✅ ${t("success")}`
            }));

            // Clear form
            setFormData({
              email: "",
              password: ""
            });

            // Redirect to admin dashboard
            setTimeout(() => {
              router.push('/admin/dashboard/posts');
            }, 1000);
          } else {
            throw new Error('Authentication verification failed');
          }

        } else {
          throw new Error('Failed to set admin authentication');
        }

      } else {
        setMessages(prev => ({
          ...prev,
          general: `❌ ${res.data.message || t("failed")}`
        }));
      }

    } catch (error) {
      console.error('❌ Admin login error:', error);

      // Clear any partial auth data on error
      clearAdminSession();

      setMessages(prev => ({
        ...prev,
        general: `❌ ${t("failed")}: ${parseApiError(error)}`
      }));
    } finally {
      setStatus(prev => ({ ...prev, loading: false }));
    }
  }, [formData.email, formData.password, router, isClient, checkAuthentication]);

  const handleBackToLogin = () => {
    router.push("/register"); // Quay lại trang login thường
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Show loading while checking authentication or client-side hydration
  if (!isClient || status.checking) {
    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              <span className="text-muted-foreground">
                {status.checking ? t("checkingAuth") : tCommon("loading")}
              </span>
            </div>
            {status.checking && (
                <p className="text-sm text-muted-foreground">
                  {t("verifyingSession")}
                </p>
            )}
          </div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <main className="flex-grow flex items-center justify-center">
          <div className="w-full max-w-5xl flex flex-col md:flex-row items-center gap-10 md:gap-16">
            
            {/* Left Content */}
            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left space-y-6">
              <div className="space-y-4">
                <div className="flex justify-center md:justify-start">
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 shadow-sm text-red-500">
                    <Shield className="w-8 h-8" />
                  </div>
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-4xl">
                  {t("title")}
                </h1>
                <p className="text-[var(--muted-foreground)] text-base max-w-md">
                  {t("subtitle")}
                </p>
              </div>

              <div className="bg-[var(--card)] rounded-2xl p-5 border border-[var(--border)] admin-card shadow-sm">
                <div className="flex items-start gap-4">
                  <Shield className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {t("securityTitle")}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1 leading-relaxed">
                      {t("securityDesc")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Login Card */}
            <div className="w-full max-w-md">
              <div className="bg-[var(--card)] rounded-2xl p-8 shadow-xl border border-[var(--border)] admin-card">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-[var(--foreground)]">
                    {t("cardTitle")}
                  </h2>
                  <button
                      onClick={handleBackToLogin}
                      className="text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors flex items-center gap-1"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    {t("backToLogin")}
                  </button>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-5 h-5 text-red-500" />
                    <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                    {t("restrictedAccess")}
                  </span>
                  </div>
                </div>

                {messages.general && (
                    <div
                        className={`p-3 text-xs font-medium rounded-xl mb-6 border ${
                            messages.general.includes("✅")
                                ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                                : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                        }`}
                    >
                      {messages.general}
                    </div>
                )}

                <div className="space-y-6">
                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                      {t("emailLabel")}
                    </label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="admin-input w-full px-4 py-2.5 rounded-xl border outline-none transition-all"
                        placeholder={t("emailPlaceholder")}
                        required
                        disabled={status.loading}
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2 relative">
                    <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                      {t("passwordLabel")}
                    </label>
                    <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="admin-input w-full px-4 py-2.5 pr-12 rounded-xl border outline-none transition-all"
                        placeholder={t("passwordPlaceholder")}
                        required
                        minLength={6}
                        disabled={status.loading}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !status.loading) {
                            handleAdminLogin();
                          }
                        }}
                    />
                    <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-8.5 p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                        tabIndex={-1}
                        disabled={status.loading}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                    >
                      {showPassword ? (
                          <EyeOff className="w-4.5 h-4.5" />
                      ) : (
                          <Eye className="w-4.5 h-4.5" />
                      )}
                    </button>
                  </div>

                  {/* Submit */}
                  <button
                      onClick={handleAdminLogin}
                      disabled={status.loading}
                      className="btn-primary w-full py-3 rounded-xl shadow-md hover:shadow-lg"
                  >
                    {status.loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          {t("authenticating")}
                        </div>
                    ) : (
                        t("submit")
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
  );
}