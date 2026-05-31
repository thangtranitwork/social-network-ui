"use client";

import { useState, useEffect } from "react";
import Avatar from "../ui-components/Avatar";
import Input from "../ui-components/Input";
import api from "@/utils/axios";
import toast from "react-hot-toast";
import { X, Search, Users } from "lucide-react";
import { useTranslations } from "next-intl";

export default function CreateGroupModal({ onClose, onChatCreated }) {
  const t = useTranslations("chat.createGroupModal");
  const tCommon = useTranslations("common");
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [friends, setFriends] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Load friends on mount
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const userName = typeof window !== "undefined" ? localStorage.getItem("userName") : null;
        if (!userName) return;
        const res = await api.get(`/v1/friends/${userName}`);
        setFriends(res.data.body || []);
      } catch (err) {
        console.error("Failed to load friends list:", err);
      }
    };
    fetchFriends();
  }, []);

  // Search users with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await api.get("/v1/search", {
          params: {
            query: searchQuery.trim(),
            type: "NOT_SET",
            page: 0,
            size: 15,
          },
        });
        setSearchResults(res.data.body?.USER || []);
      } catch (err) {
        console.error("Search failed:", err);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleToggleUser = (user) => {
    setSelectedUsers((prev) => {
      const exists = prev.find((u) => u.id === user.id);
      if (exists) {
        return prev.filter((u) => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      toast.error(t("nameRequired"));
      return;
    }
    if (selectedUsers.length === 0) {
      toast.error(t("memberRequired"));
      return;
    }

    setIsCreating(true);
    try {
      const memberIds = selectedUsers.map((u) => u.id);
      const res = await api.post("/v1/chat/groups", {
        name: groupName.trim(),
        memberIds,
      });

      if (res.data.code === 200 && res.data.body?.chatId) {
        const newChatId = res.data.body.chatId;
        const currentUserId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
        
        const newGroup = {
          isGroup: true,
          name: groupName.trim(),
          avatar: null,
          adminId: currentUserId,
        };

        toast.success(tCommon("success"));
        if (onChatCreated) {
          onChatCreated(newChatId, newGroup);
        }
        onClose();
      } else {
        toast.error(res.data.message || tCommon("error"));
      }
    } catch (err) {
      console.error("Failed to create group chat:", err);
      toast.error(err.response?.data?.error || tCommon("error"));
    } finally {
      setIsCreating(false);
    }
  };

  const displayedUsers = searchQuery.trim() ? searchResults : friends;

  return (
    <div className="flex flex-col h-full bg-[var(--card)] text-[var(--foreground)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold">{t("title")}</h3>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Name input */}
        <Input
          label={t("name")}
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder={t("namePlaceholder")}
          className="w-full"
          maxLength={100}
        />

        {/* Selected users badges */}
        {selectedUsers.length > 0 && (
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">
              {t("selectedMembers", { count: selectedUsers.length })}
            </label>
            <div className="flex flex-wrap gap-2 p-2 bg-[var(--accent)] rounded-lg max-h-24 overflow-y-auto">
              {selectedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-1 bg-[var(--background)] border border-[var(--border)] text-xs rounded-full px-2.5 py-1"
                >
                  <span>
                    {user.givenName} {user.familyName}
                  </span>
                  <button
                    onClick={() => handleRemoveUser(user.id)}
                    className="text-muted-foreground hover:text-foreground rounded-full"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Input */}
        <Input
          label={t("addMembers")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          icon={Search}
          className="w-full"
        />

        {/* Members List */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {searchQuery.trim() ? t("searchResults") : t("friendsList")}
          </h4>

          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : displayedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {searchQuery.trim() ? t("noResults") : t("emptyFriends")}
            </p>
          ) : (
            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              {displayedUsers.map((user) => {
                const isSelected = selectedUsers.some((u) => u.id === user.id);
                return (
                  <div
                    key={user.id}
                    onClick={() => handleToggleUser(user)}
                    className="flex items-center justify-between p-2 hover:bg-[var(--accent)] rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={user.profilePictureUrl || user.avatar}
                        alt={user.username}
                        className="w-10 h-10 object-cover"
                      />
                      <div>
                        <p className="font-medium text-sm">
                          {user.givenName} {user.familyName}
                        </p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 pointer-events-none"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--border)] flex justify-end gap-2 bg-[var(--accent)]/30">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium bg-[var(--background)] hover:bg-[var(--accent)] border border-[var(--border)] rounded-lg transition"
        >
          {tCommon("cancel")}
        </button>
        <button
          onClick={handleCreate}
          disabled={isCreating || !groupName.trim() || selectedUsers.length === 0}
          className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5"
        >
          {isCreating ? (
            <>
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
              <span>{tCommon("loading")}</span>
            </>
          ) : (
            <span>{tCommon("create")}</span>
          )}
        </button>
      </div>
    </div>
  );
}
