"use client";

import { useState, useEffect } from "react";
import UserHeader from "@/components/social-app-component/UserHeader";
import api from "@/utils/axios";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

export default function BlockedUsersPage() {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    const fetchBlockedUsers = async () => {
      setLoading(true);
      try {
        const response = await api.get("/v1/blocks");
        setUsers(response.data.body || []);
      } catch (error) {
        console.error("Lỗi khi tải danh sách chặn:", error);
        toast.error(t('blockedlist.loadError'));
      } finally {
        setLoading(false);
      }
    };
    fetchBlockedUsers();
  }, [t]);

  const handleAction = async (userId) => {
    const previousUsers = [...users];
    setUsers((prev) => prev.filter((user) => user.username !== userId));
    setActionLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      await api.delete(`/v1/blocks/${userId}`);
      toast.success(t('blockedlist.unblockSuccess'));
    } catch (error) {
      setUsers(previousUsers);
      toast.error(`${tCommon('error')}: ${error.response?.data?.message || error.message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  return (
    <div className="space-y-8 w-full max-w-2xl animate-fadeIn">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t('blockedList')}</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Quản lý danh sách những người dùng bạn đã chặn tương tác.
        </p>
      </div>

      <div className="bg-[var(--card-elevated)]/40 rounded-2xl border border-[var(--border)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center flex items-center justify-center min-h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--muted-foreground)] flex items-center justify-center min-h-[200px]">
            {t('blockedlist.empty')}
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {users.map((user) => (
              <li key={user.username} className="p-4 hover:bg-[var(--muted)]/50 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <UserHeader user={user} className="flex-grow min-w-0" />
                  <button
                    onClick={() => handleAction(user.username)}
                    disabled={actionLoading[user.username]}
                    className="btn-primary px-4 py-1.5 text-xs font-semibold rounded-xl min-w-[100px] border border-[var(--border)] shadow-sm hover:shadow transition-all disabled:opacity-50 flex items-center justify-center"
                  >
                    {actionLoading[user.username] ? (
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                    ) : (
                      t('blockedlist.unblock')
                    )}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
