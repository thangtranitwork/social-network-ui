"use client";

import { useState, useEffect } from "react";
import Input from "@/components/ui-components/Input";
import Avatar from "@/components/ui-components/Avatar";
import api from "@/utils/axios";
import { uploadFile } from "@/utils/fileUpload";
import { useTranslations } from "next-intl";

const formatDateForInput = (dateVal) => {
  if (!dateVal) return "";
  if (typeof dateVal === "string") return dateVal.slice(0, 10);
  try {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  } catch {
    // fallback
  }
  return "";
};

export default function PersonalInfoPage() {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const [user, setUser] = useState(null);           // Dữ liệu người dùng
  const [originalUser, setOriginalUser] = useState(null); // Bản sao gốc
  const [avatarFile, setAvatarFile] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessages, setSuccessMessages] = useState([]);
  const [token, setToken] = useState(null);         // Token

  useEffect(() => {
    const tokenFromLocalStorage = localStorage.getItem("accessToken");
    setToken(tokenFromLocalStorage);

    const username = localStorage.getItem("userName");

    const fetchProfile = async () => {
      try {
        const res = await api.get(`/v1/users/${username}`, {
          headers: { Authorization: `Bearer ${tokenFromLocalStorage}` },
        });

        if (res.data.code === 200) {
          const profileData = {
            ...res.data.body,
            birthdate: formatDateForInput(res.data.body.birthdate),
          };
          setUser(profileData);
          setOriginalUser(profileData);
        } else {
          setErrors((prev) => ({ ...prev, fetch: res.data.message }));
        }
      } catch {
        setErrors((prev) => ({ ...prev, fetch: "Không tải được thông tin người dùng" }));
      } finally {
        setLoadingUser(false);
      }
    };
    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e2) => {
        setUser((prev) => ({ ...prev, profilePictureUrl: e2.target.result }));
        setAvatarFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!originalUser) return;
    setLoading(true);
    setErrors({});
    setSuccessMessages([]);

    let uploadedAvatarUrl = null;

    const updates = [
      {
        label: t('givenName') || "Họ và tên",
        check: user.givenName !== originalUser.givenName || user.familyName !== originalUser.familyName,
        request: () =>
          api.patch("/v1/users/update-name", {
            givenName: user.givenName,
            familyName: user.familyName,
          }),
        errorKey: "name",
      },
      {
        label: t('username') || "Tên người dùng",
        check: user.username !== originalUser.username,
        request: () =>
          api.patch("/v1/users/update-username", {
            username: user.username,
          }),
        errorKey: "username",
      },
      {
        label: t('birthdate') || "Ngày sinh",
        check: user.birthdate !== originalUser.birthdate,
        request: () =>
          api.patch("/v1/users/update-birthdate", {
            birthdate: user.birthdate,
          }),
        errorKey: "birthday",
      },
      {
        label: t('bio') || "Tiểu sử",
        check: user.bio !== originalUser.bio,
        request: () =>
          api.patch("/v1/users/update-bio", {
            bio: user.bio,
          }),
        errorKey: "bio",
      },
      {
        label: "Avatar",
        check: !!avatarFile,
        request: async () => {
          const fileId = await uploadFile(avatarFile);
          await api.patch("/v1/users/update-profile-picture", { fileId });
          const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:11111";
          uploadedAvatarUrl = `${apiBase}/v1/files/${fileId}`;
          return fileId;
        },
        errorKey: "avatar",
      },
    ];

    let successCount = 0;

    for (const item of updates) {
      if (item.check) {
        try {
          await item.request();
          setSuccessMessages((prev) => [...prev, t('editModal.success', { label: item.label })]);
          successCount++;
        } catch (err) {
          setErrors((prev) => ({
            ...prev,
            [item.errorKey]: err?.response?.data?.message || t('editModal.error', { label: item.label }),
          }));
        }
      }
    }

    setLoading(false);
    if (successCount > 0) {
      const finalUser = {
        ...user,
        profilePictureUrl: uploadedAvatarUrl || user.profilePictureUrl,
      };
      setUser(finalUser);
      setOriginalUser(finalUser); // đồng bộ bản gốc
    }
  };

  if (loadingUser) {
    return (
        <main className="flex-1 w-full p-4 sm:p-8 text-center flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
        </main>
    );
  }

  if (!user) {
    return (
        <main className="flex-1 w-full p-4 sm:p-8 text-center text-red-500 flex items-center justify-center min-h-[300px]">
          {errors.fetch || "Không tải được thông tin"}
        </main>
    );
  }

  return (
      <div className="space-y-8 w-full max-w-2xl animate-fadeIn">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t('personalInfo')}</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Cập nhật thông tin cá nhân của bạn để hiển thị trên hồ sơ.
          </p>
        </div>

        {successMessages.length > 0 && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 p-4 rounded-2xl text-emerald-800 dark:text-emerald-300 text-sm space-y-1">
              {successMessages.map((m, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span> {m}
                  </div>
              ))}
            </div>
        )}

        {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40 p-4 rounded-2xl text-red-800 dark:text-red-300 text-sm space-y-1">
              {Object.keys(errors).map((k) => errors[k] && (
                  <div key={k} className="flex items-center gap-2">
                    <span className="text-red-500">✗</span> {errors[k]}
                  </div>
              ))}
            </div>
        )}

        <div className="space-y-6">
          {/* Avatar section - Responsive layout */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-[var(--card-elevated)]/40 border border-[var(--border)]">
            {/* Avatar - Fixed size */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-[var(--accent-subtle)] border-2 border-[var(--card)] shadow-sm">
                <Avatar
                    src={user.profilePictureUrl}
                    className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* User info */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="font-semibold text-lg text-[var(--foreground)] truncate">@{user.username}</div>
              <div className="text-[var(--muted-foreground)] text-sm truncate mt-0.5">
                {user.familyName} {user.givenName}
              </div>
            </div>

            {/* File input button */}
            <div className="flex-shrink-0 w-full sm:w-auto">
              <label className="block">
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                />
                <span className="btn-primary inline-flex w-full sm:w-auto px-4 py-2 cursor-pointer text-center text-xs font-semibold rounded-xl items-center justify-center border border-[var(--border)] shadow-sm hover:shadow-md transition-all duration-200">
                  {t('changeAvatar')}
                </span>
              </label>
            </div>
          </div>

          {/* Form fields */}
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                  label={t('familyName')}
                  name="familyName"
                  value={user.familyName || ""}
                  onChange={handleInputChange}
                  placeholder="Nhập họ"
              />
              <Input
                  label={t('givenName')}
                  name="givenName"
                  value={user.givenName || ""}
                  onChange={handleInputChange}
                  placeholder="Nhập tên"
              />
            </div>

            <Input
                label={t('username')}
                name="username"
                value={user.username || ""}
                onChange={handleInputChange}
                placeholder="Nhập tên người dùng"
            />

            <Input
                label={t('birthdate')}
                name="birthdate"
                value={user.birthdate || ""}
                onChange={handleInputChange}
                type="date"
                max={new Date().toISOString().slice(0, 10)}
            />

            <div>
              <Input
                  label={t('bio')}
                  name="bio"
                  type="textarea"
                  value={user.bio || ""}
                  onChange={handleInputChange}
                  placeholder="Giới thiệu bản thân..."
                  maxLength={150}
                  rows={3}
              />
              <div className="text-xs text-[var(--muted-foreground)] mt-1.5 text-right px-1">
                {user.bio?.length || 0} / 150
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4 flex justify-end">
            <button
                onClick={handleSave}
                disabled={loading}
                className="btn-primary w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:shadow transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{tCommon('saving')}</span>
                  </>
              ) : (
                  <span>{tCommon('save')}</span>
              )}
            </button>
          </div>
        </div>
      </div>
  );
}