"use client"
import { useEffect, useState, useCallback, useMemo } from "react"
import PostCard from "@/components/social-app-component/PostCard"
import useNewsfeed from "@/hooks/useNewsfeed"
import useInfiniteScroll from "@/hooks/useInfiniteScroll"
import usePostMutation from "@/hooks/usePostMutation"
import PostSkeleton from "@/components/social-app-component/PostCardSkeleton"
import { pageMetadata, usePageMetadata } from "@/utils/clientMetadata"
import { useTranslations } from "next-intl"
import StoryFeed from "@/components/social-app-component/StoryFeed"

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState(null)
  const [filterType, setFilterType] = useState("RELEVANT")
  
  const t = useTranslations('home')
  usePageMetadata(pageMetadata.home())

  // Get user info once when component mounts
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUsername = localStorage.getItem("userName")
      const storedUserId = localStorage.getItem("userId")
      if (storedUsername && storedUserId) {
        setCurrentUser({
          username: storedUsername,
          id: storedUserId,
        })
      }
    }
  }, [])

  // TanStack Query for newsfeed
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch
  } = useNewsfeed(filterType)

  // Infinite Scroll Hook
  const { loadMoreRef } = useInfiniteScroll(
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage || isLoading
  )

  // Post Mutations
  const { toggleLike } = usePostMutation()

  // Flatten pages into a single array
  const posts = useMemo(() => {
    return data?.pages?.flat() || []
  }, [data])

  // Handle filter change
  const handleFilterChange = useCallback((newType) => {
    if (newType === filterType) return
    setFilterType(newType)
  }, [filterType])

  // Skeletons
  const loadingSkeletons = useMemo(() => 
    Array.from({ length: 3 }).map((_, index) => <PostSkeleton key={`initial-${index}`} />), 
  [])

  const loadingMoreSkeletons = useMemo(() => 
    Array.from({ length: 3 }).map((_, index) => <PostSkeleton key={`more-${index}`} />),
  [])

  // Filter Toggle Component
  const FilterToggle = useMemo(() => {
    const filters = [
      { key: "RELEVANT", label: t('filters.relevant') },
      { key: "TIME",     label: t('filters.newest') },
      { key: "FRIEND_ONLY", label: t('filters.friendsOnly') },
    ]

    return (
      <div className="w-full sticky top-0 bg-[var(--background)]/80 backdrop-blur-md z-40 mb-2">
        <div className="profile-tabs justify-center">
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => handleFilterChange(filter.key)}
              className={`tab-btn ${filterType === filter.key ? "active" : ""}`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
    )
  }, [filterType, handleFilterChange, t])

  // Render logic
  const renderContent = () => {
    if (!currentUser || isLoading) {
      return <div className="space-y-6 w-full flex flex-col items-center">{loadingSkeletons}</div>
    }

    if (isError) {
      return (
        <div className="text-center py-16">
          <p className="text-red-500 mb-4">{t('loadError')}</p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-blue-500 text-white rounded-lg">
            {t('retry')}
          </button>
        </div>
      )
    }

    if (posts.length > 0) {
      return (
        <>
          {posts.map((post, index) => (
            <PostCard
              key={post.id}
              post={post}
              liked={post.liked}
              onLikeToggle={() => toggleLike({ postId: post.id, wasLiked: post.liked })}
              isOwnPost={post.author?.username === currentUser?.username || post.author?.id === currentUser?.id}
              isPriority={index < 3}
            />
          ))}
          
          {/* Intersection Observer target element */}
          {hasNextPage && (
            <div ref={loadMoreRef} className="w-full flex justify-center py-8">
              {isFetchingNextPage && <div className="w-full space-y-6">{loadingMoreSkeletons}</div>}
            </div>
          )}
          
          {!hasNextPage && posts.length > 0 && (
            <div className="flex justify-center py-8">
              <div className="bg-[var(--card)] rounded-full px-6 py-3 shadow-sm border border-[var(--border)]">
                <p className="text-[var(--muted-foreground)] text-sm font-medium">
                  {t('caughtUp')}
                </p>
              </div>
            </div>
          )}
        </>
      )
    }

    // No posts empty state
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="bg-[var(--card)] rounded-xl shadow-sm border border-[var(--border)] p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-[var(--muted)] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            {t('noPosts')}
          </h3>
          <p className="text-[var(--muted-foreground)]">
            {t('noPostsDesc')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 flex flex-col items-center">
      <StoryFeed />
      {FilterToggle}
      {renderContent()}
    </div>
  )
}
