"use client"

import { renderTextWithLinks } from "@/hooks/renderTextWithLinks"
import adminApi from "@/utils/adminInterception"
import api, { getUserId } from "@/utils/axios"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { Globe, Heart, Lock, MessageCircle, MoreVertical, SendHorizonal, Share2, Users, Pencil, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { lazy, memo, Suspense, useCallback, useEffect, useState, useMemo } from "react"
import toast from "react-hot-toast"
import { useShallow } from 'zustand/react/shallow';
import Avatar from "../ui-components/Avatar";
import Card from "../ui-components/Card";
import ImageView from "../ui-components/ImageView";
import useAppStore, { selectSortedChatList } from "@/store/ZustandStore";
import { useTranslations } from "next-intl";
import ConfirmModal from "../ui-components/ConfirmModal"

// Dynamic imports for heavy components
const PostModal = lazy(() => import("./PostModal"))
const EditPostModal = lazy(() => import("./EditPostModal"))
const SharePostModal = lazy(() => import("./SharePostModal"))
const ShareToChatModal = lazy(() => import("./ShareToChatModal"))

dayjs.extend(relativeTime)

const PostCard = memo(function PostCard({
    post,
    liked,
    onLikeToggle,
    onPostDeleted,
    isPriority = false,
    isAdmin = false,
    size = "default",
    className = ""
}) {
    const [isMobile, setIsMobile] = useState(undefined)
    const [activeImageIndex, setActiveImageIndex] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [showOptions, setShowOptions] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showShareModal, setShowShareModal] = useState(false)
    const [showShareToChatModal, setShowShareToChatModal] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [currentPost, setCurrentPost] = useState(post)
    // Content expansion states
    const [isContentExpanded, setIsContentExpanded] = useState(false)
    const [isOriginalContentExpanded, setIsOriginalContentExpanded] = useState(false)

    // Confirm modal state
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)

    const t = useTranslations('post');
    const tCommon = useTranslations('common');

    // Optimistic UI state for like
    const [optimisticLiked, setOptimisticLiked] = useState(liked)
    const [optimisticLikeCount, setOptimisticLikeCount] = useState(post.likeCount || 0)
    const [isLiking, setIsLiking] = useState(false)
    
    const chatMap = useAppStore(state => state.chatMap);
    const chatList = useMemo(() => selectSortedChatList({ chatMap }), [chatMap]);
    const router = useRouter()
    const isModalOpen = activeImageIndex !== null || showModal

    // Check if current post is owned by current user
    const currentUserId = getUserId()
    const isOwnPost = currentPost.author?.id === currentUserId || isAdmin

    // Show more options if it's user's own post OR if user is admin
    const showMoreOptions = isOwnPost

    useEffect(() => {
        const checkScreenSize = () => setIsMobile(window.innerWidth < 640)
        checkScreenSize()
        window.addEventListener("resize", checkScreenSize)
        return () => window.removeEventListener("resize", checkScreenSize)
    }, [])

    // Update optimistic state when props change
    useEffect(() => {
        setOptimisticLiked(liked)
        setOptimisticLikeCount(post.likeCount || 0)
        setCurrentPost(post)
    }, [liked, post])

    // Log ad view interaction
    useEffect(() => {
        if (currentPost.isAd) {
            api.post("/v1/ads/interactions", {
                campaignId: currentPost.adId,
                interactionType: "VIEW"
            }).catch(err => console.error("Failed to log view interaction:", err))
        }
    }, [currentPost.isAd, currentPost.adId])

    // Memoized functions to prevent unnecessary re-renders
    const shouldTruncateContent = (content, maxLength = 200) => {
        return content && content.length > maxLength
    }

    const getTruncatedContent = (content, maxLength = 200) => {
        if (!content) return ''
        return content.length > maxLength ? content.substring(0, maxLength) + '...' : content
    }

    // Handler for comment submission
    const handleCommentSubmit = useCallback((newComment) => {
        // Update post comment count optimistically
        setCurrentPost(prevPost => ({
            ...prevPost,
            commentCount: (prevPost.commentCount || 0) + 1
        }))
    }, [])

    // Optimistic like handler
    const handleLikeToggle = useCallback(async () => {
        if (isLiking) return

        setIsLiking(true)

        const prevLiked = optimisticLiked
        const prevLikeCount = optimisticLikeCount

        // Update optimistically
        const newLiked = !prevLiked
        const newLikeCount = prevLikeCount + (newLiked ? 1 : -1)

        setOptimisticLiked(newLiked)
        setOptimisticLikeCount(newLikeCount)

        try {
            // Call parent handler if it exists
            if (onLikeToggle) {
                const response = await onLikeToggle()

                // Check if response indicates failure
                if (response && response.data && response.data.code !== 200) {
                    // Rollback on failure
                    setOptimisticLiked(prevLiked)
                    setOptimisticLikeCount(prevLikeCount)
                    toast.error(t("likeError"))
                }
            }
        } catch (error) {
            // Rollback on error
            setOptimisticLiked(prevLiked)
            setOptimisticLikeCount(prevLikeCount)
            toast.error(t("likeError"))
            console.error("Like error:", error)
        } finally {
            setIsLiking(false)
        }
    }, [isLiking, optimisticLiked, optimisticLikeCount, onLikeToggle])

    const handleEdit = () => {
        setShowOptions(false)
        setShowEditModal(true)
    }

    const handlePostUpdated = useCallback((updatedPost) => {
        setCurrentPost(updatedPost)
    }, [])

    const handleShare = () => {
        setShowShareModal(true)
    }

    const handleShareToChat = () => {
        setShowShareToChatModal(true)
    }

    const handleDeletePost = useCallback(async () => {
        setIsConfirmOpen(true)
    }, [])

    const executeDeletePost = async () => {
        setDeleting(true)
        try {
            if (isAdmin) {
                await adminApi.delete(`/v1/admin/posts/${currentPost.id}`)
            }
            else {
                await api.delete(`/v1/posts/${currentPost.id}`)
            }
            toast.success(t('deleteSuccess'))

            // Thay vì refresh, gọi callback để cập nhật state
            if (onPostDeleted) {
                onPostDeleted(currentPost.id)
            }
        } catch (err) {
            toast.error(t('deleteError'))
            console.error(err)
        } finally {
            setDeleting(false)
            setShowOptions(false)
        }
    }

    // Function to open modal - unified logic
    const openModal = useCallback(() => {
        setShowModal(true)
    }, [])

    const handleCardClick = (e) => {
        if (currentPost.isAd) {
            e.stopPropagation()
            try {
                api.post("/v1/ads/interactions", {
                    campaignId: currentPost.adId,
                    interactionType: "CLICK"
                })
            } catch (err) {
                console.error("Failed to log click interaction:", err)
            }
            window.open(currentPost.adTargetURL || currentPost.adTargetUrl, "_blank", "noopener,noreferrer")
            return
        }

        // Không mở modal nếu đang click vào button hoặc đang trong mode edit
        if (e.target.closest('button') || e.target.closest('select') || e.target.closest('textarea') || e.target.closest('a')) {
            return
        }
        openModal()
    }

    const handleProfileClick = (e) => {
        e.stopPropagation() // Ngăn không cho bubble up tới card click
        if (currentPost.isAd) {
            handleCardClick(e)
            return
        }
        router.push(`/profile/${currentPost.author?.username}`)
    }

    const handleOriginalProfileClick = useCallback((e) => {
        e.stopPropagation()
        router.push(`/profile/${currentPost.originalPost?.author?.username}`)
    }, [router, currentPost.originalPost?.author?.username])

    // Handler for MessageCircle button
    const handleMessageCircleClick = useCallback((e) => {
        e.stopPropagation()
        openModal()
    }, [openModal])

    const renderPrivacyIcon = (privacy) => {
        switch (privacy) {
            case "PUBLIC": return <Globe size={12} className="text-muted-foreground" />
            case "FRIEND": return <Users size={12} className="text-muted-foreground" />
            case "PRIVATE": return <Lock size={12} className="text-muted-foreground" />
            default: return null
        }
    }

    const handleImageClick = useCallback((i) => {
        setActiveImageIndex(i)
        setShowModal(true)
    }, [])

    const handleCloseModal = useCallback(() => {
        setActiveImageIndex(null)
        setShowModal(false)
    }, [])

    const renderSharedPostContent = useCallback(() => {
        if (!currentPost.sharedPost) return null

        if (!currentPost.originalPostCanView) {
            return (
                <div className="mt-3 p-4 border border-[var(--border)] rounded-lg bg-[var(--card)]/50">
                    <div className="flex items-center justify-center py-8">
                        <p className="text-sm text-[var(--muted-foreground)]">
                            {t("unavailable")}
                        </p>
                    </div>
                </div>
            )
        }

        return (
            <div className="mt-3 p-4 border border-[var(--border)] rounded-lg bg-[var(--card)]/50">
                {/* Original post author info */}
                <div className="flex items-center gap-2 mb-3 cursor-pointer hover:underline" onClick={handleOriginalProfileClick}>
                    <Avatar
                        src={currentPost.originalPost.author?.profilePictureUrl}
                        alt={currentPost.originalPost.author?.username || ""}
                        size={32}
                    />
                    <div>
                        <p className="font-semibold text-sm text-[var(--card-foreground)]">
                            {currentPost.originalPost.author?.familyName + " " + currentPost.originalPost.author?.givenName}
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                            {dayjs(currentPost.originalPost.createdAt).fromNow()} {renderPrivacyIcon(currentPost.originalPost.privacy)}
                        </p>
                    </div>
                </div>

                {/* Original post content with truncation */}
                {currentPost.originalPost.content && (
                    <pre className="text-sm text-[var(--card-foreground)] mb-3 whitespace-pre-wrap break-words">
                        {shouldTruncateContent(currentPost.originalPost.content) && !isOriginalContentExpanded ? (
                            <>
                                {renderTextWithLinks(getTruncatedContent(currentPost.originalPost.content))}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setIsOriginalContentExpanded(true)
                                    }}
                                    className="text-blue-500  hover:underline hover:text-blue-700 ml-2 text-sm"
                                >
                                    {t("seeMore")}
                                </button>
                            </>
                        ) : (
                            <>
                                {renderTextWithLinks(currentPost.originalPost.content)}
                                {shouldTruncateContent(currentPost.originalPost.content) && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setIsOriginalContentExpanded(false)
                                        }}
                                        className="text-blue-500 hover:text-blue-700 ml-2 text-sm"
                                    >
                                        {t("collapse")}
                                    </button>
                                )}
                            </>
                        )}
                    </pre>
                )}

                {/* Original post images */}
                {Array.isArray(currentPost.originalPost.files) && currentPost.originalPost.files.length > 0 && (
                    <div onClick={(e) => e.stopPropagation()}>
                        <ImageView
                            images={currentPost.originalPost.files}
                            isActive={!isModalOpen}
                            priority={isPriority}
                            onImageClick={handleImageClick}
                        />
                    </div>
                )}
            </div>
        )
    }, [currentPost, isOriginalContentExpanded, handleOriginalProfileClick, renderPrivacyIcon, shouldTruncateContent, getTruncatedContent, isModalOpen, isPriority, handleImageClick])

    if (isMobile === undefined) return null

    return (
        <>
            <Card
                className={`my-2 text-[var(--card-foreground)] rounded-2xl shadow-sm card-hover-effect
                    ${size === "compact" ? "p-2 sm:p-3" : size === "large" ? "p-5" : "p-4"} 
                    w-full ${className} cursor-pointer hover:bg-[var(--card)]/90 transition-colors`}
                onClick={handleCardClick}
            >
                <div className={`flex items-start justify-between relative
                    ${size === "compact" ? "gap-2 mb-1" : size === "large" ? "gap-4 mb-3" : "gap-3 mb-2"}`}>
                    <div
                        className="flex items-center gap-2 cursor-pointer hover:underline"
                        onClick={handleProfileClick}
                    >
                        <Avatar
                            src={currentPost.author?.profilePictureUrl || ""}
                            alt={currentPost.author?.username || "sponsored"}
                            size={size === "compact" ? (isMobile ? 28 : 32) : size === "large" ? (isMobile ? 36 : 48) : (isMobile ? 32 : 40)}
                        />
                        <div>
                            <div className="flex items-center gap-1.5">
                                <p className={`font-semibold 
                                    ${size === "compact" ? "text-sm" : size === "large" ? "text-base" : "text-sm"}`}>
                                    {currentPost.author?.familyName || currentPost.author?.givenName 
                                        ? `${currentPost.author?.familyName || ""} ${currentPost.author?.givenName || ""}`.trim() 
                                        : (currentPost.isAd ? "PocPoc Sponsored Partner" : "")}
                                    {currentPost.sharedPost && !currentPost.isAd && (
                                        <>
                                            {" " + t('shared')}
                                            <Share2 className="inline w-4 h-4 ml-1 text-[var(--muted-foreground)]" />
                                        </>
                                    )}
                                </p>
                                {currentPost.isAd && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-500/10 text-blue-500 uppercase tracking-wider">Ad</span>
                                )}
                            </div>
                            <p className="text-xs">
                                {currentPost.isAd ? "Được tài trợ" : dayjs(currentPost.createdAt).fromNow()} {!currentPost.isAd && renderPrivacyIcon(currentPost.privacy)}
                            </p>
                            {currentPost.author?.mutualFriendsCount > 0 && !currentPost.isAd && (
                                <p className="text-xs text-muted-foreground">
                                    {t("mutualFriends", { count: currentPost.author.mutualFriendsCount })}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Show options menu if it's the user's own post OR if user is admin */}
                    {showMoreOptions && (
                        <div className="relative">
                            <button
                                aria-label={t("aria.moreOptions")}
                                title={t("aria.moreOptions")}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setShowOptions(!showOptions)
                                }}
                                className="text-xl text-[var(--muted-foreground)] hover:bg-[var(--input)] rounded-full p-1"
                            >
                                <MoreVertical className="w-5 h-5" />
                            </button>

                            {showOptions && (
                                <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-[var(--background)] border rounded shadow z-10">
                                    {/* Only show edit button for own posts */}
                                    {isOwnPost && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleEdit()
                                            }}
                                            className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-[var(--input)] transition-colors"
                                        >
                                            <Pencil size={14} className="text-blue-500" />
                                            <span>{t('edit')}</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleDeletePost()
                                        }}
                                        className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-[var(--input)] disabled:opacity-50 text-red-500 transition-colors"
                                        disabled={deleting}
                                    >
                                        <Trash2 size={14} />
                                        <span>{deleting ? t('deleting') : t('delete')}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Current post content (share comment) with truncation */}
                {currentPost.content && (
                    <div onClick={(e) => {
                        e.stopPropagation()
                        openModal()
                    }}>
                        <pre className={`text-sm break-words whitespace-pre-wrap
                            ${size === "compact" ? "gap-2 mb-1" : size === "large" ? "gap-4 mb-3" : "gap-3 mb-2"}`}>
                            {shouldTruncateContent(currentPost.content) && !isContentExpanded ? (
                                <>
                                    {renderTextWithLinks(getTruncatedContent(currentPost.content))}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setIsContentExpanded(true)
                                        }}
                                        className="text-blue-500 hover:text-blue-700 ml-2 text-sm"
                                    >
                                        {t("seeMore")}
                                    </button>
                                </>
                            ) : (
                                <>
                                    {renderTextWithLinks(currentPost.content)}
                                    {shouldTruncateContent(currentPost.content) && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setIsContentExpanded(false)
                                            }}
                                            className="text-blue-500 hover:text-blue-700 ml-2 text-sm"
                                        >
                                            {t("collapse")}
                                        </button>
                                    )}
                                </>
                            )}
                        </pre>
                    </div>
                )}

                {/* Shared post content */}
                {renderSharedPostContent()}

                {/* Current post images (if not a shared post) */}
                {!currentPost.sharedPost && Array.isArray(currentPost.files) && currentPost.files.length > 0 && (
                    <div onClick={(e) => e.stopPropagation()}>
                        <ImageView
                            images={currentPost.files}
                            isActive={!isModalOpen}
                            priority={isPriority}
                            onImageClick={handleImageClick}
                        />
                    </div>
                )}
                {currentPost.isAd ? (
                    <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3" onClick={(e) => e.stopPropagation()}>
                        <span className="text-xs text-[var(--muted-foreground)] font-medium">Được tài trợ bởi PocPoc Ads</span>
                        <button
                            onClick={handleCardClick}
                            className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-bold transition-all hover:opacity-90 hover:scale-105 active:scale-95 shadow-sm"
                        >
                            Tìm hiểu thêm
                        </button>
                    </div>
                ) : (
                    <>
                        {!isAdmin &&
                            (<div className="post-actions">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleLikeToggle()
                                    }}
                                    className={`action-btn ${optimisticLiked ? 'liked' : ''}`}
                                    disabled={isLiking}
                                    aria-label={optimisticLiked ? t("aria.unlike") : t("aria.like")}
                                >
                                    <Heart className={optimisticLiked ? "fill-[var(--destructive)] text-[var(--destructive)] animate-heart-pop" : ""} size={20} />
                                    <span>{optimisticLikeCount > 0 ? optimisticLikeCount : ''}</span>
                                </button>

                                <button
                                    onClick={handleMessageCircleClick}
                                    className="action-btn"
                                    aria-label={t("aria.comment")}
                                >
                                    <MessageCircle size={20} />
                                    <span>{currentPost.commentCount > 0 ? currentPost.commentCount : ''}</span>
                                </button>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleShare()
                                    }}
                                    className="action-btn"
                                    aria-label={t("aria.share")}
                                >
                                    <Share2 size={20} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleShareToChat()
                                    }}
                                    className="action-btn"
                                    aria-label={t("aria.sendToChat")}
                                >
                                    <SendHorizonal size={20} />
                                </button>
                            </div>)
                        }

                        <button
                            className="text-xs mt-3 text-[var(--muted-foreground)] hover:underline font-medium"
                            onClick={(e) => {
                                e.stopPropagation()
                                openModal()
                            }}
                        >
                            {t('viewAllComments', { count: currentPost.commentCount || 0 })}
                        </button>
                    </>
                )}
            </Card>

            {/* Lazy loaded modals - only render when needed */}
            {showEditModal && isOwnPost && (
                <Suspense fallback={<div>{tCommon("loading")}</div>}>
                    <EditPostModal
                        isOpen={showEditModal}
                        onClose={() => setShowEditModal(false)}
                        post={currentPost}
                        onPostUpdated={handlePostUpdated}
                    />
                </Suspense>
            )}

            {/* Post Modal - only render when needed */}
            {isModalOpen && (
                <Suspense fallback={<div>{tCommon("loading")}</div>}>
                    <PostModal
                        post={currentPost}
                        liked={optimisticLiked}
                        likeCount={optimisticLikeCount}
                        activeIndex={activeImageIndex}
                        isOwnPost={isOwnPost}
                        isAdmin={isAdmin}
                        onClose={handleCloseModal}
                        onLikeToggle={handleLikeToggle}
                        onCommentSubmit={handleCommentSubmit}
                    />
                </Suspense>
            )}

            {/* Share Modal - only render when needed */}
            {showShareModal && (
                <Suspense fallback={<div>{tCommon("loading")}</div>}>
                    <SharePostModal
                        isOpen={showShareModal}
                        onClose={() => setShowShareModal(false)}
                        post={currentPost}
                    />
                </Suspense>
            )}

            {/* Share to Chat Modal */}
            {showShareToChatModal && (
                <Suspense fallback={<div>{tCommon("loading")}</div>}>
                    <ShareToChatModal
                        isOpen={showShareToChatModal}
                        onClose={() => setShowShareToChatModal(false)}
                        post={currentPost}
                    />
                </Suspense>
            )}

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={executeDeletePost}
                title={t('delete')}
                message={isAdmin && !isOwnPost ? t('deleteAdminConfirm') : t('deleteConfirm')}
            />
        </>
    )
})

export default PostCard;