"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Avatar from "../ui-components/Avatar";
import api from "@/utils/axios";
import toast from "react-hot-toast";

export default function FriendsListModal({ 
  username, 
  initialFriends = [], 
  initialTab = "friends" // Thêm prop để xác định tab mặc định
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // Sử dụng initialTab
  const [friends, setFriends] = useState(initialFriends);
  const [mutualFriends, setMutualFriends] = useState([]);
  const [isLoadingMutual, setIsLoadingMutual] = useState(false);
  const router = useRouter();

  // Effect để cập nhật activeTab khi initialTab thay đổi
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleProfileClick = (friendUsername) => {
    router.push(`/profile/${friendUsername}`);
  };

  // Lấy danh sách bạn chung khi chuyển sang tab mutual friends
  const fetchMutualFriends = async () => {
    if (mutualFriends.length > 0) return; // Đã có dữ liệu rồi

    setIsLoadingMutual(true);
    try {
      const res = await api.get(`/v1/friends/mutual-friends/${username}`);
      
      if (res.data.code === 200) {
        const mutuals = res.data.body || [];
        setMutualFriends(mutuals);
      } else {
        toast.error("Không thể tải danh sách bạn chung");
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách bạn chung:", error);
      toast.error("Có lỗi xảy ra khi tải bạn chung");
    } finally {
      setIsLoadingMutual(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "mutual" && mutualFriends.length === 0) {
      fetchMutualFriends();
    }
  };

  // Tự động fetch mutual friends nếu modal mở với tab mutual
  useEffect(() => {
    if (initialTab === "mutual" && mutualFriends.length === 0) {
      fetchMutualFriends();
    }
  }, [initialTab]);

  // Component hiển thị danh sách người dùng
  const UserList = ({ users, isLoading, emptyMessage }) => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <p className="text-gray-500 text-center py-8">{emptyMessage}</p>
      );
    }

    return (
      <div className="max-h-80 overflow-y-auto">
        {users.map((user) => (
          <div
            key={user.id || user.username}
            className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
            onClick={() => handleProfileClick(user.username)}
          >
            <Avatar
              src={user.profilePictureUrl}
              alt={user.username}
              className="w-12 h-12 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {user.givenName} {user.familyName}
              </p>
              <p className="text-sm text-gray-500 truncate">@{user.username}</p>
            </div>
            {user.online && (
              <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 mb-4">
        <h3 className="text-lg font-semibold">Danh sách bạn bè</h3>
        
        {/* Tabs */}
        <div className="flex mt-4 border-b">
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "friends"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => handleTabChange("friends")}
          >
            Bạn bè ({friends.length})
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "mutual"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => handleTabChange("mutual")}
          >
            Bạn chung ({mutualFriends.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "friends" && (
          <UserList 
            users={friends}
            isLoading={false}
            emptyMessage="Chưa có bạn bè nào"
          />
        )}
        
        {activeTab === "mutual" && (
          <UserList 
            users={mutualFriends}
            isLoading={isLoadingMutual}
            emptyMessage="Không có bạn chung"
          />
        )}
      </div>
    </div>
  );
}