import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import api from '@/utils/axios';

// Event constants
export const STORE_EVENTS = {
  CHAT_LIST_LOAD: 'chat_list_load',
  CHAT_CREATED: 'chat_created',
  MESSAGE_RECEIVED: 'message_received',
  NOTIFICATION_RECEIVED: 'notification_received',
  NOTIFICATIONS_LOAD: 'notifications_load',
  UNREAD_COUNT_LOAD: 'unread_count_load',
  NEWSFEED_LOAD: 'newsfeed_load',
  POST_CREATED: 'post_created',
  SEARCH_PERFORMED: 'search_performed',
  UNREAD_MESSAGE_COUNT_UPDATED: 'unread_message_count_updated',
  BLOCK_STATUS_UPDATED: 'block_status_updated',
};

const ensureNotificationsLoadedFn = (get) => () => {
  const { notifications, isLoadingNotifications } = get();
  if (notifications.length === 0 && !isLoadingNotifications) {
    console.log('📊 Auto-fetching notifications (empty list)...');
    get().fetchNotifications(true).catch(console.error);
  }
};

const useAppStore = create(
    devtools((set, get) => ({
      // ============ USER STATE ============
      userName:null,
      setUserNameStore:(username)=>{
        set({userName:username})
      },
      getUserNameStore: () => get().userName,
      filterType: "RELEVANT", // default filter
      setFilterType: (filterType) => set({ filterType }),

      // ============ CHAT STATE ============
      chatMap: {}, // O(1) access by chatId
      chatsLoaded: false,
      conversationMap: new Map(),
      isLoadingChats: false,
      error: null,
      unreadMessageCount: 0,

      // Helper function to calculate unread message count
      calculateUnreadMessageCount: (chatMap) => {
        let total = 0;
        for (const key in chatMap) {
          total += (chatMap[key].notReadMessageCount || 0);
        }
        return total;
      },

      // Update unread message count
      updateUnreadMessageCount: () => {
        const { chatMap } = get();
        const newCount = get().calculateUnreadMessageCount(chatMap);

        set({ unreadMessageCount: newCount });
        console.log(`✅ ${STORE_EVENTS.UNREAD_MESSAGE_COUNT_UPDATED} - Total unread messages: ${newCount}`);

        return newCount;
      },

      // Fetch chat list from API
      fetchChatList: async () => {
        set({ isLoadingChats: true, error: null });
        try {
          console.log('🚀 Fetching chat list from API...');
          const res = await api.get('/v1/chat');
          console.log('📊 Chat API response:', res);

          const data = res.data.body || res.data || [];

          // Convert to Map
          const newChatMap = {};
          data.forEach(chat => {
            const id = chat.chatId || chat.id;
            newChatMap[id] = chat;
          });

          // Calculate unread message count
          const unreadCount = get().calculateUnreadMessageCount(newChatMap);

          set({
            chatMap: newChatMap,
            isLoadingChats: false,
            chatsLoaded: true,
            error: null,
            unreadMessageCount: unreadCount
          });

          console.log(`✅ ${STORE_EVENTS.CHAT_LIST_LOAD} - ${data.length} chats loaded`);
          console.log(`✅ ${STORE_EVENTS.UNREAD_MESSAGE_COUNT_UPDATED} - Total unread messages: ${unreadCount}`);
          return data;
        } catch (error) {
          console.error('❌ Error fetching chats:', error);
          const errorMessage = error.response?.data?.message || error.message || 'Failed to load chats';

          set({
            isLoadingChats: false,
            chatsLoaded: true,
            error: errorMessage,
            chatMap: {},
            unreadMessageCount: 0
          });

          throw error;
        }
      },

      // Update chat user online status
      updateChatUserOnlineStatus: (userId, onlineStatusData) => {
        set((state) => {
          let updated = false;
          const newChatMap = { ...state.chatMap };
          
          for (const key in newChatMap) {
            const chat = newChatMap[key];
            if (chat.target && chat.target.id === userId) {
              newChatMap[key] = {
                ...chat,
                target: {
                  ...chat.target,
                  isOnline: onlineStatusData.online,
                  lastOnline: onlineStatusData.lastOnline || null
                }
              };
              updated = true;
            }
          }

          if (!updated) return state;

          const unreadCount = get().calculateUnreadMessageCount(newChatMap);

          return {
            chatMap: newChatMap,
            unreadMessageCount: unreadCount
          };
        });
        console.log(`✅ Updated target online status for ${userId}`, onlineStatusData);
      },

      // Get block status by chat ID
      getBlockStatusByChatId: (chatId) => {
        const { chatMap } = get();
        const chat = chatMap[chatId];

        if (!chat) {
          console.log(`❌ Chat not found for ID: ${chatId}`);
          return "NORMAL";
        }

        return chat.blockStatus || "NORMAL";
      },

      // Mark chat as read
      markChatAsRead: async (chatId) => {
        try {
          set(state => {
            const chat = state.chatMap[chatId];
            if (!chat) return state;

            const newChatMap = {
              ...state.chatMap,
              [chatId]: { ...chat, notReadMessageCount: 0 }
            };

            const unreadCount = get().calculateUnreadMessageCount(newChatMap);

            return {
              chatMap: newChatMap,
              unreadMessageCount: unreadCount
            };
          });

          console.log(`✅ Marked chat ${chatId} as read`);
        } catch (error) {
          console.error('❌ Error marking chat as read:', error);
        }
      },

      // Handle received message
      onMessageReceived: (message) => {
        const { selectedChatId, chatMap } = get();
        const isCurrentChatOpen = selectedChatId === message.chatId;
        const currentUserId = typeof window !== 'undefined' ? localStorage.getItem("userId") : null;
        const isOwnMessage = message.sender?.id === currentUserId;

        const chatId = message.chatId;
        const existingChat = chatMap[chatId];

        if (!existingChat) return;

        set(state => {
          const newChatMap = {
            ...state.chatMap,
            [chatId]: {
              ...existingChat,
              latestMessage: {
                id: message.id,
                content: message.content,
                sentAt: message.sentAt || message.createdAt,
                sender: message.sender,
                messageType: message.messageType || message.type,
                attachment: message.attachment,
                attachments: message.attachments,
                deleted: message.deleted || false,
              },
              lastMessage: message,
              updatedAt: message.createdAt || message.sentAt,
              notReadMessageCount: isCurrentChatOpen
                  ? 0
                  : isOwnMessage
                      ? (existingChat.notReadMessageCount || 0)
                      : (existingChat.notReadMessageCount || 0) + 1
            }
          };

          const unreadCount = get().calculateUnreadMessageCount(newChatMap);

          return {
            chatMap: newChatMap,
            unreadMessageCount: unreadCount
          };
        });

        console.log(`📊 ${STORE_EVENTS.MESSAGE_RECEIVED} - ${message.chatId}`);
      },

      // Handle new chat creation
      onChatCreated: (newChat) => {
        const id = newChat.chatId || newChat.id;
        set(state => {
          const newChatMap = { ...state.chatMap, [id]: newChat };
          const unreadCount = get().calculateUnreadMessageCount(newChatMap);

          return {
            chatMap: newChatMap,
            unreadMessageCount: unreadCount
          };
        });

        console.log(`📊 ${STORE_EVENTS.CHAT_CREATED} - ${id}`);
      },

      // ============ NOTIFICATIONS STATE ============
      notifications: [],
      isLoadingNotifications: false,
      unreadNotificationCount: 0,
      unreadNotificationCountFromSocket: 0,

      // Fetch unread notification count
      fetchUnreadNotificationCount: async () => {
        try {
          const res = await api.get('/v1/notifications/unread-count');
          console.log('📊 Unread count API response:', res);

          const unreadCount = res.data.body;

          set({
            unreadNotificationCount: unreadCount,
            error: null
          });

          console.log(`✅ ${STORE_EVENTS.UNREAD_COUNT_LOAD} - ${unreadCount} unread notifications from API`);
          return unreadCount;
        } catch (error) {
          console.error('❌ Error fetching unread notification count:', error);
          return 0;
        }
      },

      // Fetch notifications
      fetchNotifications: async (force = false, page = 0, size = 10) => {
        const { notifications, isLoadingNotifications } = get();

        if (!force && notifications.length > 0) {
          return notifications;
        }

        if (isLoadingNotifications) {
          return notifications;
        }

        set({ isLoadingNotifications: true, error: null });
        try {
          console.log('🚀 Fetching notifications from API...');
          const res = await api.get('/v1/notifications', {
            params: { page, size }
          });

          console.log('📊 Notifications API response:', res);

          const responseData = res.data.body.notifications;
          let data = [];

          if (responseData) {
            if (responseData.body && Array.isArray(responseData.body)) {
              data = responseData.body;
            } else if (Array.isArray(responseData)) {
              data = responseData;
            }
          }

          const currentNotifications = get().notifications;
          let finalNotifications = data;

          // Merge with socket notifications if available
          if (currentNotifications.length > 0) {
            const apiNotificationIds = new Set(data.map(n => n.id));
            const socketOnlyNotifications = currentNotifications.filter(n => !apiNotificationIds.has(n.id));

            finalNotifications = [...socketOnlyNotifications, ...data];
          }

          set({
            notifications: finalNotifications,
            isLoadingNotifications: false,
            error: null
          });

          console.log(`✅ ${STORE_EVENTS.NOTIFICATIONS_LOAD} - ${finalNotifications.length} notifications loaded`);
          return finalNotifications;
        } catch (error) {
          console.error('❌ Error fetching notifications:', error);
          const errorMessage = error.response?.data?.message || error.message || 'Failed to load notifications';

          set({
            isLoadingNotifications: false,
            error: errorMessage
          });

          throw error;
        }
      },

      // Handle notification received from socket
      onNotificationReceived: (notification) => {
        const { notifications } = get();

        if (notifications.length === 0) {
          console.log('📊 Empty notifications list, fetching from API...');
          get().fetchNotifications(true).catch(console.error);
        }

        const existingNotification = notifications.find(n => n.id === notification.id);
        if (existingNotification) {
          console.log(`📊 Notification ${notification.id} already exists, skipping...`);
          return;
        }

        set(state => ({
          notifications: [notification, ...state.notifications],
          unreadNotificationCountFromSocket: state.unreadNotificationCountFromSocket + 1
        }));

        console.log(`📊 ${STORE_EVENTS.NOTIFICATION_RECEIVED} - ${notification.id || 'new notification'} | Socket count: ${get().unreadNotificationCountFromSocket}`);
      },

      // ============ CHAT NAVIGATION & SELECTION LOGIC ============
      selectedChatId: null,
      virtualChatUser: null,

      // Select a chat
      selectChat: (chatId) => {
        set({
          selectedChatId: chatId,
          virtualChatUser: null
        });
        console.log(`✅ Selected chat: ${chatId}`);
      },

      // Show virtual chat with user
      showVirtualChat: (userId, userInfo) => {
        set({
          selectedChatId: null,
          virtualChatUser: {
            id: userId,
            ...userInfo
          }
        });
        console.log(`✅ Showing virtual chat with user: ${userId}`);
      },

      // Clear chat selection
      clearChatSelection: () => {
        set({
          selectedChatId: null,
          virtualChatUser: null
        });
      },

      // ============ INITIALIZATION ============
      initializeApp: async () => {
        console.log('🚀 Initializing app...');
        try {
          await Promise.allSettled([
            get().fetchChatList(),
            get().fetchUnreadNotificationCount(),
          ]);
          console.log('✅ App initialized successfully');
        } catch (error) {
          console.error('❌ Error initializing app:', error);
          set({ error: 'Failed to initialize app' });
        }
      },

      // ============ UTILITY ============
      clearAllData: () => {
        set({
          chatMap: {},
          chatsLoaded: false,
          filterType: "RELEVANT",
          conversationMap: new Map(),
          selectedChatId: null,
          virtualChatUser: null,
          notifications: [],
          unreadNotificationCount: 0,
          unreadNotificationCountFromSocket: 0,
          unreadMessageCount: 0,
          error: null,
          isLoadingChats: false,
          isLoadingNotifications: false,
        }, false, 'clearAllData');
      },
      // Ensure notifications are loaded
      ensureNotificationsLoaded: () => {
        const { notifications, isLoadingNotifications } = get();

        if (notifications.length === 0 && !isLoadingNotifications) {
          console.log('📊 Auto-fetching notifications (empty list)...');
          get().fetchNotifications(true).catch(console.error);
        }
      },

      // Force refresh chat list
      refreshChatList: async () => {
        console.log('🔄 Force refreshing chat list...');
        return get().fetchChatList();
      },

    }), {
      name: 'app-store'
    })
);

// Derived selector for getting sorted chat list
export const selectSortedChatList = (state) => {
  return Object.values(state.chatMap).sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.createdAt).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt).getTime();
    return timeB - timeA;
  });
};

export default useAppStore;
