"use client";

import { useState, useEffect } from "react";
import ChatList from "@/components/social-app-component/ChatList";
import ChatBox from "@/components/social-app-component/ChatBox";
import useAppStore from "@/store/ZustandStore";
import useIsMobile from "@/hooks/useIsMobile";
import { pageMetadata, usePageMetadata } from "@/utils/clientMetadata";
import { useSearchParams, useRouter } from "next/navigation";

export default function ChatLayoutInner() {
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [targetUser, setTargetUser] = useState(null);
  const [chatListKey, setChatListKey] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);

  const searchParams = useSearchParams();
  const router = useRouter();
  const isMobile = useIsMobile();

  const chatIdFromUrl = searchParams.get("chatId");

  const chatList = useAppStore((state) => state.chatList);
  const fetchChatList = useAppStore((state) => state.fetchChatList);
  const clearChatSelection = useAppStore((state) => state.clearChatSelection);

  usePageMetadata(pageMetadata.chats());

  useEffect(() => {
    const timer = setTimeout(() => setIsInitializing(false), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (chatIdFromUrl && chatList.length > 0) {
      const selectedChat = chatList.find(
        (chat) => chat.chatId === chatIdFromUrl || chat.id === chatIdFromUrl
      );
      if (selectedChat) {
        setSelectedChatId(chatIdFromUrl);
        setTargetUser(selectedChat.target);
      }
    } else {
      setSelectedChatId(null);
      setTargetUser(null);
    }
  }, [chatIdFromUrl, chatList]);

  const handleSelectChat = (chatId, user) => {
    const params = new URLSearchParams(window.location.search);
    params.set("chatId", chatId);
    router.push(`/chats?${params.toString()}`, { scroll: false });
    setSelectedChatId(chatId);
    setTargetUser(user);
  };

  const handleChatCreated = async (newChatId, user) => {
    try {
      await fetchChatList();
      const params = new URLSearchParams(window.location.search);
      params.set("chatId", newChatId);
      router.push(`/chats?${params.toString()}`, { scroll: false });
      setSelectedChatId(newChatId);
      setTargetUser(user);
      setChatListKey((prev) => prev + 1);
    } catch (error) {
      console.error("❌ Error in chat creation flow:", error);
    }
  };

  const handleBackToList = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete("chatId");
    router.push(`/chats${params.toString() ? `?${params.toString()}` : ""}`, {
      scroll: false,
    });
    clearChatSelection();
    setSelectedChatId(null);
    setTargetUser(null);
  };

  const shouldShowChatList = !targetUser || !isMobile;
  const shouldShowChatBox = !!targetUser;
  const shouldShowChatSkeleton = !targetUser && !isMobile;

  if (isInitializing) {
    return (
      <div className="pt-16 flex h-[calc(100vh-64px)] bg-[var(--background)] text-[var(--foreground)] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="md:mt-16 flex h-[calc(100vh-64px)] bg-[var(--background)] text-[var(--foreground)] transition-colors duration-500 p-2 sm:p-4 gap-4">
      {shouldShowChatList && (
        <aside className="w-full md:w-[40%] lg:w-[340px] h-full md:h-auto max-h-[calc(100vh-72px)] md:max-h-none rounded-2xl bg-[var(--card)] border border-[var(--border)] p-2 md:p-4 overflow-y-auto shadow-sm">
          <ChatList
            key={chatListKey}
            onSelectChat={handleSelectChat}
            selectedChatId={selectedChatId}
          />
        </aside>
      )}

      {shouldShowChatBox && (
        <main className="w-full md:w-[60%] md:flex-1 rounded-2xl bg-[var(--card)] border border-[var(--border)] overflow-y-auto shadow-sm">
          <ChatBox
            chatId={selectedChatId}
            targetUser={targetUser}
            onBack={handleBackToList}
            onChatCreated={handleChatCreated}
          />
        </main>
      )}

      {shouldShowChatSkeleton && (
        <main className="w-full md:h-full md:w-[60%] md:flex-1 rounded-2xl bg-[var(--card)] border border-[var(--border)] overflow-y-auto shadow-sm">
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="mb-6">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-blue-500 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
              Chưa có cuộc trò chuyện được chọn
            </h3>
            <p className="text-[var(--muted-foreground)] mb-4 max-w-md">
              Chọn một cuộc trò chuyện từ danh sách bên trái hoặc bắt đầu cuộc trò chuyện mới để bắt đầu nhắn tin.
            </p>
          </div>
        </main>
      )}
    </div>
  );
}
