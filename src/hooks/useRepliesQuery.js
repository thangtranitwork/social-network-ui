"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/utils/axios";

export default function useRepliesQuery(commentId, enabled = false) {
  return useQuery({
    queryKey: ["replies", commentId],
    queryFn: async () => {
      const res = await api.get(`/v1/comments/of-comment/${commentId}`);
      return res.data.body || [];
    },
    enabled: enabled && !!commentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
