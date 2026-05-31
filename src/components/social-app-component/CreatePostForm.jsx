"use client";

import React, { useRef, useState, useEffect } from "react";
import Modal from "@/components/ui-components/Modal";
import api from "@/utils/axios";
import { uploadMultipleFiles } from "@/utils/fileUpload";
import toast from "react-hot-toast";
import ImagePreview from "../ui-components/ImagePreview";
import { useTranslations } from "next-intl";
import { Globe, Users, Lock, Image as ImageIcon, Video, Plus, Loader2, FolderOpen } from "lucide-react";

export default function NewPostModal({ isOpen, onClose }) {
  const t = useTranslations("post.createModal");
  const tPost = useTranslations("post");
  const tCommon = useTranslations("common");
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const [media, setMedia] = useState([]);
  const [privacy, setPrivacy] = useState("PUBLIC");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(null); // 🔍 index để zoom

  const MAX_FILES = 10; // 🔧 Giới hạn tối đa 10 files

  useEffect(() => {
    if (isOpen) {
      const storedPrivacy = localStorage.getItem("defaultPrivacy")
      if ((storedPrivacy)) {
        setPrivacy(storedPrivacy)
      } else {
        setPrivacy("PUBLIC") // fallback
      }
    }
  }, [isOpen])
  const handleMediaSelect = (files) => {
    const mediaFiles = files.filter(
      (file) => file.type.startsWith("image/") || file.type.startsWith("video/")
    );

    // 🔧 Kiểm tra giới hạn số file
    const currentCount = media.length;
    const availableSlots = MAX_FILES - currentCount;

    if (mediaFiles.length > availableSlots) {
      toast.error(t("uploadLimit", { count: MAX_FILES, slots: availableSlots }));
      // Chỉ lấy số file cho phép
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

    // 🔧 Hiển thị thông báo nếu đã đạt giới hạn
    if (currentCount + mediaFiles.length >= MAX_FILES) {
      toast.success(t("selectedFiles", { count: currentCount + mediaFiles.length, max: MAX_FILES }));
    }
  };

  const handleFileChange = (e) => {
    handleMediaSelect(Array.from(e.target.files));
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleMediaSelect(Array.from(e.dataTransfer.files));
  };

  const handleClickUploadArea = () => {
    // 🔧 Kiểm tra giới hạn trước khi mở file picker
    if (media.length >= MAX_FILES) {
      toast.error(t("limitReached", { count: MAX_FILES }));
      return;
    }

    console.log("🔍 Clicking file input..."); // Debug log
    fileInputRef.current?.click();
  };

  const handleRemoveMedia = (index) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  // 🔧 Hàm để tự động điều chỉnh chiều cao textarea
  const handleContentChange = (e) => {
    setContent(e.target.value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, 96)}px`; // min height 96px (4 rows)
    }
  };

  const handleSubmit = async () => {
    if ((media.length === 0 && !content.trim()) || !privacy || isLoading) return;

    setIsLoading(true);
    try {
      // 1. Upload all files using presigned URLs
      const filesToUpload = media.map(item => item.file);
      const fileIds = await uploadMultipleFiles(filesToUpload);

      // 2. Submit post with file IDs
      const res = await api.post("/v1/posts/post", {
        content: content,
        privacy: privacy,
        files: fileIds
      });

      if (res.data.code === 200) {
        toast.success(t("success"));
        onClose?.();
        setMedia([]);
        setContent("");
        setPrivacy("PUBLIC");
      } else {
        toast.error(res.data.message || t("error"));
      }
    } catch (err) {
      toast.error(tPost("networkError") || tCommon("error"));
      console.error("❌ Error posting:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="relative p-5">
          <div className="flex justify-between items-center mb-4 px-2">
            <h2 className="text-lg font-semibold">{t("title")}</h2>
          </div>

          {/* Hidden file input - đặt ở đây để luôn có thể truy cập */}
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

            {media.length === 0 ? (
                <div
                    onClick={handleClickUploadArea}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="flex flex-col items-center justify-center border-2 border-dashed border-[var(--border)] rounded-lg p-10 text-gray-500 hover:border-[var(--primary)] cursor-pointer transition-colors space-y-2"
                >
                  <p className="text-sm">{t("dropzone")}</p>
                  <p className="text-xs text-gray-400">{t("dropzoneLimit", { count: MAX_FILES })}</p>
                  <FolderOpen className="w-12 h-12 text-[var(--muted-foreground)]" />
                </div>
            ) : (
                <div className="flex flex-col md:flex-row gap-6 p-4">
                  <div className="md:w-1/2 w-full">
                    {/* 🔧 Hiển thị số file hiện tại */}
                    <div className="mb-2 text-sm text-gray-500">
                      {t("uploadedCount", { count: media.length, max: MAX_FILES })}
                    </div>
                    <ImagePreview
                        images={media}
                        onImageClick={(i) => setZoomIndex(i)} // ⚡ xử lý zoom
                        onDelete={handleRemoveMedia}
                        onAdd={media.length < MAX_FILES ? handleClickUploadArea : undefined} // 🔧 Chỉ hiển thị nút Add nếu chưa đạt giới hạn
                    />
                  </div>

              <div className="md:w-1/2 w-full space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t("privacyLabel")}</label>
                  <select
                    value={privacy}
                    onChange={(e) => setPrivacy(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-[var(--input)] text-[var(--foreground)]"
                  >
                    <option value="PUBLIC">{tPost("privacy.public")}</option>
                    <option value="FRIEND">{tPost("privacy.friend")}</option>
                    <option value="PRIVATE">{tPost("privacy.private")}</option>
                  </select>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">{t("contentLabel")}</label>
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={handleContentChange}
                    rows={4}
                    placeholder={t("placeholder")}
                    className="w-full px-3 py-2 border rounded-md bg-[var(--input)] text-[var(--foreground)] resize-none overflow-hidden min-h-[96px]"
                    style={{ height: '96px' }}
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? t("uploading") : tPost("comment")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Nếu không có media */}
          {media.length === 0 && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t("privacyLabel")}</label>
                  <select
                    value={privacy}
                    onChange={(e) => setPrivacy(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-[var(--input)] text-[var(--foreground)]"
                  >
                    <option value="PUBLIC">{tPost("privacy.public")}</option>
                    <option value="FRIEND">{tPost("privacy.friend")}</option>
                    <option value="PRIVATE">{tPost("privacy.private")}</option>
                  </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t("contentLabel")}</label>
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={handleContentChange}
                  rows={4}
                  placeholder={t("placeholder")}
                  className="w-full px-3 py-2 border rounded-md bg-[var(--input)] text-[var(--foreground)] resize-none overflow-hidden min-h-[96px]"
                  style={{ height: '96px' }}
                />
                <div className={`text-xs text-[var(--muted-foreground)] mt-1 text-right ${content.length > 10000 && "text-red-500"}`}>
                        {content.length}/10000
                    </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || (!content.trim() && media.length === 0) || content.length > 10000}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? t("uploading") : tPost("comment")}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* 🔍 Modal zoom ảnh/video */}
      {zoomIndex !== null && (
        <Modal isOpen={zoomIndex !== null} onClose={() => setZoomIndex(null)}>
          <div className="relative w-full h-[80vh] flex items-center justify-center bg-black">
            {media[zoomIndex]?.type === "video" ? (
              <video
                src={media[zoomIndex].preview}
                className="max-h-full max-w-full"
                controls
                autoPlay
              />
            ) : (
              <img
                src={media[zoomIndex].preview}
                className="max-h-full max-w-full object-contain"
                alt={`Preview ${zoomIndex}`}
              />
            )}
          </div>
        </Modal>
      )}
    </>
  );
}