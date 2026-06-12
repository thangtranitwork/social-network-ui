"use client";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Search,
  MessageCircle,
  Users,
  UserPen,
  Settings,
  LogOut,
  User,
  Menu,
  Bell,
  Megaphone,
} from "lucide-react";
import Badge from "@/components/ui-components/Badge";
import api, {clearSession, getUserName} from "@/utils/axios";
import NotificationList from "../social-app-component/NotificationList";
import useAppStore from "@/store/ZustandStore";
import { useTranslations } from "next-intl";

export default function SidebarNavigation() {
  const t = useTranslations('navigation');
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState(null);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [showNotifications, setShowNotifications] = useState(false);
  const [badgeCount, setBadgeCount] = useState(0);
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);
  const [notificationPosition, setNotificationPosition] = useState({ top: 10, left: 0 });
  
  const dropdownRef = useRef(null);
  const moreButtonRef = useRef(null);
  const notificationRef = useRef(null);
  const notificationButtonRef = useRef(null);

  // ✅ Zustand store
  const clearAllData = useAppStore(state => state.clearAllData);
  const unreadNotificationCount = useAppStore(state => state.unreadNotificationCount);
  const unreadNotificationCountFromSocket = useAppStore(state => state.unreadNotificationCountFromSocket);
  const fetchNotifications = useAppStore(state => state.fetchNotifications);
  
  // ✅ Add unread message count from store
  const unreadMessageCount = useAppStore(state => state.unreadMessageCount);

  // ✅ Update badge count when store count changes
  useEffect(() => {
    setBadgeCount(unreadNotificationCount + unreadNotificationCountFromSocket);
  }, [unreadNotificationCount, unreadNotificationCountFromSocket]);

  useEffect(() => {
    const storedUsername = getUserName()
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSettingsDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ✅ Enhanced notification button click handler
  const handleNotificationClick = async () => {
    // ✅ If already showing notifications, just hide them
    if (showNotifications) {
      setShowNotifications(false);
      return;
    }

    // ✅ Calculate position for notification dropdown
    if (notificationButtonRef.current) {
      const rect = notificationButtonRef.current.getBoundingClientRect();
      const isDesktop = window.innerWidth >= 768;
      
      if (isDesktop) {
        // Desktop: show to the LEFT of the sidebar (80px from left + some padding)
        setNotificationPosition({
          top: 64, // 64px navbar height + 16px padding
          left: 80 + 16, // 80px sidebar width + 16px padding
        });
      } else {
        // Mobile: full width, positioned from bottom
        setNotificationPosition({
          top: 0, // Will be overridden by CSS
          left: 0, // Will be overridden by CSS
        });
      }
    }

    // ✅ Show loading state
    setIsMarkingAsRead(true);

    try {
      console.log(unreadNotificationCountFromSocket);
      // ✅ If there are socket notifications, mark them as read first
      if (unreadNotificationCountFromSocket > 0) {
        const res = await api.patch(`/v1/notifications/mark-as-read?limit=${unreadNotificationCountFromSocket}`);
        console.log(res);
        
        console.log(`✅ Successfully marked ${unreadNotificationCountFromSocket} notifications as read`);
      }

      // ✅ Fetch notifications (always fetch to get latest state)
      await fetchNotifications(true); // force refresh
      // ✅ Show notifications dropdown
      setShowNotifications(true);
      
      // ✅ Hide badge count when clicked (set to 0)
      setBadgeCount(0);

    } catch (error) {
      console.error('❌ Error handling notification click:', error);
      // ✅ Still show notifications even if mark-as-read fails
      setShowNotifications(true);
      setBadgeCount(0);
    } finally {
      setIsMarkingAsRead(false);
    }
  };

  const handleLogout = async () => {
    // ✅ Prevent multiple logout calls
    if (isLoggingOut) return;
   
    setIsLoggingOut(true);
   
    try {
      await api.delete("/v1/auth/logout");
    } catch (err) {
      console.error("Logout failed:", err.response?.data || err.message);
    } finally {
      // ✅ Clear session first
      clearSession();
      // ✅ Clear store data after session is cleared
      clearAllData();
     
      // ✅ Navigate immediately after clearing data
      router.replace("/register"); // Use replace instead of push
     
      setIsLoggingOut(false);
    }
  };

  const handleMoreClick = () => {
    if (!showSettingsDropdown && moreButtonRef.current) {
      const rect = moreButtonRef.current.getBoundingClientRect();
      const isDesktop = window.innerWidth >= 768;
      
      if (isDesktop) {
        // Desktop: show to the right of the button
        setDropdownPosition({
          top: rect.top,
          left: rect.right + 8,
        });
      } else {
        // Mobile: show above the button
        setDropdownPosition({
          top: rect.top - 160, // Adjust based on dropdown height
          left: rect.left - 75, // Center the dropdown
        });
      }
    }
    setShowSettingsDropdown(!showSettingsDropdown);
  };

  // Render dropdown using portal
  const renderDropdown = () => {
    if (!showSettingsDropdown) return null;

    return createPortal(
      <div
        ref={dropdownRef}
        className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-[150px] z-[9999]"
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
        }}
      >
        <button
          onClick={() => {
            handleLogout();
            setShowSettingsDropdown(false);
          }}
          disabled={isLoggingOut}
          className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          aria-label={t('logout')}
        >
          <LogOut size={16} className="mr-3" />
          {isLoggingOut ? t('loggingOut') : t('logout')}
        </button>
        
        <Link
          href="/settings/personalinfo"
          onClick={() => setShowSettingsDropdown(false)}
          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label={t('settings')}
        >
          <Settings size={16} className="mr-3" />
          {t('settings')}
        </Link>
        
        <Link
          href="/ads"
          onClick={() => setShowSettingsDropdown(false)}
          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-t border-gray-100 dark:border-gray-700/50 mt-1 pt-2"
          aria-label="Quảng cáo"
        >
          <Megaphone size={16} className="mr-3" />
          Quảng cáo
        </Link>
      </div>,
      document.body
    );
  };

  // Render notifications dropdown using portal
  const renderNotifications = () => {
    if (!showNotifications) return null;

    return createPortal(
      <div
        ref={notificationRef}
        className={`
          fixed z-[9999] overflow-y-auto rounded-xl shadow-lg bg-[var(--card)] border border-[var(--border)]
          md:w-80 md:max-h-[calc(100vh-64px-32px)]
          w-full max-h-[calc(90vh-72px-32px)] left-0 right-0
          md:left-auto md:right-auto
        `}
        style={{
          // Desktop positioning
          ...(window.innerWidth >= 768 ? {
            top: `${notificationPosition.top}px`,
            left: `${notificationPosition.left}px`,
          } : {
            // Mobile positioning - from bottom
            bottom: `${72 + 32}px`, // 72px sidebar height + 32px padding
            top: 'auto',
            left: '0',
            right: '0',
          })
        }}
      >
        <NotificationList />
      </div>,
      document.body
    );
  };

  return (
    <>
      {/* Main sidebar */}
      <div
        className={`
          z-50 fixed bottom-0 left-0 w-full flex justify-around
          md:static md:top-[64px] md:items-start md:h-full
          md:flex md:px-2 md:py-4
        `}
      >
        <nav className="md:h-auto bg-transparent md:bg-glass p-3 md:rounded-full md:shadow-lg border-0 md:border md:border-[var(--border)] flex flex-row md:flex-col items-center justify-around md:justify-start md:space-y-4 w-full md:w-[60px] mx-auto transition-all duration-300">
          
          {/* Desktop: Thứ tự cũ | Mobile: Home Button ở giữa */}
          
          {/* Home Button */}
          <div className="relative order-4 md:order-1">
            <Link
              href="/home"
              className={`nav-item ${pathname === "/home" ? "active" : ""}`}
              aria-label={t('home')}
              title={t('home')}
            >
              <Home size={24} strokeWidth={pathname === "/home" ? 2.5 : 2} />
              {pathname === "/home" && <div className="hidden md:block nav-indicator" />}
            </Link>
          </div>

          {/* Search Button */}
          <div className="relative order-1 md:order-2">
            <Link
              href="/search"
              className={`nav-item ${pathname === "/search" ? "active" : ""}`}
              aria-label={t('search')}
              title={t('search')}
            >
              <Search size={24} strokeWidth={pathname === "/search" ? 2.5 : 2} />
              {pathname === "/search" && <div className="hidden md:block nav-indicator" />}
            </Link>
          </div>

          {/* Messages Button */}
          <div className="relative order-2 md:order-3">
            <Link
              href="/chats"
              className={`nav-item ${pathname === "/chats" ? "active" : ""}`}
              aria-label={t('chats')}
              title={t('chats')}
            >
              <MessageCircle size={24} strokeWidth={pathname === "/chats" ? 2.5 : 2} />
              {pathname === "/chats" && <div className="hidden md:block nav-indicator" />}
            </Link>
            
            {unreadMessageCount > 0 && (
              <div className="absolute -top-1 -right-1">
                <div className="badge">{unreadMessageCount}</div>
              </div>
            )}
          </div>

          {/* Friends Button */}
          <div className="relative order-3 md:order-4">
            <Link
              href="/friends"
              className={`nav-item ${pathname === "/friends" ? "active" : ""}`}
              aria-label={t('friends')}
              title={t('friends')}
            >
              <Users size={24} strokeWidth={pathname === "/friends" ? 2.5 : 2} />
              {pathname === "/friends" && <div className="hidden md:block nav-indicator" />}
            </Link>
          </div>

          {/* Profile Button */}
          <div className="relative order-5 md:order-5">
            <Link
              href={username ? `/profile/${username}` : "#"}
              className={`nav-item ${pathname.startsWith("/profile") ? "active" : ""}`}
              aria-label={t('profile')}
              title={t('profile')}
            >
              <UserPen size={24} strokeWidth={pathname.startsWith("/profile") ? 2.5 : 2} />
              {pathname.startsWith("/profile") && <div className="hidden md:block nav-indicator" />}
            </Link>
          </div>
          
          {/* 🔔 Notification button */}
          <div className="relative order-6 md:order-6">
            <button
              ref={notificationButtonRef}
              type="button"
              aria-label={t('notifications')}
              title={t('notifications')}
              onClick={handleNotificationClick}
              disabled={isLoggingOut || isMarkingAsRead}
              className={`nav-item ${showNotifications ? "active" : ""} ${isLoggingOut || isMarkingAsRead ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isMarkingAsRead ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--accent)]" />
              ) : (
                <Bell size={24} strokeWidth={showNotifications ? 2.5 : 2} />
              )}
              {showNotifications && <div className="hidden md:block nav-indicator" />}
              
              {badgeCount > 0 && !isMarkingAsRead && (
                <div className="absolute -top-1 -right-1">
                  <div className="badge">{badgeCount}</div>
                </div>
              )}
            </button>
          </div>
          
          {/* More button */}
          <div className="relative order-7 md:order-7">
            <button
              aria-label={t('menu')}
              title={t('menu')}
              ref={moreButtonRef}
              onClick={handleMoreClick}
              className={`nav-item ${showSettingsDropdown ? "active" : ""}`}
            >
              <Menu size={24} strokeWidth={showSettingsDropdown ? 2.5 : 2} />
              {showSettingsDropdown && <div className="hidden md:block nav-indicator" />}
            </button>
          </div>
        </nav>
      </div>

      {/* Dropdown rendered via portal */}
      {renderDropdown()}
      
      {/* Notifications rendered via portal */}
      {renderNotifications()}
    </>
  );
}