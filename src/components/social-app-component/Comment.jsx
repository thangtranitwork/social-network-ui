import Image from "next/image";
import { useCallback, useState, memo } from "react";
import { Heart, MessageCircle, ChevronDown, ChevronUp, Edit, Check, X } from "lucide-react";
import Avatar from "../ui-components/Avatar";
import FilePreviewInChat from "../ui-components/FilePreviewInChat";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import toast from "react-hot-toast";
import { getUserId } from "@/utils/axios";
import { renderTextWithLinks } from "@/hooks/renderTextWithLinks";
import { useTranslations } from "next-intl";
import ConfirmModal from "../ui-components/ConfirmModal";
import useRepliesQuery from "@/hooks/useRepliesQuery";
import { uploadFile } from "@/utils/fileUpload";

dayjs.extend(relativeTime);

const isVideo = (url = "") => /\.(mp4|webm|ogg)$/i.test(url);

// Optimized Media Display Component
export const MediaDisplay = memo(({ url, alt, className = "" }) =>
    isVideo(url) ? (
        <video
            controls
            className={`rounded-lg max-h-60 w-full object-contain ${className}`}
            src={url}
        />
    ) : (
        <Image
            src={url}
            alt={alt}
            width={300}
            height={200}
            className={`rounded-lg max-h-60 w-auto object-contain ${className}`}
        />
    )
);

// Optimized Edit Form Component
export const EditCommentForm = memo(({ comment, onSave, onCancel, isReply = false }) => {
    const t = useTranslations("comment");
    const [editContent, setEditContent] = useState(comment.content);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!editContent.trim()) {
            toast.error(t("emptyError"));
            return;
        }

        setIsSubmitting(true);
        try {
            await onSave({ commentId: comment.id, newContent: editContent });
        } catch (error) {
            console.error("Error saving edit:", error);
        } finally {
            setIsSubmitting(false);
        }
    }, [editContent, comment.id, onSave, t]);

    return (
        <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2">
      <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className={`bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 outline-none focus:border-blue-500 resize-none ${
              isReply ? 'text-xs' : 'text-sm'
          }`}
          rows={3}
          autoFocus
          style={{ minHeight: '60px' }}
      />
            <div className="flex items-center gap-2 justify-end">
                <button
                    type="button"
                    onClick={onCancel}
                    className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex items-center gap-1"
                >
                    <X size={12} />
                    {t("cancel")}
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting || !editContent.trim()}
                    className="text-xs text-blue-500 font-semibold hover:opacity-80 disabled:opacity-50 flex items-center gap-1"
                >
                    <Check size={12} />
                    {isSubmitting ? t("saving") : t("save")}
                </button>
            </div>
        </form>
    );
});

// Optimized Comment Actions Component
export const CommentActions = memo(({
                                        comment, onLike, onReply, onToggleReplies, onEdit, showReplies,
                                        onDelete, canDeleteComment, canEditComment, isReply = false
                                    }) => {
    const t = useTranslations("comment");
    const handleLike = useCallback(() => onLike({ commentId: comment.id, wasLiked: comment.liked }), [comment.id, comment.liked, onLike]);
    const handleReply = useCallback(() => onReply(comment.id), [comment.id, onReply]);
    const handleToggleReplies = useCallback(() => onToggleReplies(), [onToggleReplies]);
    const handleEdit = useCallback(() => onEdit(comment.id), [comment.id, onEdit]);
    const handleDelete = useCallback(() => onDelete(comment.id), [comment.id, onDelete]);

    const iconSize = isReply ? 12 : 14;

    return (
        <div className={`flex items-center text-xs text-[var(--muted-foreground)] ${isReply ? 'gap-2' : 'gap-4'}`}>
            <button className="hover:underline flex items-center gap-1 transition-colors" onClick={handleLike}>
                <Heart
                    size={iconSize}
                    className={comment.liked ? "fill-red-500 text-red-500" : "hover:text-red-500"}
                />
                {comment.likeCount || 0}
            </button>

            {!isReply && (
                <>
                    <button className="hover:underline flex items-center gap-1" onClick={handleReply}>
                        <MessageCircle size={14} />
                        {t("reply")}
                    </button>

                    {(comment.replyCount || 0) > 0 && (
                        <button className="hover:underline flex items-center gap-1 text-blue-500" onClick={handleToggleReplies}>
                            {showReplies ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            {t("repliesCount", { count: comment.replyCount })}
                        </button>
                    )}
                </>
            )}

            {canEditComment && (
                <button className="hover:underline text-blue-500 flex items-center gap-1" onClick={handleEdit}>
                    <Edit size={iconSize} />
                    {t("edit")}
                </button>
            )}

            {canDeleteComment && (
                <button className="hover:underline text-red-500" onClick={handleDelete}>
                    {t("delete")}
                </button>
            )}
        </div>
    );
});

// Optimized Reply Form Component
export const ReplyForm = memo(({ commentId, authorName, onSubmit, onCancel, useForm }) => {
    const t = useTranslations("comment");
    
    const replyForm = useForm(async (content, file) => {
      let fileId = null;
      if (file) {
        fileId = await uploadFile(file);
      }
      await onSubmit({ content, fileId, originalCommentId: commentId });
    });

    return (
        <div className="mt-3 pl-4 border-l-2 border-[var(--border)]">
            {replyForm.file && (
                <div className="mb-2">
                    <FilePreviewInChat
                        selectedFile={replyForm.file}
                        filePreview={replyForm.previewUrl}
                        onCancel={replyForm.removeFile}
                    />
                </div>
            )}

            <form onSubmit={replyForm.submit} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        placeholder={t("replyPlaceholder", { name: authorName })}
                        value={replyForm.content}
                        onChange={(e) => replyForm.setContent(e.target.value)}
                        className="flex-1 bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                        autoFocus
                    />
                    <label className="text-xs text-blue-500 cursor-pointer hover:underline">
                        {t("addFile")}
                        <input type="file" accept="image/*,video/*" hidden onChange={replyForm.handleFileChange} />
                    </label>
                </div>

                <div className="flex items-center gap-2 justify-end">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    >
                        {t("cancel")}
                    </button>
                    <button
                        type="submit"
                        disabled={replyForm.isSubmitting || (!replyForm.content.trim() && !replyForm.file)}
                        className="text-xs text-blue-500 font-semibold hover:opacity-80 disabled:opacity-50"
                    >
                        {replyForm.isSubmitting ? t("replying") : t("reply")}
                    </button>
                </div>
            </form>
        </div>
    );
});

// Optimized Comment Item Component
const CommentItem = memo(({
                              comment, currentUserId, isOwnPost, onEdit, onDelete, onLike,
                              editingId, isReply = false, onSaveEdit, onCancelEdit
                          }) => {
    const isOwnComment = comment.author?.id === currentUserId;
    const canDelete = isOwnComment || isOwnPost;
    const canEdit = isOwnComment;
    const iconSize = isReply ? 24 : 32;
    const textSize = isReply ? 'text-xs' : 'text-sm';

    return (
        <div className="flex gap-2 text-sm">
            <Avatar
                src={comment.author?.profilePictureUrl}
                alt={comment.author?.username}
                size={iconSize}
            />
            <div className="flex-1 min-w-0">
                <div className="flex justify-between">
                    <p className={`font-semibold ${textSize}`}>
                        {comment.author?.givenName} {comment.author?.familyName}
                    </p>
                    <span className="text-xs text-[var(--muted-foreground)]">
            {dayjs(comment.createdAt).fromNow()}
          </span>
                </div>

                {editingId === comment.id ? (
                    <EditCommentForm
                        comment={comment}
                        onSave={onSaveEdit}
                        onCancel={onCancelEdit}
                        isReply={isReply}
                    />
                ) : (
                    <p className={`${textSize} mb-1 break-words w-full ${isReply ? 'overflow-hidden' : ''}`}>
                        {renderTextWithLinks(comment.content)}
                    </p>
                )}

                {comment.fileUrl && (
                    <div className="mb-1">
                        <MediaDisplay
                            url={comment.fileUrl}
                            alt="comment media"
                            className={isReply ? "max-h-40" : ""}
                        />
                    </div>
                )}

                <CommentActions
                    comment={comment}
                    onLike={onLike}
                    onReply={() => {}}
                    onToggleReplies={() => {}}
                    onEdit={onEdit}
                    showReplies={false}
                    onDelete={onDelete}
                    canDeleteComment={canDelete}
                    canEditComment={canEdit}
                    isReply={isReply}
                />
            </div>
        </div>
    );
});

// Main optimized Comment Component
export const Comment = memo(({
                                 comment, mutations, onReply, replyingTo, onCancelReply,
                                 isOwnPost, useForm
                             }) => {
    const t = useTranslations("comment");
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingReplyId, setEditingReplyId] = useState(null);
    const [showReplies, setShowReplies] = useState(false);

    // Confirm modal state
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        commentId: null,
    });

    const currentUserId = getUserId();
    
    // Use TanStack Query for replies
    const { data: replies, isLoading: isLoadingReplies } = useRepliesQuery(comment.id, showReplies);

    // Unified handlers
    const handlers = {
        editComment: useCallback((commentId) => {
            setEditingCommentId(commentId);
            setEditingReplyId(null);
        }, []),

        editReply: useCallback((replyId) => {
            setEditingReplyId(replyId);
            setEditingCommentId(null);
        }, []),

        saveEdit: useCallback(async ({ commentId, newContent }) => {
            await mutations.editComment({ commentId, newContent });
            setEditingCommentId(null);
            setEditingReplyId(null);
        }, [mutations.editComment]),

        cancelEdit: useCallback(() => {
            setEditingCommentId(null);
            setEditingReplyId(null);
        }, []),

        submitReply: useCallback(async (data) => {
            await mutations.addReply(data);
            onCancelReply();
        }, [mutations.addReply, onCancelReply]),

        deleteWithConfirm: useCallback((id) => {
            setConfirmConfig({ isOpen: true, commentId: id });
        }, [])
    };

    const executeDelete = useCallback(async () => {
        const commentId = confirmConfig.commentId;
        if (!commentId) return;
        await mutations.deleteComment({ commentId });
        setConfirmConfig({ isOpen: false, commentId: null });
    }, [mutations.deleteComment, confirmConfig.commentId]);

    return (
        <div className="flex gap-3 text-sm">
            <Avatar
                src={comment.author?.profilePictureUrl}
                alt={comment.author?.username}
                size={32}
            />
            <div className="flex-1">
                <div className="flex justify-between">
                    <p className="font-semibold">
                        {comment.author?.givenName} {comment.author?.familyName}
                    </p>
                    <span className="text-xs text-[var(--muted-foreground)]">
            {dayjs(comment.createdAt).fromNow()}
          </span>
                </div>

                {editingCommentId === comment.id ? (
                    <EditCommentForm
                        comment={comment}
                        onSave={handlers.saveEdit}
                        onCancel={handlers.cancelEdit}
                        isReply={false}
                    />
                ) : (
                    <div className="text-sm break-words w-full">
                        {renderTextWithLinks(comment.content)}
                    </div>
                )}

                {comment.fileUrl && (
                    <div className="mb-1">
                        <MediaDisplay url={comment.fileUrl} alt="comment media" />
                    </div>
                )}

                <CommentActions
                    comment={comment}
                    onLike={mutations.likeComment}
                    onReply={onReply}
                    onToggleReplies={() => setShowReplies(!showReplies)}
                    onEdit={handlers.editComment}
                    showReplies={showReplies}
                    onDelete={handlers.deleteWithConfirm}
                    canDeleteComment={comment.author?.id === currentUserId || isOwnPost}
                    canEditComment={comment.author?.id === currentUserId}
                    isReply={false}
                />

                {/* Replies Section */}
                {showReplies && (
                    <div className="mt-3 pl-4 border-l-2 border-[var(--border)]">
                        {isLoadingReplies ? (
                            <p className="text-xs text-[var(--muted-foreground)]">{t("loadingReplies")}</p>
                        ) : (
                            <div className="space-y-3">
                                {replies?.map((reply) => (
                                    <CommentItem
                                        key={reply.id}
                                        comment={reply}
                                        currentUserId={currentUserId}
                                        isOwnPost={isOwnPost}
                                        onEdit={handlers.editReply}
                                        onDelete={handlers.deleteWithConfirm}
                                        onLike={mutations.likeComment}
                                        editingId={editingReplyId}
                                        isReply={true}
                                        onSaveEdit={handlers.saveEdit}
                                        onCancelEdit={handlers.cancelEdit}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Reply Form */}
                {replyingTo === comment.id && (
                    <ReplyForm
                        commentId={comment.id}
                        authorName={comment.author?.givenName}
                        onSubmit={handlers.submitReply}
                        onCancel={onCancelReply}
                        useForm={useForm}
                    />
                )}

                <ConfirmModal
                    isOpen={confirmConfig.isOpen}
                    onClose={() => setConfirmConfig({ isOpen: false, commentId: null })}
                    onConfirm={executeDelete}
                    title={t("delete")}
                    message={t("deleteConfirm")}
                />
                </div>
                </div>
                );
                });