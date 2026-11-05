// Constants, Themes, Frame Styles, and Layout Engine for Spatial Profile

export const SPACE_THEMES = [
  { id: "COSMIC_VOID", labelKey: "themeCosmic", previewBg: "#07080E", accent: "#6366F1" },
  { id: "ART_GALLERY", labelKey: "themeGallery", previewBg: "#F5F2EB", accent: "#D97706" },
  { id: "BLUEPRINT_STUDIO", labelKey: "themeBlueprint", previewBg: "#0B192C", accent: "#06B6D4" },
  { id: "ETHEREAL_GLASS", labelKey: "themeEthereal", previewBg: "#13111C", accent: "#EC4899" },
];

export const ACCENT_PRESETS = [
  "#6366F1", // Indigo
  "#EC4899", // Rose Pink
  "#06B6D4", // Cyan
  "#10B981", // Emerald
  "#F59E0B", // Amber Gold
  "#8B5CF6", // Violet
];

export const NODE_FRAME_STYLES = {
  IDENTITY_CORE: ["GLASS", "GALLERY_PLAQUE", "COSMIC_ORB", "MINIMAL"],
  POST_CARD: ["POLAROID", "MUSEUM_FRAME", "FLOATING_GLASS", "MANUSCRIPT"],
  COMMENT_CARD: ["QUOTE_CARD", "GLASS_BUBBLE", "MUSEUM_PLAQUE"],
  MEDIA_FRAME: ["GALLERY_MATTE", "BORDERLESS", "TAPE_PIN"],
  TEXT_NOTE: ["SERIF_EDITORIAL", "MONO_TECH", "HANDWRITTEN"],
  AUDIO_VINYL: ["CLASSIC_VINYL", "NEON_DISC"],
  PORTAL_LINK: ["STAR_PORTAL", "GLASS"],
  GUESTBOOK_WALL: ["GLASS", "CORK_BOARD"],
  EMBED_IFRAME: ["BROWSER_WINDOW", "CINEMA_SCREEN", "GLASS_PORTAL"],
};

export const NOTE_COLORS = {
  AMBER: {
    bg: "bg-amber-100/95 dark:bg-amber-950/80",
    border: "border-amber-300/70 dark:border-amber-700/60",
    text: "text-amber-950 dark:text-amber-100",
    dot: "#F59E0B",
  },
  ROSE: {
    bg: "bg-rose-100/95 dark:bg-rose-950/80",
    border: "border-rose-300/70 dark:border-rose-700/60",
    text: "text-rose-950 dark:text-rose-100",
    dot: "#F43F5E",
  },
  CYAN: {
    bg: "bg-cyan-100/95 dark:bg-cyan-950/80",
    border: "border-cyan-300/70 dark:border-cyan-700/60",
    text: "text-cyan-950 dark:text-cyan-100",
    dot: "#06B6D4",
  },
  VIOLET: {
    bg: "bg-violet-100/95 dark:bg-violet-950/80",
    border: "border-violet-300/70 dark:border-violet-700/60",
    text: "text-violet-950 dark:text-violet-100",
    dot: "#8B5CF6",
  },
  EMERALD: {
    bg: "bg-emerald-100/95 dark:bg-emerald-950/80",
    border: "border-emerald-300/70 dark:border-emerald-700/60",
    text: "text-emerald-950 dark:text-emerald-100",
    dot: "#10B981",
  },
};

/**
 * Creates the clean default space containing ONLY the Identity Core and Guestbook Wall.
 * Posts, comments, media, and embeds are NEVER added automatically without the owner explicitly selecting them.
 */
export function createDefaultSpaceNodes(profileData) {
  return [
    {
      id: "node_identity_core",
      type: "IDENTITY_CORE",
      x: 0,
      y: 0,
      scale: 1.0,
      rotation: 0,
      zIndex: 30,
      frameStyle: "GLASS",
      content: {
        subtitle: profileData?.bio || "",
      },
    },
    {
      id: "node_guestbook_main",
      type: "GUESTBOOK_WALL",
      x: -440,
      y: 0,
      scale: 1.0,
      rotation: -2,
      zIndex: 20,
      frameStyle: "GLASS",
      content: {
        title: "Sổ lưu bút không gian",
      },
    },
  ];
}

/**
 * Rearranges ONLY the nodes that the user has already added to their space
 * into Orbit, Gallery, or Scatter presets (never injects unselected posts/comments).
 */
export function arrangeExistingNodes(existingNodes = [], preset = "ORBIT") {
  const coreNode = existingNodes.find((n) => n.type === "IDENTITY_CORE") || {
    id: "node_identity_core",
    type: "IDENTITY_CORE",
    x: 0,
    y: 0,
    scale: 1.0,
    rotation: 0,
    zIndex: 30,
    frameStyle: "GLASS",
    content: {},
  };

  const artifacts = existingNodes.filter((n) => n.type !== "IDENTITY_CORE");
  const result = [
    {
      ...coreNode,
      x: 0,
      y: 0,
      rotation: 0,
    },
  ];

  if (preset === "GALLERY") {
    const gallerySlots = [
      { x: -480, y: -240, rot: 0 },
      { x: 480, y: -240, rot: 0 },
      { x: -480, y: 240, rot: 0 },
      { x: 480, y: 240, rot: 0 },
      { x: 0, y: -460, rot: 0 },
      { x: 0, y: 460, rot: 0 },
      { x: -920, y: 0, rot: 0 },
      { x: 920, y: 0, rot: 0 },
      { x: -920, y: -380, rot: 0 },
      { x: 920, y: -380, rot: 0 },
      { x: -920, y: 380, rot: 0 },
      { x: 920, y: 380, rot: 0 },
    ];
    artifacts.forEach((art, idx) => {
      const slot = gallerySlots[idx % gallerySlots.length];
      result.push({
        ...art,
        x: slot.x,
        y: slot.y,
        rotation: slot.rot,
        zIndex: 10 + idx,
      });
    });
  } else if (preset === "SCATTER") {
    const scatterSlots = [
      { x: -460, y: -260, rot: -4 },
      { x: 470, y: -240, rot: 3 },
      { x: -500, y: 220, rot: 2 },
      { x: 490, y: 230, rot: -3 },
      { x: -80, y: -460, rot: -2 },
      { x: 95, y: 460, rot: 2 },
      { x: -880, y: -60, rot: -5 },
      { x: 890, y: -40, rot: 4 },
      { x: -820, y: 390, rot: 3 },
      { x: 830, y: 410, rot: -4 },
    ];
    artifacts.forEach((art, idx) => {
      const slot = scatterSlots[idx % scatterSlots.length];
      result.push({
        ...art,
        x: slot.x,
        y: slot.y,
        rotation: slot.rot,
        zIndex: 10 + idx,
      });
    });
  } else {
    // ORBIT
    artifacts.forEach((art, idx) => {
      const ring = idx < 6 ? 0 : 1;
      const countInRing = ring === 0 ? Math.min(6, artifacts.length) : artifacts.length - 6;
      const indexInRing = ring === 0 ? idx : idx - 6;
      const angle = (indexInRing / Math.max(1, countInRing)) * Math.PI * 2 - Math.PI / 4;
      const radiusX = ring === 0 ? 520 : 940;
      const radiusY = ring === 0 ? 390 : 680;
      const x = Math.round(Math.cos(angle) * radiusX);
      const y = Math.round(Math.sin(angle) * radiusY);
      const rot = ((idx % 3) - 1) * 2;

      result.push({
        ...art,
        x,
        y,
        rotation: rot,
        zIndex: 10 + idx,
      });
    });
  }

  return result;
}
