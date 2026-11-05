"use client";

import { Compass, ArrowUpRight } from "lucide-react";
import Avatar from "@/components/ui-components/Avatar";
import { useRouter } from "next/navigation";

export default function PortalFriendNode({
  node,
  customAccent = "#6366F1",
  isBuilderMode = false,
  tSpace,
}) {
  const router = useRouter();
  const targetUsername = node?.content?.username || "";
  const displayName = node?.content?.displayName || targetUsername;
  const avatarUrl = node?.content?.avatarUrl || "";
  const label = node?.content?.label || "";
  const frameStyle = node?.frameStyle || "STAR_PORTAL";

  const handleNavigate = () => {
    if (isBuilderMode || !targetUsername) return;
    router.push(`/profile/${targetUsername}`);
  };

  if (frameStyle === "GLASS") {
    return (
      <div
        onClick={handleNavigate}
        className={`w-[220px] p-4 rounded-2xl bg-zinc-900/80 text-white backdrop-blur-xl border border-white/15 shadow-2xl flex items-center gap-3 transition-transform ${
          !isBuilderMode ? "cursor-pointer hover:scale-105" : ""
        }`}
      >
        <Avatar src={avatarUrl} alt={displayName} size={46} className="rounded-full object-cover shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold truncate">{displayName}</p>
          <p className="text-[11px] text-zinc-400 truncate">@{targetUsername}</p>
          {label && <p className="text-[10px] text-indigo-300 truncate mt-0.5">{label}</p>}
        </div>
        <ArrowUpRight size={15} className="text-zinc-400 shrink-0" />
      </div>
    );
  }

  // Default: STAR_PORTAL
  return (
    <div
      onClick={handleNavigate}
      className={`group relative flex flex-col items-center p-4 rounded-3xl bg-zinc-950/80 text-white backdrop-blur-xl border border-white/15 shadow-[0_0_50px_rgba(99,102,241,0.25)] w-[180px] text-center transition-all duration-300 ${
        !isBuilderMode ? "cursor-pointer hover:scale-105" : ""
      }`}
    >
      <div
        className="relative p-1 rounded-full mb-2.5"
        style={{
          background: `conic-gradient(from 0deg, ${customAccent}, transparent, ${customAccent})`,
        }}
      >
        <Avatar src={avatarUrl} alt={displayName} size={58} className="rounded-full object-cover bg-zinc-900" />
      </div>

      <p className="text-xs font-bold truncate max-w-full">{displayName}</p>
      <p className="text-[11px] text-zinc-400 truncate max-w-full">@{targetUsername}</p>
      {label && <p className="mt-1 text-[10px] text-zinc-300 italic line-clamp-1">{label}</p>}

      <div
        className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold text-white/90 bg-white/10 group-hover:bg-white/20 transition-colors"
      >
        <Compass size={11} style={{ color: customAccent }} />
        <span>{tSpace ? tSpace("visitPortal") : "Du hành"}</span>
      </div>
    </div>
  );
}
