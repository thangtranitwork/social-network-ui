"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios";
import adminApi from "@/utils/adminInterception";

export default function useCommentsQuery(postId, filterType = 'RELEVANT', isAdmin = false) {
  return useQuery({
    queryKey: ["comments", postId, filterType],
    queryFn: async () => {
      let res;
      if (isAdmin) {
        res = await adminApi.get(`/v1/comments/of-post/${postId}`, {
          params: { type: filterType }
        });
      } else {
        res = await api.get(`/v1/comments/of-post/${postId}`, {
          params: { type: filterType }
        });
      }
      return res.data.body || [];
    },
    enabled: !!postId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
