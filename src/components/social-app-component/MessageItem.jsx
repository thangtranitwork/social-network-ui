"use client";

import { useMemo, useState, useEffect, useCallback, memo } from "react";
import { 
  File, Download, Image as ImageIcon, Film, 
  MoreVertical, Reply, Trash2, Edit2, Play, 
  Phone, Video, Mic, Check, CheckCheck, Clock,
  ExternalLink
} from "lucide-react";
import Avatar from "../ui-components/Avatar";
import Link from "next/link";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { getUserId, getUserName } from "@/utils/axios";
import { useTranslations } from "next-intl";
import useAppStore from "@/store/ZustandStore";
import VoiceMessage from "./VoiceMessage";

dayjs.extend(relativeTime);

// Helper to format duration in MM:SS
const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

// Memoized helper to get filename from URL
const getFilenameFromUrl = (url, t) => {
  if (!url) return t('chat.unknownFile');
  try {
    const decodedUrl = decodeURIComponent(url);
    const parts = decodedUrl.split('/');
    const lastPart = parts[parts.length - 1];
    return lastPart.split('?')[0] || t('chat.unknownFile');
  } catch (e) {
    return t('chat.unknownFile');
  }
};

// Memoized helper to get file type from URL
const getFileTypeFromUrl = (url) => {
  if (!url) return 'file';
  const extension = url.split('.').pop().split('?')[0].toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) return 'image';
  if (['mp4', 'webm', 'ogg'].includes(extension)) return 'video';
  return 'file';
};

const MessageItem = ({ 
  msg, 
  isOwn, 
  showAvatar, 
  targetUser, 
  onReply, 
  onDelete, 
  onEdit,
  onImageClick,
  onFileClick
}) => {
  const t = useTranslations('chat');
  const tCommon = useTranslations('common');
  const myId = getUserId();
  const makeCall = useAppStore(state => state.makeCall);
  
  const [showOptions, setShowOptions] = useState(false);
  // Backend trả về: deleted, updated, sentAt
  const isDeleted = msg.deleted || msg.isDeleted || msg.status === "DELETED";
  const isEdited = msg.updated || msg.isEdited;

  // Media preview component
  const MediaPreview = useCallback(({ url, type, filename }) => {
    if (type === 'image') {
      return (
        <div 
          className="relative rounded-lg overflow-hidden cursor-pointer hover:opacity-95 transition-opacity max-w-[240px]"
          onClick={() => onImageClick?.(url)}
        >
          <img src={url} alt={filename} className="w-full h-auto object-cover max-h-[300px]" />
        </div>
      );
    }
    if (type === 'video') {
      return (
        <div className="relative rounded-lg overflow-hidden max-w-[240px] bg-black/5">
          <video src={url} className="w-full h-auto max-h-[300px]" />
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors cursor-pointer"
            onClick={() => onImageClick?.(url, 'video')}
          >
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <Play size={20} fill="currentColor" />
            </div>
          </div>
        </div>
      );
    }
    return null;
  }, [onImageClick]);

  // File info component
  const renderFileInfo = useMemo(() => {
    return (url, type, filename, size) => {
      const isMedia = type === 'image' || type === 'video';
      const truncatedFilename = filename.length > 20 ? filename.substring(0, 17) + '...' : filename;
      
      if (isMedia) return <MediaPreview url={url} type={type} filename={filename} />;

      return (
        <div className="flex items-center gap-3 p-2 rounded-lg bg-black/5 hover:bg-black/10 transition-colors border border-black/5">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
            <File className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-foreground truncate" title={filename}>
              {truncatedFilename}
            </div>
            {size && <div className="text-[10px] text-muted-foreground">{dayjs().format('HH:mm')}</div>}
          </div>
          <a href={url} download target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-full hover:bg-black/5 text-muted-foreground transition-colors" onClick={(e) => e.stopPropagation()}>
            <Download className="w-4 h-4" />
          </a>
        </div>
      );
    };
  }, [MediaPreview]);

  const messageContent = useMemo(() => {
    if (isDeleted) return (
      <span className="flex items-center gap-2 italic opacity-60">
        <Trash2 size={12} />
        {t('thisMessageDeleted')}
      </span>
    );

    if (msg.type === "CALL" && msg.callId) {
      const isGroup = targetUser?.isGroup;
      const isActive = !msg.endAt;

      if (msg.answered === false && !isGroup) {
        const Icon = msg.isVideoCall ? Video : Phone;
        return (
          <span className="flex items-center gap-2 text-red-500">
            <Icon size={14} />
            {t('missedCall')}
          </span>
        );
      } else {
        const durationSec = msg.endAt ? dayjs(msg.endAt).diff(dayjs(msg.callAt), "second") : 0;
        const durationStr = formatDuration(durationSec);

        return (
          <div className="flex flex-col gap-2 min-w-[120px]">
            <div className="flex items-center gap-2">
              <Phone size={14} className={isActive && isGroup ? "text-green-500 animate-pulse" : ""} />
              <span className="font-semibold">
                {isGroup ? (isActive ? t('groupCallOngoing') : t('groupCallEnded')) : t('callEnded')}
              </span>
            </div>
            
            {isActive && isGroup && (
              <button 
                onClick={(e) => {
                    e.stopPropagation();
                    makeCall(getUserName(), msg.isVideoCall, msg.chatId);
                }}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1 shadow-sm"
              >
                {t('join')}
              </button>
            )}
            {msg.endAt && (
              <div className="text-[10px] opacity-70 border-t border-white/20 pt-1">
                {t('duration')}: {durationStr}
              </div>
            )}
          </div>
        );
      }
    }

    if (msg.attachment && msg.type === "FILE") {
      const filename = msg.attachmentName || getFilenameFromUrl(msg.attachment, t);
      return renderFileInfo(
        msg.attachment,
        getFileTypeFromUrl(msg.attachment),
        filename
      );
    }

    // Voice message: attachment có thể nằm trong attachment hoặc content (tuỳ backend)
    const voiceUrl = msg.type === "VOICE" ? (msg.attachment || msg.content) : null;
    if (msg.type === "VOICE" && voiceUrl) {
      return <VoiceMessage msg={{ ...msg, attachment: voiceUrl }} isOwn={isOwn} />;
    }

    // GIF: url có thể nằm trong attachment hoặc content
    const gifUrl = msg.type === "GIF" ? (msg.attachment || msg.content) : null;
    if (msg.type === "GIF" && gifUrl) {
        return (
            <div 
                className="relative rounded-lg overflow-hidden cursor-pointer hover:opacity-95 transition-opacity max-w-[240px]"
                onClick={() => onImageClick?.(gifUrl)}
            >
                <img src={gifUrl} alt="GIF" className="w-full h-auto object-cover max-h-[300px]" />
                <div className="absolute bottom-1 right-1 px-1 bg-black/50 text-[10px] text-white rounded font-bold uppercase tracking-wider">GIF</div>
            </div>
        );
    }

    return (
      <div className="flex flex-col gap-1">
        <p className="whitespace-pre-wrap break-words leading-relaxed">
          {msg.content}
        </p>
        {isEdited && !isDeleted && (
          <span className="text-[10px] opacity-50 italic self-end">
            {t('edited')}
          </span>
        )}
      </div>
    );
  }, [msg, isDeleted, isEdited, t, renderFileInfo, isOwn, targetUser, makeCall]);

  const messageTime = useMemo(() => {
    // Backend trả về sentAt, fallback sang timestamp/createdAt
    return dayjs(msg.sentAt || msg.timestamp || msg.createdAt).format("HH:mm");
  }, [msg.sentAt, msg.timestamp, msg.createdAt]);

  const renderStatus = () => {
    if (!isOwn) return null;
    
    // Status icons
    if (msg.status === "SENDING") return <Clock size={10} className="text-muted-foreground animate-pulse" />;
    if (msg.status === "ERROR") return <div className="w-2 h-2 rounded-full bg-red-500" title="Error sending" />;
    
    if (msg.isRead || msg.status === "READ") return <CheckCheck size={14} className="text-blue-500" />;
    return <Check size={14} className="text-muted-foreground" />;
  };

  return (
    <div className={`flex w-full mb-4 px-4 group ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[75%] md:max-w-[65%] gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
        
        {/* Avatar */}
        <div className="flex-shrink-0 mt-auto mb-4">
          {!isOwn && showAvatar ? (
            <Link href={`/profile/${targetUser?.username}`}>
              <Avatar src={targetUser?.profilePictureUrl} size="sm" />
            </Link>
          ) : (
            <div className="w-8" />
          )}
        </div>

        {/* Message Bubble & Options Container */}
        <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
          {/* Sender name for group chats */}
          {!isOwn && targetUser?.isGroup && msg.senderName && (
            <span className="text-[10px] text-muted-foreground mb-1 ml-1 font-medium">
              {msg.senderName}
            </span>
          )}

          <div className="flex items-center gap-1">
            {/* Tin nhắn của bản thân: nút nằm bên TRÁI bubble */}
            {isOwn && !isDeleted && (
               <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                  <button 
                    onClick={() => onReply?.(msg)}
                    className="p-1.5 rounded-full hover:bg-[var(--accent)] text-muted-foreground transition-colors"
                    title={t('reply')}
                  >
                    <Reply size={14} />
                  </button>
                  <div className="relative">
                    <button 
                      onClick={() => setShowOptions(!showOptions)}
                      className="p-1.5 rounded-full hover:bg-[var(--accent)] text-muted-foreground transition-colors"
                    >
                      <MoreVertical size={14} />
                    </button>
                    
                    {showOptions && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowOptions(false)} />
                        <div className="absolute left-0 bottom-full mb-2 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-xl py-1 z-20 min-w-[100px] animate-in fade-in slide-in-from-bottom-2 duration-150">
                          {msg.type === "TEXT" && (
                            <button 
                              onClick={() => { onEdit?.(msg); setShowOptions(false); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--accent)] transition-colors"
                            >
                              <Edit2 size={12} /> {t('edit')}
                            </button>
                          )}
                          <button 
                            onClick={() => { onDelete?.(msg.id); setShowOptions(false); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--accent)] text-red-500 transition-colors"
                          >
                            <Trash2 size={12} /> {t('delete')}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
               </div>
            )}

            <div 
              className={`
                relative px-3 py-2 rounded-2xl shadow-sm text-sm
                ${isOwn 
                  ? "bg-blue-600 text-white rounded-tr-none" 
                  : "bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] rounded-tl-none"}
                ${isDeleted ? "opacity-60 grayscale-[0.5]" : ""}
              `}
            >
              {messageContent}
              
              <div className={`flex items-center gap-1 mt-1 justify-end ${isOwn ? "text-blue-100/70" : "text-muted-foreground/70"}`}>
                <span className="text-[10px]">{messageTime}</span>
                {renderStatus()}
              </div>
            </div>

            {/* Tin nhắn người khác: nút nằm bên PHẢI bubble */}
            {!isOwn && (
               <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                  <button 
                    onClick={() => onReply?.(msg)}
                    className="p-1.5 rounded-full hover:bg-[var(--accent)] text-muted-foreground transition-colors"
                    title={t('reply')}
                  >
                    <Reply size={14} />
                  </button>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Custom comparison function for React.memo
const areEqual = (prev, next) => {
  // Always update if any core props changed
  if (prev.isOwn !== next.isOwn) return false;
  if (prev.showAvatar !== next.showAvatar) return false;
  if (prev.targetUser?.id !== next.targetUser?.id) return false;
  if (prev.targetUser?.isGroup !== next.targetUser?.isGroup) return false;
  if (prev.targetUser?.isOnline !== next.targetUser?.isOnline) return false;
  
  // Message comparison
  const pMsg = prev.msg;
  const nMsg = next.msg;
  
  if (pMsg.id !== nMsg.id) return false;
  if (pMsg.status !== nMsg.status) return false;
  if (pMsg.isRead !== nMsg.isRead) return false;
  // Backend dùng 'deleted' và 'updated'
  if ((pMsg.deleted || pMsg.isDeleted) !== (nMsg.deleted || nMsg.isDeleted)) return false;
  if ((pMsg.updated || pMsg.isEdited) !== (nMsg.updated || nMsg.isEdited)) return false;
  if (pMsg.content !== nMsg.content) return false;
  if (pMsg.type !== nMsg.type) return false;
  if (pMsg.attachment !== nMsg.attachment) return false;
  
  // Call state comparison
  if (pMsg.type === "CALL") {
    if (pMsg.answered !== nMsg.answered) return false;
    if (pMsg.endAt !== nMsg.endAt) return false;
  }
  
  return true;
};

export default memo(MessageItem, areEqual);
