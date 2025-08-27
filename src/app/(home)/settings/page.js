import React from "react";
import Link from "next/link";
import {
  UserCircle,
  Bell,
  Lock,
  Users,
  Ban,
  MessageCircle,
  FileText,
  Flag,
  ShieldCheck,
  Mail,
  Database,
  MessageSquare,
} from "lucide-react";

const groupedMenuItems = [
  {
    title: "Tài khoản",
    items: [
      { id: "PersonalInfo", icon: UserCircle, label: "Thông tin cá nhân" },
      { id: "Privacy", icon: Lock, label: "Bảo mật & Quyền riêng tư" },
      { id: "RestrictedAccounts", icon: ShieldCheck, label: "Tài khoản bị hạn chế" },
    ]
  },
  {
    title: "Tương tác",
    items: [
      { id: "Connections", icon: Users, label: "Bạn bè & Kết nối" },
      { id: "BlockedList", icon: Ban, label: "Danh sách chặn" },
      { id: "SentReports", icon: Flag, label: "Báo cáo đã gửi" },
    ]
  },
  {
    title: "Nội dung",
    items: [
      { id: "SavedPosts", icon: FileText, label: "Bài viết & Bình luận đã lưu" },
      { id: "UploadedFiles", icon: Database, label: "Tệp đã tải lên" },
    ]
  },
  {
    title: "Tin nhắn & Thông báo",
    items: [
      { id: "Messages", icon: MessageCircle, label: "Tin nhắn" },
      { id: "GroupChatActivity", icon: MessageSquare, label: "Hoạt động Chat nhóm" },
      { id: "Notifications", icon: Mail, label: "Thông báo hệ thống" },
    ]
  }
];

export default function SettingsOverview() {
  return (
    <div className="flex min-h-screen w-full bg-[var(--background)] text-[var(--foreground)]">
     
      {/* Main content */}
      
    </div>
  );
}
