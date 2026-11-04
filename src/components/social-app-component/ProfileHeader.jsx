"use client";

import { useState, useMemo, useRef } from "react";
import { Edit, MessageCircle, UserPlus, UserMinus, UserCheck, UserX, Shield, MoreVertical, FileText, FileImage, Eye, Camera, X } from "lucide-react";
import Avatar from "../ui-components/Avatar";
import Modal from "../ui-components/Modal";
import EditProfileModal from "./EditProfile";
import api from "@/utils/axios";
import { uploadFile } from "@/utils/fileUpload";
import toast from "react-hot-toast";
import { useParams, useRouter } from "next/navigation";
import useAppStore, { selectSortedChatList } from "@/store/ZustandStore";
import { useShallow } from 'zustand/react/shallow';
import { useTranslations } from "next-intl";

import FriendsListModal from "./FriendsListModal";
import useIsMobile from "@/hooks/useIsMobile";
import ConfirmModal from "../ui-components/ConfirmModal";
import { formatFullName } from "@/utils/formatName";

export default function ProfileHeader({ 
  profileData, 
  isOwnProfile = true, 
  activeTab = "posts",
  onTabChange,
  onProfileUpdate,
  onUsernameChange // New prop to handle username changes
}) {
  const t = useTranslations('profile');
  const isMobile = useIsMobile();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  const [friendsList, setFriendsList] = useState([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [initialModalTab, setInitialModalTab] = useState("friends");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isBlockConfirmOpen, setIsBlockConfirmOpen] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [isViewFullAvatarOpen, setIsViewFullAvatarOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarFileInputRef = useRef(null);

  const handleQuickAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading("Đang cập nhật ảnh đại diện...");
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
      toast.success(t('editModal.avatarUpdateSuccess') || "Cập nhật ảnh đại diện thành công!", { id: toastId });
    } catch (err) {
      console.error("Lỗi cập nhật ảnh đại diện:", err);
      toast.error(t('editModal.avatarUpdateError') || "Cập nhật ảnh đại diện thất bại!", { id: toastId });
    } finally {
      setIsUploadingAvatar(false);
      if (e.target) e.target.value = "";
    }
  };
  
  const avatar = profileData?.profilePictureUrl;
  const { username: routeUsername } = useParams();
  const router = useRouter();

  const username = profileData?.username;
  console.log(profileData)
  const chatMap = useAppStore((state) => state.chatMap);
  const { selectChat, showVirtualChat } = useAppStore(useShallow((state) => ({
    selectChat: state.selectChat,
    showVirtualChat: state.showVirtualChat,
  })));
  const chatList = useMemo(() => selectSortedChatList({ chatMap }), [chatMap]);
  const handleBlockUser = async () => {
    setIsBlockConfirmOpen(true);
  };

  const executeBlockUser = async () => {
    try {
      const res = await api.post(`/v1/blocks/${routeUsername}`);
      if (res.data.code === 200) {
        toast.success(t('blockSuccess', { username: routeUsername }));
        setIsDropdownOpen(false);
      } else {
        console.warn("Chặn thất bại:", res.data.message);
      }
    } catch (error) {
      console.error("Lỗi khi chặn người dùng:", error);
      toast.error(t('blockError'));
    }
  };

  const handleSaveProfile = (newData, changeInfo) => {
    if (onProfileUpdate) onProfileUpdate(newData);
    
    // If username was changed, notify the parent component
    if (changeInfo?.usernameChanged && onUsernameChange) {
      onUsernameChange(changeInfo.oldUsername, changeInfo.newUsername);
    }
    
    setIsEditModalOpen(false);
  };

  const handleChatClick = () => {
    const targetUserId = profileData.id;
    const targetUsername = profileData.username;

    console.log("🔍 handleChatClick:", { targetUserId, targetUsername });

    if (!targetUserId) {
      toast.error(t('chatError'));
      return;
    }

    const existingChat = chatList.find(chat => {
      return chat.target?.id === targetUserId || 
             chat.target?.username === targetUsername;
    });

    console.log("🎯 Existing chat found:", existingChat);

    if (existingChat) {
      const chatId = existingChat.chatId;
      console.log("✅ Selecting existing chat:", chatId);
      
      selectChat(chatId);
      
      router.push(`/chats?chatId=${chatId}`);
      return;
    }

    const virtualChatData = {
      username: profileData.username,
      givenName: profileData.givenName,
      familyName: profileData.familyName,
      profilePictureUrl: profileData.profilePictureUrl,
      online: profileData.online || false
    };

    console.log("🆕 Creating virtual chat:", virtualChatData);
    showVirtualChat(targetUserId, virtualChatData);
    
    router.push(`/chats?chatId=${targetUserId}`);
  };

  const cancelFriendRequest = async () => {
    try {
      await api.delete(`/v1/friend-request/delete/${username}`);
      toast.success(t('cancelRequestSuccess'));
      // FIX: Set request to "NONE" so "Kết bạn" button shows up again
      onProfileUpdate({ ...profileData, request: "NONE" });
    } catch (error) {
      toast.error(t('cancelRequestError'));
    }
  };

  const declineFriendRequest = async () => {
    try {
      await api.delete(`/v1/friend-request/delete/${username}`);
      toast.success(t('declineSuccess'));
      // FIX: Set request to "NONE" so "Kết bạn" button shows up again
      onProfileUpdate({ ...profileData, request: "NONE" });
    } catch (error) {
      toast.error(t('declineError'));
    }
  };

  const sendFriendRequest = async () => {
    try {
      const res = await api.post(`/v1/friend-request/send/${username}`);
      if (res.data.code === 200) {
        toast.success(t('sendRequestSuccess'));
        onProfileUpdate({ ...profileData, request: "OUT" });
      }
    } catch (error) {
      console.error("Lỗi gửi lời mời:", error);
      toast.error(t('sendRequestError'));
    }
  };

  const acceptFriendRequest = async () => {
    // Optimistic update - cập nhật ngay lập tức
    const optimisticData = {
      ...profileData,
      isFriend: true,
      request: "NONE", // FIX: Set to "NONE" instead of null
      friendCount: profileData.friendCount + 1
    };
    
    onProfileUpdate(optimisticData);
    toast.success(t('acceptSuccess'));
    
    try {
      const res = await api.post(`/v1/friend-request/accept/${username}`);
      if (res.data.code !== 200) {
        // Nếu API thất bại, rollback lại trạng thái cũ
        onProfileUpdate({
          ...profileData,
          isFriend: false,
          request: "IN",
          friendCount: profileData.friendCount
        });
        toast.error(t('acceptError'));
      }
    } catch (error) {
      // Rollback nếu có lỗi
      onProfileUpdate({
        ...profileData,
        isFriend: false,
        request: "IN",
        friendCount: profileData.friendCount
      });
      toast.error(t('acceptError'));
    }
  };

  const unfriend = async () => {
    try {
      await api.delete(`/v1/friends/${username}`);
      toast.success(t('unfriendSuccess'));
      // FIX: Set request to "NONE" so "Kết bạn" button shows up again
      onProfileUpdate({
        ...profileData,
        isFriend: false,
        request: "NONE", // This is the key fix
        friendCount: profileData.friendCount - 1
      });
      setIsDropdownOpen(false);
    } catch (error) {
      toast.error(t('unfriendError'));
    }
  };

  const handleGetListFriend = async () => {
    if (profileData.friendCount === 0) {
      setFriendsList([]);
      setInitialModalTab("friends");
      setIsFriendsModalOpen(true);
      return;
    }

    setIsLoadingFriends(true);
    try {
      const res = await api.get(`/v1/friends/${username}`);
      
      if (res.data.code === 200) {
        const friends = res.data.body || [];
        setFriendsList(friends);
        setInitialModalTab("friends");
        setIsFriendsModalOpen(true);
      } else {
        toast.error(t('loadFriendsError'));
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách bạn bè:", error);
      toast.error(t('commonError'));
    } finally {
      setIsLoadingFriends(false);
    }
  };

  const handleGetMutualFriends = async () => {
    if (profileData.mutualFriendCount === 0) {
      setFriendsList([]);
      setInitialModalTab("mutual");
      setIsFriendsModalOpen(true);
      return;
    }

    setIsLoadingFriends(true);
    try {
      const friendsRes = await api.get(`/v1/friends/${username}`);
      
      if (friendsRes.data.code === 200) {
        const friends = friendsRes.data.body || [];
        setFriendsList(friends);
        setInitialModalTab("mutual");
        setIsFriendsModalOpen(true);
      } else {
        toast.error(t('loadFriendsError'));
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách bạn bè:", error);
      toast.error(t('commonError'));
    } finally {
      setIsLoadingFriends(false);
    }
  };

  const renderActionButtons = () => {
    const reqStatus = profileData?.request;
    const isSent = reqStatus === "OUT" || reqStatus === "SENT";
    const isReceived = reqStatus === "IN" || reqStatus === "RECEIVED";
    const isNone = !reqStatus || reqStatus === "NONE" || reqStatus === "";

    if (isSent) {
      return (
        <button
          onClick={cancelFriendRequest}
          className="h-[38px] flex items-center gap-2 px-4 py-2 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full text-sm font-semibold transition-all shadow-sm active:scale-95"
        >
          <UserMinus size={16} />
          <span>{t('cancelRequest')}</span>
        </button>
      );
    }

    if (isReceived) {
      return (
        <>
          <button
            onClick={acceptFriendRequest}
            className="btn-primary h-[38px] inline-flex items-center justify-center"
          >
            <UserCheck size={16} />
            <span>{t('accept')}</span>
          </button>
          <button
            onClick={declineFriendRequest}
            className="h-[38px] flex items-center gap-2 px-4 py-2 border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-full text-sm font-semibold transition-all shadow-sm active:scale-95"
          >
            <UserX size={16} />
            <span>{t('decline')}</span>
          </button>
        </>
      );
    }

    if (!profileData?.isFriend && isNone) {
      return (
        <button
          onClick={sendFriendRequest}
          className="btn-primary h-[38px] inline-flex items-center justify-center"
        >
          <UserPlus size={16} />
          <span>{t('addFriend')}</span>
        </button>
      );
    }
    
    return null;
  };

  const renderDropdownMenu = () => {
    if (!isDropdownOpen) return null;

    return (
      <div className="absolute left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-0 top-full mt-2 w-48 bg-[var(--card)] rounded-xl shadow-xl border border-[var(--border)] py-1.5 z-[100] animate-in fade-in zoom-in-95 duration-150">
        {profileData?.isFriend && (
          <button
            onClick={unfriend}
            className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2.5 transition-colors font-medium"
          >
            <UserMinus size={16} />
            <span>{t('unfriend')}</span>
          </button>
        )}
        <button
          onClick={handleBlockUser}
          className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2.5 transition-colors font-medium"
        >
          <Shield size={16} />
          <span>{t('block')}</span>
        </button>
      </div>
    );
  };


  const handleTabClick = (tabName) => {
    if (onTabChange) {
      onTabChange(tabName);
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-4 sm:p-6">
        {/* Avatar với Menu click tương tác */}
        <div className="relative">
          <div
            onClick={() => {
              if (isOwnProfile) {
                setIsAvatarMenuOpen((prev) => !prev);
              } else {
                setIsViewFullAvatarOpen(true);
              }
            }}
            className="avatar-wrapper relative cursor-pointer group"
            title={isOwnProfile ? "Tùy chọn ảnh đại diện" : "Xem ảnh đại diện"}
          >
            <Avatar
              src={avatar}
              alt="Avatar"
              size={isMobile ? 96 : 128}
              className="rounded-full object-cover shadow-md transition-transform duration-200 group-hover:scale-[1.02]"
            />
            {profileData.online && <div className="online-ring" />}

            {/* Icon Camera nhỏ ở góc avatar cho chính chủ */}
            {isOwnProfile && (
              <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-[var(--card)] text-[var(--foreground)] border-2 border-[var(--border)] shadow-md flex items-center justify-center transition-transform group-hover:scale-110">
                <Camera size={14} className="text-[var(--primary)]" />
              </div>
            )}
          </div>

          {/* Menu Dropdown 2 lựa chọn khi click avatar của chính mình */}
          {isOwnProfile && isAvatarMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsAvatarMenuOpen(false)}
              />
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-48 bg-[var(--card)] rounded-xl shadow-xl border border-[var(--border)] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={() => {
                    setIsAvatarMenuOpen(false);
                    setIsViewFullAvatarOpen(true);
                  }}
                  className="w-full px-3.5 py-2.5 text-left text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] flex items-center gap-2.5 transition-colors"
                >
                  <Eye size={15} className="text-blue-500" />
                  <span>{t('editModal.viewAvatar') || "Xem ảnh đại diện"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAvatarMenuOpen(false);
                    avatarFileInputRef.current?.click();
                  }}
                  disabled={isUploadingAvatar}
                  className="w-full px-3.5 py-2.5 text-left text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] flex items-center gap-2.5 transition-colors disabled:opacity-50"
                >
                  <Camera size={15} className="text-emerald-500" />
                  <span>{t('editModal.updateAvatar') || "Cập nhật ảnh đại diện"}</span>
                </button>
              </div>
            </>
          )}

          {/* Input file ẩn phục vụ cập nhật nhanh */}
          <input
            ref={avatarFileInputRef}
            type="file"
            accept="image/*"
            onChange={handleQuickAvatarChange}
            className="hidden"
          />
        </div>
        
        <div className="flex-1 text-center sm:text-left min-w-0">
          <div>
            <h2 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
              {formatFullName(profileData)}
            </h2>
            <p className="text-[var(--muted-foreground)] font-medium text-sm mt-0.5">@{profileData?.username}</p>
          </div>
          
          {/* Hàng nút hành động: Đặt ngay dưới tên/username, cùng hàng, không bị wrap xấu */}
          <div className="mt-3.5 flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
            {isOwnProfile ? (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="btn-primary h-[38px] inline-flex items-center justify-center"
              >
                <Edit size={16} />
                <span>{t('editProfile')}</span>
              </button>
            ) : (
              <>
                {renderActionButtons()}
                <button
                  onClick={handleChatClick}
                  className={
                    profileData?.isFriend
                      ? "btn-primary h-[38px] inline-flex items-center justify-center"
                      : "h-[38px] flex items-center gap-2 px-4 py-2 border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-[var(--foreground)] rounded-full text-sm font-semibold transition-all shadow-sm active:scale-95"
                  }
                >
                  <MessageCircle size={16} />
                  <span>{t('sendMessage')}</span>
                </button>
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="h-[38px] w-[38px] rounded-full border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-[var(--foreground)] flex items-center justify-center transition-all shadow-sm active:scale-95 shrink-0"
                    title={t('moreOptions') || "Khác"}
                  >
                    <MoreVertical size={16} />
                  </button>
                  {renderDropdownMenu()}
                </div>
              </>
            )}
          </div>

          <div className="profile-stats mt-6 justify-center sm:justify-start">
            <div className="stat-item cursor-default">
              <span className="stat-number">{profileData.postCount || 0}</span>
              <span className="stat-label">{t('posts')}</span>
            </div>
            <button 
              onClick={handleGetListFriend}
              disabled={isLoadingFriends}
              className="stat-item"
            >
              <span className="stat-number">{profileData?.friendCount || 0}</span>
              <span className="stat-label">{t('friends')}</span>
            </button>
            <button 
              onClick={handleGetMutualFriends}
              disabled={isLoadingFriends}
              className="stat-item"
            >
              <span className="stat-number">{profileData?.mutualFriendsCount || 0}</span>
              <span className="stat-label">{t('mutualFriends')}</span>
            </button>
          </div>

          <p className="text-sm mt-4 text-[var(--muted-foreground)] leading-relaxed max-w-xl">
            {profileData?.bio || t('noBio')}
          </p>
        </div>
      </div>

      <div className="profile-tabs px-6">
        <button
          className={`tab-btn ${activeTab === "posts" ? "active" : ""}`}
          onClick={() => handleTabClick("posts")}
        >
          <FileText size={18} />
          <span>{t('posts')}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === "file" ? "active" : ""}`}
          onClick={() => handleTabClick("file")}
        >
          <FileImage size={18} />
          <span>{t('media')}</span>
        </button>
      </div>

      {/* Overlay để đóng dropdown khi click outside */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <EditProfileModal profileData={profileData} onSave={handleSaveProfile} />
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
        title={t('block')}
        message={t('blockConfirm', { username: routeUsername })}
      />

      {/* Modal xem ảnh đại diện kích thước lớn */}
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
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="relative max-w-full max-h-[70vh] flex items-center justify-center p-2">
              <img
                src={avatar || "/defaultAvatar.png"}
                alt={profileData?.username || "Avatar"}
                className="max-h-[65vh] max-w-full object-contain rounded-xl shadow-2xl"
              />
            </div>
            <div className="mt-3 text-center">
              <p className="text-white font-bold text-base">
                {formatFullName(profileData)}
              </p>
              <p className="text-zinc-400 text-xs mt-0.5">@{profileData?.username}</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}