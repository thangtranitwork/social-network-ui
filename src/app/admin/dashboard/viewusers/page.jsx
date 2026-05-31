"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Loader2, Mail, Calendar, Users, MessageCircle, FileText, Phone, Shield, ShieldCheck, Clock, UserCheck, UserX, Send, Inbox, ArrowLeft, Upload, ThumbsUp, MessageSquareText } from 'lucide-react';
import api from "@/utils/axios";
import UserHeader from '@/components/social-app-component/UserHeader';
import { useRouter } from 'next/navigation';
import adminApi from "@/utils/adminInterception";
import toast from "react-hot-toast";
import Modal from "@/components/ui-components/Modal";
import ConfirmModal from "@/components/ui-components/ConfirmModal";
import { useTranslations } from 'next-intl';

const UsersPage = () => {
  const t = useTranslations('admin.users');
  const tCommon = useTranslations('common');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentSkip, setCurrentSkip] = useState(0);
  const [error, setError] = useState("");

  // Suspension modal state
  const [suspendModal, setSuspendModal] = useState({
    isOpen: false,
    userId: null,
    duration: "300"
  });

  // Unsuspend confirm modal state
  const [unsuspendConfirm, setUnsuspendConfirm] = useState({
    isOpen: false,
    userId: null
  });

  const router = useRouter();
  
  // Refs for optimization
  const abortControllerRef = useRef(null);
  
  const LIMIT = 20;
  
  const goToProfile = (username) => {
    if (username) router.push(`/profile/${username}`);
  };

  const goBackToAdmin = () => {
    router.push('/admin/dashboard/users');
  };

  const handleSuspendUser = (e, userId) => {
    e.stopPropagation();
    setSuspendModal({
      isOpen: true,
      userId,
      duration: "300"
    });
  };

  const executeSuspendUser = async () => {
    const { userId, duration: durationInput } = suspendModal;
    const duration = parseInt(durationInput);
    if (isNaN(duration) || duration <= 0) {
      toast.error(t("invalidDuration"));
      return;
    }

    try {
      const res = await adminApi.post(`/v1/admin/users/${userId}/suspend`, {
        duration_seconds: duration
      });
      if (res.data.code === 200) {
        toast.success(t("suspendSuccess"));
        setUsers(prevUsers => prevUsers.map(u => {
          if (u.id === userId) {
            return {
              ...u,
              suspended: true,
              suspendedUntil: res.data.body?.suspendedUntil || new Date(Date.now() + duration * 1000).toISOString()
            };
          }
          return u;
        }));
        setSuspendModal({ ...suspendModal, isOpen: false });
      } else {
        toast.error(`${t("suspendError")}: ${res.data.message}`);
      }
    } catch (err) {
      toast.error(t("suspendError"));
      console.error(err);
    }
  };

  const handleUnsuspendUser = (e, userId) => {
    e.stopPropagation();
    setUnsuspendConfirm({
      isOpen: true,
      userId
    });
  };

  const executeUnsuspendUser = async () => {
    const { userId } = unsuspendConfirm;
    try {
      const res = await adminApi.post(`/v1/admin/users/${userId}/unsuspend`);
      if (res.data.code === 200) {
        toast.success(t("unsuspendSuccess"));
        setUsers(prevUsers => prevUsers.map(u => {
          if (u.id === userId) {
            return {
              ...u,
              suspended: false,
              suspendedUntil: ""
            };
          }
          return u;
        }));
        setUnsuspendConfirm({ ...unsuspendConfirm, isOpen: false });
      } else {
        toast.error(`${t("unsuspendError")}: ${res.data.message}`);
      }
    } catch (err) {
      toast.error(t("unsuspendError"));
      console.error(err);
    }
  };

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(tCommon('locale') === 'vi' ? 'vi-VN' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return "N/A";
    }
  };

  // Calculate age from birthdate
  const calculateAge = (birthdate) => {
    if (!birthdate) return "N/A";
    try {
      const today = new Date();
      const birth = new Date(birthdate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    } catch {
      return "N/A";
    }
  };

  // Format last online time - fixed for ZonedDateTime
  const formatLastOnline = (lastOnline, isOnline) => {
    if (isOnline) return t("online");
    if (!lastOnline) return t("longAgo");
    try {
      // Handle ZonedDateTime format from backend
      let date;
      if (typeof lastOnline === 'string') {
        // Remove timezone info if it's in ZonedDateTime format
        const cleanDateString = lastOnline.replace(/\[[^\]]+\]$/, '');
        date = new Date(cleanDateString);
      } else {
        date = new Date(lastOnline);
      }
      
      const now = new Date();
      const diffMs = now - date;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffHours < 1) return t("justNow");
      if (diffHours < 24) return t("hoursAgo", { hours: diffHours });
      if (diffDays < 7) return t("daysAgo", { days: diffDays });
      return date.toLocaleDateString(tCommon('locale') === 'vi' ? 'vi-VN' : 'en-US');
    } catch {
      return "N/A";
    }
  };

  // Fetch users function with axios
  const fetchUsers = useCallback(async (skipValue = 0, isLoadMore = false) => {
    const token = localStorage.getItem("admin_accessToken");
    if (!token) {
      console.warn("Không có token đăng nhập");
      return;
    }

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();

    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError("");

      const res = await adminApi.get(
        `/v1/users?skip=${skipValue}&limit=${LIMIT}`,
        { signal: abortControllerRef.current.signal }
      );
      
      console.log(res.data);
      
      if (res.data.code === 200) {
        const newUsers = res.data.body || [];
        
        // Use functional update to avoid stale closure
        setUsers(prevUsers => {
          if (isLoadMore) {
            // Prevent duplicate users
            const existingIds = new Set(prevUsers.map(u => u.id));
            const uniqueNewUsers = newUsers.filter(u => !existingIds.has(u.id));
            return [...prevUsers, ...uniqueNewUsers];
          } else {
            return newUsers;
          }
        });
        
        // Update hasMore and currentSkip based on returned data
        setHasMore(newUsers.length === LIMIT);
        setCurrentSkip(skipValue + newUsers.length);
        
        console.log(`Loaded ${newUsers.length} users, skip: ${skipValue}`);
      }
    } catch (err) {
      if (!abortControllerRef.current.signal.aborted) {
        setError(`${t("loadError")}: ${err.message}`);
        console.error("Lỗi khi tải users:", err);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Handle load more button click
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchUsers(currentSkip, true);
    }
  }, [currentSkip, hasMore, loadingMore, fetchUsers]);

  // Initial data load with cleanup
  useEffect(() => {
    console.log('Initial users load...');
    fetchUsers(0, false);
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchUsers]);

  // User Card Component
  const UserCard = ({ user }) => (
    <div 
      className="admin-card rounded-2xl p-5 hover:shadow-md hover:border-[var(--accent)]/30 transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between"
      onClick={() => goToProfile(user.username)}
    >
      <div>
        {/* Profile Header */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="relative">
            {user.profilePictureUrl ? (
              <img 
                src={user.profilePictureUrl} 
                alt={`${user.givenName} ${user.familyName}`}
                className="w-14 h-14 rounded-full object-cover border-2 border-[var(--border)]"
              />
            ) : (
              <div className="w-14 h-14 bg-gradient-to-tr from-[#00E5A0] to-[#8B5CF6] rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
                <span>
                  {user.givenName?.charAt(0)}{user.familyName?.charAt(0)}
                </span>
              </div>
            )}
            {/* Status indicator ring */}
            <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-[#141416] ${
              user.isOnline ? 'bg-green-500' : 'bg-gray-400'
            }`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h3 className="font-bold text-sm text-[var(--foreground)] truncate">
                {user.givenName} {user.familyName}
              </h3>
              {user.verified && (
                <ShieldCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-[var(--muted-foreground)] truncate">
              @{user.username}
            </p>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-[var(--muted-foreground)] font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {formatLastOnline(user.lastOnline, user.isOnline)}
              </span>
            </div>
          </div>
        </div>

        {user.suspended && (
          <div className="mb-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30">
            <UserX className="w-3.5 h-3.5" />
            <span>
              {t("suspendUntil", { date: new Date(user.suspendedUntil).toLocaleString('vi-VN') })}
            </span>
          </div>
        )}

        {/* Bio */}
        <p className="text-xs text-[var(--foreground)] leading-relaxed mb-4 line-clamp-2 h-8">
          {user.bio ? user.bio : "Chưa có tiểu sử"}
        </p>

        {/* Info detail labels */}
        <div className="space-y-2 mb-4 admin-inset p-3 rounded-xl">
          <div className="flex items-center justify-between text-[11px] text-[var(--muted-foreground)]">
            <span className="flex items-center gap-1.5 truncate pr-2">
              <Mail className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
              {user.email || "Chưa thiết lập"}
            </span>
            <span className="font-semibold text-[var(--foreground)] flex-shrink-0">
              {calculateAge(user.birthdate)} tuổi
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-[var(--muted-foreground)] pt-2 border-t border-[var(--border)] border-dashed">
            <span className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              Tham gia: {formatDate(user.registrationDate)}
            </span>
          </div>
        </div>

        {/* Grid metrics */}
        <div className="grid grid-cols-3 gap-2.5 pt-3.5 border-t border-[var(--border)] text-center">
          <div className="bg-white/60 dark:bg-zinc-900/30 p-2 rounded-xl border border-[var(--border)]">
            <p className="font-black text-sm text-[var(--foreground)]">{user.friendCount || 0}</p>
            <p className="text-[10px] text-[var(--muted-foreground)] font-semibold uppercase mt-0.5">Bạn bè</p>
          </div>
          <div className="bg-white/60 dark:bg-zinc-900/30 p-2 rounded-xl border border-[var(--border)]">
            <p className="font-black text-sm text-[var(--foreground)]">{user.postCount || 0}</p>
            <p className="text-[10px] text-[var(--muted-foreground)] font-semibold uppercase mt-0.5">Bài viết</p>
          </div>
          <div className="bg-white/60 dark:bg-zinc-900/30 p-2 rounded-xl border border-[var(--border)]">
            <p className="font-black text-sm text-[var(--foreground)]">{user.messageCount || 0}</p>
            <p className="text-[10px] text-[var(--muted-foreground)] font-semibold uppercase mt-0.5">Chat</p>
          </div>
        </div>

        {/* Small metadata stats */}
        <div className="flex items-center justify-around gap-2 mt-3 text-[10px] text-[var(--muted-foreground)] font-medium">
          <div className="flex items-center gap-1">
            <ThumbsUp className="w-3 h-3 text-[var(--accent)]" />
            <span>{user.commentCount || 0} cmt</span>
          </div>
          <div className="flex items-center gap-1">
            <Phone className="w-3 h-3 text-green-500" />
            <span>{user.callCount || 0} gọi</span>
          </div>
          <div className="flex items-center gap-1">
            <Upload className="w-3 h-3 text-blue-500" />
            <span>{user.uploadedFileCount || 0} file</span>
          </div>
        </div>

      </div>

      {/* Action buttons */}
      <div className="mt-4 pt-3.5 border-t border-[var(--border)] flex justify-end gap-2">
        {user.suspended ? (
          <>
            <button
              onClick={(e) => handleUnsuspendUser(e, user.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 hover:bg-green-100 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Mở khóa
            </button>
            <button
              onClick={(e) => handleSuspendUser(e, user.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              Đổi hạn
            </button>
          </>
        ) : (
          <button
            onClick={(e) => handleSuspendUser(e, user.id)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors"
          >
            <UserX className="w-3.5 h-3.5" />
            Khóa tài khoản
          </button>
        )}
      </div>
    </div>
  )

  return (
    <main className="max-w-6xl mx-auto mt-4 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl admin-card shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={goBackToAdmin}
              className="admin-btn-back flex items-center gap-2 px-3.5 py-2 text-xs md:text-sm font-semibold rounded-xl transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại Thống kê
            </button>
            <div>
              <h2 className="text-lg font-bold text-[var(--foreground)]">
                Danh sách thành viên ({users.length})
              </h2>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Users List */}
        <section>
          {loading && users.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card rounded-xl shadow-sm border border-border p-6">
                  <div className="animate-pulse">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-muted rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : users.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
              
              {loadingMore && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-card rounded-xl shadow-sm border border-border p-6">
                      <div className="animate-pulse">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-16 h-16 bg-muted rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 bg-muted rounded"></div>
                          <div className="h-3 bg-muted rounded w-5/6"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Load More Button or End Message */}
              <div className="flex justify-center py-8">
                {hasMore ? (
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t("loading")}
                      </>
                    ) : (
                      <>
                        {t("loadMore")}
                        <span className="text-sm opacity-80">({users.length})</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="bg-card rounded-full px-6 py-3 shadow-sm border border-border">
                    <p className="text-muted-foreground text-sm font-medium">
                      {t("allLoaded")}
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="bg-card rounded-xl shadow-sm border border-border p-8 text-center max-w-md">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-card-foreground mb-2">
                  {t("noUsers")}
                </h3>
                <p className="text-muted-foreground">
                  {t("noUsersDesc")}
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Suspend Modal */}
      <Modal 
        isOpen={suspendModal.isOpen} 
        onClose={() => setSuspendModal({ ...suspendModal, isOpen: false })}
        size="small"
      >
        <div className="p-6">
          <h3 className="text-lg font-bold mb-4">{t("suspendModalTitle")}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t("suspendModalDesc")}
          </p>
          <input
            type="number"
            value={suspendModal.duration}
            onChange={(e) => setSuspendModal({ ...suspendModal, duration: e.target.value })}
            className="w-full px-4 py-2 rounded-xl border border-border bg-background mb-6 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            placeholder="300"
            autoFocus
          />
          <div className="flex gap-3">
            <button
              onClick={() => setSuspendModal({ ...suspendModal, isOpen: false })}
              className="flex-1 px-4 py-2 rounded-xl border border-border hover:bg-accent transition-colors font-medium"
            >
              {tCommon("cancel")}
            </button>
            <button
              onClick={executeSuspendUser}
              className="flex-1 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors font-medium"
            >
              {t("confirmSuspend")}
            </button>
          </div>
        </div>
      </Modal>

      {/* Unsuspend Confirm Modal */}
      <ConfirmModal
        isOpen={unsuspendConfirm.isOpen}
        onClose={() => setUnsuspendConfirm({ ...unsuspendConfirm, isOpen: false })}
        onConfirm={executeUnsuspendUser}
        title={t("unsuspendModalTitle")}
        message={t("unsuspendModalDesc")}
        variant="warning"
      />
    </main>
  );
};

export default UsersPage;