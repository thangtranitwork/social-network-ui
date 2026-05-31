"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import ProfileHeader from "@/components/social-app-component/ProfileHeader";
import api from "@/utils/axios";
import PostCard from "@/components/social-app-component/PostCard";
import PostSkeleton from "@/components/social-app-component/PostCardSkeleton";
import { useTranslations } from "next-intl";
import useUserPosts from "@/hooks/useUserPosts";
import useInfiniteScroll from "@/hooks/useInfiniteScroll";
import usePostMutation from "@/hooks/usePostMutation";

export default function ProfilePageClient({ initialProfile, routeUsername }) {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const router = useRouter();

  // State management
  const [profileData, setProfileData] = useState(initialProfile);
  const [files, setFiles] = useState([]);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");

  // Check if own profile
  useEffect(() => {
    const storedUsername = localStorage.getItem("userName");
    if (storedUsername) {
      setIsOwnProfile(storedUsername === routeUsername);
    }
  }, [routeUsername]);

  // Sync profileData with initialProfile (important for navigation)
  useEffect(() => {
    if (initialProfile) {
      setProfileData(initialProfile);
    }
  }, [initialProfile]);

  // Fallback client-side fetch if initialProfile is missing
  useEffect(() => {
    if (!profileData && routeUsername) {
      const fetchProfile = async () => {
        try {
          const res = await api.get(`/v1/users/${routeUsername}`);
          if (res.data.code === 200) {
            setProfileData(res.data.body);
          }
        } catch (error) {
          console.error("Error fetching profile client-side:", error);
        }
      };
      fetchProfile();
    }
  }, [profileData, routeUsername]);

  // TanStack Query for user posts
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: loading,
  } = useUserPosts(routeUsername);

  // Infinite Scroll Hook
  const { loadMoreRef } = useInfiniteScroll(
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage || loading
  );

  // Post Mutations
  const { toggleLike } = usePostMutation([["userPosts", routeUsername], ["newsfeed"]]);

  // Flatten pages into a single array
  const posts = useMemo(() => {
    return data?.pages?.flat() || [];
  }, [data]);

  // Fetch files when on file tab
  useEffect(() => {
    if (!routeUsername || activeTab !== "file") return;

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const controller = new AbortController();
    api.get(`/v1/posts/files/${routeUsername}`, { signal: controller.signal })
        .then(res => {
          if (res.data.code === 200) {
            setFiles(res.data.body);
          }
        })
        .catch(error => {
          if (!controller.signal.aborted) {
            console.error("Lỗi khi tải files:", error);
          }
        });

    return () => controller.abort();
  }, [routeUsername, activeTab]);

  // Event handlers
  const handleUsernameChange = useCallback((oldUsername, newUsername) => {
    console.log("Username changed from", oldUsername, "to", newUsername);
    window.location.href = `/profile/${newUsername}`;
  }, []);

  const handlePostDeleted = useCallback((deletedPostId) => {
    // Rely on TanStack query invalidation or manual update if needed
    // In a full implementation, you'd invalidate the query here.
  }, []);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  // Memoized values
  const ProfileHeaderSkeleton = useMemo(() => (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden animate-pulse">
        <div className="px-6 pt-6 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-6 -mt-16 sm:-mt-20">
            <div className="w-32 h-32 bg-gray-300 dark:bg-gray-600 rounded-full border-4 border-white dark:border-gray-800 mb-4 sm:mb-0"></div>
            <div className="flex-1 sm:pb-4">
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-48 mb-2"></div>
              <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-32 mt-4"></div>
              <div className="flex space-x-8 mt-4">
                {[1, 2].map(i => (
                    <div key={i} className="text-center">
                      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-12 mb-1"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                    </div>
                ))}
              </div>
              <div className="flex space-x-3 mt-4">
                <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
          </div>
          <div className="mt-6 border-t border-gray-200 dark:border-gray-700"></div>
        </div>
      </div>
  ), []);

  const loadingSkeletons = useMemo(() =>
      Array.from({ length: 5 }).map((_, i) => <PostSkeleton key={i} />), []
  );

  const loadingMoreSkeletons = useMemo(() =>
      Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={`loading-${i}`} />), []
  );

  // Render helpers
  const renderEmptyState = (title, description) => (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
          <p className="text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
  );

  const renderFiles = () => (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {files.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('mediaFiles')}</h3>
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {t('files', { count: files.length })}
            </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {files.map((url, index) => {
                  const isVideo = url.toLowerCase().match(/\.(mp4|mov)$/);
                  return (
                      <div key={index} className="relative group cursor-pointer rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 aspect-square">
                        {isVideo ? (
                            <video src={url} controls className="w-full h-full object-cover hover:scale-105 transition-transform duration-200" />
                        ) : (
                            <img src={url} alt={`media-${index}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-200" />
                        )}
                      </div>
                  );
                })}
              </div>
            </div>
        ) : (
            renderEmptyState(t('noMediaFiles'), t('noMediaFilesDesc'))
        )}
      </div>
  );

  return (
      <main className="max-w-4xl mx-auto mt-4 flex-col justify-center items-center">
        {/* Profile Header */}
        {profileData ? (
            <ProfileHeader
                profileData={profileData}
                isOwnProfile={isOwnProfile}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                onProfileUpdate={(updatedData) => setProfileData(prev => ({ ...prev, ...updatedData }))}
                onUsernameChange={handleUsernameChange}
            />
        ) : (
            ProfileHeaderSkeleton
        )}

        {/* Content Section */}
        <div className="w-full flex flex-col items-center justify-center">
          <section className="flex flex-col w-full items-center justify-center mt-6 space-y-4">
            {activeTab === "posts" ? (
                <>
                  {loading && posts.length === 0 ? (
                      <div className="space-y-6 w-full flex flex-col items-center">
                        {loadingSkeletons}
                      </div>
                  ) : posts.length > 0 ? (
                      <>
                        {posts.map(post => (
                            <PostCard
                                key={post.id || Math.random().toString(36)}
                                post={post}
                                liked={post.liked}
                                likeCount={post.likeCount}
                                onLikeToggle={() => toggleLike({ postId: post.id, wasLiked: post.liked })}
                                onPostDeleted={handlePostDeleted}
                                isOwnProfile={isOwnProfile}
                                isFriend={profileData?.isFriend}
                            />
                        ))}

                        {/* Intersection Observer target element */}
                        {hasNextPage && (
                          <div ref={loadMoreRef} className="w-full flex justify-center py-8">
                            {isFetchingNextPage && <div className="w-full space-y-6">{loadingMoreSkeletons}</div>}
                          </div>
                        )}

                        {!hasNextPage && !loading && (
                            <div className="w-full h-10 flex items-center justify-center">
                              <div className="text-gray-400 text-sm">{tCommon('viewMore')} ...</div>
                            </div>
                        )}
                      </>
                  ) : (
                      renderEmptyState(
                          isOwnProfile ? t('noPostsOwn') : t('noPostsOther'),
                          isOwnProfile ? t('noPostsOwnDesc') : t('noPostsOtherDesc')
                      )
                  )}
                </>
            ) : (
                renderFiles()
            )}
          </section>
        </div>
      </main>
  );
}
