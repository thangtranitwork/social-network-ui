"use client";

import { useState } from "react";
import { Heart, MessageCircle, Sparkles, Maximize2 } from "lucide-react";
import PostModal from "@/components/social-app-component/PostModal";
import dayjs from "dayjs";

export default function PostExhibitNode({
  node,
  post,
  isBuilderMode = false,
  customAccent = "#6366F1",
  onToggleLike,
}) {
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  if (!post) {
    return (
      <div className="w-64 p-5 rounded-2xl bg-zinc-900/70 border border-white/10 text-zinc-400 text-xs text-center backdrop-blur-md">
        Tác phẩm không còn khả dụng
      </div>
    );
  }

  const frameStyle = node?.frameStyle || "POLAROID";
  const curatorNote = node?.content?.curatorNote || "";
  const mediaList = post.media || post.files || [];
  const firstMedia = Array.isArray(mediaList) && mediaList.length > 0 ? mediaList[0] : null;
  const mediaUrl = typeof firstMedia === "string" ? firstMedia : firstMedia?.url || firstMedia?.fileUrl || "";
  const isVideo = mediaUrl && /\.(mp4|mov|webm)$/i.test(mediaUrl);

  const handleOpenPost = () => {
    if (isBuilderMode) return;
    setIsPostModalOpen(true);
  };

  // Frame styles
  const wrapperClass = {
    POLAROID:
      "bg-[#FAF8F5] text-stone-900 p-3.5 pb-5 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.38)] border border-stone-200/80 w-[280px] sm:w-[300px]",
    MUSEUM_FRAME:
      "bg-[#181615] text-stone-100 p-5 rounded-md shadow-[0_25px_60px_rgba(0,0,0,0.65)] border-[6px] border-[#38322C] w-[290px] sm:w-[310px]",
    FLOATING_GLASS:
      "bg-zinc-900/75 text-white p-4 rounded-2xl backdrop-blur-xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.45)] w-[290px] sm:w-[310px]",
    MANUSCRIPT:
      "bg-[#F5EFE6] text-stone-900 p-5 rounded-lg shadow-xl border-l-4 border-amber-700 w-[280px] sm:w-[300px] font-serif",
  }[frameStyle] || "bg-zinc-900/80 text-white p-4 rounded-2xl border border-white/15 w-[290px]";

  const isLightFrame = frameStyle === "POLAROID" || frameStyle === "MANUSCRIPT";

  return (
    <>
      <div
        onClick={handleOpenPost}
        className={`group relative transition-transform duration-300 ${
          !isBuilderMode ? "cursor-pointer hover:-translate-y-1" : ""
        } ${wrapperClass}`}
      >
        {/* Media Preview if present */}
        {mediaUrl && (
          <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-zinc-800 mb-3">
            {isVideo ? (
              <video src={mediaUrl} muted playsInline className="w-full h-full object-cover" />
            ) : (
              <img
                src={mediaUrl}
                alt="Exhibit"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            )}
            <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Maximize2 size={13} />
            </div>
          </div>
        )}

        {/* Post Content Excerpt */}
        {post.content && (
          <p
            className={`text-xs sm:text-sm leading-relaxed ${
              mediaUrl ? "line-clamp-3" : "line-clamp-6 text-sm sm:text-base font-medium py-2"
            } ${isLightFrame ? "text-stone-800" : "text-zinc-100"}`}
          >
            {post.content}
          </p>
        )}

        {/* Curator Note */}
        {curatorNote && (
          <div
            className={`mt-2.5 pt-2 border-t text-[11px] italic flex items-start gap-1.5 ${
              isLightFrame ? "border-stone-300/80 text-stone-600" : "border-white/10 text-zinc-300"
            }`}
          >
            <Sparkles size={12} className="shrink-0 mt-0.5" style={{ color: customAccent }} />
            <span>{curatorNote}</span>
          </div>
        )}

        {/* Footer Metadata & Quick Actions */}
        <div
          className={`mt-3 pt-2.5 border-t flex items-center justify-between text-xs ${
            isLightFrame ? "border-stone-200 text-stone-500" : "border-white/10 text-zinc-400"
          }`}
        >
          <span className="text-[11px]">
            {post.createdAt ? dayjs(post.createdAt).format("DD/MM/YYYY") : ""}
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!isBuilderMode && onToggleLike) {
                  onToggleLike(post);
                }
              }}
              className={`flex items-center gap-1 font-medium transition-colors ${
                post.liked ? "text-rose-500" : "hover:text-rose-400"
              }`}
            >
              <Heart size={14} className={post.liked ? "fill-rose-500 text-rose-500" : ""} />
              <span>{post.likeCount || 0}</span>
            </button>

            <div className="flex items-center gap-1">
              <MessageCircle size={14} />
              <span>{post.commentCount || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {isPostModalOpen && (
        <PostModal
          post={post}
          isOpen={isPostModalOpen}
          onClose={() => setIsPostModalOpen(false)}
          liked={post.liked}
          likeCount={post.likeCount || 0}
          onLikeToggle={() => onToggleLike?.(post)}
        />
      )}
    </>
  );
}
