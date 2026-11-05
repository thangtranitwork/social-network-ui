"use client";

import { useState } from "react";
import { MessageSquarePlus, Send, Trash2, Sparkles } from "lucide-react";
import Avatar from "@/components/ui-components/Avatar";
import { NOTE_COLORS } from "../spatialConstants";
import dayjs from "dayjs";

const COLOR_KEYS = ["AMBER", "ROSE", "CYAN", "VIOLET", "EMERALD"];

export default function GuestbookWallNode({
  node,
  entries = [],
  allowGuestbook = true,
  isOwnProfile = false,
  currentUserId = "",
  isBuilderMode = false,
  customAccent = "#6366F1",
  onAddEntry,
  onDeleteEntry,
  tSpace,
}) {
  const [message, setMessage] = useState("");
  const [selectedColor, setSelectedColor] = useState("AMBER");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const frameStyle = node?.frameStyle || "GLASS";
  const isCork = frameStyle === "CORK_BOARD";

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isBuilderMode || !message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddEntry({
        message: message.trim(),
        cardColor: selectedColor,
        posX: 0,
        posY: 0,
      });
      setMessage("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`w-[340px] sm:w-[380px] p-5 rounded-3xl overflow-hidden transition-all ${
        isCork
          ? "bg-[#2B2118] text-amber-50 border-4 border-[#4A3728] shadow-[0_25px_65px_rgba(0,0,0,0.6)]"
          : "bg-zinc-900/85 text-white backdrop-blur-2xl border border-white/15 shadow-[0_24px_65px_rgba(0,0,0,0.55)]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2 min-w-0">
          <MessageSquarePlus size={16} className="shrink-0" style={{ color: customAccent }} />
          <h3 className="text-sm font-bold tracking-tight truncate">
            {tSpace ? tSpace("guestbookTitle") : "Sổ lưu bút không gian"}
          </h3>
        </div>
        <Sparkles size={14} className="text-zinc-400 shrink-0" />
      </div>

      {/* Pinned Entries List */}
      <div
        data-scrollable="true"
        className="max-h-[220px] overflow-y-auto space-y-2.5 pr-1 mb-3.5"
      >
        {entries.length > 0 ? (
          entries.map((entry) => {
            const palette = NOTE_COLORS[entry.cardColor] || NOTE_COLORS.AMBER;
            const canDelete = isOwnProfile || (currentUserId && entry.authorId === currentUserId);
            const authorName =
              [entry.authorFamilyName, entry.authorGivenName].filter(Boolean).join(" ") ||
              entry.authorUsername ||
              "Khách";

            return (
              <div
                key={entry.id}
                className={`p-3 rounded-xl border transition-transform ${palette.bg} ${palette.border} ${palette.text}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar
                      src={entry.authorAvatarUrl}
                      alt={authorName}
                      size={22}
                      className="rounded-full object-cover shrink-0"
                    />
                    <span className="text-xs font-bold truncate">{authorName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] opacity-65">
                      {entry.createdAt ? dayjs(entry.createdAt).format("DD/MM") : ""}
                    </span>
                    {canDelete && !isBuilderMode && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteEntry?.(entry.id);
                        }}
                        className="p-1 rounded-md hover:bg-black/10 text-rose-600 dark:text-rose-400 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs leading-relaxed break-words">{entry.message}</p>
              </div>
            );
          })
        ) : (
          <div className="py-6 text-center text-xs text-zinc-400 border border-dashed border-white/10 rounded-2xl">
            {tSpace ? tSpace("guestbookEmpty") : "Chưa có lời nhắn lưu bút nào"}
          </div>
        )}
      </div>

      {/* Add Note Form (Fixed Flex Overflow with min-w-0) */}
      {allowGuestbook && !isBuilderMode && (
        <form onSubmit={handleSubmit} className="space-y-2.5 pt-2.5 border-t border-white/10 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {COLOR_KEYS.map((colorKey) => (
                <button
                  key={colorKey}
                  type="button"
                  onClick={() => setSelectedColor(colorKey)}
                  className={`w-4 h-4 rounded-full transition-transform ${
                    selectedColor === colorKey ? "scale-125 ring-2 ring-white" : "opacity-70 hover:opacity-100"
                  }`}
                  style={{ background: NOTE_COLORS[colorKey].dot }}
                />
              ))}
            </div>
            <span className="text-[10px] text-zinc-400">{message.length}/280</span>
          </div>

          <div className="flex items-center gap-2 w-full">
            <input
              type="text"
              maxLength={280}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={tSpace ? tSpace("guestbookPlaceholder") : "Để lại lời nhắn..."}
              className="flex-1 min-w-0 bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
            <button
              type="submit"
              disabled={!message.trim() || isSubmitting}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-40 transition-opacity shrink-0 whitespace-nowrap"
              style={{ background: customAccent }}
            >
              <Send size={13} />
              <span>{tSpace ? tSpace("guestbookSign") : "Ghim"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
