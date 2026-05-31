"use client";

import { useState, useEffect, useRef } from "react";
import Avatar from "../ui-components/Avatar";
import api from "@/utils/axios";
import toast from "react-hot-toast";
import useAppStore from "@/store/ZustandStore";
import { X, Edit2, Check, UserPlus, Trash2, LogOut, Users, User, Loader2, Shield, Camera } from "lucide-react";
import Link from "next/link";
import { uploadFile } from "@/utils/fileUpload";
import { useTranslations } from "next-intl";
import ConfirmModal from "../ui-components/ConfirmModal";

export default function ChatDetailsSidebar({ chatId, targetUser, onClose, onChatUpdated }) {
  const t = useTranslations("chat.details");
  const tCommon = useTranslations("common");
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [groupName, setGroupName] = useState(targetUser?.name || "");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState("");
  const [updatingAvatar, setUpdatingAvatar] = useState(false);

  // Confirm modal state
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const fileInputRef = useRef(null);

  const currentUserId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
  const isGroup = targetUser?.isGroup || false;
  const isAdmin = isGroup && targetUser?.adminId === currentUserId;

  const fetchChatList = useAppStore((state) => state.fetchChatList);

  // Sync group name when targetUser changes
  useEffect(() => {
    setGroupName(targetUser?.name || "");
  }, [targetUser]);

  // Fetch group members
  const fetchGroupMembers = async () => {
    if (!isGroup || !chatId) return;
    setLoadingMembers(true);
    try {
      const res = await api.get(`/v1/chat/groups/${chatId}/members`);
      setMembers(res.data.body || []);
    } catch (err) {
      console.error("Failed to load group members:", err);
      toast.error(t("loadMembersError"));
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    fetchGroupMembers();
    setIsAddingMember(false);
  }, [chatId, isGroup]);

  // Fetch friends for adding
  const fetchFriends = async () => {
    setLoadingFriends(true);
    try {
      const userName = typeof window !== "undefined" ? localStorage.getItem("userName") : null;
      if (!userName) return;
      const res = await api.get(`/v1/friends/${userName}`);
      setFriends(res.data.body || []);
    } catch (err) {
      console.error("Failed to load friends list:", err);
    } finally {
      setLoadingFriends(false);
    }
  };

  useEffect(() => {
    if (isAddingMember) {
      fetchFriends();
    }
  }, [isAddingMember]);

  const handleUpdateGroupName = async () => {
    if (!groupName.trim()) {
      toast.error(t("nameEmpty"));
      return;
    }
    try {
      await api.put(`/v1/chat/groups/${chatId}`, {
        name: groupName.trim(),
        avatar: targetUser?.avatar || "",
      });
      toast.success(t("updateNameSuccess"));
      setIsEditingName(false);
      if (onChatUpdated) {
        onChatUpdated(chatId, { name: groupName.trim() });
      }
    } catch (err) {
      console.error("Failed to update group name:", err);
      toast.error(t("updateNameError"));
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const localDataUrl = event.target.result;
      
      // 1. Optimistic update with local base64 data URL
      if (onChatUpdated) {
        onChatUpdated(chatId, { avatar: localDataUrl });
      }

      setUpdatingAvatar(true);
      try {
        // 2. Upload file to storage
        const fileId = await uploadFile(file);
        
        // 3. Update group metadata in DB
        await api.put(`/v1/chat/groups/${chatId}`, {
          name: groupName.trim() || targetUser?.name || t("groupChat"),
          avatar: fileId,
        });
        
        toast.success(t("updateAvatarSuccess"));
        
        // 4. Trigger server sync to get resolved/presigned URLs
        if (onChatUpdated) {
          onChatUpdated(chatId, {});
        }
      } catch (err) {
        console.error("Failed to update group avatar:", err);
        toast.error(t("updateAvatarError"));
      } finally {
        setUpdatingAvatar(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleKickMember = async (userId, userFullName) => {
    setConfirmConfig({
      isOpen: true,
      title: t("kickConfirmTitle") || tCommon("confirm"),
      message: t("kickConfirm", { name: userFullName }),
      onConfirm: async () => {
        try {
          await api.delete(`/v1/chat/groups/${chatId}/members/${userId}`);
          toast.success(t("kickSuccess", { name: userFullName }));
          fetchGroupMembers();
          if (onChatUpdated) {
            onChatUpdated(chatId, {});
          }
        } catch (err) {
          console.error("Failed to kick member:", err);
          toast.error(t("kickMemberError"));
        }
      }
    });
  };

  const handleAddMember = async (friend) => {
    try {
      await api.post(`/v1/chat/groups/${chatId}/members`, {
        memberIds: [friend.id],
      });
      toast.success(t("addSuccess", { name: friend.givenName }));
      fetchGroupMembers();
      setIsAddingMember(false);
      setFriendSearchQuery("");
      if (onChatUpdated) {
        onChatUpdated(chatId, {});
      }
    } catch (err) {
      console.error("Failed to add member:", err);
      toast.error(t("addMemberError"));
    }
  };

  const handleLeaveGroup = async () => {
    setConfirmConfig({
      isOpen: true,
      title: t("leaveGroup") || tCommon("confirm"),
      message: t("leaveConfirm"),
      onConfirm: async () => {
        try {
          await api.delete(`/v1/chat/groups/${chatId}/members/${currentUserId}`);
          toast.success(t("leaveSuccess"));
          onClose();
          await fetchChatList();
          window.location.href = "/chats"; // Redirect to clean state
        } catch (err) {
          console.error("Failed to leave group:", err);
          toast.error(t("leaveGroupError"));
        }
      }
    });
  };

  // Filter friends who are not already in the group
  const nonMemberFriends = friends.filter(
    (friend) => !members.some((m) => m.id === friend.id)
  );

  const filteredFriends = nonMemberFriends.filter((friend) => {
    const fullName = `${friend.givenName || ""} ${friend.familyName || ""}`.toLowerCase();
    const username = (friend.username || "").toLowerCase();
    const query = friendSearchQuery.toLowerCase().trim();
    return fullName.includes(query) || username.includes(query);
  });

  return (
    <aside className="w-80 md:w-96 border-l border-[var(--border)] bg-[var(--card)] flex flex-col h-full z-10 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <h3 className="font-semibold text-base">{t("title")}</h3>
        <button
          onClick={onClose}
          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-[var(--accent)] rounded-full transition-colors"
          title={t("close")}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content scroll area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Info Box */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div
            className={`relative group ${isGroup && isAdmin ? "cursor-pointer" : ""}`}
            onClick={() => isGroup && isAdmin && fileInputRef.current?.click()}
          >
            <Avatar
              src={isGroup ? targetUser?.avatar : targetUser?.profilePictureUrl}
              size="lg"
              isGroup={isGroup}
              className="w-20 h-20 shadow-md ring-2 ring-blue-500/10 transition group-hover:brightness-90"
            />
            {isGroup && isAdmin && (
              <>
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
              </>
            )}
            {updatingAvatar && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full">
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              </div>
            )}
          </div>

          <div className="w-full px-2">
            {isEditingName ? (
              <div className="flex items-center gap-1 max-w-xs mx-auto">
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full text-center font-semibold text-base py-1 px-2 bg-[var(--background)] border border-[var(--border)] rounded-lg outline-none text-[var(--foreground)]"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleUpdateGroupName()}
                />
                <button
                  onClick={handleUpdateGroupName}
                  className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded-md transition"
                  title={tCommon("save")}
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setIsEditingName(false);
                    setGroupName(targetUser?.name || "");
                  }}
                  className="p-1.5 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition"
                  title={tCommon("cancel")}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1.5 group">
                <h4 className="font-bold text-lg line-clamp-1 text-[var(--foreground)]">
                  {isGroup
                    ? targetUser?.name || t("groupChat")
                    : `${targetUser?.givenName || ""} ${targetUser?.familyName || ""}`.trim() || targetUser?.username}
                </h4>
                {isAdmin && (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1 text-muted-foreground hover:text-foreground rounded transition opacity-0 group-hover:opacity-100"
                    title={tCommon("edit")}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-1">
              {isGroup
                ? t("groupChatMembers", { count: members.length })
                : `@${targetUser?.username || ""}`}
            </p>
          </div>
        </div>

        {/* 1-1 Chat actions */}
        {!isGroup && (
          <div className="space-y-2">
            {targetUser?.username && (
              <Link
                href={`/profile/${targetUser.username}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--accent)] transition text-sm font-medium"
              >
                <User className="w-4 h-4 text-blue-500" />
                <span>{t("viewProfile")}</span>
              </Link>
            )}
          </div>
        )}

        {/* Group Members Section */}
        {isGroup && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>{t("members", { count: members.length })}</span>
              </h5>
              {isAdmin && (
                <button
                  onClick={() => setIsAddingMember((prev) => !prev)}
                  className="text-xs font-semibold text-blue-500 hover:text-blue-600 flex items-center gap-1 transition"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isAddingMember ? t("close") : t("add")}</span>
                </button>
              )}
            </div>

            {/* Add Member Subsection */}
            {isAddingMember && (
              <div className="p-3 bg-[var(--accent)]/50 rounded-xl space-y-2.5 border border-[var(--border)] animate-in fade-in duration-200">
                <p className="text-xs font-medium text-muted-foreground">{t("addFriendsToGroup")}</p>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t("searchFriends")}
                    value={friendSearchQuery}
                    onChange={(e) => setFriendSearchQuery(e.target.value)}
                    className="w-full text-xs py-1.5 px-3 bg-[var(--background)] border border-[var(--border)] rounded-lg outline-none text-[var(--foreground)] placeholder-muted-foreground"
                  />
                </div>

                {loadingFriends ? (
                  <div className="flex justify-center py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  </div>
                ) : filteredFriends.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-1">
                    {t("noFriendsFound")}
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {filteredFriends.map((friend) => (
                      <div
                        key={friend.id}
                        className="flex items-center justify-between p-1.5 hover:bg-[var(--background)] rounded-lg transition"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar
                            src={friend.profilePictureUrl}
                            className="w-7 h-7 object-cover"
                          />
                          <div className="text-xs">
                            <p className="font-semibold line-clamp-1">
                              {friend.givenName} {friend.familyName}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddMember(friend)}
                          className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-[10px] font-semibold transition"
                        >
                          {t("add")}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Members List */}
            {loadingMembers ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => {
                  const isMemberAdmin = member.id === targetUser?.adminId;
                  const isSelf = member.id === currentUserId;
                  const fullName = `${member.givenName || ""} ${member.familyName || ""}`.trim() || member.username;

                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--accent)]/30 transition group/item"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={member.profilePictureUrl}
                          className="w-9 h-9 object-cover"
                        />
                        <div>
                          <p className="font-semibold text-sm flex items-center gap-1.5">
                            <span className="line-clamp-1">{fullName}</span>
                            {isSelf && <span className="text-[10px] text-muted-foreground font-normal">({tCommon("you")})</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">@{member.username}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isMemberAdmin && (
                          <span
                            title={t("admin")}
                            className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                          >
                            <Shield className="w-2.5 h-2.5" />
                            <span>{t("admin")}</span>
                          </span>
                        )}

                        {isAdmin && !isSelf && (
                          <button
                            onClick={() => handleKickMember(member.id, fullName)}
                            className="p-1 text-red-500 hover:bg-red-500/10 rounded transition opacity-0 group-hover/item:opacity-100"
                            title={t("kickMemberError")}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Leave group actions */}
      {isGroup && (
        <div className="p-4 border-t border-[var(--border)]">
          <button
            onClick={handleLeaveGroup}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition font-medium text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>{t("leaveGroup")}</span>
          </button>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
      />
    </aside>
  );
}
