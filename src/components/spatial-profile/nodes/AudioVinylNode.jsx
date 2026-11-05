"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Disc, Volume2 } from "lucide-react";

export default function AudioVinylNode({
  node,
  customAccent = "#6366F1",
  isBuilderMode = false,
  shouldAutoplay = false,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const synthCtxRef = useRef(null);
  const synthIntervalRef = useRef(null);
  const hasAttemptedAutoplayRef = useRef(false);

  const title = node?.content?.title || "Giai điệu không gian";
  const audioUrl = node?.content?.audioUrl || "";
  const frameStyle = node?.frameStyle || "CLASSIC_VINYL";

  const stopAmbientSynth = useCallback(() => {
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
    if (synthCtxRef.current) {
      synthCtxRef.current.close().catch(() => {});
      synthCtxRef.current = null;
    }
  }, []);

  // Procedural Web Audio API Cosmic Ambient Chords when no external audioUrl is provided
  const startAmbientSynth = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      stopAmbientSynth();

      const ctx = new AudioCtx();
      synthCtxRef.current = ctx;

      const chords = [
        [220.0, 277.18, 329.63, 415.3], // A major 7
        [196.0, 246.94, 293.66, 369.99], // G major 7
        [174.61, 220.0, 261.63, 329.63], // F major 7
        [164.81, 207.65, 246.94, 329.63], // E7sus
      ];
      let chordIndex = 0;

      const playPadChord = () => {
        if (!synthCtxRef.current || synthCtxRef.current.state === "closed") return;
        const now = ctx.currentTime;
        const freqs = chords[chordIndex % chords.length];
        chordIndex += 1;

        freqs.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.exponentialRampToValueAtTime(0.035, now + 1.2);
          gain.gain.exponentialRampToValueAtTime(0.0008, now + 4.2);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 4.3);
        });
      };

      playPadChord();
      synthIntervalRef.current = setInterval(playPadChord, 3800);
    } catch {
      // Ignore Web Audio errors if blocked by browser
    }
  }, [stopAmbientSynth]);

  useEffect(() => {
    return () => {
      stopAmbientSynth();
    };
  }, [stopAmbientSynth]);

  // Handle Autoplay when visitor enters the space
  useEffect(() => {
    if (isBuilderMode || !shouldAutoplay || hasAttemptedAutoplayRef.current) return;
    hasAttemptedAutoplayRef.current = true;

    if (audioUrl && audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        // Browser autoplay restriction: will play upon first user interaction
        const triggerPlayOnInteraction = () => {
          if (audioRef.current) {
            audioRef.current.play().then(() => {
              setIsPlaying(true);
            }).catch(() => {});
          }
          window.removeEventListener("pointerdown", triggerPlayOnInteraction);
          window.removeEventListener("keydown", triggerPlayOnInteraction);
        };
        window.addEventListener("pointerdown", triggerPlayOnInteraction, { once: true });
        window.addEventListener("keydown", triggerPlayOnInteraction, { once: true });
      });
      return;
    }

    // Built-in procedural ambient synth
    const triggerSynth = () => {
      startAmbientSynth();
      setIsPlaying(true);
    };
    try {
      triggerSynth();
    } catch {
      const onFirstGesture = () => {
        triggerSynth();
        window.removeEventListener("pointerdown", onFirstGesture);
        window.removeEventListener("keydown", onFirstGesture);
      };
      window.addEventListener("pointerdown", onFirstGesture, { once: true });
      window.addEventListener("keydown", onFirstGesture, { once: true });
    }
  }, [shouldAutoplay, isBuilderMode, audioUrl, startAmbientSynth]);

  const togglePlay = (e) => {
    e.stopPropagation();
    if (isBuilderMode) return;

    if (audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
      return;
    }

    if (isPlaying) {
      stopAmbientSynth();
      setIsPlaying(false);
    } else {
      startAmbientSynth();
      setIsPlaying(true);
    }
  };

  const isNeon = frameStyle === "NEON_DISC";

  return (
    <div
      className={`w-[260px] p-4 rounded-2xl flex items-center gap-3.5 transition-all duration-300 ${
        isNeon
          ? "bg-zinc-950/90 text-white border border-fuchsia-500/40 shadow-[0_0_45px_rgba(217,70,239,0.28)]"
          : "bg-zinc-900/85 text-white backdrop-blur-xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      }`}
    >
      {/* Spinning Vinyl Record with Tone Arm & Ambient Ripples */}
      <div className="relative shrink-0 flex items-center justify-center">
        {/* Pulsing Acoustic Ripples behind vinyl when playing */}
        {isPlaying && (
          <>
            <div
              className="pointer-events-none absolute w-16 h-16 rounded-full border border-current animate-vinyl-ripple"
              style={{ color: customAccent, animationDelay: "0s" }}
            />
            <div
              className="pointer-events-none absolute w-16 h-16 rounded-full border border-current animate-vinyl-ripple"
              style={{ color: customAccent, animationDelay: "1.1s" }}
            />
          </>
        )}

        {/* Vinyl Disc Button */}
        <button
          type="button"
          onClick={togglePlay}
          className="relative w-16 h-16 rounded-full shrink-0 bg-gradient-to-tr from-zinc-950 via-zinc-800 to-zinc-950 border-2 border-zinc-700 shadow-inner flex items-center justify-center group overflow-hidden z-10"
          title={isPlaying ? "Tạm dừng" : "Phát đĩa than"}
        >
          <div
            className={`w-full h-full rounded-full flex items-center justify-center transition-all ${
              isPlaying ? "animate-vinyl-spin" : ""
            }`}
            style={{
              animationDuration: "4s",
              animationTimingFunction: "linear",
            }}
          >
            {/* Vinyl Circular Grooves */}
            <div className="w-[52px] h-[52px] rounded-full border border-white/10 flex items-center justify-center">
              <div className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shadow-md"
                  style={{ background: customAccent }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-950 shadow-inner" />
                </div>
              </div>
            </div>
          </div>

          {/* Vinyl Glare Reflection */}
          <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-60" />

          {/* Play/Pause Overlay */}
          <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-10">
            {isPlaying ? (
              <Pause size={18} className="text-white" />
            ) : (
              <Play size={18} className="text-white ml-0.5" />
            )}
          </div>
        </button>

        {/* Tone Arm Needle Indicator */}
        <div
          className={`pointer-events-none absolute -top-1.5 right-0.5 w-7 h-7 transition-transform duration-500 origin-[22px_4px] z-20 ${
            isPlaying ? "rotate-[28deg]" : "rotate-0"
          }`}
        >
          {/* Tone Arm Pivot Base */}
          <div className="absolute top-0 right-1 w-2.5 h-2.5 rounded-full bg-zinc-600 border border-zinc-400 shadow-sm" />
          {/* Tone Arm Metallic Bar */}
          <div className="absolute top-1 right-2 w-4 h-0.5 bg-zinc-300 rounded-full shadow" />
          {/* Cartridge / Needle Head */}
          <div
            className="absolute top-1 right-5 w-1.5 h-1 rounded-sm shadow-sm"
            style={{ background: isPlaying ? customAccent : "#71717A" }}
          />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            {isPlaying ? (
              <Volume2 size={12} className="animate-pulse" style={{ color: customAccent }} />
            ) : (
              <Disc size={12} style={{ color: customAccent }} />
            )}
            <span>{isPlaying ? "Đang phát" : "Đĩa than"}</span>
          </div>

          {/* Animated Audio Equalizer Waveform Bars */}
          {isPlaying ? (
            <div className="flex items-end gap-[2.5px] h-3.5 px-1">
              <span
                className="w-[2.5px] rounded-full"
                style={{
                  background: customAccent,
                  animation: "vinyl-soundwave 1s ease-in-out infinite",
                  animationDelay: "0s",
                }}
              />
              <span
                className="w-[2.5px] rounded-full"
                style={{
                  background: customAccent,
                  animation: "vinyl-soundwave 1s ease-in-out infinite",
                  animationDelay: "0.2s",
                }}
              />
              <span
                className="w-[2.5px] rounded-full"
                style={{
                  background: customAccent,
                  animation: "vinyl-soundwave 1s ease-in-out infinite",
                  animationDelay: "0.4s",
                }}
              />
              <span
                className="w-[2.5px] rounded-full"
                style={{
                  background: customAccent,
                  animation: "vinyl-soundwave 1s ease-in-out infinite",
                  animationDelay: "0.15s",
                }}
              />
            </div>
          ) : null}
        </div>
        <p className="text-xs sm:text-sm font-bold truncate mt-0.5">{title}</p>
        <button
          type="button"
          onClick={togglePlay}
          className="mt-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          {isPlaying ? "Tạm dừng" : "Phát nhạc"}
        </button>
      </div>

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}
    </div>
  );
}
