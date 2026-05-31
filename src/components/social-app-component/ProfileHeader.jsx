"use client";

import { useState, useMemo } from "react";
import { Edit, MessageCircle, UserPlus, UserMinus, UserCheck, UserX, Shield, MoreVertical, FileText, FileImage } from "lucide-react";
import Avatar from "../ui-components/Avatar";
import Modal from "../ui-components/Modal";
import EditProfileModal from "./EditProfile";
import api from "@/utils/axios";
import toast from "react-hot-toast";
import { useParams, useRouter } from "next/navigation";
import useAppStore, { selectSortedChatList } from "@/store/ZustandStore";
import { useShallow } from 'zustand/react/shallow';
import { useTranslations } from "next-intl";

import FriendsListModal from "./FriendsListModal";
import useIsMobile from "@/hooks/useIsMobile";
import ConfirmModal from "../ui-components/ConfirmModal";

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
  
  const avatar = profileData.profilePictureUrl;
  const { username: routeUsername } = useParams();
  const router = useRouter();

  const username = profileData.username;
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
    // FIX: Updated condition to check for both null and "NONE"
    if (profileData.request) {
      if (profileData.request === "OUT") {
        return (
          <button
            onClick={cancelFriendRequest}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200"
          >
            <UserMinus size={16} />
            <span>{t('cancelRequest')}</span>
          </button>
        );
      } else if (profileData.request === "IN") {
        return (
          <div className="flex gap-2">
            <button
              onClick={acceptFriendRequest}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200"
            >
              <UserCheck size={16} />
              <span>{t('accept')}</span>
            </button>
            <button
              onClick={declineFriendRequest}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-full text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200"
            >
              <UserX size={16} />
              <span>{t('decline')}</span>
            </button>
          </div>
        );
      }
    }

    // FIX: Check for both null and "NONE" values
    if (!profileData.isFriend && (profileData.request === "NONE" || profileData.request === null)) {
      return (
        <div className="flex gap-2">
          <button
            onClick={sendFriendRequest}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200"
          >
            <UserPlus size={16} />
            <span>{t('addFriend')}</span>
          </button>
        </div>
      );
    }
    
    return null;
  };

  const renderDropdownMenu = () => {
    if (!isDropdownOpen) return null;

    return (
      <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--card)] rounded-lg shadow-lg border border-[var(--border)] z-[100]">
        {profileData.isFriend && (
          <button
            onClick={unfriend}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 rounded-t-lg"
          >
            <UserMinus size={16} />
            <span>{t('unfriend')}</span>
          </button>
        )}
        <button
          onClick={handleBlockUser}
          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 rounded-b-lg"
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
        <div className="avatar-wrapper">
          <Avatar
            src={avatar}
            alt="Avatar"
            size={isMobile ? 96 : 128}
            className="rounded-full object-cover shadow-md"
          />
          {profileData.online && <div className="online-ring" />}
        </div>
        
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[var(--foreground)]">
                {profileData?.givenName || ""} {profileData?.familyName || ""}
              </h2>
              <p className="text-[var(--muted-foreground)] font-medium text-sm mt-0.5">@{profileData?.username}</p>
            </div>
            
            <div className="flex flex-wrap justify-center sm:justify-end gap-2">
              {isOwnProfile ? (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="btn-primary"
                >
                  <Edit size={16} />
                  <span>{t('editProfile')}</span>
                </button>
              ) : (
                <>
                  {renderActionButtons()}
                  <button
                    onClick={handleChatClick}
                    className="btn-primary"
                  >
                    <MessageCircle size={16} />
                    <span>{t('sendMessage')}</span>
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="nav-item bg-[var(--muted)]"
                    >
                      <MoreVertical size={18} />
                    </button>
                    {renderDropdownMenu()}
                  </div>
                </>
              )}
            </div>
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
      </div>
      );
      }