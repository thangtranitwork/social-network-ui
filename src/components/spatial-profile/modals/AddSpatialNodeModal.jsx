"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  MessageSquareQuote,
  Globe,
  Image as ImageIcon,
  Quote,
  Disc,
  Compass,
  MessageSquarePlus,
  Upload,
  Check,
} from "lucide-react";
import Modal from "@/components/ui-components/Modal";
import Avatar from "@/components/ui-components/Avatar";
import { uploadFile } from "@/utils/fileUpload";
import api from "@/utils/axios";
import { NOTE_COLORS } from "../spatialConstants";
import { normalizeEmbedUrl } from "../nodes/EmbedIframeNode";
import { formatFullName } from "@/utils/formatName";
import toast from "react-hot-toast";

const ARTIFACT_TYPES = [
  { id: "POST_CARD", labelKey: "nodePost", icon: FileText },
  { id: "COMMENT_CARD", labelKey: "nodeComment", icon: MessageSquareQuote },
  { id: "EMBED_IFRAME", labelKey: "nodeIframe", icon: Globe },
  { id: "MEDIA_FRAME", labelKey: "nodeMedia", icon: ImageIcon },
  { id: "TEXT_NOTE", labelKey: "nodeNote", icon: Quote },
  { id: "AUDIO_VINYL", labelKey: "nodeVinyl", icon: Disc },
  { id: "PORTAL_LINK", labelKey: "nodePortal", icon: Compass },
  { id: "GUESTBOOK_WALL", labelKey: "nodeGuestbook", icon: MessageSquarePlus },
];

export default function AddSpatialNodeModal({
  isOpen,
  onClose,
  onAddNodes,
  posts = [],
  files = [],
  username,
  customAccent = "#6366F1",
  tSpace,
}) {
  const [selectedType, setSelectedType] = useState("POST_CARD");

  // Multi-select posts for POST_CARD
  const [selectedPostIds, setSelectedPostIds] = useState([]);
  const [curatorNote, setCuratorNote] = useState("");

  // Comment selector for COMMENT_CARD
  const [postForCommentId, setPostForCommentId] = useState("");
  const [commentsList, setCommentsList] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [selectedComments, setSelectedComments] = useState([]);
  const [commentCuratorNote, setCommentCuratorNote] = useState("");

  // Iframe embed for EMBED_IFRAME
  const [iframeRawInput, setIframeRawInput] = useState("");
  const [iframeTitle, setIframeTitle] = useState("");

  // Media frame
  const [selectedMediaUrl, setSelectedMediaUrl] = useState("");
  const [mediaCaption, setMediaCaption] = useState("");

  // Text note
  const [noteText, setNoteText] = useState("");
  const [noteColor, setNoteColor] = useState("AMBER");

  // Vinyl audio
  const [vinylTitle, setVinylTitle] = useState("");
  const [vinylAudioUrl, setVinylAudioUrl] = useState("");

  // Friend portal
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [portalLabel, setPortalLabel] = useState("");

  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (posts.length > 0 && !postForCommentId) {
      setPostForCommentId(posts[0].id);
    }
    if (files.length > 0 && !selectedMediaUrl) {
      setSelectedMediaUrl(files[0]);
    }
  }, [posts, files, postForCommentId, selectedMediaUrl]);

  // Fetch comments when owner selects a post in COMMENT_CARD tab
  useEffect(() => {
    if (!isOpen || selectedType !== "COMMENT_CARD" || !postForCommentId) return;
    let active = true;
    setIsLoadingComments(true);
    setSelectedComments([]);

    api
      .get(`/v1/comments/of-post/${postForCommentId}`, { params: { type: "RELEVANT" } })
      .then((res) => {
        if (!active) return;
        const list = res.data?.body || [];
        setCommentsList(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (active) setCommentsList([]);
      })
      .finally(() => {
        if (active) setIsLoadingComments(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, selectedType, postForCommentId]);

  // Fetch friends when owner opens PORTAL_LINK tab
  useEffect(() => {
    if (isOpen && selectedType === "PORTAL_LINK" && username && friends.length === 0) {
      api
        .get(`/v1/friends/${username}`)
        .then((res) => {
          if (res.data?.code === 200 && Array.isArray(res.data.body)) {
            setFriends(res.data.body);
            if (res.data.body.length > 0) {
              setSelectedFriend(res.data.body[0]);
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen, selectedType, username, friends.length]);

  const togglePostSelection = (postId) => {
    setSelectedPostIds((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
  };

  const toggleCommentSelection = (commentObj) => {
    setSelectedComments((prev) => {
      const exists = prev.some((c) => c.id === commentObj.id);
      if (exists) {
        return prev.filter((c) => c.id !== commentObj.id);
      }
      return [...prev, commentObj];
    });
  };

  const handleFileUpload = async (e, targetType) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const fileId = await uploadFile(file);
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:11111";
      const fullUrl = `${apiBase}/v1/files/${fileId}`;
      if (targetType === "MEDIA") {
        setSelectedMediaUrl(fullUrl);
      } else {
        setVinylAudioUrl(fullUrl);
      }
      toast.success("Đã tải tệp lên");
    } catch {
      toast.error("Không thể tải tệp lên");
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirm = () => {
    const baseTime = Date.now().toString(36);
    const createdNodes = [];

    const randomCoord = (idx = 0) => ({
      x: Math.round((Math.random() - 0.5) * 420 + idx * 60),
      y: Math.round((Math.random() - 0.5) * 320 + idx * 40),
    });

    if (selectedType === "POST_CARD") {
      if (selectedPostIds.length === 0) {
        toast.error(tSpace("selectPost"));
        return;
      }
      const postFrames = ["POLAROID", "MUSEUM_FRAME", "FLOATING_GLASS", "MANUSCRIPT"];
      selectedPostIds.forEach((pid, idx) => {
        const pos = randomCoord(idx);
        createdNodes.push({
          id: `node_post_${pid}_${baseTime}_${idx}`,
          type: "POST_CARD",
          x: pos.x,
          y: pos.y,
          scale: 1.0,
          rotation: ((idx % 3) - 1) * 2,
          zIndex: 40 + idx,
          frameStyle: postFrames[idx % postFrames.length],
          content: {
            postId: pid,
            curatorNote: curatorNote.trim(),
          },
        });
      });
    } else if (selectedType === "COMMENT_CARD") {
      if (selectedComments.length === 0) {
        toast.error(tSpace("selectCommentToPin"));
        return;
      }
      const commentFrames = ["QUOTE_CARD", "GLASS_BUBBLE", "MUSEUM_PLAQUE"];
      selectedComments.forEach((cmt, idx) => {
        const pos = randomCoord(idx);
        const author = cmt.author || {};
        const authorFullName =
          formatFullName(author) || author.username || "Người dùng";
        const mediaUrl = cmt.fileUrl || (Array.isArray(cmt.files) ? cmt.files[0] : "") || "";

        createdNodes.push({
          id: `node_comment_${cmt.id}_${baseTime}_${idx}`,
          type: "COMMENT_CARD",
          x: pos.x,
          y: pos.y,
          scale: 1.0,
          rotation: ((idx % 3) - 1) * 2,
          zIndex: 40 + idx,
          frameStyle: commentFrames[idx % commentFrames.length],
          content: {
            postId: postForCommentId,
            commentId: cmt.id,
            commentText: cmt.content || "",
            authorName: authorFullName,
            authorUsername: author.username || "",
            authorAvatarUrl: author.profilePictureUrl || "",
            commentMediaUrl: mediaUrl,
            likeCount: cmt.likeCount || 0,
            createdAt: cmt.createdAt || "",
            curatorNote: commentCuratorNote.trim(),
          },
        });
      });
    } else if (selectedType === "EMBED_IFRAME") {
      const normalized = normalizeEmbedUrl(iframeRawInput);
      if (!normalized) {
        toast.error("Đường dẫn hoặc mã Iframe không hợp lệ");
        return;
      }
      const pos = randomCoord(0);
      createdNodes.push({
        id: `node_iframe_${baseTime}`,
        type: "EMBED_IFRAME",
        x: pos.x,
        y: pos.y,
        scale: 1.0,
        rotation: 0,
        zIndex: 45,
        frameStyle: "BROWSER_WINDOW",
        content: {
          embedUrl: normalized,
          title: iframeTitle.trim(),
        },
      });
    } else if (selectedType === "MEDIA_FRAME") {
      if (!selectedMediaUrl) return;
      const pos = randomCoord(0);
      createdNodes.push({
        id: `node_media_${baseTime}`,
        type: "MEDIA_FRAME",
        x: pos.x,
        y: pos.y,
        scale: 1.0,
        rotation: 2,
        zIndex: 40,
        frameStyle: "GALLERY_MATTE",
        content: {
          fileUrl: selectedMediaUrl,
          caption: mediaCaption.trim(),
        },
      });
    } else if (selectedType === "TEXT_NOTE") {
      if (!noteText.trim()) return;
      const pos = randomCoord(0);
      createdNodes.push({
        id: `node_note_${baseTime}`,
        type: "TEXT_NOTE",
        x: pos.x,
        y: pos.y,
        scale: 1.0,
        rotation: 0,
        zIndex: 40,
        frameStyle: "SERIF_EDITORIAL",
        content: {
          text: noteText.trim(),
          color: noteColor,
        },
      });
    } else if (selectedType === "AUDIO_VINYL") {
      const pos = randomCoord(0);
      createdNodes.push({
        id: `node_vinyl_${baseTime}`,
        type: "AUDIO_VINYL",
        x: pos.x,
        y: pos.y,
        scale: 1.0,
        rotation: 0,
        zIndex: 40,
        frameStyle: "CLASSIC_VINYL",
        content: {
          title: vinylTitle.trim() || tSpace("vinylDefaultTitle"),
          audioUrl: vinylAudioUrl,
        },
      });
    } else if (selectedType === "PORTAL_LINK") {
      if (!selectedFriend) return;
      const pos = randomCoord(0);
      const friendName =
        [selectedFriend.familyName, selectedFriend.givenName].filter(Boolean).join(" ") ||
        selectedFriend.username;
      createdNodes.push({
        id: `node_portal_${baseTime}`,
        type: "PORTAL_LINK",
        x: pos.x,
        y: pos.y,
        scale: 1.0,
        rotation: 0,
        zIndex: 40,
        frameStyle: "STAR_PORTAL",
        content: {
          username: selectedFriend.username,
          displayName: friendName,
          avatarUrl: selectedFriend.profilePictureUrl || "",
          label: portalLabel.trim(),
        },
      });
    } else if (selectedType === "GUESTBOOK_WALL") {
      const pos = randomCoord(0);
      createdNodes.push({
        id: "node_guestbook_main",
        type: "GUESTBOOK_WALL",
        x: pos.x,
        y: pos.y,
        scale: 1.0,
        rotation: 0,
        zIndex: 40,
        frameStyle: "GLASS",
        content: {
          title: tSpace("guestbookTitle"),
        },
      });
    }

    if (createdNodes.length > 0) {
      onAddNodes(createdNodes);
      setSelectedPostIds([]);
      setSelectedComments([]);
      setIframeRawInput("");
      setIframeTitle("");
      setCuratorNote("");
      setCommentCuratorNote("");
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="medium">
      <div className="p-6 text-[var(--foreground)]">
        <h2 className="text-lg font-bold mb-4">{tSpace("addNode")}</h2>

        {/* Artifact Type Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
          {ARTIFACT_TYPES.map((item) => {
            const Icon = item.icon;
            const active = selectedType === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedType(item.id)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all text-left ${
                  active
                    ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                    : "border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]"
                }`}
              >
                <Icon size={15} className="shrink-0" />
                <span className="truncate">{tSpace(item.labelKey)}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body by Type */}
        <div className="space-y-4">
          {selectedType === "POST_CARD" && (
            <>
              <div>
                <label className="block text-xs font-semibold mb-2">
                  {tSpace("selectPost")}
                </label>
                <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                  {posts.length > 0 ? (
                    posts.map((p) => {
                      const isChecked = selectedPostIds.includes(p.id);
                      const firstMedia = p.media?.[0] || p.files?.[0];
                      const thumbUrl =
                        typeof firstMedia === "string"
                          ? firstMedia
                          : firstMedia?.url || firstMedia?.fileUrl || "";

                      return (
                        <div
                          key={p.id}
                          onClick={() => togglePostSelection(p.id)}
                          className={`p-3 rounded-xl border cursor-pointer text-xs flex items-center justify-between gap-3 transition-colors ${
                            isChecked
                              ? "border-indigo-500 bg-indigo-500/10"
                              : "border-[var(--border)] hover:bg-[var(--muted)]"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {thumbUrl && (
                              <img
                                src={thumbUrl}
                                alt=""
                                className="w-10 h-10 rounded-lg object-cover shrink-0 bg-zinc-800"
                              />
                            )}
                            <span className="line-clamp-2 flex-1">
                              {p.content || "Bài viết hình ảnh / video"}
                            </span>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                              isChecked
                                ? "bg-indigo-500 border-indigo-500 text-white"
                                : "border-zinc-500"
                            }`}
                          >
                            {isChecked && <Check size={13} />}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-[var(--muted-foreground)] py-4 text-center">
                      Chưa có bài viết nào để chọn
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">{tSpace("curatorNote")}</label>
                <input
                  type="text"
                  maxLength={120}
                  value={curatorNote}
                  onChange={(e) => setCuratorNote(e.target.value)}
                  placeholder={tSpace("curatorNotePlaceholder")}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs"
                />
              </div>
            </>
          )}

          {selectedType === "COMMENT_CARD" && (
            <>
              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  {tSpace("selectPostForComment")}
                </label>
                <select
                  value={postForCommentId}
                  onChange={(e) => setPostForCommentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs"
                >
                  {posts.map((p, idx) => (
                    <option key={p.id} value={p.id}>
                      {p.content
                        ? p.content.slice(0, 70)
                        : `Bài viết #${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2">
                  {tSpace("selectCommentToPin")}
                </label>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {isLoadingComments ? (
                    <div className="py-6 text-center text-xs text-[var(--muted-foreground)]">
                      Đang tải bình luận...
                    </div>
                  ) : commentsList.length > 0 ? (
                    commentsList.map((cmt) => {
                      const isChecked = selectedComments.some((c) => c.id === cmt.id);
                      const authorName =
                        formatFullName(cmt.author) || cmt.author?.username || "Người dùng";
                      return (
                        <div
                          key={cmt.id}
                          onClick={() => toggleCommentSelection(cmt)}
                          className={`p-3 rounded-xl border cursor-pointer text-xs flex items-center justify-between gap-3 transition-colors ${
                            isChecked
                              ? "border-indigo-500 bg-indigo-500/10"
                              : "border-[var(--border)] hover:bg-[var(--muted)]"
                          }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            <Avatar
                              src={cmt.author?.profilePictureUrl}
                              alt={authorName}
                              size={28}
                              className="rounded-full object-cover shrink-0 mt-0.5"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="font-bold truncate">{authorName}</p>
                              <p className="text-[var(--muted-foreground)] line-clamp-2 mt-0.5">
                                {cmt.content || "Bình luận đính kèm phương tiện"}
                              </p>
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                              isChecked
                                ? "bg-indigo-500 border-indigo-500 text-white"
                                : "border-zinc-500"
                            }`}
                          >
                            {isChecked && <Check size={13} />}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-6 text-center text-xs text-[var(--muted-foreground)] border border-dashed border-[var(--border)] rounded-xl">
                      {tSpace("noCommentsInPost")}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">{tSpace("curatorNote")}</label>
                <input
                  type="text"
                  maxLength={120}
                  value={commentCuratorNote}
                  onChange={(e) => setCommentCuratorNote(e.target.value)}
                  placeholder={tSpace("curatorNotePlaceholder")}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs"
                />
              </div>
            </>
          )}

          {selectedType === "EMBED_IFRAME" && (
            <>
              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  {tSpace("iframeUrlLabel")}
                </label>
                <textarea
                  rows={3}
                  value={iframeRawInput}
                  onChange={(e) => setIframeRawInput(e.target.value)}
                  placeholder={tSpace("iframeUrlPlaceholder")}
                  className="w-full p-3.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs font-mono"
                />
              </div>
              <div>
                <input
                  type="text"
                  maxLength={80}
                  value={iframeTitle}
                  onChange={(e) => setIframeTitle(e.target.value)}
                  placeholder={tSpace("iframeTitlePlaceholder")}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs"
                />
              </div>
            </>
          )}

          {selectedType === "MEDIA_FRAME" && (
            <>
              <div>
                <label className="block text-xs font-semibold mb-2">{tSpace("uploadMedia")}</label>
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-xs font-semibold cursor-pointer">
                  <Upload size={14} />
                  <span>{isUploading ? "..." : tSpace("uploadMedia")}</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => handleFileUpload(e, "MEDIA")}
                    className="hidden"
                  />
                </label>

                {files.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-3 max-h-40 overflow-y-auto p-1">
                    {files.map((url, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedMediaUrl(url)}
                        className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 ${
                          selectedMediaUrl === url ? "border-indigo-500" : "border-transparent"
                        }`}
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">{tSpace("curatorNote")}</label>
                <input
                  type="text"
                  maxLength={100}
                  value={mediaCaption}
                  onChange={(e) => setMediaCaption(e.target.value)}
                  placeholder={tSpace("curatorNotePlaceholder")}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs"
                />
              </div>
            </>
          )}

          {selectedType === "TEXT_NOTE" && (
            <>
              <textarea
                rows={3}
                maxLength={240}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder={tSpace("noteTextPlaceholder")}
                className="w-full p-3.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs"
              />
              <div className="flex items-center gap-2">
                {Object.keys(NOTE_COLORS).map((cKey) => (
                  <button
                    key={cKey}
                    type="button"
                    onClick={() => setNoteColor(cKey)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      noteColor === cKey ? "scale-125 ring-2 ring-indigo-500" : ""
                    }`}
                    style={{ background: NOTE_COLORS[cKey].dot }}
                  />
                ))}
              </div>
            </>
          )}

          {selectedType === "AUDIO_VINYL" && (
            <>
              <input
                type="text"
                maxLength={80}
                value={vinylTitle}
                onChange={(e) => setVinylTitle(e.target.value)}
                placeholder={tSpace("vinylTitlePlaceholder")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs"
              />
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-xs font-semibold cursor-pointer">
                <Upload size={14} />
                <span>{isUploading ? "..." : tSpace("uploadAudio")}</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => handleFileUpload(e, "AUDIO")}
                  className="hidden"
                />
              </label>
            </>
          )}

          {selectedType === "PORTAL_LINK" && (
            <>
              <div>
                <label className="block text-xs font-semibold mb-2">{tSpace("selectFriend")}</label>
                <div className="max-h-44 overflow-y-auto space-y-1.5">
                  {friends.map((f) => (
                    <div
                      key={f.id || f.username}
                      onClick={() => setSelectedFriend(f)}
                      className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2.5 text-xs ${
                        selectedFriend?.username === f.username
                          ? "border-indigo-500 bg-indigo-500/10"
                          : "border-[var(--border)] hover:bg-[var(--muted)]"
                      }`}
                    >
                      <Avatar src={f.profilePictureUrl} alt={f.username} size={28} className="rounded-full" />
                      <span className="font-semibold">@{f.username}</span>
                    </div>
                  ))}
                </div>
              </div>
              <input
                type="text"
                maxLength={60}
                value={portalLabel}
                onChange={(e) => setPortalLabel(e.target.value)}
                placeholder={tSpace("portalLabelPlaceholder")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs"
              />
            </>
          )}
        </div>

        {/* Submit Button */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md hover:opacity-95 transition-opacity"
            style={{ background: customAccent }}
          >
            {tSpace("addConfirm")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
