"use client";
import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";

export default function VoiceMessage({ msg }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);

  // Format mm:ss
  const formatTime = (sec) => {
    if (isNaN(sec)) return "00:00";
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(sec % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  useEffect(() => {
    // Khởi tạo WaveSurfer
    wavesurfer.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "#fff",
      progressColor: "transparent",
      cursorColor: "transparent",
      barWidth: 2,
      barRadius: 2,
      responsive: true,
      height: 36,
    });

    // Load audio file
    wavesurfer.current.load(msg.attachment);

    // Lấy thời lượng khi sẵn sàng
    wavesurfer.current.on("ready", () => {
      setDuration(wavesurfer.current.getDuration());
    });

    // Khi play/pause
    wavesurfer.current.on("play", () => setIsPlaying(true));
    wavesurfer.current.on("pause", () => setIsPlaying(false));
    wavesurfer.current.on("finish", () => {
      setIsPlaying(false);
      wavesurfer.current.seekTo(0);
    });

    // Cleanup
    return () => {
      wavesurfer.current.destroy();
    };
  }, [msg.attachment]);

  const togglePlay = () => {
    wavesurfer.current.playPause();
  };

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-2xl max-w-xs min-w-12 cursor-pointer h-10"
      onClick={togglePlay} // click vào toàn khung cũng phát được
    >
      {/* Play/Pause button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition"
      >
        {isPlaying ? (
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <polygon points="7,6 17,12 7,18" />
          </svg>
        )}
      </button>

      {/* Waveform */}
      <div ref={waveformRef} className="flex-1" />

      {/* Duration */}
      <span className="text-[11px] text-white whitespace-nowrap">
        {formatTime(duration)}
      </span>
    </div>
  );
}
