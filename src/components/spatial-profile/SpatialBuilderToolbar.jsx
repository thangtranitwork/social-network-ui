"use client";

import {
  Plus,
  Sparkles,
  Save,
  X,
  LayoutGrid,
  Check,
  MessageSquare,
} from "lucide-react";
import { SPACE_THEMES, ACCENT_PRESETS } from "./spatialConstants";

export default function SpatialBuilderToolbar({
  theme = "COSMIC_VOID",
  onThemeChange,
  customAccent = "#6366F1",
  onAccentChange,
  allowGuestbook = true,
  onToggleAllowGuestbook,
  onOpenAddModal,
  onApplyPresetLayout,
  onSaveSpace,
  onCancelBuilder,
  isSaving = false,
  tSpace,
}) {
  return (
    <div
      data-spatial-ui="true"
      className="fixed top-20 left-1/2 -translate-x-1/2 z-40 max-w-[95vw] flex flex-wrap items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl bg-zinc-950/90 text-white border border-white/15 shadow-[0_24px_60px_rgba(0,0,0,0.65)] backdrop-blur-2xl"
    >
      {/* Add Artifact Button */}
      <button
        type="button"
        onClick={onOpenAddModal}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white shadow-sm hover:opacity-95 transition-opacity"
        style={{ background: customAccent }}
      >
        <Plus size={14} />
        <span>{tSpace("addNode")}</span>
      </button>

      <div className="w-[1px] h-5 bg-white/15 mx-0.5 hidden sm:block" />

      {/* Auto-Layout Presets */}
      <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
        <span className="text-[11px] text-zinc-400 px-1.5 hidden lg:inline-flex items-center gap-1">
          <LayoutGrid size={12} />
          <span>{tSpace("autoLayout")}:</span>
        </span>
        <button
          type="button"
          onClick={() => onApplyPresetLayout("ORBIT")}
          className="px-2.5 py-1 rounded-lg text-xs font-medium hover:bg-white/15 transition-colors"
        >
          {tSpace("layoutOrbit")}
        </button>
        <button
          type="button"
          onClick={() => onApplyPresetLayout("GALLERY")}
          className="px-2.5 py-1 rounded-lg text-xs font-medium hover:bg-white/15 transition-colors"
        >
          {tSpace("layoutGallery")}
        </button>
        <button
          type="button"
          onClick={() => onApplyPresetLayout("SCATTER")}
          className="px-2.5 py-1 rounded-lg text-xs font-medium hover:bg-white/15 transition-colors"
        >
          {tSpace("layoutScatter")}
        </button>
      </div>

      {/* Atmosphere Theme Switcher */}
      <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
        {SPACE_THEMES.map((item) => {
          const isSelected = theme === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onThemeChange(item.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                isSelected ? "bg-white text-zinc-950 font-semibold shadow-sm" : "text-zinc-300 hover:bg-white/10"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full border border-white/30"
                style={{ background: item.previewBg }}
              />
              <span>{tSpace(item.labelKey)}</span>
            </button>
          );
        })}
      </div>

      {/* Accent Color Swatches */}
      <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white/5 border border-white/10">
        {ACCENT_PRESETS.map((hex) => (
          <button
            key={hex}
            type="button"
            onClick={() => onAccentChange(hex)}
            className="w-4 h-4 rounded-full flex items-center justify-center transition-transform hover:scale-110"
            style={{ background: hex }}
          >
            {customAccent.toLowerCase() === hex.toLowerCase() && (
              <Check size={10} className="text-white" />
            )}
          </button>
        ))}
      </div>

      {/* Guestbook Toggle */}
      <button
        type="button"
        onClick={onToggleAllowGuestbook}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
          allowGuestbook
            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
            : "bg-white/5 border-white/10 text-zinc-400"
        }`}
      >
        <MessageSquare size={13} />
        <span className="hidden sm:inline">{tSpace("allowGuestbook")}</span>
      </button>

      <div className="w-[1px] h-5 bg-white/15 mx-0.5" />

      {/* Save & Cancel */}
      <button
        type="button"
        disabled={isSaving}
        onClick={onSaveSpace}
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-md transition-all disabled:opacity-50"
      >
        <Save size={14} />
        <span>{isSaving ? tSpace("savingSpace") : tSpace("saveSpace")}</span>
      </button>

      <button
        type="button"
        onClick={onCancelBuilder}
        className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 transition-colors"
        title={tSpace("exitBuilder")}
      >
        <X size={15} />
      </button>
    </div>
  );
}
