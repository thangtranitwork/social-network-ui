"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import api, { isTokenValid } from "@/utils/axios";
import { 
  getStompClient, 
  subscribe, 
  unsubscribe, 
  isConnected,
  connect,
  sendMessage
} from "@/utils/socket";
import useAppStore from "@/store/ZustandStore";
import { decryptRatchetMessage } from "@/utils/e2ee/doubleRatchet";
import { decryptGroupMessage, getOrCreateOwnGroupSenderKey } from "@/utils/e2ee/senderKeys";
import { initializeUserKeys } from "@/utils/e2ee/x3dh";
import { getCachedPlaintext } from "@/utils/e2ee/plaintextCache";

export default function useChat(chatId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalMessages, setTotalMessages] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  // ✅ Thêm state cho typing notifications
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsersMap, setTypingUsersMap] = useState({});
  const typingTimeoutRef = useRef(null);
  const messagesRef = useRef([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Refs để track subscription
  const subscriptionRef = useRef(null);
  const subscribedChatIdRef = useRef(null);
  const reconnectIntervalRef = useRef(null);

  // Get userId từ localStorage
  useEffect(() => {
    const uid = localStorage.getItem("userId");
    if (uid) setCurrentUserId(uid);
  }, []);

  // Hàm helper để cập nhật chatList
  const updateChatList = useCallback((newMessage) => {
    useAppStore.getState().onMessageReceived({ ...newMessage, chatId });
  }, [chatId]);

  // ✅ Xử lý typing notifications
  const handleTypingNotification = useCallback((data) => {
    // Chỉ xử lý typing của người khác, không phải của mình
    if (data.id === currentUserId) {
      return;
    }

    if (data.command === "TYPING") {
      let resolvedName = data.name;
      if (!resolvedName && data.id) {
        const matchedMsg = messagesRef.current.find((m) => m.sender?.id === data.id);
        if (matchedMsg?.sender) {
          const s = matchedMsg.sender;
          resolvedName =
            matchedMsg.senderName ||
            (s.familyName || s.givenName
              ? `${s.familyName || ""} ${s.givenName || ""}`.trim()
              : s.username);
        }
      }
      setTypingUsersMap((prev) => ({
        ...prev,
        [data.id || "peer"]: resolvedName || "Ai đó",
      }));
      setIsTyping(true);
    } else if (data.command === "STOP_TYPING") {
      setTypingUsersMap((prev) => {
        const next = { ...prev };
        delete next[data.id || "peer"];
        const stillTyping = Object.keys(next).length > 0;
        setIsTyping(stillTyping);
        return next;
      });
    }
  }, [currentUserId]);

  // ✅ NEW: Xử lý block/unblock notifications
  const handleBlockNotification = useCallback((data) => {
    console.log("🚫 Block notification received:", data);
    
    // Cập nhật blockStatus trong store
    const { updateBlockStatus } = useAppStore.getState();
    
    if (data.command === "HAS_BEEN_BLOCKED") {
      updateBlockStatus(chatId, {
        blockStatus: "HAS_BEEN_BLOCKED",
        blockedAt: data.blockedAt || new Date().toISOString(),
        blockReason: data.blockReason || "Blocked by user"
      });
      console.log(`🚫 Updated blockStatus to HAS_BEEN_BLOCKED for chat ${chatId}`);
    } else if (data.command === "HAS_BEEN_UNBLOCKED") {
      updateBlockStatus(chatId, {
        blockStatus: "NORMAL",
        blockedAt: null,
        blockReason: null
      });
      console.log(`✅ Updated blockStatus to NORMAL for chat ${chatId}`);
    }
  }, [chatId]);

  // UPDATED: Xử lý READING notifications
  const handleReadingNotification = useCallback((data) => {
    if (!data?.id) return;

    const readerUser = data.user || { id: data.id };

    setMessages((prevMessages) => {
      return prevMessages.map((message) => {
        const existingReadBy = Array.isArray(message.readBy) ? message.readBy : [];
        const isSender = message.sender?.id === data.id;
        const alreadyInReadBy = existingReadBy.some((r) => r?.id === data.id);

        const updatedReadBy =
          !isSender && !alreadyInReadBy
            ? [...existingReadBy, readerUser]
            : existingReadBy.map((r) => (r?.id === data.id && data.user ? data.user : r));

        return {
          ...message,
          isRead: data.id !== currentUserId ? true : message.isRead,
          readBy: updatedReadBy,
        };
      });
    });
  }, [currentUserId]);

  // Xử lý message nhận được từ WebSocket
  const handleMessage = useCallback((message) => {
    try {
      const data = JSON.parse(message.body);

      // ✅ Handle system commands (except message mutations like DELETE and EDIT)
      if (data.command && data.command !== "DELETE" && data.command !== "EDIT") {
        if (data.command === "TYPING" || data.command === "STOP_TYPING") {
          handleTypingNotification(data);
        } else if (data.command === "HAS_BEEN_BLOCKED" || data.command === "HAS_BEEN_UNBLOCKED") {
          handleBlockNotification(data);
        } else if (data.command === "READING") {
          console.log("👁️ READING received:", data);
          handleReadingNotification(data);
        } else if (data.command === "GROUP_UPDATED") {
          const store = useAppStore.getState();
          if (store.updateChat) {
            store.updateChat(data.chatId, {
              ...(data.name ? { name: data.name } : {}),
              ...(data.avatar ? { avatar: data.avatar } : {}),
            });
          }
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("group_chat_updated", { detail: data }));
          }
        }
        return;
      }

      if (data.command === "DELETE") {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.id ? { ...msg, content: "[Tin nhắn đã bị xóa]", deleted: true } : msg
          )
        );
        return;
      }

      if (data.command === "EDIT") {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.id
              ? { ...msg, content: data.message, updated: true, editedAt: data.editedAt || new Date().toISOString() }
              : msg
          )
        );
        return;
      }

      // NEW MESSAGE
      let newMessage = { ...data, isOwnMessage: data.sender?.id === currentUserId };
      console.log("📩 Processing new message:", newMessage);
      console.log("🆔 Current userId:", currentUserId);
      console.log("🆔 Sender ID:", data.sender?.id);

      // 🔐 E2EE Decryption Layer on Incoming Message
      if (newMessage.isEncrypted && newMessage.content && newMessage.e2eHeader) {
        const rawCiphertext = newMessage.content;
        newMessage.rawCiphertext = rawCiphertext;
        const cached = getCachedPlaintext(rawCiphertext);
        if (cached) {
          newMessage.content = cached;
          newMessage.isDecrypted = true;
        } else {
          newMessage.isDecrypted = false;
          (async () => {
            try {
              let decryptedText = rawCiphertext;
              if (newMessage.e2eHeader.algorithm === "SENDER_KEY_V1") {
                decryptedText = await decryptGroupMessage(chatId, newMessage.sender?.id, rawCiphertext, newMessage.e2eHeader);
              } else {
                decryptedText = await decryptRatchetMessage(newMessage.sender?.id, rawCiphertext, newMessage.e2eHeader);
              }
              setMessages((prev) =>
                prev.map((m) => (m.id === newMessage.id ? { ...m, content: decryptedText, isDecrypted: true } : m))
              );
              updateChatList({ ...newMessage, content: decryptedText, isDecrypted: true });
            } catch (decryptErr) {
              console.warn("⚠️ Could not decrypt incoming message in real-time:", decryptErr);
              setMessages((prev) =>
                prev.map((m) => (m.id === newMessage.id ? { ...m, content: "🔒 Tin nhắn không thể giải mã", isDecrypted: false, rawCiphertext } : m))
              );
            }
          })();
        }
      }
      
      // ✅ Khi nhận được tin nhắn mới, ẩn typing indicator của người gửi & gửi READING nếu đang mở chat
      if (!newMessage.isOwnMessage) {
        const senderId = newMessage.sender?.id;
        setTypingUsersMap((prev) => {
          const next = { ...prev };
          if (senderId) delete next[senderId];
          delete next["peer"];
          const stillTyping = Object.keys(next).length > 0;
          setIsTyping(stillTyping);
          return next;
        });
        if (chatId && isConnected()) {
          sendMessage(`/chat/${chatId}`, { command: "READING", chatId });
        }
        useAppStore.getState().markChatAsRead(chatId);
      }
      
      // Cập nhật messages state - thêm vào đầu mảng (tin nhắn mới nhất)
      setMessages((prev) => {
        if (prev.some(m => m.id === newMessage.id)) {
          return prev.map(m => m.id === newMessage.id ? newMessage : m);
        }
        const newMessages = [newMessage, ...prev];
        return newMessages;
      });

      // Cập nhật chatList ngay lập tức
      requestAnimationFrame(() => {
        updateChatList(newMessage);
      });

    } catch (err) {
      console.error("❌ Error parsing message:", err);
    }
  }, [currentUserId, updateChatList, handleTypingNotification, handleBlockNotification, handleReadingNotification, chatId]);

  // Decrypt an array of messages
  const decryptMessageBatch = useCallback(async (msgList) => {
    await initializeUserKeys();
    const hasGroupMsg = msgList.some((m) => m.e2eHeader?.algorithm === "SENDER_KEY_V1");
    const chatInfo = useAppStore.getState().chatMap?.[chatId];
    if (chatId && (hasGroupMsg || chatInfo?.isGroup || chatInfo?.chatType === "GROUP")) {
      try {
        await getOrCreateOwnGroupSenderKey(chatId);
      } catch (e) {
        console.warn("Could not pre-sync own group sender key:", e);
      }
    }

    return Promise.all(
      msgList.map(async (msg) => {
        const cipher = msg.rawCiphertext || msg.content;
        if (!msg.isEncrypted || !cipher || !msg.e2eHeader) {
          return msg;
        }
        const cached = getCachedPlaintext(cipher);
        if (cached) {
          return { ...msg, rawCiphertext: cipher, content: cached, isDecrypted: true };
        }
        try {
          let decryptedText = cipher;
          if (msg.e2eHeader.algorithm === "SENDER_KEY_V1") {
            decryptedText = await decryptGroupMessage(chatId, msg.sender?.id, cipher, msg.e2eHeader);
          } else {
            decryptedText = await decryptRatchetMessage(msg.sender?.id, cipher, msg.e2eHeader);
          }
          return { ...msg, rawCiphertext: cipher, content: decryptedText, isDecrypted: true };
        } catch (e) {
          console.warn(`Could not decrypt message ${msg.id}:`, e);
          return { ...msg, rawCiphertext: cipher, content: "🔒 Tin nhắn không thể giải mã", isDecrypted: false };
        }
      })
    );
  }, [chatId]);

  const retryCountRef = useRef(0);
  useEffect(() => {
    retryCountRef.current = 0;
  }, [chatId]);

  // Auto-retry undecrypted messages when peer keys finish syncing to server
  useEffect(() => {
    const hasUndecrypted = messages.some((m) => m.isEncrypted && m.isDecrypted === false && m.rawCiphertext);
    if (!hasUndecrypted || retryCountRef.current >= 4) return;

    const timer = setTimeout(async () => {
      retryCountRef.current += 1;
      try {
        await getOrCreateOwnGroupSenderKey(chatId);
        const reDecrypted = await decryptMessageBatch(messages);
        const improved = reDecrypted.some((m, idx) => m.isDecrypted && !messages[idx]?.isDecrypted);
        if (improved) {
          setMessages(reDecrypted);
          const newest = reDecrypted[0];
          if (newest?.isDecrypted) {
            updateChatList(newest);
          }
        }
      } catch (e) {
        // Ignore retry error
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [messages, chatId, decryptMessageBatch, updateChatList]);

  // Load messages lần đầu khi chatId thay đổi
  useEffect(() => {
    if (!chatId) return;

    let isSubscribed = true;

    const fetchInitialMessages = async () => {
      try {
        setLoading(true);
        setMessages([]);
        setHasMore(true);
        setTotalMessages(0);
        
        // Reset typing state khi chuyển chat
        setIsTyping(false);
        setTypingUsersMap({});
        
        const limit = 20;
        const skip = 0;
        
        const res = await api.get(`/v1/chat/messages/${chatId}?skip=${skip}&limit=${limit}`);
        if (!isSubscribed) return;
        const fetchedMessages = res.data.body || [];

        // Decrypt batch hoàn chỉnh trước khi cập nhật state messages
        const decryptedMessages = await decryptMessageBatch(fetchedMessages);
        if (!isSubscribed) return;
        
        setMessages(decryptedMessages);
        setTotalMessages(decryptedMessages.length);
        setHasMore(decryptedMessages.length === limit);
        
        console.log(`📨 Loaded initial messages: ${decryptedMessages.length}, hasMore=${decryptedMessages.length === limit}`);
      } catch (err) {
        if (!isSubscribed) return;
        console.error("❌ Lỗi tải tin nhắn:", err);
        setMessages([]);
        setHasMore(false);
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    fetchInitialMessages();

    return () => {
      isSubscribed = false;
    };
  }, [chatId, currentUserId, decryptMessageBatch]);

  // Load more messages (infinity scroll)
  const loadMoreMessages = useCallback(async () => {
    if (!chatId || loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      
      const limit = 20;
      const currentCount = messages.length;
      const skip = currentCount;
      
      console.log(`📨 Loading more messages: currentCount=${currentCount}, skip=${skip}`);
      
      const res = await api.get(`/v1/chat/messages/${chatId}?skip=${skip}&limit=${limit}`);
      const olderMessages = res.data.body || [];
      
      if (olderMessages.length > 0) {
        const decryptedOlder = await decryptMessageBatch(olderMessages);
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newUnique = decryptedOlder.filter(m => !existingIds.has(m.id));
          return [...prev, ...newUnique];
        });
        setTotalMessages(prev => prev + decryptedOlder.length);
        setHasMore(decryptedOlder.length === limit);
        
        console.log(`📨 Loaded ${decryptedOlder.length} more messages, hasMore=${decryptedOlder.length === limit}`);
      } else {
        setHasMore(false);
        console.log(`📨 No more messages to load`);
      }
    } catch (err) {
      console.error("❌ Lỗi load thêm tin nhắn:", err);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [chatId, messages.length, loadingMore, hasMore, decryptMessageBatch]);

  // Quản lý WebSocket subscription với singleton client
  useEffect(() => {
    if (!chatId || !currentUserId) return;

    if (subscribedChatIdRef.current === chatId && subscriptionRef.current) {
      console.log(`✅ Already subscribed to chat:${chatId}`);
      return;
    }

    if (subscriptionRef.current && subscribedChatIdRef.current) {
      console.log(`🧹 Unsubscribing from previous chat:${subscribedChatIdRef.current}`);
      unsubscribe(`/chat/${subscribedChatIdRef.current}`);
      subscriptionRef.current = null;
      subscribedChatIdRef.current = null;
    }

    const subscribeToChat = async () => {
      try {
        console.log(`🔌 Subscribing to chat:${chatId}...`);
        setConnectionStatus('connecting');

        await getStompClient();
        
        const subscription = await subscribe(`/chat/${chatId}`, handleMessage);
        
        if (subscription) {
          subscriptionRef.current = subscription;
          subscribedChatIdRef.current = chatId;
          setConnectionStatus('connected');
          console.log(`✅ Successfully subscribed to chat:${chatId}`);
        } else {
          setConnectionStatus('error');
          console.error(`❌ Failed to subscribe to chat:${chatId}`);
        }
      } catch (error) {
        setConnectionStatus('error');
        console.error(`❌ Error subscribing to chat:${chatId}:`, error);
      }
    };

    subscribeToChat();

    reconnectIntervalRef.current = setInterval(async () => {
      const connected = isConnected();
      
      if (!connected && isTokenValid()) {
        console.log(`🔁 Reconnecting to chat:${chatId}...`);
        setConnectionStatus('reconnecting');
        
        try {
          await connect();
          
          if (isConnected()) {
            const subscription = await subscribe(`/chat/${chatId}`, handleMessage);
            if (subscription) {
              subscriptionRef.current = subscription;
              subscribedChatIdRef.current = chatId;
              setConnectionStatus('connected');
              console.log(`✅ Reconnected and resubscribed to chat:${chatId}`);
            }
          }
        } catch (error) {
          setConnectionStatus('error');
          console.error(`❌ Reconnection failed for chat:${chatId}:`, error);
        }
      } else {
        setConnectionStatus(connected ? 'connected' : 'disconnected');
        console.log(
          `[chat:${chatId}] Status: ${connected ? "✅ connected" : "❌ disconnected"}`
        );
      }
    }, 15000);

    return () => {
      console.log(`🧹 Cleaning up chat:${chatId} subscription...`);
      
      if (subscriptionRef.current && subscribedChatIdRef.current === chatId) {
        unsubscribe(`/chat/${chatId}`);
        subscriptionRef.current = null;
        subscribedChatIdRef.current = null;
      }
      
      if (reconnectIntervalRef.current) {
        clearInterval(reconnectIntervalRef.current);
        reconnectIntervalRef.current = null;
      }
      
      // ✅ Cleanup typing state
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      
      setConnectionStatus('disconnected');
    };
  }, [chatId, currentUserId, handleMessage]);

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current && subscribedChatIdRef.current) {
        console.log(`🧹 Component unmounting, cleaning up chat:${subscribedChatIdRef.current}`);
        unsubscribe(`/chat/${subscribedChatIdRef.current}`);
      }
      
      if (reconnectIntervalRef.current) {
        clearInterval(reconnectIntervalRef.current);
      }
      
      // ✅ Cleanup typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Utility function để force reconnect
  const forceReconnect = useCallback(async () => {
    if (!chatId) return;
    
    console.log(`🔄 Force reconnecting to chat:${chatId}...`);
    setConnectionStatus('connecting');
    
    try {
      if (subscriptionRef.current) {
        unsubscribe(`/chat/${chatId}`);
        subscriptionRef.current = null;
        subscribedChatIdRef.current = null;
      }
      
      await connect();
      
      const subscription = await subscribe(`/chat/${chatId}`, handleMessage);
      if (subscription) {
        subscriptionRef.current = subscription;
        subscribedChatIdRef.current = chatId;
        setConnectionStatus('connected');
        console.log(`✅ Force reconnected to chat:${chatId}`);
      } else {
        setConnectionStatus('error');
      }
    } catch (error) {
      setConnectionStatus('error');
      console.error(`❌ Force reconnect failed:`, error);
    }
  }, [chatId, handleMessage]);

  const typingNames = Object.values(typingUsersMap).filter(Boolean);
  const typingUser =
    typingNames.length > 0
      ? { displayName: typingNames.join(", ") }
      : null;

  return { 
    messages, 
    loading, 
    loadingMore,
    hasMore,
    totalMessages,
    currentUserId,
    connectionStatus,
    loadMoreMessages,
    forceReconnect,
    // ✅ Thêm typing states
    isTyping,
    typingUser,
  };
}