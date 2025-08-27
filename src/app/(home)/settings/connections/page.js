"use client";

import UserHeader from "@/components/social-app-component/UserHeader";
const friends = [
  {
    id: 1,
    username: "minhnguyen",
    givenName: "Minh",
    familyName: "Nguyễn",
    avatar: "/avatars/user1.png",
    bio: "Yêu âm nhạc và du lịch",
    friendSince: "2023-11-15",
  },
  {
    id: 2,
    username: "hoamai",
    givenName: "Mai",
    familyName: "Hoa",
    avatar: "/avatars/user2.png",
    bio: "Nhiếp ảnh gia tự do",
    friendSince: "2024-04-10",
  },
  {
    id: 3,
    username: "trananh",
    givenName: "Anh",
    familyName: "Trần",
    avatar: "/avatars/user3.png",
    bio: "Lập trình viên front-end",
    friendSince: "2024-12-22",
  },
];

export default function ConnectionsPage() {
  return (
    <div className="flex min-h-screen w-full bg-[var(--background)] text-[var(--foreground)]">
      <main className="flex-1 w-full p-8 space-y-6">
        <h1 className="text-2xl font-bold">Bạn bè</h1>

        <div className="bg-[var(--card)] p-6 rounded-lg shadow-md space-y-4">
          {friends.map((user) => (
            <UserHeader
              key={user.id}
              user={{
                name: `${user.familyName} ${user.givenName}`,
                avatar: user.avatar,
                lastOnline: `Bạn bè từ ${new Date(user.friendSince).toLocaleDateString("vi-VN")}`,
              }}
              variant="post"
              lastonline={true}
              isme={false}
              size="default"
            />
          ))}
        </div>
      </main>
    </div>
  );
}
