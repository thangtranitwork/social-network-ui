import { useEffect, useState, useCallback } from 'react';
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
  const name = n.creator?.givenName || tCommon("you"); // Use "You" or a generic name
  const typeKey = `types.${n.action}`;
  return t(typeKey, { name });
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
    if (notification.targetType === 'USER' || notification.targetType === "REQUEST" && notification.targetId) {
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
                {notifications.map((n, idx) => (
                  <div
                    key={n.id || idx}
                    onClick={() => handleNotificationClick(n)}
                    className={`
        bg-[var(--card)] border border-[var(--border)] p-3 rounded-xl shadow-sm
        cursor-pointer hover:bg-[var(--accent)] transition-colors flex items-start gap-3
        ${isLoadingPost ? "opacity-50 cursor-wait" : ""}
      `}
                  >
                    {/* Ảnh đại diện người tạo */}
                    <Avatar
                      src={n.creator?.profilePictureUrl}
                      alt="avatar"
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-[var(--border)]"
                    />

                    {/* Nội dung thông báo - tiêu đề + nội dung rút gọn ở hàng dưới */}
                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-[var(--foreground)] font-medium">
                          {formatNotificationText(n, t, tCommon)}
                        </p>
                      </div>

                      {n?.shortenedContent ? (
                        <p className="text-xs text-[var(--muted-foreground)] mt-1">
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

                    {/* Chấm xanh nếu chưa đọc */}
                    {/* {!n.isRead && (
        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
      )} */}
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