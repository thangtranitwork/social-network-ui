import { cookies } from "next/headers";
import ProfilePageClient from "./ProfilePageClient";
import { formatFullName } from "@/utils/formatName";

async function getProfile(username) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;
    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/users/${username}`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.body;
  } catch (error) {
    console.error("Error fetching profile for metadata:", error);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { username } = await params;
  const user = await getProfile(username);

  if (!user) {
    return {
      title: 'Người dùng | PocPoc',
    };
  }

  const fullName = formatFullName(user);
  const title = `${fullName} (@${user.username}) | PocPoc`;
  const description = user.bio || `Kết nối với ${fullName} trên PocPoc - Mạng xã hội thế hệ mới.`;
  const image = user.profilePictureUrl || '/pocpoc.png';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://pocpoc.online/profile/${username}`,
      siteName: 'PocPoc',
      images: [
        {
          url: image,
          width: 400,
          height: 400,
          alt: fullName,
        },
      ],
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [image],
    },
  };
}

export default async function Page({ params }) {
  const { username } = await params;
  const profile = await getProfile(username);

  return <ProfilePageClient initialProfile={profile} routeUsername={username} />;
}
