"use client";

import { useEffect, useState, useCallback } from "react";
import { getStompClient, sendMessage as stompSendMessage, isConnected as stompIsConnected } from "@/utils/socket";
import { encryptRatchetMessage } from "@/utils/e2ee/doubleRatchet";
import { encryptGroupMessage } from "@/utils/e2ee/senderKeys";
import { setCachedPlaintext } from "@/utils/e2ee/plaintextCache";
import useAppStore from "@/store/ZustandStore";

export default function useSendMessage({ chatId, receiverUsername, isGroup = false, peerUserId = null, memberIds = [] }) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize connection when hook mounts
    const initializeConnection = async () => {
      try {
        const client = await getStompClient();
        setIsConnected(client.connected);
        
        // Set up connection status monitoring
        const checkConnection = () => {
          setIsConnected(stompIsConnected());
        };
        
        // Check connection status periodically
        const intervalId = setInterval(checkConnection, 1000);
        
        return () => {
          clearInterval(intervalId);
        };
      } catch (error) {
        console.error("❌ Failed to initialize STOMP connection:", error);
        setIsConnected(false);
      }
    };

    initializeConnection();

    // Cleanup is handled by the singleton itself
    return () => {
      setIsConnected(false);
    };
  }, []);

  const sendMessage = useCallback(
    async (text) => {
      console.log("📡 Attempting to send message...");
      console.log("✅ isConnected:", isConnected);

      // Validate inputs
      if (!text?.trim()) {
        console.warn("⚠️ Empty message text");
        return false;
      }

      if (!chatId && !receiverUsername?.trim()) {
        console.warn("⚠️ Missing receiver username for new chat");
        return false;
      }

      const trimmedText = text.trim();
      let messageData = {
        chatId: chatId || null,
        username: receiverUsername ? receiverUsername.trim() : "",
        text: trimmedText,
        isEncrypted: false,
      };

      // 🔐 E2EE Encryption Layer
      try {
        if (isGroup && chatId) {
          const { ciphertext, e2eHeader } = await encryptGroupMessage(chatId, trimmedText, memberIds);
          messageData.text = ciphertext;
          messageData.isEncrypted = true;
          messageData.e2eHeader = e2eHeader;
          setCachedPlaintext(ciphertext, trimmedText);
        } else if (peerUserId) {
          const { ciphertext, e2eHeader } = await encryptRatchetMessage(peerUserId, trimmedText);
          messageData.text = ciphertext;
          messageData.isEncrypted = true;
          messageData.e2eHeader = e2eHeader;
          setCachedPlaintext(ciphertext, trimmedText);
        }
      } catch (err) {
        console.warn("⚠️ E2EE encryption failed or peer bundle not ready, falling back to standard plaintext:", err);
      }

      try {
        // Use the singleton's sendMessage method
        const success = await stompSendMessage("/app/chat", messageData);
        
        if (success) {
          console.log("✅ Message sent successfully:", messageData.isEncrypted ? "[Encrypted]" : messageData);
          return true;
        } else {
          console.error("❌ Failed to send message");
          return false;
        }
      } catch (error) {
        console.error("❌ Error sending message:", error);
        return false;
      }
    },
    [chatId, receiverUsername, isConnected, isGroup, peerUserId, memberIds]
  );

  return { 
    sendMessage, 
    isConnected,
    // Additional utility functions
    connectionStatus: isConnected ? 'connected' : 'disconnected'
  };
}
