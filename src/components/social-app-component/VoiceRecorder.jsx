"use client";
import React, { useState, useRef, useEffect } from "react";

export default function VoiceRecorder({ onSend, disabled }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);
  const [seconds, setSeconds] = useState(0);

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    return () => {
      cleanupStream();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startTimer = () => {
    setSeconds(0);
    timerRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
  };

  const stopTimer = () => clearInterval(timerRef.current);

  const cleanupStream = () => {
    try {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
    } catch (_) {}
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  };

  const handleStart = async () => {
    setError(null);
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setError("Trình duyệt không hỗ trợ ghi âm.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setIsStopped(true);
        stopTimer();
      };

      mr.start();
      setIsRecording(true);
      setIsStopped(false);
      setAudioUrl(null);
      startTimer();
    } catch (err) {
      setError("Không thể truy cập micro.");
    }
  };

  const handleStop = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) audioRef.current.play();
    else audioRef.current.pause();
  };

  const handleSend = async () => {
    if (!chunksRef.current.length && !audioUrl) return;
    const blob =
      chunksRef.current.length > 0
        ? new Blob(chunksRef.current, { type: "audio/webm" })
        : await fetch(audioUrl).then((r) => r.blob());

    try {
      if (typeof onSend === "function") await onSend(blob);
    } catch (e) {
      console.error(e);
    }

    chunksRef.current = [];
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setIsStopped(false);
    setSeconds(0);
  };

  const handleCancel = () => {
    cleanupStream();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setIsRecording(false);
    setIsStopped(false);
    setSeconds(0);
  };

  return (
    <div className="relative flex items-center justify-center">
      {error && (
        <div className="absolute bottom-12 left-0 text-xs text-red-450 bg-[var(--card)] border border-red-500/20 px-3 py-1.5 rounded-xl z-50 shadow-lg min-w-[200px]">
          {error}
        </div>
      )}

      {/* Nút micro mặc định */}
      {!isRecording && !isStopped && (
        <button
          type="button"
          onClick={handleStart}
          disabled={disabled}
          aria-label="Start recording"
          className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all ${
            disabled
              ? "text-[var(--muted-foreground)] opacity-50 cursor-not-allowed"
              : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
          }`}
          title="Ghi âm giọng nói"
        >
          <svg
            aria-hidden="true"
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="9" y="2" width="6" height="11" rx="3" />
            <path d="M12 15v4" />
            <path d="M8 21h8" />
          </svg>
        </button>
      )}

      {/* Panel hiện khi đang ghi âm hoặc đã ghi xong */}
      {(isRecording || (isStopped && audioUrl)) && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={handleCancel}
          />
          <div
            className="absolute bottom-12 left-0 flex items-center bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl p-2.5 min-w-[220px] space-x-3.5 z-50 text-[var(--foreground)] animate-in fade-in slide-in-from-bottom-2 duration-200"
            role="dialog"
            aria-label="Recording controls"
          >
            {audioUrl && (
              <audio ref={audioRef} src={audioUrl} preload="auto" hidden />
            )}

            {/* Khi đang ghi âm */}
            {isRecording && (
              <div className="flex items-center space-x-3 w-full justify-between px-1">
                <div className="flex items-center space-x-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <span className="text-xs font-mono text-[var(--muted-foreground)]">
                    {new Date(seconds * 1000).toISOString().substr(14, 5)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleStop}
                  aria-label="Stop recording"
                  className="flex items-center justify-center w-7 h-7 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                  title="Dừng ghi"
                >
                  <svg
                    aria-hidden="true"
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                </button>
              </div>
            )}

            {/* Khi đã ghi xong */}
            {isStopped && audioUrl && (
              <div className="flex items-center space-x-2 w-full justify-between">
                <button
                  type="button"
                  onClick={handlePlayPause}
                  aria-label="Play/Pause"
                  className="flex items-center justify-center w-7 h-7 rounded-lg text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
                  title="Nghe lại"
                >
                  <svg
                    aria-hidden="true"
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polygon points="7,6 17,12 7,18" />
                  </svg>
                </button>

                <span className="text-xs font-mono text-[var(--muted-foreground)]">
                  {new Date(seconds * 1000).toISOString().substr(14, 5)}
                </span>

                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={handleCancel}
                    aria-label="Cancel recording"
                    className="flex items-center justify-center w-7 h-7 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-red-500 transition-colors"
                    title="Xóa bản ghi"
                  >
                    <svg
                      aria-hidden="true"
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M3 6h18" />
                      <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={handleSend}
                    aria-label="Send recording"
                    className="flex items-center justify-center w-7 h-7 rounded-lg text-blue-500 hover:bg-blue-500/10 transition-colors"
                    title="Gửi âm thanh"
                  >
                    <svg
                      aria-hidden="true"
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M22 2L11 13" />
                      <path d="M22 2l-7 20 -3-9-9-3 19-8z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
