"use client"

import { memo, useCallback, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { Search, Send, X } from "lucide-react"
import Avatar from "../ui-components/Avatar"
import useAppStore from "@/store/ZustandStore"
import api from "@/utils/axios"

function ShareToChatModal({ isOpen, onClose, post }) {
    const { chatList, fetchChatList } = useAppStore()
    const [searchQuery, setSearchQuery] = useState("")
    const [sending, setSending] = useState(null) // chatId đang gửi
    const [sentChats, setSentChats] = useState(new Set()) // các chatId đã gửi thành công

    // Lọc danh sách chat theo tên
    const filteredChats = useMemo(() => {
        if (!searchQuery.trim()) return chatList
        const q = searchQuery.toLowerCase()
        return chatList.filter((chat) => {
            const name = `${chat.target?.givenName || ""} ${chat.target?.familyName || ""}`.toLowerCase()
            const username = (chat.target?.username || "").toLowerCase()
            return name.includes(q) || username.includes(q)
        })
    }, [chatList, searchQuery])

    // Gửi bài viết tới đoạn chat
    const handleSendToChat = useCallback(async (chat) => {
        if (sending || sentChats.has(chat.chatId)) return

        const username = chat.target?.username
        if (!username) {
            toast.error("Không tìm thấy người dùng")
            return
        }

        const postUrl = `${window.location.origin}/post/${post.id}`
        const authorName = `${post.author?.familyName || ""} ${post.author?.givenName || ""}`.trim()
        const shareText = `📌 Chia sẻ bài viết của ${authorName}: ${postUrl}`

        setSending(chat.chatId)
        try {
            await api.post("/v1/chat/send", {
                username: username,
                text: shareText,
            })
            setSentChats((prev) => new Set(prev).add(chat.chatId))
            toast.success("Đã gửi bài viết!")
        } catch (err) {
            console.error("Error sharing to chat:", err)
            toast.error("Không thể gửi bài viết")
        } finally {
            setSending(null)
        }
    }, [sending, sentChats, post])

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <div className="bg-[var(--card)] rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
                    <h2 className="text-lg font-semibold text-[var(--card-foreground)]">
                        Gửi đến đoạn chat
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-[var(--input)] transition-colors text-[var(--muted-foreground)]"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="px-5 py-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm đoạn chat..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Post preview */}
                <div className="mx-5 mb-3 p-3 rounded-xl bg-[var(--background)] border border-[var(--border)]">
                    <div className="flex items-center gap-2">
                        <Avatar
                            src={post.author?.profilePictureUrl}
                            alt={post.author?.username || ""}
                            size={28}
                        />
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-[var(--card-foreground)] truncate">
                                {post.author?.familyName} {post.author?.givenName}
                            </p>
                            <p className="text-xs text-[var(--muted-foreground)] truncate">
                                {post.content?.substring(0, 60) || "Bài viết được chia sẻ"}
                                {post.content?.length > 60 ? "..." : ""}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Chat list */}
                <div className="max-h-[320px] overflow-y-auto px-3 pb-4">
                    {filteredChats.length === 0 ? (
                        <div className="text-center py-8 text-sm text-[var(--muted-foreground)]">
                            {searchQuery ? "Không tìm thấy đoạn chat nào" : "Chưa có đoạn chat nào"}
                        </div>
                    ) : (
                        filteredChats.map((chat) => {
                            const displayName = `${chat.target?.givenName || ""} ${chat.target?.familyName || ""}`.trim() || chat.target?.username || "Unknown"
                            const isOnline = chat.target?.isOnline || false
                            const isSending = sending === chat.chatId
                            const isSent = sentChats.has(chat.chatId)

                            return (
                                <div
                                    key={chat.chatId}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--input)] transition-colors cursor-pointer"
                                    onClick={() => !isSent && handleSendToChat(chat)}
                                >
                                    {/* Avatar with online indicator */}
                                    <div className="relative shrink-0">
                                        <Avatar
                                            src={chat.target?.profilePictureUrl}
                                            alt={displayName}
                                            size={44}
                                        />
                                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[var(--card)] ${isOnline ? "bg-green-500" : "bg-gray-400"}`} />
                                    </div>

                                    {/* Name */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[var(--card-foreground)] truncate">
                                            {displayName}
                                        </p>
                                        {chat.target?.username && (
                                            <p className="text-xs text-[var(--muted-foreground)] truncate">
                                                @{chat.target.username}
                                            </p>
                                        )}
                                    </div>

                                    {/* Send button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            if (!isSent) handleSendToChat(chat)
                                        }}
                                        disabled={isSending || isSent}
                                        className={`shrink-0 flex items-center justify-center px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                                            isSent
                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 cursor-default"
                                                : isSending
                                                    ? "bg-blue-100 text-blue-500 dark:bg-blue-900/30 cursor-wait"
                                                    : "bg-blue-500 text-white hover:bg-blue-600 active:scale-95"
                                        }`}
                                    >
                                        {isSent ? (
                                            "Đã gửi ✓"
                                        ) : isSending ? (
                                            <div className="flex items-center gap-1">
                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500" />
                                                <span>Đang gửi</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1">
                                                <Send className="w-3 h-3" />
                                                <span>Gửi</span>
                                            </div>
                                        )}
                                    </button>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}

export default memo(ShareToChatModal)
