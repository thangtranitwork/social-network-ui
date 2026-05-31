"use client"

import React, { useState, useEffect, useRef } from "react"
import { Plus, Trash2, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import api from "@/utils/axios"
import { uploadFile } from "@/utils/fileUpload"
import toast from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"

export default function StoryFeed() {
  const [currentUser, setCurrentUser] = useState(null)
  const [feed, setFeed] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  // Story Viewer State
  const [activeUserIndex, setActiveUserIndex] = useState(null)
  const [activeStoryIndex, setActiveStoryIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  const progressInterval = useRef(null)
  const STORY_DURATION = 5000 // 5 seconds per story

  // Get current user info
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("userId")
      const storedUsername = localStorage.getItem("userName")
      if (storedUserId) {
        setCurrentUser({
          id: storedUserId,
          username: storedUsername || "me",
          profilePictureUrl: "",
        })

        if (storedUsername) {
          api.get(`/v1/users/${storedUsername}`)
            .then((res) => {
              if (res.data && res.data.body) {
                setCurrentUser((prev) => ({
                  ...prev,
                  profilePictureUrl: res.data.body.profilePictureUrl || "",
                }))
              }
            })
            .catch((err) => console.error("Error fetching user profile:", err))
        }
      }
    }
  }, [])

  // Fetch story feed
  const fetchStories = async () => {
    try {
      const res = await api.get("/v1/stories/feed")
      if (res.data && res.data.body) {
        setFeed(res.data.body)
      } else {
        setFeed([])
      }
    } catch (err) {
      console.error("Error fetching stories:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStories()
  }, [])

  // Handle new story upload
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast.error("Please upload an image or video file.")
      return
    }

    setUploading(true)
    const toastId = toast.loading("Uploading story...")

    try {
      // 1. Upload to storage
      const fileId = await uploadFile(file)
      if (!fileId) throw new Error("Upload failed")

      // 2. Save story metadata
      const mediaType = file.type.startsWith("video/") ? "VIDEO" : "IMAGE"
      await api.post("/v1/stories", {
        mediaUrl: fileId,
        mediaType: mediaType,
      })

      toast.success("Story posted successfully!", { id: toastId })
      fetchStories()
    } catch (err) {
      console.error("Story creation error:", err)
      toast.error("Failed to post story. Please try again.", { id: toastId })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleDeleteStory = async (storyId, e) => {
    e.stopPropagation()
    if (!confirm("Are you sure you want to delete this story?")) return

    const toastId = toast.loading("Deleting story...")
    try {
      await api.delete(`/v1/stories/${storyId}`)
      toast.success("Story deleted", { id: toastId })
      
      // Close viewer or advance if deleting active story
      const activeUserStories = feed[activeUserIndex]?.stories || []
      if (activeUserStories.length <= 1) {
        closeViewer()
      } else {
        if (activeStoryIndex >= activeUserStories.length - 1) {
          setActiveStoryIndex(activeStoryIndex - 1)
        }
        setProgress(0)
      }
      fetchStories()
    } catch (err) {
      console.error("Delete story error:", err)
      toast.error("Failed to delete story", { id: toastId })
    }
  }

  // Story Viewer Control Logic
  const openViewer = (userIndex) => {
    setActiveUserIndex(userIndex)
    setActiveStoryIndex(0)
    setProgress(0)
  }

  const closeViewer = () => {
    setActiveUserIndex(null)
    setActiveStoryIndex(0)
    setProgress(0)
  }

  // Ticking progress bar
  useEffect(() => {
    if (activeUserIndex === null) {
      if (progressInterval.current) clearInterval(progressInterval.current)
      return
    }

    const intervalStep = 50 // Update every 50ms
    const totalSteps = STORY_DURATION / intervalStep

    setProgress(0)
    if (progressInterval.current) clearInterval(progressInterval.current)

    progressInterval.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval.current)
          handleNextStory()
          return 100
        }
        return prev + (100 / totalSteps)
      })
    }, intervalStep)

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current)
    }
  }, [activeUserIndex, activeStoryIndex])

  const handleNextStory = () => {
    const userStories = feed[activeUserIndex]?.stories || []
    if (activeStoryIndex < userStories.length - 1) {
      setActiveStoryIndex((prev) => prev + 1)
      setProgress(0)
    } else {
      // Go to next friend
      if (activeUserIndex < feed.length - 1) {
        setActiveUserIndex((prev) => prev + 1)
        setActiveStoryIndex(0)
        setProgress(0)
      } else {
        // End of all stories
        closeViewer()
      }
    }
  }

  const handlePrevStory = () => {
    if (activeStoryIndex > 0) {
      setActiveStoryIndex((prev) => prev - 1)
      setProgress(0)
    } else {
      // Go to previous friend
      if (activeUserIndex > 0) {
        setActiveUserIndex((prev) => prev - 1)
        const prevUserStories = feed[activeUserIndex - 1]?.stories || []
        setActiveStoryIndex(Math.max(0, prevUserStories.length - 1))
        setProgress(0)
      } else {
        // Already at first story of first user, just restart
        setProgress(0)
      }
    }
  }

  // Find if current user has active stories
  const ownFeedItemIndex = feed.findIndex((item) => item.user?.id === currentUser?.id)
  const hasOwnStories = ownFeedItemIndex !== -1

  return (
    <div className="w-full max-w-2xl bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 shadow-sm mb-4">
      {/* Hidden file input for creating story */}
      <input
        type="file"
        accept="image/*,video/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex items-center space-x-4 overflow-x-auto no-scrollbar py-1">
        {/* Own story placeholder or item */}
        <div className="flex flex-col items-center flex-shrink-0 relative group">
          <div
            onClick={() => {
              if (hasOwnStories) {
                openViewer(ownFeedItemIndex)
              } else {
                fileInputRef.current?.click()
              }
            }}
            className={`w-16 h-16 rounded-full p-[2px] cursor-pointer transition-transform hover:scale-105 ${
              hasOwnStories
                ? "bg-gradient-to-tr from-[var(--accent)] to-[#00B3FF]"
                : "border-2 border-dashed border-[var(--border)] flex items-center justify-center"
            }`}
          >
            {currentUser?.profilePictureUrl ? (
              <img
                src={currentUser.profilePictureUrl}
                alt="Your Avatar"
                className="w-full h-full object-cover rounded-full bg-[var(--muted)]"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold text-lg">
                {currentUser?.username?.charAt(0).toUpperCase() || "+"}
              </div>
            )}
          </div>

          {/* Add story "+" action badge */}
          <div
            onClick={(e) => {
              e.stopPropagation()
              fileInputRef.current?.click()
            }}
            className="absolute bottom-6 right-0 bg-[var(--primary)] text-white p-1 rounded-full border-2 border-[var(--card)] cursor-pointer hover:bg-opacity-90 transition-colors"
          >
            {uploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
          </div>

          <span className="text-xs text-[var(--muted-foreground)] mt-2 font-medium">
            Your Story
          </span>
        </div>

        {/* Friends' stories */}
        {loading ? (
          <div className="flex space-x-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex flex-col items-center space-y-2 animate-pulse">
                <div className="w-16 h-16 rounded-full bg-[var(--muted)]" />
                <div className="w-12 h-2.5 bg-[var(--muted)] rounded" />
              </div>
            ))}
          </div>
        ) : (
          feed
            .map((item, idx) => {
              // Skip own stories in main list rendering (we display it first separately)
              if (item.user?.id === currentUser?.id) return null

              return (
                <div
                  key={item.user?.id || idx}
                  onClick={() => openViewer(idx)}
                  className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
                >
                  <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-[var(--accent)] via-[#00B3FF] to-[#7000FF] transition-transform group-hover:scale-105">
                    {item.user?.profilePictureUrl ? (
                      <img
                        src={item.user.profilePictureUrl}
                        alt={item.user.username}
                        className="w-full h-full object-cover rounded-full bg-[var(--muted)] border-2 border-[var(--card)]"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-[var(--muted)] text-[var(--foreground)] border-2 border-[var(--card)] flex items-center justify-center font-semibold text-lg">
                        {item.user?.username?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-[var(--muted-foreground)] mt-2 font-medium truncate max-w-[72px]">
                    {item.user?.username || "User"}
                  </span>
                </div>
              )
            })
        )}
      </div>

      {/* Full-Screen Story Viewer Overlay */}
      <AnimatePresence>
        {activeUserIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          >
            {/* Click regions for navigating */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1/4 z-20 cursor-w-resize"
              onClick={handlePrevStory}
            />
            <div
              className="absolute right-0 top-0 bottom-0 w-1/4 z-20 cursor-e-resize"
              onClick={handleNextStory}
            />

            {/* Main story box */}
            <div className="relative w-full max-w-lg h-full max-h-[85vh] md:max-h-[90vh] bg-neutral-900 rounded-lg overflow-hidden flex flex-col justify-center items-center z-10 shadow-2xl">
              {/* Progress indicator segments */}
              <div className="absolute top-3 left-4 right-4 flex space-x-1.5 z-30">
                {(feed[activeUserIndex]?.stories || []).map((s, idx) => (
                  <div key={s.id || idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-75"
                      style={{
                        width:
                          idx < activeStoryIndex
                            ? "100%"
                            : idx === activeStoryIndex
                            ? `${progress}%`
                            : "0%",
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Story Author Header */}
              <div className="absolute top-6 left-4 right-4 flex justify-between items-center z-30 text-white">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-white/40">
                    <img
                      src={feed[activeUserIndex]?.user?.profilePictureUrl || "/placeholder-avatar.png"}
                      alt={feed[activeUserIndex]?.user?.username}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="font-semibold text-sm">
                      {feed[activeUserIndex]?.user?.username || "Username"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Delete Button (If own story) */}
                  {feed[activeUserIndex]?.user?.id === currentUser?.id && (
                    <button
                      onClick={(e) =>
                        handleDeleteStory(feed[activeUserIndex]?.stories[activeStoryIndex]?.id, e)
                      }
                      className="p-1.5 bg-red-600/80 rounded-full hover:bg-red-600 transition-colors cursor-pointer"
                      title="Delete story"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  )}

                  <button
                    onClick={closeViewer}
                    className="p-1 bg-black/40 rounded-full hover:bg-black/65 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Story Media */}
              <div className="w-full h-full flex items-center justify-center bg-black">
                {feed[activeUserIndex]?.stories[activeStoryIndex]?.mediaType === "VIDEO" ? (
                  <video
                    src={feed[activeUserIndex]?.stories[activeStoryIndex]?.mediaUrl}
                    className="max-h-full max-w-full object-contain"
                    autoPlay
                    playsInline
                    controls={false}
                  />
                ) : (
                  <img
                    src={feed[activeUserIndex]?.stories[activeStoryIndex]?.mediaUrl}
                    alt="Story Content"
                    className="max-h-full max-w-full object-contain"
                  />
                )}
              </div>

              {/* Navigation Chevrons (desktop only helper) */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handlePrevStory()
                }}
                className="hidden md:flex absolute left-4 w-10 h-10 items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-all text-white z-30"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleNextStory()
                }}
                className="hidden md:flex absolute right-4 w-10 h-10 items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-all text-white z-30"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
