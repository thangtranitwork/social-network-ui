"use client";

import { useState } from "react";
import { MessageSquareQuote, Heart, Sparkles, ExternalLink } from "lucide-react";
import Avatar from "@/components/ui-components/Avatar";
import PostModal from "@/components/social-app-component/PostModal";
import dayjs from "dayjs";

export default function CommentExhibitNode({
  node,
  post,
  isBuilderMode = false,
  customAccent = "#6366F1",
  onToggleLikePost,
}) {
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  const frameStyle = node?.frameStyle || "QUOTE_CARD";
  const content = node?.content || {};
  const commentText = content.commentText || "";
  const authorName = content.authorName || content.authorUsername || "Người dùng";
  const authorUsername = content.authorUsername || "";
  const authorAvatarUrl = content.authorAvatarUrl || "";
  const commentMediaUrl = content.commentMediaUrl || "";
  const likeCount = content.likeCount || 0;
  const createdAt = content.createdAt || "";
  const curatorNote = content.curatorNote || "";

  const wrapperClass = {
    QUOTE_CARD:
      "bg-zinc-900/85 text-white p-5 rounded-2xl backdrop-blur-2xl border border-white/15 shadow-[0_22px_55px_rgba(0,0,0,0.5)] w-[290px] sm:w-[320px]",
    GLASS_BUBBLE:
      "bg-gradient-to-br from-white/15 to-white/5 text-white p-5 rounded-3xl backdrop-blur-2xl border border-white/25 shadow-[0_20px_50px_rgba(0,0,0,0.45)] w-[290px] sm:w-[320px]",
    MUSEUM_PLAQUE:
      "bg-[#FAF8F5] text-stone-900 p-5 rounded-xl border-2 border-stone-300 shadow-[0_22px_50px_rgba(0,0,0,0.35)] w-[290px] sm:w-[320px]",
  }[frameStyle] || "bg-zinc-900/85 text-white p-5 rounded-2xl border border-white/15 w-[300px]";

  const isLight = frameStyle === "MUSEUM_PLAQUE";

  return (
    <>
      <div
        onClick={() => {
          if (!isBuilderMode && post) {
            setIsPostModalOpen(true);
          }
        }}
        className={`group relative transition-transform duration-300 ${
          !isBuilderMode && post ? "cursor-pointer hover:-translate-y-1" : ""
        } ${wrapperClass}`}
      >
        {/* Top Comment Author Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar
              src={authorAvatarUrl}
              alt={authorName}
              size={34}
              className="rounded-full object-cover shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">{authorName}</p>
              {authorUsername && (
                <p className={`text-[10px] truncate ${isLight ? "text-stone-500" : "text-zinc-400"}`}>
                  @{authorUsername}
                </p>
              )}
            </div>
          </div>
          <MessageSquareQuote size={18} className="shrink-0 opacity-80" style={{ color: customAccent }} />
        </div>

        {/* Comment Content */}
        {commentText && (
          <p
            className={`text-xs sm:text-sm leading-relaxed break-words ${
              isLight ? "text-stone-800" : "text-zinc-100"
            }`}
          >
            “{commentText}”
          </p>
        )}

        {/* Comment Media if attached */}
        {commentMediaUrl && (
          <div className="mt-2.5 rounded-lg overflow-hidden max-h-40 bg-black/20">
            <img src={commentMediaUrl} alt="Comment media" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Curator Note */}
        {curatorNote && (
          <div
            className={`mt-3 pt-2 border-t text-[11px] italic flex items-start gap-1.5 ${
              isLight ? "border-stone-200 text-stone-600" : "border-white/10 text-zinc-300"
            }`}
          >
            <Sparkles size={12} className="shrink-0 mt-0.5" style={{ color: customAccent }} />
            <span>{curatorNote}</span>
          </div>
        )}

        {/* Footer */}
        <div
          className={`mt-3 pt-2.5 border-t flex items-center justify-between text-[11px] ${
            isLight ? "border-stone-200 text-stone-500" : "border-white/10 text-zinc-400"
          }`}
        >
          <span>{createdAt ? dayjs(createdAt).format("DD/MM/YYYY") : "Bình luận nổi bật"}</span>
          <div className="flex items-center gap-2.5">
            {likeCount > 0 && (
              <span className="flex items-center gap-1 text-rose-400">
                <Heart size={12} className="fill-rose-400" />
                {likeCount}
              </span>
            )}
            {post && <ExternalLink size={12} className="opacity-60 group-hover:opacity-100" />}
          </div>
        </div>
      </div>

      {isPostModalOpen && post && (
        <PostModal
          post={post}
          isOpen={isPostModalOpen}
          onClose={() => setIsPostModalOpen(false)}
          liked={post.liked}
          likeCount={post.likeCount || 0}
          onLikeToggle={() => onToggleLikePost?.(post)}
        />
      )}
    </>
  );
}
