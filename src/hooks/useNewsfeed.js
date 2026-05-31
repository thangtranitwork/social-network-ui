"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import api from "@/utils/axios";

const LIMIT = 20;

export default function useNewsfeed(filterType) {
  return useInfiniteQuery({
    queryKey: ["newsfeed", filterType],
    queryFn: async ({ pageParam = 0 }) => {
      const res = await api.get(`/v1/posts/newsfeed`, {
        params: {
          skip: pageParam,
          limit: LIMIT,
          type: filterType,
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
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
