"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronDown, ChevronUp, SearchIcon, RefreshCw, Users, ArrowLeft,
} from "lucide-react";
import ChatItem from "./ChatItem";
import Avatar from "../ui-components/Avatar";
import Modal from "../ui-components/Modal";
import CreateGroupModal from "./CreateGroupModal";
import Chatbox from "./ChatBox";
import api from "@/utils/axios";
import useAppStore, { selectSortedChatList } from "@/store/ZustandStore";
import { useShallow } from "zustand/react/shallow";
import { useTranslations } from "next-intl";

// ── constants ──────────────────────────────────────────────
const DEFAULT_W = 440;
const DEFAULT_H = 580;
const MIN_W = 320;
const MIN_H = 400;
const MAX_W = 640;
const MAX_H = 800;
const RIGHT_OFFSET = 24; // px from right edge

export default function FloatingChatWidget({ beToken }) {
  const t = useTranslations("chat");
  const tCommon = useTranslations("common");

  // ── Zustand ────────────────────────────────────────────────
  const chatList = useAppStore(useShallow(selectSortedChatList));
  const {
    isLoadingChats, fetchChatList, markChatAsRead, refreshChatList,
    virtualChatUser, storeError,
  } = useAppStore(useShallow((s) => ({
    isLoadingChats: s.isLoadingChats,
    fetchChatList: s.fetchChatList,
    markChatAsRead: s.markChatAsRead,
    refreshChatList: s.refreshChatList,
    virtualChatUser: s.virtualChatUser,
    storeError: s.error,
  })));

  // ── UI state ───────────────────────────────────────────────
  const [expanded, setExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  // ── Active chat - managed INSIDE widget so position never resets ──
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeTargetUser, setActiveTargetUser] = useState(null);

  // ── Drag / Resize ──────────────────────────────────────────
  // position: offset RIGHT and BOTTOM from viewport edge
  const [pos, setPos] = useState({ right: RIGHT_OFFSET, bottom: 0 });
  const [size, setSize] = useState({ w: DEFAULT_W, h: DEFAULT_H });
  const dragging = useRef(false);
  const resizing = useRef(false);
  const dragOrigin = useRef({});
  const resizeOrigin = useRef({});

  // ── Fetch ──────────────────────────────────────────────────
  useEffect(() => {
    if (!fetchAttempted && typeof fetchChatList === "function") {
      setFetchAttempted(true);
      fetchChatList().catch(() => setFetchAttempted(false));
    }
  }, [fetchAttempted, fetchChatList]);

  // ── Search ─────────────────────────────────────────────────
  useEffect(() => {
    if (!searchTerm) { setSearchResults(null); return; }
    const id = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await api.get("/v1/chat/search", { params: { query: searchTerm } });
        setSearchResults(res.data.body || res.data || []);
      } catch { setSearchResults([]); }
      finally { setIsSearching(false); }
    }, 800);
    return () => clearTimeout(id);
  }, [searchTerm]);

  // ── Drag ───────────────────────────────────────────────────
  const onDragDown = useCallback((e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    dragging.current = true;
    dragOrigin.current = {
      mx: e.clientX, my: e.clientY,
      right: pos.right, bottom: pos.bottom,
    };
    const onMove = (e) => {
      if (!dragging.current) return;
      const dx = e.clientX - dragOrigin.current.mx;
      const dy = e.clientY - dragOrigin.current.my;
      setPos({
        right: Math.max(0, dragOrigin.current.right - dx),
        bottom: Math.max(0, dragOrigin.current.bottom - dy),
      });
    };
    const onUp = () => {
      dragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [pos]);

  // ── Resize (top-left handle) ───────────────────────────────
  const onResizeDown = useCallback((e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    resizing.current = true;
    resizeOrigin.current = { mx: e.clientX, my: e.clientY, w: size.w, h: size.h };
    const onMove = (e) => {
      if (!resizing.current) return;
      const dx = e.clientX - resizeOrigin.current.mx;
      const dy = e.clientY - resizeOrigin.current.my;
      setSize({
        w: Math.min(MAX_W, Math.max(MIN_W, resizeOrigin.current.w - dx)),
        h: Math.min(MAX_H, Math.max(MIN_H, resizeOrigin.current.h - dy)),
      });
    };
    const onUp = () => {
      resizing.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [size]);

  // ── Chat selection ─────────────────────────────────────────
  const handleChatSelect = async (chat) => {
    const chatId = chat.chatId || chat.id;
    try { await markChatAsRead(chatId); } catch {}
    setActiveChatId(chatId);
    // Group chat: no `target`, use group metadata
    if (chat.isGroup) {
      setActiveTargetUser({
        isGroup: true,
        name: chat.name,
        avatar: chat.avatar,
        adminId: chat.adminId,
      });
    } else {
      setActiveTargetUser(chat.target || null);
    }
    setSearchTerm("");
    setSearchResults(null);
  };

  const handleBack = () => {
    setActiveChatId(null);
    setActiveTargetUser(null);
  };

  const handleChatCreated = async (newChatId, targetUser) => {
    if (typeof fetchChatList === "function") await fetchChatList();
    setActiveChatId(newChatId);
    setActiveTargetUser(targetUser);
  };

  const handleGroupCreated = async (newChatId, newGroup) => {
    if (typeof fetchChatList === "function") await fetchChatList();
    setActiveChatId(newChatId);
    setActiveTargetUser({ isGroup: true, name: newGroup.name, avatar: newGroup.avatar, adminId: newGroup.adminId });
    setIsCreateGroupOpen(false);
  };

  const handleRefresh = async () => {
    setFetchAttempted(false);
    try { await refreshChatList(); } catch {}
  };

  // ── Derived data ───────────────────────────────────────────
  const mockVirtualChat = virtualChatUser && !chatList.some(
    (c) => c.chatId === virtualChatUser.id || c.target?.id === virtualChatUser.id
  ) ? {
    chatId: virtualChatUser.id,
    target: { id: virtualChatUser.id, username: virtualChatUser.username, givenName: virtualChatUser.givenName, familyName: virtualChatUser.familyName, profilePictureUrl: virtualChatUser.profilePictureUrl },
    latestMessage: null, notReadMessageCount: 0, updatedAt: new Date().toISOString(),
  } : null;

  const baseChats = mockVirtualChat ? [...chatList, mockVirtualChat] : chatList;
  const filteredChats = searchResults ?? baseChats;
  const uniqueChats = [...new Map(baseChats.map((c) => [c.chatId || c.id, c])).values()];
  const onlineCount = uniqueChats.filter((c) => c.target?.onlineStatus?.isOnline).length;

  // ─────────────────────────────────────────────────────────
  // COLLAPSED PILL
  // ─────────────────────────────────────────────────────────
  if (!expanded) {
    return (
      <div
        className="hidden md:flex items-center justify-between px-3 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-full cursor-pointer shadow-lg hover:shadow-xl transition-shadow duration-200 select-none"
        style={{ position: "fixed", bottom: pos.bottom + 24, right: pos.right, minWidth: 220, zIndex: 40 }}
        onClick={() => setExpanded(true)}
        role="button"
      >
        <div className="flex -space-x-2">
          {uniqueChats.slice(0, 3).map((chat, i) => (
            <div key={i} className="relative">
              <Avatar
                src={chat.isGroup ? chat.avatar : chat.target?.profilePictureUrl}
                size="sm"
                isGroup={chat.isGroup}
                className="border-2 border-[var(--card)] w-8 h-8"
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
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span>{onlineCount}</span>
            </div>
          )}
          <span className="text-xs text-[var(--foreground)] font-medium">
            {baseChats.length > 3
              ? t("moreChats", { count: baseChats.length - 3 })
              : t("chatsCount", { count: baseChats.length })}
          </span>
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // EXPANDED PANEL - single container, no remount on chat switch
  // ─────────────────────────────────────────────────────────
  return (
    <>
      <div
        className="hidden md:flex flex-col bg-[var(--card)] border border-[var(--border)] rounded-t-2xl shadow-2xl overflow-hidden"
        style={{
          position: "fixed",
          bottom: pos.bottom,
          right: pos.right,
          width: size.w,
          height: size.h,
          zIndex: 40,
        }}
      >
        {/* ── Resize handle (top-left) ── */}
        <div
          onMouseDown={onResizeDown}
          className="absolute top-0 left-0 w-6 h-6 cursor-nw-resize z-10 group flex items-start justify-start p-1"
          title="Kéo để thay đổi kích thước"
        >
          <div className="w-3 h-3 border-t-2 border-l-2 border-[var(--border)] group-hover:border-blue-400 transition-colors rounded-tl" />
        </div>

        {/* ── Header (drag handle) ── */}
        <div
          onMouseDown={onDragDown}
          className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] cursor-grab active:cursor-grabbing select-none shrink-0 bg-[var(--card)]"
          style={{ touchAction: "none" }}
        >
          <div className="flex items-center gap-2" onMouseDown={(e) => e.stopPropagation()}>
            {activeChatId && (
              <button
                onClick={handleBack}
                className="p-1 text-muted-foreground hover:text-foreground hover:bg-[var(--accent)] rounded-full transition-colors"
                title={tCommon("back")}
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <h3 className="font-semibold text-sm">
              {activeChatId && activeTargetUser
                ? (activeTargetUser.isGroup
                    ? activeTargetUser.name
                    : `${activeTargetUser.givenName || ""} ${activeTargetUser.familyName || ""}`.trim() || activeTargetUser.username)
                : t("messages")}
            </h3>
            {!activeChatId && onlineCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span>{onlineCount} {t("online")}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
            {!activeChatId && (
              <>
                <button
                  onClick={handleRefresh}
                  disabled={isLoadingChats}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-[var(--accent)] rounded-full transition-colors disabled:opacity-50"
                  title={tCommon("refresh")}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoadingChats ? "animate-spin" : ""}`} />
                </button>
                <button
                  onClick={() => setIsCreateGroupOpen(true)}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-[var(--accent)] rounded-full transition-colors"
                  title={t("createGroup")}
                >
                  <Users className="h-3.5 w-3.5" />
                </button>
              </>
            )}
            <button
              onClick={() => setExpanded(false)}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-[var(--accent)] rounded-full transition-colors"
              title="Thu nhỏ"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* ── Body: Chat list OR Chatbox ── */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeChatId && activeTargetUser ? (
            // ── Chatbox ──
            <Chatbox
              chatId={activeChatId}
              targetUser={activeTargetUser}
              onBack={handleBack}
              onChatCreated={handleChatCreated}
              beToken={beToken}
              recipientId={activeTargetUser?.id || activeTargetUser?.userId}
              // Ẩn header của Chatbox vì widget đã có header riêng
              hideHeader={true}
            />
          ) : (
            // ── Chat list ──
            <div className="flex flex-col h-full">
              {/* Search */}
              <div className="px-3 py-2 border-b border-[var(--border)] shrink-0">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={t("searchPlaceholder")}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--accent)] border border-transparent focus:border-[var(--border)] rounded-full outline-none text-[var(--foreground)] placeholder-muted-foreground transition-colors"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto">
                {isLoadingChats ? (
                  <div className="p-4 space-y-2 animate-pulse">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-12 bg-[var(--accent)] rounded-xl" />
                    ))}
                  </div>
                ) : storeError ? (
                  <div className="p-4 text-center text-xs text-destructive">
                    {t("loadError")}
                    <button onClick={handleRefresh} className="block mx-auto mt-2 text-primary hover:underline">
                      {tCommon("retry")}
                    </button>
                  </div>
                ) : filteredChats.length > 0 ? (
                  [...filteredChats].reverse().map((chat) => (
                    <ChatItem
                      key={chat.chatId}
                      chat={chat}
                      selected={activeChatId === chat.chatId}
                      onClick={() => handleChatSelect(chat)}
                    />
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    {isSearching ? t("searching") : searchTerm ? t("noMatches") : t("noConversations")}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isCreateGroupOpen} onClose={() => setIsCreateGroupOpen(false)} size="small">
        <CreateGroupModal
          onClose={() => setIsCreateGroupOpen(false)}
          onChatCreated={handleGroupCreated}
        />
      </Modal>
    </>
  );
}
