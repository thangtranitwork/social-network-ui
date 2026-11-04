export const CHAT_WALLPAPERS = [
  {
    id: "default",
    name: "Mặc định",
    previewStyle: { backgroundColor: "var(--card)" },
    style: {}
  },
  {
    id: "midnight",
    name: "Đêm huyền bí",
    previewStyle: { background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)" },
    style: { background: "linear-gradient(135deg, rgba(30, 27, 75, 0.18) 0%, rgba(15, 23, 42, 0.28) 100%)" }
  },
  {
    id: "sunset",
    name: "Hoàng hôn",
    previewStyle: { background: "linear-gradient(135deg, #f43f5e 0%, #fbbf24 100%)" },
    style: { background: "linear-gradient(135deg, rgba(244, 63, 94, 0.12) 0%, rgba(251, 191, 36, 0.12) 100%)" }
  },
  {
    id: "ocean",
    name: "Biển xanh",
    previewStyle: { background: "linear-gradient(135deg, #0284c7 0%, #6366f1 100%)" },
    style: { background: "linear-gradient(135deg, rgba(2, 132, 199, 0.12) 0%, rgba(99, 102, 241, 0.12) 100%)" }
  },
  {
    id: "emerald",
    name: "Lá ngọc",
    previewStyle: { background: "linear-gradient(135deg, #059669 0%, #10b981 100%)" },
    style: { background: "linear-gradient(135deg, rgba(5, 150, 105, 0.12) 0%, rgba(16, 185, 129, 0.12) 100%)" }
  },
  {
    id: "lavender",
    name: "Oải hương",
    previewStyle: { background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)" },
    style: { background: "linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(236, 72, 153, 0.12) 100%)" }
  },
  {
    id: "warm",
    name: "Ấm áp",
    previewStyle: { background: "linear-gradient(135deg, #ea580c 0%, #f97316 100%)" },
    style: { background: "linear-gradient(135deg, rgba(234, 88, 12, 0.12) 0%, rgba(249, 115, 22, 0.12) 100%)" }
  },
  {
    id: "dots",
    name: "Chấm bi",
    previewStyle: { backgroundImage: "radial-gradient(#6366f1 2px, transparent 2px)", backgroundSize: "8px 8px" },
    style: { backgroundImage: "radial-gradient(rgba(99, 102, 241, 0.15) 1.5px, transparent 1.5px)", backgroundSize: "16px 16px" }
  }
];

export const getChatWallpaper = (chatId) => {
  if (typeof window === "undefined" || !chatId) return "default";
  return localStorage.getItem(`pocpoc_chat_wp_${chatId}`) || "default";
};

export const setChatWallpaper = (chatId, wallpaperId) => {
  if (typeof window === "undefined" || !chatId) return;
  if (!wallpaperId || wallpaperId === "default") {
    localStorage.removeItem(`pocpoc_chat_wp_${chatId}`);
  } else {
    localStorage.setItem(`pocpoc_chat_wp_${chatId}`, wallpaperId);
  }
  window.dispatchEvent(new CustomEvent("chat_wallpaper_changed", { detail: { chatId, wallpaperId } }));
};
