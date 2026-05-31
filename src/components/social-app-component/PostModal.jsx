"use client";

import { useState, useCallback, useMemo, useRef  } from "react";
import { Heart, MessageCircle, SendHorizonal, ChevronDown } from "lucide-react";
import Avatar from "../ui-components/Avatar";
import Modal from "../ui-components/Modal";
import FilePreviewInChat from "../ui-components/FilePreviewInChat";
import MediaCarousel from "../ui-components/MediaCarousel";
import { Comment } from "./Comment";
import { useRouter } from "next/navigation";
import { useForm } from "@/hooks/useComment";
import { uploadFile } from "@/utils/fileUpload";
import {renderTextWithLinks} from "@/hooks/renderTextWithLinks";
import SharePostModal from "@/components/social-app-component/SharePostModal";
import useCommentsQuery from "@/hooks/useCommentsQuery";
import useCommentMutation from "@/hooks/useCommentMutation";

import { useTranslations, useFormatter } from "next-intl";

// Comment filter options
const getCommentFilterOptions = (t) => [
  { value: 'RELEVANT', label: t('filter.relevant') },
  { value: 'FRIEND_ONLY', label: t('filter.friends') },
  { value: 'TIME', label: t('filter.newest') }
];

// Main Post Modal Component
export default function PostModal({
                                    post,
                                    liked,
                                    likeCount,
                                    activeIndex = 0,
                                    isOwnPost,
                                    isAdmin,
                                    onClose,
                                    onLikeToggle,
                                    onCommentSubmit,
                                  }) {
  const t = useTranslations("post");
  const tComment = useTranslations("comment");
  const tCommon = useTranslations("common");
  const format = useFormatter();

  // Add error handling for missing or invalid post
  if (!post || !post.id) {
    return (
        <Modal isOpen={true} onClose={onClose} size="small">
          <div className="flex flex-col items-center justify-center h-[400px] bg-[var(--card)] text-[var(--card-foreground)] rounded-xl p-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-[var(--muted)] rounded-full flex items-center justify-center">
                <MessageCircle className="h-8 w-8 text-[var(--muted-foreground)]" />
              </div>
              <h3 className="text-lg font-semibold">{t("unavailable")}</h3>
              <p className="text-sm text-[var(--muted-foreground)] max-w-sm">
                {t("originalDeleted")}
              </p>
              <button
                  onClick={onClose}
                  className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm hover:opacity-90 transition-opacity"
              >
                {tCommon("close")}
              </button>
            </div>
          </div>
        </Modal>
    );
  }

  // Determine what content and media to display
  const isSharedPost = post?.sharedPost;
  const displayPost = isSharedPost ? post.originalPost : post;
  const router = useRouter();
  const inputRef = useRef(null);

  // Handle media from both regular posts and shared posts
  let media = [];
  if (isSharedPost && post.originalPost) {
    media = post.originalPost.files || post.originalPost.images || [];
  } else if (!isSharedPost) {
    media = post?.files || post?.images || [];
  }
  // For shared posts without originalPost, media will be empty array
  const hasMedia = Array.isArray(media) && media.length > 0;

  const [page, setPage] = useState({ index: activeIndex, direction: 0 });
  const [replyingTo, setReplyingTo] = useState(null);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [isSharedContentExpanded, setIsSharedContentExpanded] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [commentFilter, setCommentFilter] = useState('RELEVANT'); // New state for comment filter
  const [showFilterDropdown, setShowFilterDropdown] = useState(false); // New state for dropdown visibility

  // TanStack Query for comments
  const { data: comments = [], isLoading: loadingComments } = useCommentsQuery(post.id, commentFilter, isAdmin);
  
  // Comment Mutations
  const mutations = useCommentMutation(post.id, commentFilter);

  const handleProfileClick = (e, post) => {
    e.stopPropagation();
    if (post?.author?.username) {
      router.push(`/profile/${post.author.username}`);
    }
  };

  // Function to check if content should be truncated
  const shouldTruncateContent = (content, maxLength = 200) => {
    return content && content.length > maxLength;
  };

  // Function to get truncated content
  const getTruncatedContent = (content, maxLength = 200) => {
    if (!content) return '';
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  // Handle comment filter change
  const handleCommentFilterChange = useCallback((filterValue) => {
    setCommentFilter(filterValue);
    setShowFilterDropdown(false);
  }, []);

  // ✅ Handle main comment submission
  const handleMainCommentSubmit = useCallback(async (content, file) => {
    let fileId = null;
    if (file) {
      fileId = await uploadFile(file);
    }

    const newComment = await mutations.addComment({ content, fileId });
    
    // Call the parent callback if provided (for comment count sync if needed)
    if (onCommentSubmit) onCommentSubmit(newComment);
  }, [mutations.addComment, onCommentSubmit]);

  const mainCommentForm = useForm(handleMainCommentSubmit);

  // ✅ Handle reply actions
  const handleReply = useCallback((commentId) => {
    setReplyingTo(commentId);
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  // Get current filter label
  const currentFilterLabel = useMemo(() => {
    const options = getCommentFilterOptions(tComment);
    const option = options.find(opt => opt.value === commentFilter);
    return option ? option.label : tComment('filter.relevant');
  }, [commentFilter, tComment]);

  // Memoized components to prevent unnecessary re-renders
  const PostHeader = useMemo(() => (
      <div className="flex flex-col gap-3 p-4 border-b border-[var(--border)]">
        {/* Show the person who shared the post first (if it's a shared post) */}
        {isSharedPost && (
            <>
              <div className="flex items-center gap-3" onClick={(e) => handleProfileClick(e, post)}>
                <Avatar
                    src={post.author?.profilePictureUrl}
                    alt={post.author?.username}
                />
                <div>
                  <p className="font-semibold text-sm">
                    {post.author?.givenName} {post.author?.familyName}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {t("shared")} • {format.dateTime(new Date(post.createdAt), 'short')}
                  </p>
                </div>
              </div>

              {/* Show shared post content if exists */}
              {post.content && (
                  <div className="ml-12">
                    <div className="text-sm break-words whitespace-pre-wrap">
                      {shouldTruncateContent(post.content) && !isSharedContentExpanded ? (
                          <>
                            {renderTextWithLinks(getTruncatedContent(post.content))}
                            <button
                                onClick={() => setIsSharedContentExpanded(true)}
                                className="text-blue-500 hover:text-blue-700 ml-2 text-sm"
                            >
                              {t("seeMore")}
                            </button>
                          </>
                      ) : (
                          <>
                            {renderTextWithLinks(post.content)}
                            {shouldTruncateContent(post.content) && (
                                <button
                                    onClick={() => setIsSharedContentExpanded(false)}
                                    className="text-blue-500 hover:text-blue-700 ml-2 text-sm"
                                >
                                  {t("collapse")}
                                </button>
                            )}
                          </>
                      )}
                    </div>
                  </div>
              )}
            </>
        )}

        {/* Original post in a rounded container */}
        <div className={`${isSharedPost ? 'p-4 border border-[var(--border)] rounded-lg bg-[var(--muted)]/20' : ''}`}>
          {isSharedPost && post.originalPostCanView === false ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-3">
                <div className="w-12 h-12 bg-[var(--muted)] rounded-full flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-[var(--muted-foreground)]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-[var(--muted-foreground)]">
                    {t("unavailable")}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    {t("originalDeleted")}
                  </p>
                </div>
              </div>
          ) : (
              <>
                {/* Original post author */}
                <div className="flex items-center gap-3 mb-3" onClick={(e) => handleProfileClick(e, displayPost)}>
                  <Avatar
                      src={displayPost?.author?.profilePictureUrl}
                      alt={displayPost?.author?.username}
                  />
                  <div>
                    <p className="font-semibold text-sm">
                      {displayPost?.author?.givenName} {displayPost?.author?.familyName}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {displayPost?.createdAt ? format.dateTime(new Date(displayPost.createdAt), 'short') : ''}
                    </p>
                  </div>
                </div>

                {/* Original post content */}
                {displayPost?.content && (
                    <div className="text-sm break-words whitespace-pre-wrap">
                      {shouldTruncateContent(displayPost.content) && !isContentExpanded ? (
                          <>
                            {renderTextWithLinks(getTruncatedContent(displayPost.content))}
                            <button
                                onClick={() => setIsContentExpanded(true)}
                                className="text-blue-500 hover:text-blue-700 ml-2 text-sm"
                            >
                              {t("seeMore")}
                            </button>
                          </>
                      ) : (
                          <>
                            {renderTextWithLinks(displayPost.content)}
                            {shouldTruncateContent(displayPost.content) && (
                                <button
                                    onClick={() => setIsContentExpanded(false)}
                                    className="text-blue-500 hover:text-blue-700 ml-2 text-sm"
                                >
                                  {t("collapse")}
                                </button>
                            )}
                          </>
                      )}
                    </div>
                )}
              </>
          )}
        </div>
      </div>
  ), [post, displayPost, isSharedPost, isContentExpanded, isSharedContentExpanded, handleProfileClick, renderTextWithLinks]);

  const PostActions = useMemo(() => (
      !isAdmin && (
      <div className="border-b border-[var(--border)]">
        <div className="flex gap-4 text-[var(--muted-foreground)] items-center p-3">
          <button onClick={onLikeToggle}>
            <Heart
                className={`h-5 w-5 ${
                    liked ? "fill-red-500 text-red-500" : ""
                }`}
            />
          </button>
          <button onClick={()=>{    inputRef.current?.focus();
          }}>
            <MessageCircle className="h-5 w-5" />
          </button>
          <button onClick={()=>setShowShareModal(true)}
          >
            <SendHorizonal className="h-5 w-5" />
          </button>
        </div>
        <p className="text-xs px-4 pb-2">{t("likes", { count: likeCount })}</p>
      </div>
      )
  ), [liked, likeCount, onLikeToggle, isAdmin, t]);

  // ✅ Memoized comments section with filter dropdown
  const CommentsSection = useMemo(() => (
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">{t("comment")} ({comments.length})</p>

          {/* Comment Filter Dropdown */}
          <div className="relative">
            <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[var(--muted)] hover:bg-[var(--muted)]/80 rounded-lg transition-colors"
            >
              <span>{currentFilterLabel}</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showFilterDropdown && (
                <div className="absolute right-0 top-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg py-1 min-w-[140px] z-10">
                  {getCommentFilterOptions(tComment).map((option) => (
                      <button
                          key={option.value}
                          onClick={() => handleCommentFilterChange(option.value)}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-[var(--muted)] transition-colors ${
                              commentFilter === option.value ? 'bg-[var(--muted)] font-medium' : ''
                          }`}
                      >
                        {option.label}
                      </button>
                  ))}
                </div>
            )}
          </div>
        </div>

        {loadingComments ? (
            <div className="flex items-center justify-center py-4">
              <p className="text-xs text-[var(--muted-foreground)]">{tComment("loadingComments")}</p>
            </div>
        ) : comments.length === 0 ? (
            <p className="text-xs text-[var(--muted-foreground)]">{tComment("noComments")}</p>
        ) : (
            <div className="space-y-4 mb-4">
              {comments.map((comment) => (
                  <Comment
                      key={comment.id}
                      comment={comment}
                      mutations={mutations}
                      onReply={handleReply}
                      replyingTo={replyingTo}
                      onCancelReply={handleCancelReply}
                      isOwnPost={isOwnPost}
                      useForm={useForm}
                  />
              ))}
            </div>
        )}
      </div>
  ), [
    loadingComments,
    comments,
    mutations,
    handleReply,
    replyingTo,
    handleCancelReply,
    isOwnPost,
    currentFilterLabel,
    showFilterDropdown,
    commentFilter,
    handleCommentFilterChange,
    t,
    tComment
  ]);

  // ✅ Memoized comment input
  const CommentInput = useMemo(() => (
      !isAdmin &&
      <div  className="flex-shrink-0 bg-[var(--card)] border-t border-[var(--border)]">
        {mainCommentForm.file && (
            <div className="p-4">
              <FilePreviewInChat
                  selectedFile={mainCommentForm.file}
                  filePreview={mainCommentForm.previewUrl}
                  onCancel={mainCommentForm.removeFile}
              />
            </div>
        )}

        <form
            onSubmit={mainCommentForm.submit}
            className="flex items-center gap-2 p-4"
        >
          <input
              ref={inputRef}
              type="text"
              placeholder={tComment("placeholder")}
              value={mainCommentForm.content}
              onChange={(e) => mainCommentForm.setContent(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm p-2"
          />
          <label className="text-sm text-blue-500 cursor-pointer hover:underline">
            {tComment("addPhoto")}
            <input
                type="file"
                accept="image/*,video/*"
                hidden
                onChange={mainCommentForm.handleFileChange}
            />
          </label>
          <button
              type="submit"
              disabled={
                  mainCommentForm.isSubmitting ||
                  (!mainCommentForm.content.trim() && !mainCommentForm.file)
              }
              className="text-blue-500 text-sm font-semibold hover:opacity-80 disabled:opacity-50"
          >
            {mainCommentForm.isSubmitting ? tComment("sending") : tComment("send")}
          </button>
        </form>
      </div>
  ), [mainCommentForm, isAdmin, tComment]);

  return (
      <Modal
          isOpen={true}
          onClose={onClose}
          size={hasMedia ? undefined : "small"}
      >
        <div
            className={`flex flex-col w-full ${
                hasMedia ? "md:flex-row h-[90vh]" : "h-[80vh]"
            } bg-[var(--card)] text-[var(--card-foreground)] rounded-xl overflow-hidden`}
        >
          {/* Layout for posts without media */}
          {!hasMedia && (
              <div className="flex flex-col w-full h-full">
                <div className="flex-1 overflow-y-auto">
                  {PostHeader}
                  {PostActions}
                  {CommentsSection}
                </div>
                {CommentInput}
              </div>
          )}

          {/* Layout for posts with media */}
          {hasMedia && (
              <>
                {/* Mobile Layout */}
                <div className="flex flex-col md:hidden w-full h-full">
                  <div className="flex-1 overflow-y-auto">
                    {PostHeader}
                    <MediaCarousel media={media} page={page} setPage={setPage} />
                    {PostActions}
                    {CommentsSection}
                  </div>
                  {CommentInput}
                </div>

                {/* Desktop Layout */}
                <div className="hidden md:flex md:w-3/5 md:h-full">
                  <MediaCarousel media={media} page={page} setPage={setPage} />
                </div>

                <div className="hidden md:flex md:flex-col md:w-2/5 md:h-full md:border-l md:border-[var(--border)]">
                  <div className="flex-1 overflow-y-auto">
                    {PostHeader}
                    {PostActions}
                    {CommentsSection}
                  </div>
                  {CommentInput}
                </div>
              </>
          )}
          <SharePostModal
              isOpen={showShareModal}
              onClose={() => setShowShareModal(false)}
              post={post}
          />
        </div>
      </Modal>
  );
}