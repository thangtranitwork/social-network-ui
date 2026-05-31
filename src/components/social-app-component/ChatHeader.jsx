"use client"

import { ArrowLeft, Phone, Video, MoreVertical } from "lucide-react"
import Avatar from "../ui-components/Avatar"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

// Enable plugin
dayjs.extend(relativeTime)
export default function ChatHeader({
  targetUser,
  onBack,
  onCall,
  onVideoCall,
  onMoreOptions,
}) {
  const router = useRouter()
  const t = useTranslations("chat");
  const tCall = useTranslations("call");
  const tCommon = useTranslations("common");
  const isGroup = targetUser?.isGroup || false

  const handleProfileClick = (e, user) => {
    e.stopPropagation()
    if (!isGroup && user?.username) {
      router.push(`/profile/${user.username}`)
    }
  }

  let statusText = (
    <span className="flex items-center gap-1">
      {t("offline")} <span className="w-2 h-2 rounded-full bg-red-500" />
    </span>
  )
  if (isGroup) {
    statusText = t("details.groupChat")
  } else if (targetUser?.isOnline) {
    statusText = (
      <span className="flex items-center gap-1">
        {t("online")} <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      </span>
    )
  } else if (targetUser?.lastOnline) {
    statusText = `${dayjs(targetUser.lastOnline).fromNow()}`
  }

  const displayName = isGroup
    ? (targetUser?.name || t("details.groupChat"))
    : `${targetUser?.givenName || ""} ${targetUser?.familyName || ""}`.trim() || targetUser?.username || "";

  const avatarUrl = isGroup ? targetUser?.avatar : targetUser?.profilePictureUrl;

  return (
    <div className="flex items-center justify-between gap-3 p-3 py-1 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-[var(--muted-foreground)] hover:text-foreground">
          <ArrowLeft className="w-3 h-3" />
        </button>
      <div className={`flex items-center ${!isGroup ? "cursor-pointer" : ""}`} onClick={(e) => {handleProfileClick(e, targetUser)}}>
      <Avatar src={avatarUrl} size="sm" isGroup={isGroup} />
 
      <div className="flex-1 px-2">
        <div className="font-semibold text-base">{displayName}</div>
        <div className="text-sm text-[var(--muted-foreground)]">
          {statusText}
        </div>
      </div>
      </div>
        </div>
 
      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            console.log("[DEBUG] Voice call button clicked → isGroup:", isGroup, "username:", targetUser?.username)
            onCall && onCall()
          }}
          className="p-2 text-[var(--muted-foreground)] hover:text-foreground hover:bg-[var(--accent)] rounded-full transition-colors"
          title={tCall("audio")}
        >
          <Phone className="w-5 h-5" />
        </button>

        <button
          onClick={() => {
            console.log("[DEBUG] Video call button clicked → isGroup:", isGroup, "username:", targetUser?.username)
            onVideoCall && onVideoCall()
          }}
          className="p-2 text-[var(--muted-foreground)] hover:text-foreground hover:bg-[var(--accent)] rounded-full transition-colors"
          title={tCall("video")}
        >
          <Video className="w-5 h-5" />
        </button>
 
        <button
          onClick={() => {
            console.log("[DEBUG] More options clicked")
            onMoreOptions && onMoreOptions()
          }}
          className="p-2 text-[var(--muted-foreground)] hover:text-foreground hover:bg-[var(--accent)] rounded-full transition-colors"
          title={tCommon("moreOptions")}
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
