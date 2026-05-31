import { getAuthToken, isTokenValid, onTokenRefresh, clearSession } from "./axios";
import api from "./axios";

class CustomSocketSingleton {
  constructor() {
    this.connections = new Map(); // key: wsUrl
    this.subscribers = new Map(); // key: destination
    this.isRefreshing = false;

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

    // Listen for token refresh from axios.js
    if (typeof window !== 'undefined') {
      onTokenRefresh((newToken) => {
        if (newToken) {
          console.log("🔄 Socket: Token refreshed, restarting active connections...");
          this.reconnectAll();
        }
      });
    }
  }

  async reconnectAll() {
    // Capture current subscribers
    const currentSubscribers = new Map(this.subscribers);
    
    // Close existing connections (don't use disconnect() as it clears subscribers)
    this.connections.forEach(ws => {
      if (ws.readyState !== WebSocket.CLOSED) {
        ws.close(1000, "Token Refresh");
      }
    });
    this.connections.clear();
    
    // Clear subscribers map temporarily to allow re-subscription
    this.subscribers.clear();

    // Re-establish all subscriptions
    for (const [dest, sub] of currentSubscribers) {
      console.log(`🔌 Socket: Re-subscribing to ${dest}...`);
      this.subscribe(dest, sub.callback, sub.headers);
    }
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
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error("Connection timeout")), 10000);
          const interval = setInterval(() => {
            const currentWs = this.connections.get(wsUrl);
            if (!currentWs || currentWs.readyState === WebSocket.CLOSED) {
              clearInterval(interval);
              clearTimeout(timeout);
              reject(new Error("Connection failed"));
            } else if (currentWs.readyState === WebSocket.OPEN) {
              clearInterval(interval);
              clearTimeout(timeout);
              resolve(currentWs);
            }
          }, 100);
        });
      }
    }

    const userId = localStorage.getItem("userId");
    const token = getAuthToken() || "";
    
    // If token is missing and we're not already refreshing, maybe we should wait or error
    if (!token && isTokenValid()) {
       // Should wait for auth?
    }

    const urlWithParams = `${wsUrl}?userId=${userId || ""}&token=${token}`;
    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(urlWithParams);
        this.connections.set(wsUrl, ws);

        ws.onopen = () => {
          console.log("✅ WebSocket connected:", wsUrl);
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          resolve(ws);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const isError = data.command === "ERROR" || (data.code !== undefined && data.message !== undefined);
            
            // Check for authentication errors specifically
            if (isError && (data.code === 401 || data.message?.toLowerCase().includes("token") || data.message?.toLowerCase().includes("auth"))) {
               console.warn("⚠️ Socket: Authentication error detected:", data.message);
               // If it's a 401, axios might already be refreshing or we should trigger it
            }

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
          this.isConnecting = false;
          reject(error);
        };

        ws.onclose = (event) => {
          console.log(`🔌 WebSocket closed (${event.code}):`, wsUrl);
          this.connections.delete(wsUrl);
          this.isConnecting = false;
          
          // Auto-reconnect logic if it wasn't a normal closure
          if (event.code !== 1000 && event.code !== 1001 && this.subscribers.size > 0) {
            this.handleAutoReconnect(wsUrl);
          }
        };
      } catch (e) {
        this.isConnecting = false;
        reject(e);
      }
    });
  }

  async handleAutoReconnect(wsUrl) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("❌ Max reconnect attempts reached for:", wsUrl);
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    
    console.log(`🔄 Socket: Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms...`);
    
    setTimeout(() => {
      // Check if we still have subscribers for this URL
      const hasSubscribers = Array.from(this.subscribers.values()).some(sub => sub.wsUrl === wsUrl);
      if (hasSubscribers) {
        this.connectSocket(wsUrl).catch(err => {
          console.error("❌ Reconnect failed:", err);
        });
      }
    }, delay);
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