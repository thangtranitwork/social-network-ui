"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import MotionContainer from "@/components/ui-components/MotionContainer";
import Chatbox from "@/components/social-app-component/ChatBox";
import Header from "@/components/ui-components/Header";
import Sidebar from "@/components/ui-components/Sidebar";
import ProgressBar from "@/components/ui-components/ProgressBar";
import { Toaster } from "react-hot-toast";
import FloatingChatWidget from "@/components/social-app-component/FloatingChatWidget";
import useNotificationSocket from "@/hooks/useNotificationSocket";
import useMessageNotification from "@/hooks/useMessageNotification";
import useErrorSocket from "@/hooks/useErrorSocket"; // ✅ Import useErrorSocket
import useOnlineNotification from "@/hooks/useOnlineNotification";
import { getAuthInfo } from "@/utils/axios";
// ✅ Import Call System
import { CallProvider } from "@/context/CallContext";
import { useCall } from "@/context/CallContext";
import ThemeProvider from "@/providers/ThemeProvider";
import { useRouter } from "next/navigation";
import {pageMetadata, usePageMetadata} from "@/utils/clientMetadata";

// ✅ Hàm kiểm tra route có cần hiển thị header không
function shouldShowHeader(pathname) {
  // Các route cần hiển thị header
  const showHeaderRoutes = [
    '/',
    '/home',
    '/settings',
    '/search',
    '/friends',
  ];
  
  // Kiểm tra exact match
  if (showHeaderRoutes.includes(pathname)) {
    return true;
  }
  
  // Kiểm tra profile route với pattern /profile/{abc}
  if (pathname.startsWith('/profile/')) {
    return true;
  }
  
  // Kiểm tra settings route với sub-paths
  if (pathname.startsWith('/settings')) {
    return true;
  }
  
  return false;
}

// ✅ Main Layout Content (tách ra để có thể sử dụng useCall)
function MainLayoutContent({ children }) {
  const { resolvedTheme } = useTheme();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const prevThemeRef = useRef(null);

  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);

  // ✅ Sử dụng Call Hook
  const { initializeCall, currentCall, isCallEnding } = useCall();

  // ✅ Kiểm tra có cần hiển thị header không
  const showHeader = shouldShowHeader(pathname);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    const storedToken = localStorage.getItem("accessToken");

    if (storedUserId && storedToken) {
      setUserId(storedUserId);
      setToken(storedToken);
      
      // ✅ Initialize call system khi có token
      initializeCall(storedToken);
    }
  }, [initializeCall]);

  // ✅ Sử dụng các socket hooks
  useMessageNotification(userId);
  useNotificationSocket(userId, token);
  useOnlineNotification(userId);
  useErrorSocket(userId); // ✅ Subscribe tới error channel

  useEffect(() => {
    // ✅ Handle error events từ useErrorSocket
    const handleErrorReceived = (event) => {
      const errorData = event.detail;
      console.log("🚨 [MainLayout] Error received:", errorData);
    };
    window.addEventListener('errorReceived', handleErrorReceived);
    return () => window.removeEventListener('errorReceived', handleErrorReceived);
  }, []);

  // Xử lý animation theme change
  useEffect(() => {
    setMounted(true);
  }, []);

  const shouldAnimate =
    mounted && prevThemeRef.current && prevThemeRef.current !== resolvedTheme;

  useEffect(() => {
    if (mounted) {
      prevThemeRef.current = resolvedTheme;
    }
  }, [resolvedTheme, mounted]);

  // Xác định các route ẩn floating chat
  const hideRightSidebar =
    pathname.startsWith("/settings") ||
    pathname.startsWith("/search") ||
    pathname.startsWith("/chats");

  // Floating chat widget - quản lý state nội bộ, không reset khi switch chat
  const renderFloatingChat = () => {
    if (pathname.startsWith("/chats")) return null;
    return <FloatingChatWidget beToken={token} />;
  };

  // ✅ Tính toán header height và padding top
  const headerHeight = showHeader ? "h-16" : "h-0";
  const contentPaddingTop = showHeader ? "pt-16" : "pt-0";
  const sidebarHeight = showHeader ? "h-[calc(100vh-64px)]" : "h-screen";

// ✅ Fixed layout - phần chính cần chỉnh sửa
const layoutContent = (
  <>
    <ProgressBar />
    <Toaster 
      position="top-right" 
      toastOptions={{ 
        duration: 4000,
        style: {
          background: 'var(--background)',
          color: 'var(--foreground)',
          border: '1px solid var(--border)',
        },
      }} 
    />

    {/* ✅ Main UI */}
    <div className={`h-screen flex flex-col`}>
      
      {/* ✅ Header - chỉ hiển thị khi showHeader = true */}
      {showHeader && (
        <header className={`fixed top-0 left-0 right-0 z-50 bg-glass ${headerHeight} transition-colors duration-500`}>
          <Header />
        </header>
      )}

      <div className={`flex flex-1 ${contentPaddingTop} bg-[var(--background)] text-[var(--foreground)] transition-colors duration-500`}>
        {/* Left Sidebar - ẩn trên mobile, fixed trên desktop */}
       <aside
  className={`hidden md:block md:w-[80px] ${sidebarHeight} overflow-y-auto ${
    pathname === "/chats" ? "pt-16" : ""
  }`}
>
  <Sidebar />
</aside>

        {/* Main Content - chiếm toàn bộ width vì floating chat */}
        <main className={`flex-1 ${showHeader ? 'h-[calc(100vh-64px)]' : 'h-screen'} overflow-y-auto`}>
          <div
            className={`${
              hideRightSidebar ? "max-w-7xl" : "max-w-3xl"
            } w-full mx-auto space-y-6 pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-6 px-4 sm:px-6`}
          >
            {children}
          </div>
        </main>

        {/* Floating Chat Widget - bottom right giống Facebook */}
        {renderFloatingChat()}
      </div>

      {/* ✅ Bottom Navigation - Fixed position trên mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-glass h-[56px] pb-[env(safe-area-inset-bottom)]">
        <Sidebar />
      </div>
    </div>
  </>
);

  return shouldAnimate ? (
    <AnimatePresence mode="wait">
      <MotionContainer
        key={resolvedTheme}
        modeKey={resolvedTheme}
        effect="fadeUp"
        duration={0.25}
      >
        {layoutContent}
      </MotionContainer>
    </AnimatePresence>
  ) : (
    layoutContent
  );
}

// ✅ Main Layout với CallProvider wrapper
export default function MainLayout({ children }) {
  return (
    <CallProvider>
    <ThemeProvider>
      <MainLayoutContent>
        {children}
      </MainLayoutContent>

    </ThemeProvider>
    </CallProvider>
  );
}