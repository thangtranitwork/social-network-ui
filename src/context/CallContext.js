"use client";

import React, { createContext, useCallback, useContext, useEffect, useState, useRef } from "react";
import { subscribe, sendMessage } from "@/utils/socket";
import CallModal from "@/components/social-app-component/CallModal";
import toast from "react-hot-toast";

const CallContext = createContext();

export const CallProvider = ({ children }) => {
  const [callState, setCallState] = useState("idle"); // "idle" | "calling" | "incoming" | "in-call"
  const [callInfo, setCallInfo] = useState(null);    // { chatId, callerName, callType, offerSdp, participants: [] }
  const [currentChatId, setCurrentChatId] = useState(null);
  
  // A ref to store the subscription cleanup function
  const subscriptionRef = useRef(null);

  // Global listener for incoming calls
  useEffect(() => {
    const handleIncomingSignal = ({ body }) => {
      try {
        const msg = JSON.parse(body);
        if (!msg.command?.startsWith("CALL_")) return;

        console.log("[WebRTC] Received signal:", msg.command, msg);

        if (msg.command === "CALL_OFFER") {
          setCallState((prev) => {
            if (prev !== "idle") return prev;
            
            setCallInfo({
              chatId: msg.chatId,
              callerName: msg.senderName || "Người dùng",
              callType: msg.callType || "AUDIO",
              offerSdp: msg.sdp,
              participants: [msg.senderId],
            });
            setCurrentChatId(msg.chatId);
            return "incoming";
          });
        } else if (msg.command === "CALL_HANGUP") {
          // In group calls, HANGUP might just mean one person left.
          // But for now, let's keep it simple: if the session ends, set idle.
          // Real group hangup logic will be in CallModal.
        }
      } catch (e) {
        console.error("[WebRTC] Failed to parse signaling message:", e);
      }
    };

    const sub = subscribe("/app/signals", handleIncomingSignal);
    subscriptionRef.current = sub;

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.then(s => s?.unsubscribe());
      }
    };
  }, []);

  const makeCall = useCallback((targetUsername, isVideo = false, chatId = null) => {
    if (!chatId) {
        toast.error("Không tìm thấy chatId để bắt đầu cuộc gọi");
        return;
    }

    setCallInfo({
      chatId,
      callerName: targetUsername,
      callType: isVideo ? "VIDEO" : "AUDIO",
      participants: [],
    });
    setCurrentChatId(chatId);
    setCallState("calling");
  }, []);

  // For compatibility with ChatBox.jsx which calls initializeCall(token)
  const initializeCall = useCallback((token) => {
    // No-op for WebRTC as we use existing WS session
    console.log("[WebRTC] initializeCall (no-op)");
  }, []);

  const handleClose = useCallback(() => {
    setCallState("idle");
    setCallInfo(null);
    setCurrentChatId(null);
  }, []);

  // Sync callState for CallModal (it might set in-call itself when answer is received)
  const handleCallConnected = useCallback(() => {
      setCallState("in-call");
  }, []);

  return (
    <CallContext.Provider
      value={{
        callState,
        callInfo,
        initializeCall,
        makeCall: (username, isVideo, chatId) => {
            if (!chatId) {
                toast.error("Không tìm thấy chatId để bắt đầu cuộc gọi");
                return;
            }
            makeCall(username, isVideo, chatId);
        },
        endCall: handleClose,
      }}
    >
      {children}
      
      {callState !== "idle" && (
        <CallModal
          callState={callState}
          callInfo={callInfo}
          // We'll modify CallModal to use the global singleton instead of wsRef
          onClose={handleClose}
          onConnected={handleCallConnected}
        />
      )}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error("useCall must be used within a CallProvider ❌");
  }
  return context;
};
