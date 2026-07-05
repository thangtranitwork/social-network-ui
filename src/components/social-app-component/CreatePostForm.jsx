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
      <div className="flex flex-col h-full max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)] shrink-0">
          <h2 className="text-xl font-bold">{t("title")}</h2>
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

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
          {/* Privacy Selector */}
          <div className="flex items-center gap-3">
            <select
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value)}
              className="bg-[var(--muted)] text-[var(--foreground)] text-sm font-semibold py-1.5 px-3 rounded-lg border-none focus:ring-2 focus:ring-[var(--primary)] outline-none cursor-pointer hover:bg-[var(--muted)]/80 transition-colors"
            >
              <option value="PUBLIC">🌎 {tPost("privacy.public")}</option>
              <option value="FRIEND">👥 {tPost("privacy.friend")}</option>
              <option value="PRIVATE">🔒 {tPost("privacy.private")}</option>
            </select>
          </div>

          {/* Text Area */}
          <div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              placeholder={t("placeholder")}
              className="w-full bg-transparent text-[var(--foreground)] text-lg placeholder:text-[var(--muted-foreground)] resize-none outline-none min-h-[120px]"
              style={{ height: '120px' }}
            />
            <div className={`text-xs text-[var(--muted-foreground)] mt-1 text-right ${content.length > 10000 && "text-red-500"}`}>
              {content.length}/10000
            </div>
          </div>

          {/* Media Area */}
          {media.length > 0 ? (
            <div className="relative border border-[var(--border)] rounded-xl p-3 bg-[var(--muted)]/10">
              <div className="mb-3 text-sm font-medium text-[var(--muted-foreground)] flex justify-between items-center px-1">
                <span>{t("uploadedCount", { count: media.length, max: MAX_FILES })}</span>
                {media.length < MAX_FILES && (
                  <button type="button" onClick={handleClickUploadArea} className="text-xs text-[var(--primary)] font-semibold hover:underline flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Thêm
                  </button>
                )}
              </div>
              <ImagePreview
                images={media}
                onImageClick={(i) => setZoomIndex(i)}
                onDelete={handleRemoveMedia}
                onAdd={media.length < MAX_FILES ? handleClickUploadArea : undefined}
              />
            </div>
          ) : (
            <div
              onClick={handleClickUploadArea}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="group flex flex-col items-center justify-center border-2 border-dashed border-[var(--border)] rounded-xl p-8 text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 cursor-pointer transition-all duration-200"
            >
              <div className="p-4 bg-[var(--muted)] group-hover:bg-[var(--primary)]/10 rounded-full mb-3 transition-colors">
                <ImageIcon className="w-8 h-8" />
              </div>
              <p className="text-base font-medium">{t("dropzone")}</p>
              <p className="text-xs mt-2 opacity-70">{t("dropzoneLimit", { count: MAX_FILES })}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--background)] shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-[var(--foreground)] hidden sm:block">Thêm vào bài viết</p>
              <button
                type="button"
                onClick={handleClickUploadArea}
                className="p-2 text-green-500 hover:bg-green-500/10 rounded-full transition-colors"
                title="Photo/Video"
              >
                <ImageIcon className="w-6 h-6" />
              </button>
            </div>
            <button
              onClick={handleSubmit}
              disabled={isLoading || (!content.trim() && media.length === 0) || content.length > 10000}
              className="px-6 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-sm"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? t("uploading") : tPost("create")}
            </button>
          </div>
        </div>
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