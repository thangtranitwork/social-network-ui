"use client";

import { useState, useRef, useMemo } from "react";
import {
  Edit,
  MessageCircle,
  UserPlus,
  UserMinus,
  UserCheck,
  UserX,
  Shield,
  MoreVertical,
  Camera,
  Sparkles,
  X,
} from "lucide-react";
import Avatar from "@/components/ui-components/Avatar";
import Modal from "@/components/ui-components/Modal";
import EditProfileModal from "@/components/social-app-component/EditProfile";
import FriendsListModal from "@/components/social-app-component/FriendsListModal";
import ConfirmModal from "@/components/ui-components/ConfirmModal";
import api from "@/utils/axios";
import { uploadFile } from "@/utils/fileUpload";
import { formatFullName } from "@/utils/formatName";
import useAppStore, { selectSortedChatList } from "@/store/ZustandStore";
import { useShallow } from "zustand/react/shallow";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

export default function IdentityCoreNode({
  node,
  profileData,
  isOwnProfile = false,
  customAccent = "#6366F1",
  isBuilderMode = false,
  onProfileUpdate,
  onUsernameChange,
}) {
  const t = useTranslations("profile");
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  const [friendsList, setFriendsList] = useState([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [initialModalTab, setInitialModalTab] = useState("friends");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isBlockConfirmOpen, setIsBlockConfirmOpen] = useState(false);
  const [isViewFullAvatarOpen, setIsViewFullAvatarOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarFileInputRef = useRef(null);

  const chatMap = useAppStore((state) => state.chatMap);
  const { selectChat, showVirtualChat } = useAppStore(
    useShallow((state) => ({
      selectChat: state.selectChat,
      showVirtualChat: state.showVirtualChat,
    }))
  );
  const chatList = useMemo(() => selectSortedChatList({ chatMap }), [chatMap]);

  const username = profileData?.username;
  const avatar = profileData?.profilePictureUrl;
  const frameStyle = node?.frameStyle || "GLASS";

  const handleQuickAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading(t("editModal.saving"));
    try {
      setIsUploadingAvatar(true);
      const fileId = await uploadFile(file);
      await api.patch("/v1/users/update-profile-picture", { fileId });

      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:11111";
      const fullUrl = `${apiBase}/v1/files/${fileId}`;

      if (onProfileUpdate) {
        onProfileUpdate({
          ...profileData,
          profilePictureUrl: fullUrl,
        });
      }
      toast.success(t("editModal.avatarUpdateSuccess"), { id: toastId });
    } catch {
      toast.error(t("editModal.avatarUpdateError"), { id: toastId });
    } finally {
      setIsUploadingAvatar(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleChatClick = () => {
    if (isBuilderMode) return;
    const targetUserId = profileData?.id;
    const targetUsername = profileData?.username;
    if (!targetUserId) {
      toast.error(t("chatError"));
      return;
    }

    const existingChat = chatList.find(
      (chat) => chat.target?.id === targetUserId || chat.target?.username === targetUsername
    );
    if (existingChat) {
      selectChat(existingChat.chatId);
      router.push(`/chats?chatId=${existingChat.chatId}`);
      return;
    }

    showVirtualChat(targetUserId, {
      username: profileData.username,
      givenName: profileData.givenName,
      familyName: profileData.familyName,
      profilePictureUrl: profileData.profilePictureUrl,
      online: profileData.online || false,
    });
    router.push(`/chats?chatId=${targetUserId}`);
  };

  const sendFriendRequest = async () => {
    if (isBuilderMode) return;
    try {
      const res = await api.post(`/v1/friend-request/send/${username}`);
      if (res.data.code === 200) {
        toast.success(t("sendRequestSuccess"));
        onProfileUpdate?.({ ...profileData, request: "OUT" });
      }
    } catch {
      toast.error(t("sendRequestError"));
    }
  };

  const cancelFriendRequest = async () => {
    if (isBuilderMode) return;
    try {
      await api.delete(`/v1/friend-request/delete/${username}`);
      toast.success(t("cancelRequestSuccess"));
      onProfileUpdate?.({ ...profileData, request: "NONE" });
    } catch {
      toast.error(t("cancelRequestError"));
    }
  };

  const acceptFriendRequest = async () => {
    if (isBuilderMode) return;
    try {
      const res = await api.post(`/v1/friend-request/accept/${username}`);
      if (res.data.code === 200) {
        toast.success(t("acceptSuccess"));
        onProfileUpdate?.({
          ...profileData,
          isFriend: true,
          request: "NONE",
          friendCount: (profileData.friendCount || 0) + 1,
        });
      }
    } catch {
      toast.error(t("acceptError"));
    }
  };

  const declineFriendRequest = async () => {
    if (isBuilderMode) return;
    try {
      await api.delete(`/v1/friend-request/delete/${username}`);
      toast.success(t("declineSuccess"));
      onProfileUpdate?.({ ...profileData, request: "NONE" });
    } catch {
      toast.error(t("declineError"));
    }
  };

  const unfriend = async () => {
    try {
      await api.delete(`/v1/friends/${username}`);
      toast.success(t("unfriendSuccess"));
      onProfileUpdate?.({
        ...profileData,
        isFriend: false,
        request: "NONE",
        friendCount: Math.max(0, (profileData.friendCount || 1) - 1),
      });
      setIsDropdownOpen(false);
    } catch {
      toast.error(t("unfriendError"));
    }
  };

  const executeBlockUser = async () => {
    try {
      const res = await api.post(`/v1/blocks/${username}`);
      if (res.data.code === 200) {
        toast.success(t("blockSuccess", { username }));
        setIsDropdownOpen(false);
      }
    } catch {
      toast.error(t("blockError"));
    }
  };

  const openFriendsModal = async (tab = "friends") => {
    if (isBuilderMode) return;
    setIsLoadingFriends(true);
    try {
      const res = await api.get(`/v1/friends/${username}`);
      if (res.data.code === 200) {
        setFriendsList(res.data.body || []);
        setInitialModalTab(tab);
        setIsFriendsModalOpen(true);
      }
    } catch {
      toast.error(t("loadFriendsError"));
    } finally {
      setIsLoadingFriends(false);
    }
  };

  // Frame styling variants
  const cardStyleClasses = {
    GLASS:
      "bg-zinc-900/75 dark:bg-zinc-900/80 text-white backdrop-blur-2xl border border-white/15 shadow-[0_24px_80px_rgba(0,0,0,0.55)] rounded-3xl",
    GALLERY_PLAQUE:
      "bg-[#FAF8F5] text-stone-900 border-2 border-stone-300 shadow-[0_25px_60px_rgba(0,0,0,0.18)] rounded-xl",
    COSMIC_ORB:
      "bg-gradient-to-b from-zinc-900/90 via-indigo-950/80 to-zinc-950/95 text-white backdrop-blur-2xl border border-indigo-400/30 shadow-[0_0_90px_rgba(99,102,241,0.3)] rounded-[2.5rem]",
    MINIMAL:
      "bg-zinc-950/90 text-white border border-zinc-800 shadow-2xl rounded-2xl",
  }[frameStyle] || "bg-zinc-900/80 text-white backdrop-blur-2xl border border-white/15 rounded-3xl";

  const isLightPlaque = frameStyle === "GALLERY_PLAQUE";

  const reqStatus = profileData?.request;
  const isSent = reqStatus === "OUT" || reqStatus === "SENT";
  const isReceived = reqStatus === "IN" || reqStatus === "RECEIVED";
  const isNone = !reqStatus || reqStatus === "NONE" || reqStatus === "";

  return (
    <div className={`relative w-[360px] sm:w-[410px] p-6 sm:p-7 transition-all duration-300 ${cardStyleClasses}`}>
      {/* Ambient Halo Ring */}
      <div
        className="pointer-events-none absolute -inset-1 rounded-[inherit] opacity-25 blur-xl -z-10"
        style={{ background: customAccent }}
      />

      {/* Top Curator Badge */}
      <div className="flex items-center justify-between mb-4">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase ${
            isLightPlaque ? "bg-stone-200/80 text-stone-700" : "bg-white/10 text-zinc-200"
          }`}
        >
          <Sparkles size={12} style={{ color: customAccent }} />
          <span>@{username}</span>
        </span>

        {!isOwnProfile && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isLightPlaque ? "hover:bg-stone-200 text-stone-700" : "hover:bg-white/10 text-zinc-300"
              }`}
            >
              <MoreVertical size={15} />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl bg-zinc-900 text-white border border-white/15 shadow-2xl py-1.5 z-50">
                {profileData?.isFriend && (
                  <button
                    type="button"
                    onClick={unfriend}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-rose-400 hover:bg-white/10 flex items-center gap-2"
                  >
                    <UserMinus size={14} />
                    <span>{t("unfriend")}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsBlockConfirmOpen(true);
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-rose-400 hover:bg-white/10 flex items-center gap-2"
                >
                  <Shield size={14} />
                  <span>{t("block")}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Avatar & Identity Header */}
      <div className="flex flex-col items-center text-center">
        <div className="relative group">
          <div
            onClick={() => {
              if (isBuilderMode) return;
              setIsViewFullAvatarOpen(true);
            }}
            className="relative cursor-pointer rounded-full p-1 transition-transform duration-300 group-hover:scale-[1.03]"
            style={{
              background: `linear-gradient(135deg, ${customAccent}, transparent 80%)`,
            }}
          >
            <Avatar
              src={avatar}
              alt={username || "Avatar"}
              size={104}
              className="rounded-full object-cover border-2 border-black/20"
            />
          </div>

          {isOwnProfile && (
            <button
              type="button"
              disabled={isUploadingAvatar}
              onClick={(e) => {
                e.stopPropagation();
                avatarFileInputRef.current?.click();
              }}
              className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-zinc-900 text-white border border-white/20 shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
              title={t("editModal.updateAvatar")}
            >
              <Camera size={14} style={{ color: customAccent }} />
            </button>
          )}
          <input
            ref={avatarFileInputRef}
            type="file"
            accept="image/*"
            onChange={handleQuickAvatarChange}
            className="hidden"
          />
        </div>

        <h1 className="mt-3.5 text-2xl font-bold tracking-tight">
          {formatFullName(profileData)}
        </h1>

        <p
          className={`mt-2 text-xs sm:text-sm leading-relaxed line-clamp-3 max-w-xs ${
            isLightPlaque ? "text-stone-600" : "text-zinc-300"
          }`}
        >
          {profileData?.bio || t("noBio")}
        </p>

        {/* Stats Row */}
        <div
          className={`mt-5 w-full grid grid-cols-3 gap-2 py-3 px-4 rounded-2xl border ${
            isLightPlaque
              ? "bg-stone-100 border-stone-200/80"
              : "bg-white/5 border-white/10"
          }`}
        >
          <div className="flex flex-col items-center">
            <span className="text-base font-bold">{profileData?.postCount || 0}</span>
            <span className={`text-[11px] ${isLightPlaque ? "text-stone-500" : "text-zinc-400"}`}>
              {t("posts")}
            </span>
          </div>
          <button
            type="button"
            disabled={isLoadingFriends}
            onClick={() => openFriendsModal("friends")}
            className="flex flex-col items-center hover:opacity-80 transition-opacity"
          >
            <span className="text-base font-bold">{profileData?.friendCount || 0}</span>
            <span className={`text-[11px] ${isLightPlaque ? "text-stone-500" : "text-zinc-400"}`}>
              {t("friends")}
            </span>
          </button>
          <button
            type="button"
            disabled={isLoadingFriends}
            onClick={() => openFriendsModal("mutual")}
            className="flex flex-col items-center hover:opacity-80 transition-opacity"
          >
            <span className="text-base font-bold">{profileData?.mutualFriendsCount || 0}</span>
            <span className={`text-[11px] ${isLightPlaque ? "text-stone-500" : "text-zinc-400"}`}>
              {t("mutualFriends")}
            </span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex items-center justify-center gap-2.5 w-full">
          {isOwnProfile ? (
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-95 active:scale-[0.98] text-white shadow-md"
              style={{ background: customAccent }}
            >
              <Edit size={14} />
              <span>{t("editProfile")}</span>
            </button>
          ) : (
            <>
              {isSent && (
                <button
                  type="button"
                  onClick={cancelFriendRequest}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center justify-center gap-1.5"
                >
                  <UserMinus size={14} />
                  <span>{t("cancelRequest")}</span>
                </button>
              )}
              {isReceived && (
                <>
                  <button
                    type="button"
                    onClick={acceptFriendRequest}
                    className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5"
                    style={{ background: customAccent }}
                  >
                    <UserCheck size={14} />
                    <span>{t("accept")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={declineFriendRequest}
                    className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 flex items-center justify-center gap-1.5"
                  >
                    <UserX size={14} />
                    <span>{t("decline")}</span>
                  </button>
                </>
              )}
              {!profileData?.isFriend && isNone && (
                <button
                  type="button"
                  onClick={sendFriendRequest}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 shadow-md"
                  style={{ background: customAccent }}
                >
                  <UserPlus size={14} />
                  <span>{t("addFriend")}</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleChatClick}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors ${
                  isLightPlaque
                    ? "bg-stone-900 text-white border-stone-900 hover:bg-stone-800"
                    : "bg-white/10 hover:bg-white/15 border-white/15 text-white"
                }`}
              >
                <MessageCircle size={14} />
                <span>{t("sendMessage")}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <EditProfileModal
          profileData={profileData}
          onSave={(newData, changeInfo) => {
            onProfileUpdate?.(newData);
            if (changeInfo?.usernameChanged && onUsernameChange) {
              onUsernameChange(changeInfo.oldUsername, changeInfo.newUsername);
            }
            setIsEditModalOpen(false);
          }}
        />
      </Modal>

      <Modal
        isOpen={isFriendsModalOpen}
        onClose={() => setIsFriendsModalOpen(false)}
        size="small"
      >
        <FriendsListModal
          username={username}
          initialFriends={friendsList}
          initialTab={initialModalTab}
        />
      </Modal>

      <ConfirmModal
        isOpen={isBlockConfirmOpen}
        onClose={() => setIsBlockConfirmOpen(false)}
        onConfirm={executeBlockUser}
        title={t("block")}
        message={t("blockConfirm", { username })}
      />

      {isViewFullAvatarOpen && (
        <Modal
          isOpen={isViewFullAvatarOpen}
          onClose={() => setIsViewFullAvatarOpen(false)}
          size="medium"
          hideCloseButton={true}
        >
          <div className="relative w-full max-h-[85vh] flex flex-col items-center justify-center p-6 bg-black/95 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setIsViewFullAvatarOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-20"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={avatar || "/defaultAvatar.png"}
              alt={username || "Avatar"}
              className="max-h-[65vh] max-w-full object-contain rounded-xl shadow-2xl"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
