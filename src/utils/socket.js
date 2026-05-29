import { getAuthToken, isTokenValid, onTokenRefresh, clearSession } from "./axios";
import api from "./axios";

class CustomSocketSingleton {
  constructor() {
    this.connections = new Map(); // key: wsUrl
    this.subscribers = new Map(); // key: destination

    // Gateway endpoint for unified routing
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:2003").replace("http", "ws");

    this.config = {
      chatUrl: baseUrl + "/v1/chat/ws",
      notificationUrl: baseUrl + "/v1/notifications/ws",
    };

    // Properties to satisfy useErrorSocket.js / legacy stomp hooks
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  updateConfig(newConfig) {
    console.log("updateConfig called with:", newConfig);
  }

  getWsUrl(destination) {
    if (destination.startsWith("/chat") || destination.startsWith("/message") || destination.startsWith("/online") || destination.startsWith("/typing") || destination.startsWith("/app") || destination.startsWith("/errors")) return this.config.chatUrl;
    if (destination.startsWith("/notifications")) return this.config.notificationUrl;
    return null;
  }

  async connectSocket(wsUrl) {
    if (this.connections.has(wsUrl)) {
      const ws = this.connections.get(wsUrl);
      if (ws.readyState === WebSocket.OPEN) return ws;
      if (ws.readyState === WebSocket.CONNECTING) {
        return new Promise(resolve => {
          const interval = setInterval(() => {
            if (this.connections.get(wsUrl)?.readyState === WebSocket.OPEN) {
              clearInterval(interval);
              resolve(this.connections.get(wsUrl));
            }
          }, 100);
        });
      }
    }

    const userId = localStorage.getItem("userId");
    const token = getAuthToken() || "";
    const urlWithParams = `${wsUrl}?userId=${userId || ""}&token=${token}`;

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(urlWithParams);
      this.connections.set(wsUrl, ws);

      ws.onopen = () => {
        console.log("✅ WebSocket connected:", wsUrl);
        resolve(ws);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const isError = data.command === "ERROR" || (data.code !== undefined && data.message !== undefined);
          
          this.subscribers.forEach((sub, dest) => {
            if (sub.wsUrl === wsUrl) {
              if (dest.startsWith("/errors")) {
                if (isError) {
                  sub.callback({ body: event.data });
                }
              } else {
                if (!isError) {
                  sub.callback({ body: event.data });
                }
              }
            }
          });
        } catch (e) {
          // Fallback: broadcast to all if not parsable
          this.subscribers.forEach(({ callback, wsUrl: subWsUrl }) => {
            if (subWsUrl === wsUrl) {
              callback({ body: event.data });
            }
          });
        }
      };

      ws.onerror = (error) => {
        console.error("❌ WebSocket error:", wsUrl, error);
        reject(error);
      };

      ws.onclose = () => {
        console.log("🔌 WebSocket disconnected:", wsUrl);
        this.connections.delete(wsUrl);
      };
    });
  }

  async getInstance() {
    return { connected: true };
  }

  async connect() {
    return { connected: true };
  }

  async disconnect() {
    this.connections.forEach(ws => ws.close());
    this.connections.clear();
    this.subscribers.clear();
  }

  async sendMessage(destination, message, headers = {}) {
    const wsUrl = this.getWsUrl(destination);
    if (!wsUrl) return false;

    try {
      const ws = await this.connectSocket(wsUrl);
      if (ws.readyState === WebSocket.OPEN) {
        console.log(`📡 Sending to ${destination}:`, message);
        ws.send(JSON.stringify(message));
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  }

  async subscribe(destination, callback, headers = {}) {
    const wsUrl = this.getWsUrl(destination);
    if (!wsUrl) return null;

    try {
      await this.connectSocket(wsUrl);
      this.subscribers.set(destination, { callback, headers, wsUrl });

      // Notify backend that user has opened/subscribed to this chat room
      if (destination.startsWith("/chat/")) {
        const chatId = destination.substring(6);
        console.log(`🔌 Notifying backend of active chat subscription: ${chatId}`);
        this.sendMessage(destination, { command: "SUBSCRIBE", chatId });
      }

      return {
        unsubscribe: () => this.unsubscribe(destination)
      };
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  unsubscribe(destination) {
    if (destination.startsWith("/chat/")) {
      const chatId = destination.substring(6);
      console.log(`🔌 Notifying backend of unsubscribe from active chat: ${chatId}`);
      this.sendMessage(destination, { command: "UNSUBSCRIBE", chatId });
    }
    this.subscribers.delete(destination);
  }

  isConnected() {
    return true;
  }

  getSubscriberCount() {
    return this.subscribers.size;
  }

  cleanup() {
    this.disconnect();
  }
}

const stompClientSingleton = new CustomSocketSingleton();

export const getStompClient = () => stompClientSingleton.getInstance();
export const sendMessage = (destination, message, headers = {}) => stompClientSingleton.sendMessage(destination, message, headers);
export const subscribe = (destination, callback, headers = {}) => stompClientSingleton.subscribe(destination, callback, headers);
export const unsubscribe = (destination) => stompClientSingleton.unsubscribe(destination);
export const connect = () => stompClientSingleton.connect();
export const disconnect = () => stompClientSingleton.disconnect();
export const isConnected = () => stompClientSingleton.isConnected();
export const cleanup = () => stompClientSingleton.cleanup();

export { stompClientSingleton };

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    stompClientSingleton.cleanup();
  });
}