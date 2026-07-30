"use client";
import { useEffect, useRef } from "react";
import { subscribe, unsubscribe, getStompClient } from "@/utils/socket";
import toast from "react-hot-toast";
import useAppStore from "@/store/ZustandStore";
import { playSound } from "@/utils/playSound";
export default function useNotificationSocket(userId) {
  const subscriptionRef = useRef(null);
  const isSubscribedRef = useRef(false);

  // Store actions
  const {
    fetchChatList,
    onMessageReceived,
    onChatCreated,
    fetchNotifications,
    onNotificationReceived,
  } = useAppStore();

  useEffect(() => {
    if (!userId) return;
    let isMounted = true;

    const handleNotification = async (data) => {
      if (!data?.action) {
        console.warn("⚠️ Notification không hợp lệ:", data);
        return;
      }

      const name = data.creator?.givenName || "ai đó";

      // Helper to show OS native notification banner when tab is hidden
      const showNativeNotification = (title, body) => {
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          if (document.hidden) {
            if ("serviceWorker" in navigator) {
              navigator.serviceWorker.ready.then((reg) => {
                reg.showNotification(title, {
                  body: body,
                  icon: "/pocpoc.png",
                  badge: "/pocpoc.png",
                  tag: "social-notif-" + Date.now(),
                });
              });
            } else {
              new Notification(title, { body, icon: "/pocpoc.png" });
            }
          }
        }
      };

      // === Toast & store updates by action ===
      let notifMessage = "";
      switch (data.action) {
        case "SENT_ADD_FRIEND_REQUEST":
          notifMessage = `${name} đã gửi lời mời kết bạn 💌`;
          break;

        case "BE_FRIEND":
        case "ACCEPTED_FRIEND_REQUEST":
          notifMessage = `${name} đã trở thành bạn bè 👥`;
          break;

        case "POST":
          notifMessage = `${name} đã đăng một bài viết mới`;
          break;

        case "SHARE":
          notifMessage = `${name} đã chia sẻ một bài viết mới`;
          break;

        case "LIKE_POST":
          notifMessage = `${name} đã thích bài viết của bạn ❤️`;
          break;

        case "COMMENT":
          notifMessage = `${name} đã bình luận về bài viết của bạn 💬`;
          break;

        case "REPLY_COMMENT":
          notifMessage = `${name} đã trả lời bình luận của bạn 💬`;
          break;
        case "DELETE_COMMENT":
          notifMessage = `${name} đã xóa bình luận của bạn 💬`;
          break;
        case "DELETE_POST":
          notifMessage = `${name} đã xóa bài viết của bạn 💬`;
          break;

        case "NEW_MESSAGE": {
          notifMessage = `${name} đã nhắn tin cho bạn 💬`;
          
          // Play sound notification for new message
          try {
            playSound("/pocpoc.mp3", { 
              loop: false,
              volume: 0.9, 
              duration: 1000 
            });
            console.log("🔊 Playing notification sound for NEW_MESSAGE");
          } catch (soundError) {
            console.warn("🔇 Failed to play notification sound:", soundError);
          }
          
          try {
            if (!data.message || !data.message.senderUsername) break;
            useAppStore.getState().onMessageReceived(data.message);
          } catch (err) {
            console.error("❌ Failed to process NEW_MESSAGE:", err);
          }

          break;
        }

        case "NEW_CHAT_CREATED":
          if (data.chat) {
            onChatCreated(data.chat);
            notifMessage = `${name} đã tạo cuộc trò chuyện mới 💬`;
          }
          break;

        default:
          notifMessage = `🔔 Có thông báo mới từ ${name}`;
      }

      if (notifMessage) {
        toast(notifMessage);
        showNativeNotification("PocPoc", notifMessage);
      }

      // ✅ Đồng bộ thông báo vào store và cập nhật unread count
      if (onNotificationReceived && fetchNotifications) {
        onNotificationReceived(data); // Tạm thời hiển thị ngay - sẽ tự động cập nhật unread count
        
        // ✅ Cập nhật unread count trực tiếp cho đảm bảo
        const currentState = useAppStore.getState();
        const newUnreadCount = currentState.unreadNotificationCount + 1;
        
        useAppStore.setState({ 
          unreadNotificationCountFromSocket: newUnreadCount 
        });
        
        console.log(`📊 Unread notification count updated: ${newUnreadCount}`);
      }
    };

    // === Setup socket subscription ===
    const setupSubscription = async () => {
      try {
        if (!isMounted) return;

        console.log("🔌 Setting up subscription to /notifications/" + userId);

        // Ensure client is connected
        await getStompClient();

        // Subscribe to notifications
        const subscription = await subscribe(
          `/notifications/${userId}`,
          (message) => {
            if (!isMounted) return;
            
            try {
              const data = JSON.parse(message.body);
              console.log("📨 Notification received:", data);
              handleNotification(data);
            } catch (err) {
              console.error("❌ Không thể parse message:", err);
            }
          }
        );

        if (subscription && isMounted) {
          subscriptionRef.current = subscription;
          isSubscribedRef.current = true;
          console.log("✅ Successfully subscribed to notifications");
        }
      } catch (err) {
        console.error("❌ Lỗi khi setup subscription:", err);
        
        // Retry after delay
        if (isMounted) {
          setTimeout(() => {
            if (isMounted && !isSubscribedRef.current) {
              setupSubscription();
            }
          }, 3000);
        }
      }
    };

    // Start setup
    setupSubscription();

    return () => {
      isMounted = false;

      if (isSubscribedRef.current) {
        try {
          unsubscribe(`/notifications/${userId}`);
          console.log("📤 Đã hủy đăng ký /notifications/" + userId);
        } catch (err) {
          console.warn("⚠️ Lỗi khi hủy đăng ký:", err);
        }
        isSubscribedRef.current = false;
      }

      subscriptionRef.current = null;
    };
  }, [
    userId,
    fetchChatList,
    onMessageReceived,
    onChatCreated,
    fetchNotifications,
    onNotificationReceived,
  ]);
}