"use client";
import React, { useState, useRef, useEffect } from "react";

export default function VoiceRecorder({ onSend }) {
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
    <div className="relative inline-block p-2">
      {error && <div className="text-red-500 mb-2">{error}</div>}

      {/* Nút micro mặc định */}
      {!isRecording && !isStopped && (
        <button
          type="button"
          onClick={handleStart}
          aria-label="Start recording"
          className="flex items-center justify-center w-10 h-10 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <svg
            aria-hidden="true"
            width="18"
            height="18"
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
        <div
          className="absolute bottom-14 left-1/2 -translate-x-1/2 flex items-center bg-white border rounded-lg shadow-md p-2 min-w-[180px] space-x-2 z-50 dark:bg-gray-900"
          role="dialog"
          aria-label="Recording controls"
        >
          {audioUrl && (
            <audio ref={audioRef} src={audioUrl} preload="auto" hidden />
          )}

          {/* Khi đang ghi âm */}
          {isRecording && (
            <>
              <button
                onClick={handleStop}
                aria-label="Stop recording"
                className="flex items-center justify-center w-8 h-8 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <svg
                  aria-hidden="true"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>
              <span className="text-sm font-mono">
                {new Date(seconds * 1000).toISOString().substr(14, 5)}
              </span>
            </>
          )}

          {/* Khi đã ghi xong */}
          {isStopped && audioUrl && (
            <>
              <button
                onClick={handlePlayPause}
                aria-label="Play/Pause"
                className="flex items-center justify-center w-8 h-8 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <svg
                  aria-hidden="true"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <polygon points="7,6 17,12 7,18" />
                  <rect x="3" y="6" width="2" height="12" />
                </svg>
              </button>

              <button
                onClick={handleSend}
                aria-label="Send recording"
                className="flex items-center justify-center w-8 h-8 rounded-full text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900"
              >
                <svg
                  aria-hidden="true"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M22 2L11 13" />
                  <path d="M22 2l-7 20 -3-9-9-3 19-8z" />
                </svg>
              </button>

              <button
                onClick={handleCancel}
                aria-label="Cancel recording"
                className="flex items-center justify-center w-8 h-8 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <svg
                  aria-hidden="true"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M3 6h18" />
                  <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" />
                  <path d="M10 6V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2" />
                </svg>
              </button>

              <span className="text-sm font-mono">
                {new Date(seconds * 1000).toISOString().substr(14, 5)}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
