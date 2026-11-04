"use client";

import { useState } from "react";
import Avatar from "../ui-components/Avatar";
import Input from "../ui-components/Input";
import api, { refreshTokenManually, setUserName } from "@/utils/axios";
import { uploadFile } from "@/utils/fileUpload";
import { useTranslations } from "next-intl";
import { Camera } from "lucide-react";
import toast from "react-hot-toast";

// Helper để chuyển format ngày thành YYYY-MM-DD cho input type="date"
const formatDateForInput = (dateVal) => {
  if (!dateVal) return "";
  if (typeof dateVal === "string") {
    return dateVal.slice(0, 10);
  }
  try {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      return d.toISOString().slice(0, 10);
    }
  } catch {
    // fallback
  }
  return "";
};

export default function EditProfileModal({ profileData = {}, onSave }) {
  const t = useTranslations("profile.editModal");
  const initialBirthdate = formatDateForInput(profileData.birthdate);

  const [formData, setFormData] = useState({
    firstname: profileData.givenName || "",
    lastname: profileData.familyName || "",
    username: profileData.username || "",
    birthdate: initialBirthdate,
    bio: profileData.bio || "",
    avatar: profileData.profilePictureUrl || "/avatar-placeholder.png",
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessages, setSuccessMessages] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData((prev) => ({ ...prev, avatar: event.target.result }));
        setAvatarFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccessMessages([]);

    let uploadedAvatarUrl = null;

    const updates = [
      {
        label: t("givenName") || "Họ và tên",
        check:
          formData.firstname !== (profileData.givenName || "") ||
          formData.lastname !== (profileData.familyName || ""),
        request: () =>
          api.patch("/v1/users/update-name", {
            givenName: formData.firstname,
            familyName: formData.lastname,
          }),
        errorKey: "name",
      },
      {
        label: t("username") || "Tên người dùng",
        check: formData.username !== (profileData.username || ""),
        request: () =>
          api.patch("/v1/users/update-username", {
            username: formData.username,
          }),
        errorKey: "username",
      },
      {
        label: t("birthdate") || "Ngày sinh",
        check: formData.birthdate && formData.birthdate !== initialBirthdate,
        request: () =>
          api.patch("/v1/users/update-birthdate", {
            birthdate: formData.birthdate,
          }),
        errorKey: "birthdate",
      },
      {
        label: t("bio") || "Tiểu sử",
        check: formData.bio !== (profileData.bio || ""),
        request: () =>
          api.patch("/v1/users/update-bio", {
            bio: formData.bio,
          }),
        errorKey: "bio",
      },
      {
        label: t("avatar") || "Avatar",
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

    const pendingUpdates = updates.filter((item) => item.check);

    // Nếu không có trường nào thay đổi thì đóng modal
    if (pendingUpdates.length === 0) {
      setLoading(false);
      onSave?.(profileData);
      return;
    }

    let successCount = 0;
    let usernameUpdated = false;
    const oldUsername = profileData.username;
    const newUsername = formData.username;

    for (const item of pendingUpdates) {
      try {
        await item.request();
        setSuccessMessages((prev) => [
          ...prev,
          t("success", { label: item.label }) || `Đã cập nhật ${item.label}`,
        ]);
        successCount++;

        if (item.errorKey === "username") {
          usernameUpdated = true;
        }
      } catch (err) {
        console.error(`❌ Error updating ${item.label}:`, err);
        const errorMsg =
          err?.response?.data?.message ||
          t("error", { label: item.label.toLowerCase() }) ||
          `Lỗi khi cập nhật ${item.label}`;
        setErrors((prev) => ({
          ...prev,
          [item.errorKey]: errorMsg,
        }));
      }
    }

    // Đồng bộ username nếu thay đổi thành công
    if (usernameUpdated && !errors.username) {
      try {
        setUserName(formData.username);
        refreshTokenManually();
      } catch (syncError) {
        console.warn("Could not sync username:", syncError);
      }
    }

    if (successCount > 0) {
      toast.success("Cập nhật thông tin thành công!");
      const updatedData = {
        ...profileData,
        ...formData,
        givenName: formData.firstname,
        familyName: formData.lastname,
        birthdate: formData.birthdate,
        profilePictureUrl: uploadedAvatarUrl || formData.avatar,
      };

      onSave?.(updatedData, {
        usernameChanged: usernameUpdated && !errors.username,
        oldUsername,
        newUsername,
      });
    }

    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col bg-[var(--card)] text-[var(--foreground)] rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-[var(--border)] shrink-0">
        <h2 className="text-lg font-bold">{t("title") || "Chỉnh sửa thông tin cá nhân"}</h2>
      </div>

      {successMessages.length > 0 && (
        <div className="mx-6 mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <ul className="text-xs font-medium text-emerald-600 dark:text-emerald-400 space-y-1">
            {successMessages.map((msg, index) => (
              <li key={index}>✓ {msg}</li>
            ))}
          </ul>
        </div>
      )}

      {Object.keys(errors).length > 0 && (
        <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <ul className="text-xs font-medium text-red-600 dark:text-red-400 space-y-1">
            {Object.entries(errors).map(
              ([field, error]) => error && <li key={field}>✗ {error}</li>
            )}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between p-6 overflow-y-auto space-y-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Avatar Area with Camera Icon button at bottom-right */}
          <div className="flex flex-col items-center gap-2 w-full md:w-auto shrink-0 md:pr-6 md:border-r border-[var(--border)]">
            <div className="relative w-32 h-32 rounded-full ring-4 ring-[var(--border)] group">
              <Avatar src={formData.avatar} className="w-full h-full object-cover rounded-full" />
              <label
                htmlFor="edit-profile-avatar-input"
                className="absolute bottom-0.5 right-0.5 w-9 h-9 rounded-full bg-[var(--primary)] text-white hover:opacity-90 flex items-center justify-center cursor-pointer shadow-md transition-all hover:scale-105 active:scale-95 border-2 border-[var(--card)]"
                title={t("changeAvatar") || "Đổi ảnh đại diện"}
              >
                <Camera className="w-4 h-4" />
                <input
                  id="edit-profile-avatar-input"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            {errors.avatar && <p className="text-red-500 text-xs text-center mt-1">{errors.avatar}</p>}
          </div>

          {/* Form Fields */}
          <div className="flex-1 w-full space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Input
                  name="firstname"
                  label={t("givenName") || "Tên"}
                  value={formData.firstname}
                  onChange={handleInputChange}
                  placeholder="Nhập tên"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <Input
                  name="lastname"
                  label={t("familyName") || "Họ"}
                  value={formData.lastname}
                  onChange={handleInputChange}
                  placeholder="Nhập họ"
                />
              </div>
            </div>

            <div>
              <Input
                name="username"
                label={t("username") || "Tên người dùng"}
                value={formData.username}
                onChange={handleInputChange}
                placeholder="username"
              />
              {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
            </div>

            {/* Date Picker Input */}
            <div>
              <Input
                type="date"
                name="birthdate"
                label={t("birthdate") || "Ngày sinh"}
                value={formData.birthdate}
                onChange={handleInputChange}
                max={new Date().toISOString().slice(0, 10)}
              />
              {errors.birthdate && <p className="text-red-500 text-xs mt-1">{errors.birthdate}</p>}
            </div>

            <div>
              <Input
                name="bio"
                label={t("bio") || "Tiểu sử"}
                type="textarea"
                value={formData.bio}
                onChange={handleInputChange}
                maxLength={256}
                placeholder={t("bioPlaceholder") || "Giới thiệu đôi nét về bản thân..."}
              />
              <div className="text-xs text-[var(--muted-foreground)] mt-1 text-right">
                {formData.bio.length} / 256
              </div>
              {errors.bio && <p className="text-red-500 text-xs mt-1">{errors.bio}</p>}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t border-[var(--border)]">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{t("saving") || "Đang lưu..."}</span>
              </>
            ) : (
              <span>{t("saveChanges") || "Lưu thay đổi"}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
