import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useAppStore from '@/store/ZustandStore';
import api from '@/utils/axios';
import PostModal from '@/components/social-app-component/PostModal';
import toast from 'react-hot-toast';
import Avatar from '../ui-components/Avatar';
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useTranslations } from 'next-intl';

dayjs.extend(relativeTime);

function formatNotificationText(n, t, tCommon) {
  const creators = n.creators || (n.creator ? [n.creator] : []);
  const count = creators.length;
  const name1 = creators[0]?.givenName || tCommon("you");

  if (count <= 1) {
    const typeKey = `types.${n.action}`;
    try {
      return t(typeKey, { name: name1 });
    } catch {
      return t("types.default", { name: name1 });
    }
  }

  const name2 = creators[1]?.givenName || "";

  if (count === 2) {
    const twoKey = `types.group_${n.action}_two`;
    try {
      const translated = t(twoKey, { name1, name2 });
      if (translated && !translated.startsWith("notifications.")) return translated;
    } catch {}
    return `${name1} và ${name2} đã tương tác với bài viết của bạn`;
  }

  const othersCount = count - 2;
  const manyKey = `types.group_${n.action}_many`;
  try {
    const translated = t(manyKey, { name1, name2, count: othersCount });
    if (translated && !translated.startsWith("notifications.")) return translated;
  } catch {}
  return `${name1}, ${name2} và ${othersCount} người khác đã tương tác với bài viết của bạn`;
}

export default function NotificationList() {
  const t = useTranslations("notifications");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [selectedPost, setSelectedPost] = useState(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isLoadingPost, setIsLoadingPost] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);

  const {
    notifications,
    isLoadingNotifications: loading,
    error,
    ensureNotificationsLoaded,
    markNotificationAsRead
  } = useAppStore();

  const groupedNotifications = useMemo(() => {
    if (!Array.isArray(notifications) || notifications.length === 0) return [];
    const groups = [];
    const map = new Map();

    for (const n of notifications) {
      // Nhóm các tương tác liên quan đến cùng 1 bài viết (LIKE_POST, COMMENT, SHARE, LIKE_COMMENT)
      const isPostInteraction =
        (n.targetType === "POST" || n.targetType === "COMMENT") &&
        (n.targetId || n.postId);
      const postTargetId = n.targetId || n.postId;

      if (isPostInteraction) {
        const groupKey = `${n.action}_${postTargetId}`;
        if (!map.has(groupKey)) {
          const groupItem = {
            ...n,
            isGrouped: true,
            groupKey,
            items: [n],
            creators: n.creator ? [n.creator] : [],
          };
          map.set(groupKey, groupItem);
          groups.push(groupItem);
        } else {
          const existing = map.get(groupKey);
          existing.items.push(n);
          if (
            n.creator &&
            !existing.creators.some(
              (c) => c?.id === n.creator?.id || c?.username === n.creator?.username
            )
          ) {
            existing.creators.push(n.creator);
          }
          if (new Date(n.sentAt) > new Date(existing.sentAt)) {
            existing.sentAt = n.sentAt;
          }
        }
      } else {
        groups.push({
          ...n,
          isGrouped: false,
          items: [n],
          creators: n.creator ? [n.creator] : [],
        });
      }
    }
    return groups;
  }, [notifications]);

  useEffect(() => {
    // Tự động fetch notifications nếu danh sách rỗng
    ensureNotificationsLoaded();
  }, [ensureNotificationsLoaded]);

  const fetchComments = async (postId) => {
    if (loadingComments) return;
    setLoadingComments(true);
    try {
      const res = await api.get(`/v1/comments/of-post/${postId}`, {
        params: { page: 0, size: 50 }
      });
      console.log('Comments response:', res);
      setComments(res.data.body || []);
    } catch (err) {
      toast.error(tCommon("error"));
      console.error('Error fetching comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    console.log('Notification clicked:', notification);

    // Handle navigation based on notification type
    if (notification.targetType === 'CHAT' || notification.action === 'NEW_MESSAGE') {
      router.push(`/chats?chatId=${notification.targetId}`);
    } else if (notification.targetType === 'USER' || notification.targetType === "REQUEST" && notification.targetId) {
      // Navigate to user profile
      router.push(`/profile/${notification.creator.username}`);
    } else if ((notification.targetType === 'POST' && notification.targetId)) {
      console.log('Fetching post with ID:', notification.targetId);
      setIsLoadingPost(true)
      try {
        const response = await api.get(`/v1/posts/${notification.targetId}`);
        console.log('Post fetch response:', response);
        console.log('Response data:', response.data);
        console.log('Response body:', response.data.body);

        if (response.data.body) {
          setSelectedPost(response.data.body);
          setIsPostModalOpen(true);
          // Fetch comments for the post
          fetchComments(notification.targetId);
        } else {
          console.error('No post data in response body');
          toast.error(tCommon("error"));
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        console.error('Error response:', error.response);
        toast.error(tCommon("error"));
      } finally {
        setIsLoadingPost(false);
      }
    }
    else if ((notification.targetType === 'COMMENT' && notification.postId)) {
      console.log('Fetching post with ID:', notification.postId);
      setIsLoadingPost(true)
      try {
        const response = await api.get(`/v1/posts/${notification.postId}`);
        console.log('Post fetch response:', response);
        console.log('Response data:', response.data);
        console.log('Response body:', response.data.body);

        if (response.data.body) {
          setSelectedPost(response.data.body);
          setIsPostModalOpen(true);
          // Fetch comments for the post
          fetchComments(notification.postId);
        } else {
          console.error('No post data in response body');
          toast.error(tCommon("error"));
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        console.error('Error response:', error.response);
        toast.error(tCommon("error"));
      } finally {
        setIsLoadingPost(false);
      }
    }
  };

  const closePostModal = () => {
    setIsPostModalOpen(false);
    setSelectedPost(null);
    setComments([]);
  };

  const truncateContent = useCallback((content, maxLength = 30) => {
    if (!content || content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }, []);

  return (
    <>
      <div className="max-w-4xl w-full mx-auto">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm">
          <div className="p-4 border-b border-[var(--border)]">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              {t("title")}
            </h2>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="text-center py-8 text-[var(--muted-foreground)]">
                {tCommon("loading")}
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                {t("loadError")}
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-[var(--muted-foreground)]">
                {t("noNotifications")}
              </div>
            ) : (
              <div className="space-y-3">
                {groupedNotifications.map((n, idx) => (
                  <div
                    key={n.groupKey || n.id || idx}
                    onClick={() => handleNotificationClick(n)}
                    className={`
        bg-[var(--card)] border border-[var(--border)] p-3 rounded-xl shadow-sm
        cursor-pointer hover:bg-[var(--accent)] transition-colors flex items-start gap-3
        ${isLoadingPost ? "opacity-50 cursor-wait" : ""}
      `}
                  >
                    {/* Ảnh đại diện: 1 avatar hoặc chồng 2 avatar nếu được gộp */}
                    {n.creators && n.creators.length > 1 ? (
                      <div className="flex -space-x-2.5 flex-shrink-0 pt-0.5">
                        {n.creators.slice(0, 2).map((c, i) => (
                          <Avatar
                            key={c?.id || c?.username || i}
                            src={c?.profilePictureUrl}
                            alt="avatar"
                            className="w-8 h-8 rounded-full object-cover border-2 border-[var(--card)] shadow-sm"
                          />
                        ))}
                      </div>
                    ) : (
                      <Avatar
                        src={n.creator?.profilePictureUrl}
                        alt="avatar"
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-[var(--border)]"
                      />
                    )}

                    {/* Nội dung thông báo - tiêu đề + nội dung rút gọn ở hàng dưới */}
                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-[var(--foreground)] font-medium leading-snug">
                          {formatNotificationText(n, t, tCommon)}
                        </p>
                      </div>

                      {n?.shortenedContent ? (
                        <p className="text-xs text-[var(--muted-foreground)] mt-1 line-clamp-2">
                          {truncateContent(n.shortenedContent, 80)}
                        </p>
                      ) : null}

                      <p
                        className="text-xs text-[var(--muted-foreground)] mt-1"
                        title={dayjs(n.sentAt).format("HH:mm DD/MM")}
                      >
                        {dayjs(n.sentAt).fromNow()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

            )}
          </div>
        </div>
      </div>

      {/* Post Modal with high z-index to appear above other elements */}
      {isPostModalOpen && selectedPost && (
        <div className="fixed inset-0 z-50">
          <PostModal
            post={selectedPost}
            liked={selectedPost.liked}
            likeCount={selectedPost.likeCount}
            comments={comments}
            loadingComments={loadingComments}
            onClose={closePostModal}
            onLikeToggle={async () => {
              try {
                const endpoint = selectedPost.liked
                  ? `/v1/posts/unlike/${selectedPost.id}`
                  : `/v1/posts/like/${selectedPost.id}`;

                if (selectedPost.liked) {
                  await api.delete(endpoint);
                } else {
                  await api.post(endpoint);
                }

                // Update local post state
                setSelectedPost(prev => ({
                  ...prev,
                  liked: !prev.liked,
                  likeCount: prev.liked ? prev.likeCount - 1 : prev.likeCount + 1
                }));
              } catch (error) {
                console.error('Error toggling like:', error);
                toast.error(t('likeError'));
              }
            }}
            onCommentSubmit={(newComment) => {
              // Add new comment to the comments list
              setComments(prev => [newComment, ...prev]);
            }}
            onCommentUpdate={(commentId, liked) => {
              // Update comment like status
              setComments(prev =>
                prev.map(comment =>
                  comment.id === commentId
                    ? { ...comment, liked, likeCount: liked ? comment.likeCount + 1 : comment.likeCount - 1 }
                    : comment
                )
              );
            }}
          />
        </div>
      )}
    </>
  );
}