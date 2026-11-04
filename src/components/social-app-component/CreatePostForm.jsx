"use client";

import React, { useRef, useState, useEffect } from "react";
import Modal from "@/components/ui-components/Modal";
import MediaLightbox from "../ui-components/MediaLightbox";
import api from "@/utils/axios";
import { uploadMultipleFiles } from "@/utils/fileUpload";
import toast from "react-hot-toast";
import ImagePreview from "../ui-components/ImagePreview";
import Avatar from "../ui-components/Avatar";
import { useTranslations } from "next-intl";
import { formatFullName } from "@/utils/formatName";
import { extractFilesFromClipboard } from "@/utils/clipboardUtils";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Globe, 
  Users, 
  Lock, 
  Image as ImageIcon, 
  Plus, 
  Loader2, 
  X,
  ChevronDown 
} from "lucide-react";

export default function NewPostModal({ isOpen, onClose }) {
  const t = useTranslations("post.createModal");
  const tPost = useTranslations("post");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const [media, setMedia] = useState([]);
  const [privacy, setPrivacy] = useState("PUBLIC");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    percent: 0,
    text: "",
  });

  const MAX_FILES = 10;

  // Load user info & default privacy on open
  useEffect(() => {
    if (isOpen) {
      const storedPrivacy = localStorage.getItem("defaultPrivacy");
      if (storedPrivacy) {
        setPrivacy(storedPrivacy);
      } else {
        setPrivacy("PUBLIC");
      }

      if (typeof window !== "undefined") {
        const storedUserId = localStorage.getItem("userId");
        const storedUsername = localStorage.getItem("userName");

        if (storedUsername) {
          setCurrentUser({
            id: storedUserId || "",
            username: storedUsername,
            fullName: storedUsername,
            profilePictureUrl: "",
          });

          // Fetch full profile info for name and avatar
          api.get(`/v1/users/${storedUsername}`)
            .then((res) => {
              if (res.data && res.data.body) {
                const u = res.data.body;
                const fullName = formatFullName(u);
                setCurrentUser({
                  id: u.id || storedUserId,
                  username: u.username,
                  fullName: fullName,
                  profilePictureUrl: u.profilePictureUrl || "",
                });
              }
            })
            .catch((err) => {
              console.warn("Could not fetch user details for modal:", err);
            });
        }
      }
    }
  }, [isOpen]);

  const handleMediaSelect = (files) => {
    const mediaFiles = files.filter(
      (file) => file.type.startsWith("image/") || file.type.startsWith("video/")
    );

    const currentCount = media.length;
    const availableSlots = MAX_FILES - currentCount;

    if (mediaFiles.length > availableSlots) {
      toast.error(t("uploadLimit", { count: MAX_FILES, slots: availableSlots }));
      mediaFiles.splice(availableSlots);
    }

    if (mediaFiles.length === 0) {
      if (availableSlots === 0) {
        toast.error(t("limitReached", { count: MAX_FILES }));
      }
      return;
    }

    const newMedia = mediaFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith("video/") ? "video" : "image",
    }));

    setMedia((prev) => [...prev, ...newMedia]);

    if (currentCount + mediaFiles.length >= MAX_FILES) {
      toast.success(t("selectedFiles", { count: currentCount + mediaFiles.length, max: MAX_FILES }));
    }
  };

  const handleFileChange = (e) => {
    handleMediaSelect(Array.from(e.target.files));
    e.target.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading && media.length < MAX_FILES) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDraggingOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (isLoading) return;
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      handleMediaSelect(Array.from(e.dataTransfer.files));
    }
  };

  const handlePaste = (e) => {
    const files = extractFilesFromClipboard(e);
    if (files.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      handleMediaSelect(files);
    }
  };

  const handleClickUploadArea = () => {
    if (media.length >= MAX_FILES) {
      toast.error(t("limitReached", { count: MAX_FILES }));
      return;
    }
    fileInputRef.current?.click();
  };

  const handleRemoveMedia = (index) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, 96)}px`;
    }
  };

  const handleSubmit = async () => {
    if ((media.length === 0 && !content.trim()) || !privacy || isLoading) return;

    setIsLoading(true);
    setUploadProgress({ percent: 5, text: t("preparing") || "Đang chuẩn bị tải lên..." });

    try {
      let fileIds = [];

      // 1. Upload files with progress tracking
      if (media.length > 0) {
        const filesToUpload = media.map((item) => item.file);
        fileIds = await uploadMultipleFiles(filesToUpload, ({ percent, completedCount, totalCount }) => {
          // Keep percent capped at 90% while uploading files
          const scaledPercent = Math.round((percent * 0.9));
          setUploadProgress({
            percent: Math.min(scaledPercent, 90),
            text: t("uploadingCount", { completedCount, totalCount, percent }) || `Đang tải tệp ${completedCount}/${totalCount} (${percent}%)...`,
          });
        });
      }

      // 2. Submit post to backend
      setUploadProgress({ percent: 95, text: t("publishing") || "Đang xuất bản bài viết..." });
      const res = await api.post("/v1/posts/post", {
        content: content,
        privacy: privacy,
        files: fileIds,
      });

      if (res.data.code === 200 || res.data.code === 201) {
        setUploadProgress({ percent: 100, text: t("completed") || "Hoàn tất!" });
        const createdPost = res.data.body;

        // 3. Optimistic cache update for newsfeed
        if (createdPost) {
          queryClient.setQueriesData({ queryKey: ["newsfeed"] }, (oldData) => {
            if (!oldData || !oldData.pages) return oldData;
            return {
              ...oldData,
              pages: [
                [createdPost, ...(oldData.pages[0] || [])],
                ...oldData.pages.slice(1),
              ],
            };
          });
        }

        // 4. Invalidate newsfeed queries to sync with backend
        queryClient.invalidateQueries({ queryKey: ["newsfeed"] });

        // 5. Dispatch post-created event for smooth scroll to top
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("post-created", { detail: createdPost }));
        }

        toast.success(t("success") || "Tạo bài viết thành công!");
        
        // Reset state
        setMedia([]);
        setContent("");
        setUploadProgress({ percent: 0, text: "" });
        onClose?.();
      } else {
        toast.error(res.data.message || t("error"));
      }
    } catch (err) {
      console.error("❌ Error creating post:", err);
      toast.error(tPost("networkError") || tCommon("error"));
    } finally {
      setIsLoading(false);
    }
  };

  const getPrivacyIcon = (p) => {
    switch (p) {
      case "FRIEND":
        return <Users className="w-3.5 h-3.5 text-blue-500" />;
      case "PRIVATE":
        return <Lock className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <Globe className="w-3.5 h-3.5 text-emerald-500" />;
    }
  };

  const getPrivacyLabel = (p) => {
    switch (p) {
      case "FRIEND":
        return tPost("privacy.friend") || "Bạn bè";
      case "PRIVATE":
        return tPost("privacy.private") || "Chỉ mình tôi";
      default:
        return tPost("privacy.public") || "Công khai";
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={isLoading ? () => {} : onClose} size="medium" hideCloseButton={true}>
        <div onPaste={handlePaste} className="flex flex-col h-full max-h-[85vh] bg-[var(--card)] text-[var(--foreground)] rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="relative flex items-center justify-center px-4 py-3.5 border-b border-[var(--border)] shrink-0">
            <h2 className="text-lg font-bold text-center tracking-tight">
              {t("title") || "Tạo bài viết"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[var(--muted)] hover:bg-[var(--muted)]/80 text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label={t("close") || "Đóng"}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Hidden file input */}
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Scrollable Body with Full-Area Drag & Drop */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex-1 overflow-y-auto p-4 space-y-4 min-h-[280px] relative transition-colors ${
              isDraggingOver ? "bg-[var(--primary)]/5" : ""
            }`}
          >
            {/* Overlay hint when dragging over */}
            {isDraggingOver && (
              <div className="absolute inset-x-4 inset-y-4 z-20 border-2 border-dashed border-[var(--primary)] bg-[var(--card)]/80 backdrop-blur-xs rounded-xl flex items-center justify-center pointer-events-none animate-in fade-in duration-150">
                <div className="text-center">
                  <ImageIcon className="w-10 h-10 text-[var(--primary)] mx-auto mb-2 animate-bounce" />
                  <p className="text-sm font-bold text-[var(--primary)]">
                    {t("dropToUpload") || "Thả ảnh hoặc video vào đây để thêm"}
                  </p>
                </div>
              </div>
            )}

            {/* User Profile & Privacy Pill Bar */}
            <div className="flex items-center gap-3">
              <Avatar
                src={currentUser?.profilePictureUrl}
                alt={currentUser?.fullName || "User"}
                size={44}
                className="ring-2 ring-[var(--border)]"
              />
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-[var(--foreground)] leading-tight">
                  {currentUser?.fullName || currentUser?.username || t("userFallback") || "Người dùng"}
                </span>

                {/* Privacy Selector Pill */}
                <div className="relative mt-1 inline-flex items-center">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--muted)] hover:bg-[var(--muted)]/80 text-xs font-medium rounded-full cursor-pointer transition-colors border border-[var(--border)]/60 text-[var(--foreground)]">
                    {getPrivacyIcon(privacy)}
                    <span>{getPrivacyLabel(privacy)}</span>
                    <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
                    <select
                      value={privacy}
                      disabled={isLoading}
                      onChange={(e) => setPrivacy(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed"
                      aria-label="Quyền riêng tư bài viết"
                    >
                      <option value="PUBLIC">🌎 {tPost("privacy.public") || "Công khai"}</option>
                      <option value="FRIEND">👥 {tPost("privacy.friend") || "Bạn bè"}</option>
                      <option value="PRIVATE">🔒 {tPost("privacy.private") || "Chỉ mình tôi"}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Text Area */}
            <div className="pt-1">
              <textarea
                ref={textareaRef}
                value={content}
                disabled={isLoading}
                onChange={handleContentChange}
                placeholder={t("placeholder") || "Bạn đang nghĩ gì thế?..."}
                className="w-full bg-transparent text-[var(--foreground)] text-base placeholder:text-[var(--muted-foreground)] resize-none outline-none min-h-[100px] leading-relaxed"
                style={{ height: "100px" }}
              />
              <div className={`text-xs text-[var(--muted-foreground)] text-right mt-1 ${content.length > 10000 ? "text-red-500 font-bold" : ""}`}>
                {content.length}/10000
              </div>
            </div>

            {/* Media Area */}
            {media.length > 0 ? (
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className="relative border border-[var(--border)] rounded-xl p-3 bg-[var(--muted)]/20"
              >
                <div className="mb-2.5 text-xs font-semibold text-[var(--muted-foreground)] flex justify-between items-center px-1">
                  <span>{t("uploadedCount", { count: media.length, max: MAX_FILES })}</span>
                  {media.length < MAX_FILES && !isLoading && (
                    <button
                      type="button"
                      onClick={handleClickUploadArea}
                      className="text-xs text-[var(--primary)] font-semibold hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> {t("addMediaShort") || "Thêm ảnh/video"}
                    </button>
                  )}
                </div>
                <ImagePreview
                  images={media}
                  onImageClick={(i) => setZoomIndex(i)}
                  onDelete={isLoading ? undefined : handleRemoveMedia}
                  onAdd={media.length < MAX_FILES && !isLoading ? handleClickUploadArea : undefined}
                />
              </div>
            ) : (
              <div
                onClick={isLoading ? undefined : handleClickUploadArea}
                onDrop={isLoading ? undefined : handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className={`group flex flex-col items-center justify-center border-2 border-dashed border-[var(--border)] rounded-xl p-6 text-[var(--muted-foreground)] transition-all duration-200 ${
                  isLoading
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 cursor-pointer"
                }`}
              >
                <div className="p-3 bg-[var(--muted)] group-hover:bg-[var(--primary)]/10 rounded-full mb-2 transition-colors">
                  <ImageIcon className="w-7 h-7" />
                </div>
                <p className="text-sm font-semibold">{t("dropzone") || "Thêm ảnh hoặc video"}</p>
                <p className="text-xs mt-1 opacity-70">
                  {t("dropzoneLimit", { count: MAX_FILES }) || `Tối đa ${MAX_FILES} tệp`}
                </p>
              </div>
            )}

            {/* Real-time Upload Progress Indicator */}
            {isLoading && (
              <div className="p-3.5 rounded-xl bg-[var(--muted)]/40 border border-[var(--border)] space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="flex items-center gap-1.5 text-[var(--foreground)]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--primary)]" />
                    {uploadProgress.text || "Đang xử lý..."}
                  </span>
                  <span className="font-bold text-[var(--primary)]">{uploadProgress.percent}%</span>
                </div>
                <div className="w-full bg-[var(--muted)] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[var(--primary)] h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress.percent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Action Bar */}
          <div className="p-4 border-t border-[var(--border)] bg-[var(--card)] shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-medium text-[var(--muted-foreground)]">
                  {t("addToPost") || "Thêm vào bài viết"}
                </span>
                <button
                  type="button"
                  onClick={handleClickUploadArea}
                  disabled={isLoading || media.length >= MAX_FILES}
                  className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title={t("addPhotosVideos") || "Thêm ảnh hoặc video"}
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading || (!content.trim() && media.length === 0) || content.length > 10000}
                className="px-6 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-bold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-sm"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLoading ? (uploadProgress.text || t("posting") || "Đang đăng...") : (tPost("create") || "Đăng")}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* 🔍 Media Lightbox for images/videos */}
      <MediaLightbox
        isOpen={zoomIndex !== null}
        onClose={() => setZoomIndex(null)}
        src={media[zoomIndex]?.preview}
        type={media[zoomIndex]?.type}
        alt={`Preview ${zoomIndex}`}
      />
    </>
  );
}
