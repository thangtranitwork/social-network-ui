"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import api from "@/utils/axios";

const LIMIT = 20;

export default function useUserPosts(username) {
  return useInfiniteQuery({
    queryKey: ["userPosts", username],
    queryFn: async ({ pageParam = 0 }) => {
      const res = await api.get(`/v1/posts/of-user/${username}`, {
        params: {
          skip: pageParam,
          limit: LIMIT,
        },
      });
      return res.data.body || [];
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < LIMIT) {
        return undefined;
      }
      // Calculate next skip
      const totalLoaded = allPages.reduce((sum, page) => sum + page.length, 0);
      return totalLoaded;
    },
    enabled: !!username,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
