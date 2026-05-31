"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

export default function usePostMutation(queryKeysToUpdate = [["newsfeed"]]) {
  const queryClient = useQueryClient();
  const t = useTranslations('post');

  const toggleLikeMutation = useMutation({
    mutationFn: async ({ postId, wasLiked }) => {
      if (wasLiked) {
        return api.delete(`/v1/posts/unlike/${postId}`);
      } else {
        return api.post(`/v1/posts/like/${postId}`);
      }
    },
    onMutate: async ({ postId, wasLiked }) => {
      const previousData = {};

      for (const queryKey of queryKeysToUpdate) {
        await queryClient.cancelQueries({ queryKey });
        previousData[JSON.stringify(queryKey)] = queryClient.getQueryData(queryKey);

        queryClient.setQueriesData({ queryKey }, (old) => {
          if (!old) return old;
          
          // Handle infinite query data structure (pages)
          if (old.pages) {
            return {
              ...old,
              pages: old.pages.map((page) =>
                page.map((post) => {
                  if (post.id === postId) {
                    return {
                      ...post,
                      liked: !wasLiked,
                      likeCount: post.likeCount + (wasLiked ? -1 : 1),
                    };
                  }
                  return post;
                })
              ),
            };
          }
          
          // Handle single post or flat array (if any)
          if (Array.isArray(old)) {
            return old.map((post) => {
               if (post.id === postId) {
                  return {
                    ...post,
                    liked: !wasLiked,
                    likeCount: post.likeCount + (wasLiked ? -1 : 1),
                  };
               }
               return post;
            });
          }

          return old;
        });
      }

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        for (const queryKey of queryKeysToUpdate) {
           const prev = context.previousData[JSON.stringify(queryKey)];
           if (prev) {
             queryClient.setQueriesData({ queryKey }, prev);
           }
        }
      }
      toast.error(t("likeError"));
      console.error("Toggle like failed:", err);
    },
  });

  return { toggleLike: toggleLikeMutation.mutate };
}
