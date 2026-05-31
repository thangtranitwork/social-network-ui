"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PostCard from "@/components/social-app-component/PostCard";
import api, {getAuthInfo} from "@/utils/axios";
import toast from "react-hot-toast";
import usePostActions from "@/hooks/usePostAction";
import { House } from "lucide-react";
import { useTranslations } from "next-intl";

export default function PostPageClient({ initialPost, postId }) {
    const t = useTranslations('errors');
    const tPost = useTranslations('post');
    const tCommon = useTranslations('common');
    const router = useRouter();
    const [post, setPost] = useState(initialPost);
    const [loading, setLoading] = useState(!initialPost);
    const [error, setError] = useState(null);
    const [liked, setLiked] = useState(initialPost?.liked || false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);

    const { toggleLike } = usePostActions({ post, setPost });

    const handleRouterBack = () => {
        router.push("/");
    };

    // Check authentication status
    useEffect(() => {
        const authInfo = getAuthInfo();
        if (!authInfo) {
            router.push("/register");
            return;
        }
        if (!authInfo.token || !authInfo.userId || !authInfo.userName) {
            router.push("/register");
            return;
        }

        setIsLoggedIn(true);
        setUser({
            id: authInfo.userId,
            name: authInfo.userName,
            username: authInfo.userName
        });
    }, [router]);

    // Fetch post data if not provided via initialPost (fallback)
    useEffect(() => {
        const fetchPost = async () => {
            if (!postId || initialPost) return;

            try {
                setLoading(true);
                setError(null);

                const response = await api.get(`/v1/posts/${postId}`);
                const postData = response.data.body;

                setPost(postData);
                setLiked(postData.liked || false);

            } catch (err) {
                console.error("Error fetching post:", err);
                if (err.response?.data?.code === 5003) {
                    setError(t('postUnavailable'));
                    toast.error(t('postUnavailable'));
                } else {
                    setError(err.response?.data?.message || t('postLoadFailed'));
                    toast.error(t('postLoadFailed'));
                }
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [postId, initialPost]);

    const handleLogin = () => {
        router.push('/login');
    };

    const handlePostDeleted = (deletedPostId) => {
        toast.success(tPost("deleteSuccess"));
        router.push("/");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="bg-[var(--card)] p-8 rounded-xl shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--accent)]"></div>
                        <span className="text-[var(--card-foreground)]">{tCommon('loading')}</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="bg-[var(--card)] p-8 rounded-xl shadow-lg text-center max-w-md">
                    <div className="text-red-500 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--card-foreground)] mb-2">
                        Lỗi tải bài viết
                    </h3>
                    <p className="text-[var(--muted-foreground)] mb-4">
                        {error}
                    </p>
                    <div className="flex gap-2 justify-center">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-[var(--accent)] text-[var(--accent-foreground)] rounded-lg hover:opacity-90 transition-opacity"
                        >
                            Thử lại
                        </button>
                        <button
                            onClick={() => router.back()}
                            className="px-4 py-2 bg-[var(--muted)] text-[var(--muted-foreground)] rounded-lg hover:opacity-80 transition-opacity"
                        >
                            Quay lại
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="bg-[var(--card)] p-8 rounded-xl shadow-lg text-center max-w-md">
                    <div className="text-[var(--muted-foreground)] mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--card-foreground)] mb-2">
                        {t('postNotFound')}
                    </h3>
                    <p className="text-[var(--muted-foreground)] mb-4">
                        {t('postNotFoundDesc')}
                    </p>
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2 bg-[var(--accent)] text-[var(--accent-foreground)] rounded-lg hover:opacity-90 transition-opacity"
                    >
                        {t('goBack')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <div className="sticky top-0 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)] z-10">
                <div className="max-w-2xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleRouterBack}
                                className="p-2 rounded-full hover:bg-[var(--input)] transition-colors"
                                aria-label="Go back"
                            >
                                <House/>
                            </button>
                        </div>

                        {!isLoggedIn && (
                            <button
                                onClick={handleLogin}
                                className="px-4 py-2 bg-[var(--accent)] text-[var(--accent-foreground)] rounded-lg hover:opacity-90 transition-opacity font-medium text-sm"
                            >
                                {tCommon('login')}
                            </button>
                        )}

                        {isLoggedIn && user && (
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-[var(--accent-foreground)] text-sm font-medium">
                                    {user.name?.charAt(0) || user.username?.charAt(0) || 'U'}
                                </div>
                                <span className="text-sm text-[var(--card-foreground)] hidden sm:block">
                                    {user.name || user.username}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6">
                <PostCard
                    post={post}
                    liked={liked}
                    onLikeToggle={() => toggleLike(post.id)}
                    onPostDeleted={handlePostDeleted}
                    size="large"
                    className="shadow-lg"
                />
            </div>
        </div>
    );
}
