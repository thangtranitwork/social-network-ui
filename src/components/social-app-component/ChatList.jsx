"use client";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronUp, SearchIcon, RefreshCw, Users } from "lucide-react";
import ChatItem from "./ChatItem";
import Avatar from "../ui-components/Avatar";
import Modal from "../ui-components/Modal";
import CreateGroupModal from "./CreateGroupModal";
import { useEffect, useRef, useState } from "react";
import api from "@/utils/axios";
import useAppStore, { selectSortedChatList } from "@/store/ZustandStore";
import { useShallow } from 'zustand/react/shallow';
import { useTranslations } from "next-intl";

export default function ChatList({ onSelectChat, selectedChatId }) {
  const t = useTranslations('chat');
  const tCommon = useTranslations('common');
  const pathname = usePathname();

  // Zustand store
  const chatList = useAppStore(useShallow(selectSortedChatList));
  const { 
    isLoadingChats, 
    fetchChatList, 
    markChatAsRead, 
    refreshChatList, 
    virtualChatUser, 
    clearChatSelection,
    storeError
  } = useAppStore(useShallow(state => ({
    isLoadingChats: state.isLoadingChats,
    fetchChatList: state.fetchChatList,
    markChatAsRead: state.markChatAsRead,
    refreshChatList: state.refreshChatList,
    virtualChatUser: state.virtualChatUser,
    clearChatSelection: state.clearChatSelection,
    storeError: state.error
  })));

  const [expanded, setExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const listRef = useRef(null);
  const isChatsPage = pathname === "/chats";

  // Debug logging
  useEffect(() => {
    console.log(chatList)
    console.log("🔍 ChatList Debug:", {
      chatListLength: chatList.length,
      isLoadingChats,
      fetchAttempted,
      storeError
    });
  }, [chatList.length, isLoadingChats, fetchAttempted, storeError]);

  // MAIN FETCH LOGIC
  useEffect(() => {
    const shouldFetch =
        !fetchAttempted &&
        typeof fetchChatList === 'function';

    if (shouldFetch) {
      console.log("🚀 Fetching chat list...");
      setFetchAttempted(true);

      fetchChatList()
          .then((data) => {
            console.log("✅ Chat list fetched successfully:", data?.length || 0, "chats");
          })
          .catch((error) => {
            console.error("❌ Failed to fetch chat list:", error);
            // Reset on error to allow retry
            setFetchAttempted(false);
          });
    }
  }, [fetchAttempted, fetchChatList]);

  // Auto-expand on chats page
  useEffect(() => {
    if (isChatsPage) setExpanded(true);
  }, [isChatsPage]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (listRef.current && chatList.length > 0) {
      listRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });    }
  }, [chatList]);

  const handleGroupCreated = async (newChatId, newGroup) => {
    if (typeof fetchChatList === "function") {
      await fetchChatList();
    }
    onSelectChat(newChatId, newGroup, { ...newGroup, chatId: newChatId });
  };

  // Improved chat selection handler
  const handleChatSelect = async (chat) => {
    if (typeof markChatAsRead !== 'function') {
      return;
    }

    const chatId = chat.chatId || chat.id;

    console.log("🎯 Selecting chat:", {
      chatId,
      currentNotReadCount: chat.notReadMessageCount
    });

    try {
      await markChatAsRead(chatId);
      onSelectChat(chatId, chat.target, chat);
    } catch (error) {
      console.error("❌ Error selecting chat:", error);
    }
  };

  // Manual refresh handler
  const handleRefresh = async () => {
    if (typeof refreshChatList !== 'function') {
      return;
    }

    console.log("🔄 Manual refresh triggered");
    setFetchAttempted(false); // Reset to allow new fetch

    try {
      await refreshChatList();
      console.log("✅ Manual refresh completed");
    } catch (error) {
      console.error("❌ Manual refresh failed:", error);
    }
  };

  // Debounced search API call
  useEffect(() => {
    if (!searchTerm) {
      setSearchResults(null);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await api.get(`/v1/chat/search`, {
          params: { query: searchTerm },
        });
        setSearchResults(res.data.body || res.data || []);
      } catch (err) {
        console.error("Search failed:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [searchTerm]);

  // If we have a virtualChatUser, and they are not already in the chatList, create a mock chat item
  const mockVirtualChat = virtualChatUser && !chatList.some(
    (c) => c.chatId === virtualChatUser.id || c.id === virtualChatUser.id || c.target?.id === virtualChatUser.id || c.target?.username === virtualChatUser.username
  ) ? {
    chatId: virtualChatUser.id,
    id: virtualChatUser.id,
    target: {
      id: virtualChatUser.id,
      username: virtualChatUser.username,
      givenName: virtualChatUser.givenName,
      familyName: virtualChatUser.familyName,
      profilePictureUrl: virtualChatUser.profilePictureUrl,
      onlineStatus: { isOnline: virtualChatUser.online }
    },
    latestMessage: null,
    notReadMessageCount: 0,
    updatedAt: new Date().toISOString(),
  } : null;

  const baseChats = mockVirtualChat ? [...chatList, mockVirtualChat] : chatList;
  const filteredChats = searchResults ?? baseChats;

  // Create unique chats for collapsed view with online status
  const uniqueChats = [
    ...new Map(
        baseChats.map(chat => [
          chat.target?.userId || chat.target?.id || chat.target?.username,
          chat
        ])
    ).values(),
  ];

  // Count online users
  const onlineCount = uniqueChats.filter(chat =>
      chat.target?.onlineStatus?.isOnline
  ).length;

  // Show loading state when fetching
  if (isLoadingChats) {
    return (
        <div className="space-y-3 p-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-6 w-6 bg-muted rounded" />
          </div>
          {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-muted rounded-lg" />
          ))}
        </div>
    );
  }

  // Enhanced error state with retry
  if (storeError) {
    return (
        <div className="p-4 text-center text-sm">
          <div className="text-destructive mb-2">
            {t("loadError")}
          </div>
          <div className="text-muted-foreground text-xs mb-3">
            {storeError}
          </div>
          <button
              onClick={handleRefresh}
              disabled={isLoadingChats}
              className="flex items-center gap-2 mx-auto px-3 py-1.5 text-primary hover:bg-primary/10 rounded-md transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingChats ? 'animate-spin' : ''}`} />
            {isLoadingChats ? tCommon("loading") : tCommon("retry")}
          </button>
        </div>
    );
  }

  // Enhanced empty state
  if (!isLoadingChats && baseChats.length === 0 && fetchAttempted) {
    return (
        <div className="p-4 text-center text-muted-foreground">
          <div className="mb-2">{t("noConversations")}</div>
          <button
              onClick={handleRefresh}
              className="flex items-center gap-2 mx-auto px-3 py-1.5 text-primary hover:bg-primary/10 rounded-md transition-colors text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            {tCommon("retry")}
          </button>
        </div>
    );
  }

  // Collapsed state (chỉ hiển thị khi không phải trang /chats)
  if (!expanded && !isChatsPage) {
    return (
      <div
        role="button"
        onClick={() => setExpanded(true)}
        className="w-full flex items-center justify-between p-3 bg-[var(--card)] border border-[var(--border)] rounded-2xl cursor-pointer hover:bg-[var(--accent)] transition-colors select-none"
      >
        <div className="flex -space-x-2">
          {uniqueChats.slice(0, 3).map((chat, i) => (
            <div key={i} className="relative">
              <Avatar
                src={chat.isGroup ? chat.avatar : chat.target?.profilePictureUrl}
                size="sm"
                isGroup={chat.isGroup}
                className="border-2 border-[var(--card)] w-9 h-9"
              />
              {!chat.isGroup && chat.target?.onlineStatus?.isOnline && (
                <div className="absolute bottom-0 right-0">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[var(--card)]" />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-2">
          {onlineCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span>{onlineCount} {t("online")}</span>
            </div>
          )}
          <span className="text-sm text-muted-foreground font-medium">
            {baseChats.length > 3 ? t("moreChats", { count: baseChats.length - 3 }) : t("chatsCount", { count: baseChats.length })}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Expanded / full-page state (dùng cho trang /chats)
  return (
    <div className="w-full bg-[var(--background)] flex flex-col h-full">
      {/* Header - chỉ hiển thị khi không phải trang /chats */}
      {!isChatsPage && (
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">{t("messages")}</h3>
            {onlineCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                <span>{onlineCount} {t("online")}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={handleRefresh} disabled={isLoadingChats}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-[var(--accent)] rounded-full transition-colors disabled:opacity-50">
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingChats ? "animate-spin" : ""}`} />
            </button>
            <button onClick={() => setExpanded(false)}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-[var(--accent)] rounded-full transition-colors">
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Search + Create Group */}
      <div className="px-3 py-2 border-b border-[var(--border)] shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--accent)] border border-transparent focus:border-[var(--border)] rounded-xl outline-none text-[var(--foreground)] placeholder-muted-foreground transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setIsCreateGroupOpen(true)}
            className="p-2 bg-[var(--accent)] hover:bg-blue-500 hover:text-white text-foreground rounded-xl transition-colors border border-[var(--border)]"
            title={t("createGroup")}
          >
            <Users className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto"
      >
        {filteredChats.length > 0 ? (
          [...filteredChats].reverse().map((chat) => (
            <div key={chat.chatId}>
              <ChatItem
                chat={chat}
                selected={selectedChatId === chat.chatId || (selectedChatId === null && virtualChatUser && (chat.chatId === virtualChatUser.id || chat.target?.id === virtualChatUser.id))}
                onClick={() => handleChatSelect(chat)}
              />
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-muted-foreground text-sm">
            {isSearching ? t("searching") : searchTerm ? t("noMatches") : t("noConversations")}
          </div>
        )}
      </div>

      <Modal isOpen={isCreateGroupOpen} onClose={() => setIsCreateGroupOpen(false)} size="small">
        <CreateGroupModal
          onClose={() => setIsCreateGroupOpen(false)}
          onChatCreated={handleGroupCreated}
        />
      </Modal>
    </div>
  );
}