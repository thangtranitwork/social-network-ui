"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Phone, PhoneOff, PhoneIncoming, Video, VideoOff,
  Mic, MicOff, Maximize2, Minimize2, User
} from "lucide-react";
import api from "@/utils/axios";
import { sendMessage, subscribe } from "@/utils/socket";
import { getUserName, getUserId } from "@/utils/axios";
import { useTranslations } from "next-intl";

// ──────────────────────────────────────────────────────────────────────────────
// CallModal (Mesh Group Implementation)
// ──────────────────────────────────────────────────────────────────────────────
export default function CallModal({ callState, callInfo, onClose, onConnected }) {
  const t = useTranslations("call");
  const tChat = useTranslations("chat");
  const myId = getUserId();
  const pcs = useRef(new Map()); // userId -> RTCPeerConnection
  const localStreamRef = useRef(null);
  
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // userId -> MediaStream
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isMinimised, setIsMinimised] = useState(false);
  const [iceServers, setIceServers] = useState([{ urls: "stun:stun.l.google.com:19302" }]);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef(null);

  const isVideo = callInfo?.callType === "VIDEO";

  // ── Fetch ICE servers ────────────────────────────────────────────────────
  useEffect(() => {
    api.get("/v1/call/ice-servers")
      .then(res => { if (res.data?.iceServers) setIceServers(res.data.iceServers); })
      .catch(() => {});
  }, []);

  // ── Call duration timer ──────────────────────────────────────────────────
  useEffect(() => {
    if (callState === "in-call") {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [callState]);

  const formatDuration = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── WebSocket signaling sender ───────────────────────────────────────────
  const sendSignal = useCallback((command, payload = {}) => {
    sendMessage("/app/calls", { 
        command, 
        chatId: callInfo?.chatId, 
        senderId: myId,
        ...payload 
    });
  }, [callInfo, myId]);

  // ── Create RTCPeerConnection ─────────────────────────────────────────────
  const createPC = useCallback((targetId) => {
    if (pcs.current.has(targetId)) return pcs.current.get(targetId);

    console.log(`[WebRTC] Creating PC for target: ${targetId}`);
    const pc = new RTCPeerConnection({ iceServers });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        sendSignal("CALL_CANDIDATE", { candidate: e.candidate, targetId });
      }
    };

    pc.ontrack = (e) => {
      console.log(`[WebRTC] Received remote track from ${targetId}`);
      setRemoteStreams(prev => ({
        ...prev,
        [targetId]: e.streams[0]
      }));
    };

    pc.onconnectionstatechange = () => {
      if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
        removePeer(targetId);
      }
    };

    // Add local tracks immediately if available
    if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current));
    }

    pcs.current.set(targetId, pc);
    return pc;
  }, [iceServers, sendSignal]);

  const removePeer = (userId) => {
    const pc = pcs.current.get(userId);
    if (pc) {
      pc.close();
      pcs.current.delete(userId);
    }
    setRemoteStreams(prev => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  };

  // ── Acquire local media ──────────────────────────────────────────────────
  const getLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error("getUserMedia error:", err);
      return null;
    }
  }, [isVideo]);

  // ── Call Actions ────────────────────────────────────────────────────────
  const startCall = useCallback(async () => {
    await getLocalStream();
    sendSignal("CALL_JOINED", { callType: callInfo?.callType, senderName: getUserName() });
  }, [getLocalStream, sendSignal, callInfo]);

  const acceptCall = useCallback(async () => {
    await getLocalStream();
    onConnected?.();
    sendSignal("CALL_JOINED", { callType: callInfo?.callType, senderName: getUserName() });
  }, [getLocalStream, sendSignal, onConnected, callInfo]);

  const hangup = useCallback(() => {
    sendSignal("CALL_HANGUP");
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    pcs.current.forEach(pc => pc.close());
    pcs.current.clear();
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStreams({});
    clearInterval(timerRef.current);
    onClose?.();
  }, [sendSignal, onClose]);

  // ── Signaling Handler ────────────────────────────────────────────────────
  useEffect(() => {
    let sub;
    let active = true;

    const setupSub = async () => {
      sub = await subscribe("/app/calls", async ({ body }) => {
        if (!active) return;
        let msg;
        try { msg = JSON.parse(body); } catch { return; }
        if (!msg.command?.startsWith("CALL_")) return;
        if (msg.chatId !== callInfo?.chatId) return;
        if (msg.senderId === myId) return;

        console.log(`[WebRTC] Processing ${msg.command} from ${msg.senderId}`);

        switch (msg.command) {
          case "CALL_JOINED":
            // New person joined, we (as an existing participant) send them an offer
            if (callState === "in-call" || callState === "calling") {
                const pc = createPC(msg.senderId);
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                sendSignal("CALL_OFFER", { sdp: offer.sdp, targetId: msg.senderId });
            }
            break;

          case "CALL_OFFER":
            if (msg.targetId === myId) {
                const pc = createPC(msg.senderId);
                await pc.setRemoteDescription({ type: "offer", sdp: msg.sdp });
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                sendSignal("CALL_ANSWER", { sdp: answer.sdp, targetId: msg.senderId });
            }
            break;

          case "CALL_ANSWER":
            if (msg.targetId === myId) {
                const pc = pcs.current.get(msg.senderId);
                if (pc) await pc.setRemoteDescription({ type: "answer", sdp: msg.sdp });
            }
            break;

          case "CALL_CANDIDATE":
            if (msg.targetId === myId) {
                const pc = createPC(msg.senderId);
                try { await pc.addIceCandidate(msg.candidate); } catch {}
            }
            break;

          case "CALL_HANGUP":
            removePeer(msg.senderId);
            break;

          case "END_CALL":
            // Server forced termination or whole session ended
            localStreamRef.current?.getTracks().forEach(t => t.stop());
            pcs.current.forEach(pc => pc.close());
            pcs.current.clear();
            onClose?.();
            break;
        }
      });
    };

    setupSub();
    return () => {
      active = false;
      sub?.unsubscribe();
    };
  }, [callInfo, myId, callState, createPC, sendSignal]);

  // Trigger initiation
  useEffect(() => {
    if (callState === "calling") startCall();
  }, [callState]);

  // ── Toggle controls ──────────────────────────────────────────────────────
  const toggleMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = isMuted; });
      setIsMuted(m => !m);
    }
  };

  const toggleCam = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = isCamOff; });
      setIsCamOff(c => !c);
    }
  };

  if (callState === "idle") return null;

  // ── Incoming call ring UI ─────────────────────────────────────────────────
  if (callState === "incoming") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-[var(--card)] rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-6 w-80 animate-in zoom-in duration-200">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <PhoneIncoming className="w-9 h-9 text-white animate-bounce" />
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-[var(--foreground)]">{callInfo?.callerName}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t("incoming")}
            </p>
          </div>
          <div className="flex gap-6">
            <button onClick={hangup} className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-md transition-all">
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
            <button onClick={acceptCall} className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-md transition-all">
              <Phone className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Active / calling UI ──────────────────────────────────────────────────
  const remoteUserIds = Object.keys(remoteStreams);
  const participantCount = remoteUserIds.length + 1; // +1 for local

  return (
    <div
      className={`fixed z-50 bg-gray-950 flex flex-col shadow-2xl rounded-2xl overflow-hidden transition-all duration-300
        ${isMinimised
          ? "bottom-4 right-4 w-64 h-48"
          : "inset-0 m-0 md:m-4 md:inset-auto md:bottom-6 md:right-6 md:w-[800px] md:h-[600px] lg:w-[1000px] lg:h-[700px]"
        }`}
    >
      {/* Video Grid */}
      <div className={`flex-1 grid gap-2 p-2 bg-black overflow-y-auto
        ${participantCount <= 1 ? "grid-cols-1" : participantCount <= 2 ? "grid-cols-2" : participantCount <= 4 ? "grid-cols-2 grid-rows-2" : "grid-cols-3"}
      `}>
        
        {/* Local Stream */}
        <div className="relative bg-gray-900 rounded-lg overflow-hidden group">
          {isVideo && localStream ? (
            <video 
              ref={el => { if(el) el.srcObject = localStream; }} 
              autoPlay playsInline muted 
              className={`w-full h-full object-cover ${isCamOff ? 'hidden' : ''}`}
            />
          ) : null}
          {(isCamOff || !isVideo) && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
               <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                 {t("you")}
               </div>
            </div>
          )}
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/40 rounded text-white text-xs backdrop-blur-md">
            {t("youLocal")}
          </div>
        </div>

        {/* Remote Streams */}
        {remoteUserIds.map(uid => (
          <div key={uid} className="relative bg-gray-900 rounded-lg overflow-hidden group">
            {isVideo && remoteStreams[uid] ? (
               <video 
                 ref={el => { if(el) el.srcObject = remoteStreams[uid]; }} 
                 autoPlay playsInline 
                 className="w-full h-full object-cover"
               />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <User className="w-16 h-16 text-gray-500" />
                </div>
            )}
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/40 rounded text-white text-xs backdrop-blur-md">
              {t("participant")}
            </div>
          </div>
        ))}

        {/* Waiting state */}
        {participantCount === 1 && callState === "calling" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                <div className="text-white text-center bg-black/40 p-4 rounded-xl backdrop-blur-md">
                    <p className="animate-pulse">{t("waiting")}</p>
                </div>
            </div>
        )}
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="text-white font-medium flex items-center gap-2 pointer-events-auto">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          {formatDuration(duration)}
        </div>
        <button 
          onClick={() => setIsMinimised(m => !m)} 
          className="text-white/80 hover:text-white p-2 bg-black/20 rounded-full backdrop-blur-md transition-all pointer-events-auto"
          title={isMinimised ? t("maximise") : t("minimise")}
        >
          {isMinimised ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
        </button>
      </div>

      {/* Bottom Controls */}
      {!isMinimised && (
        <div className="p-6 flex items-center justify-center gap-6 bg-gradient-to-t from-black/80 to-transparent">
          <button 
            onClick={toggleMic} 
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
            title={isMuted ? t("unmute") : t("mute")}
          >
            {isMuted ? <MicOff /> : <Mic />}
          </button>
          
          {isVideo && (
            <button 
              onClick={toggleCam} 
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isCamOff ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
              title={isCamOff ? t("camOn") : t("camOff")}
            >
              {isCamOff ? <VideoOff /> : <Video />}
            </button>
          )}

          <button 
            onClick={hangup} 
            className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:bg-red-700 transition-all hover:scale-105 active:scale-95"
            title={t("hangup")}
          >
            <PhoneOff size={28} />
          </button>
        </div>
      )}

      {/* Mini hangup */}
      {isMinimised && (
        <button 
          onClick={hangup} 
          className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-all"
          title={t("hangup")}
        >
          <PhoneOff size={20} />
        </button>
      )}
    </div>
  );
}
