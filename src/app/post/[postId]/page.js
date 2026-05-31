import PostPageClient from "./PostPageClient";

async function getPost(postId) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/posts/${postId}`, {
      next: { revalidate: 60 } // Revalidate every minute
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.body;
  } catch (error) {
    console.error("Error fetching post for metadata:", error);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { postId } = await params;
  const post = await getPost(postId);

  if (!post) {
    return {
      title: 'Bài viết | PocPoc',
    };
  }

  const title = post.content?.substring(0, 60) || 'Bài viết';
  const description = post.content?.substring(0, 160) || 'Xem bài viết trên PocPoc';
  const image = post.files?.[0] || '/pocpoc.png';

  return {
    title: `${title} | PocPoc`,
    description,
    openGraph: {
      title,
      description,
      url: `https://pocpoc.online/post/${postId}`,
      siteName: 'PocPoc',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
        },
      ],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function Page({ params }) {
  const { postId } = await params;
  const post = await getPost(postId);

  return <PostPageClient initialPost={post} postId={postId} />;
}
