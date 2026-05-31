"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios";
import adminApi from "@/utils/adminInterception";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

export default function useCommentMutation(postId, filterType = 'RELEVANT') {
  const queryClient = useQueryClient();
  const t = useTranslations('comment');

  const commentsQueryKey = ["comments", postId, filterType];

  // Helper to update comment in both main comments and replies caches
  const updateCommentInCache = (commentId, updater) => {
    // Update main comments
    queryClient.setQueryData(commentsQueryKey, (old) => {
      if (!old) return old;
      return old.map((c) => (c.id === commentId ? updater(c) : c));
    });

    // We don't know which parent this reply belongs to, so we might need to update all replies queries
    // or just rely on invalidation. For simplicity and correctness with optimistic updates:
    queryClient.setQueriesData({ queryKey: ["replies"] }, (old) => {
      if (!old) return old;
      return old.map((c) => (c.id === commentId ? updater(c) : c));
    });
  };

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async ({ commentId, wasLiked }) => {
      const endpoint = wasLiked
        ? `/v1/comments/unlike/${commentId}`
        : `/v1/comments/like/${commentId}`;
      
      return wasLiked ? api.delete(endpoint) : api.post(endpoint);
    },
    onMutate: async ({ commentId, wasLiked }) => {
      await queryClient.cancelQueries({ queryKey: commentsQueryKey });
      await queryClient.cancelQueries({ queryKey: ["replies"] });

      const previousComments = queryClient.getQueryData(commentsQueryKey);
      
      updateCommentInCache(commentId, (c) => ({
        ...c,
        liked: !wasLiked,
        likeCount: wasLiked ? c.likeCount - 1 : c.likeCount + 1,
      }));

      return { previousComments };
    },
    onError: (err, variables, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(commentsQueryKey, context.previousComments);
      }
      toast.error(t("likeError"));
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ commentId, isAdmin }) => {
      return isAdmin ? adminApi.delete(`/v1/comments/${commentId}`) : api.delete(`/v1/comments/${commentId}`);
    },
    onMutate: async ({ commentId }) => {
      await queryClient.cancelQueries({ queryKey: commentsQueryKey });
      await queryClient.cancelQueries({ queryKey: ["replies"] });

      const previousComments = queryClient.getQueryData(commentsQueryKey);

      // Remove from main comments
      queryClient.setQueryData(commentsQueryKey, (old) => {
        if (!old) return old;
        return old.filter((c) => c.id !== commentId);
      });

      // Remove from replies
      queryClient.setQueriesData({ queryKey: ["replies"] }, (old) => {
        if (!old) return old;
        return old.filter((c) => c.id !== commentId);
      });

      return { previousComments };
    },
    onSuccess: () => {
      toast.success(t("deleteSuccess"));
    },
    onError: (err, variables, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(commentsQueryKey, context.previousComments);
      }
      toast.error(t("deleteError"));
    },
  });

  // Edit mutation
  const editMutation = useMutation({
    mutationFn: async ({ commentId, newContent }) => {
      return api.patch(`/v1/comments/${commentId}`, { content: newContent });
    },
    onMutate: async ({ commentId, newContent }) => {
      await queryClient.cancelQueries({ queryKey: commentsQueryKey });
      await queryClient.cancelQueries({ queryKey: ["replies"] });

      const previousComments = queryClient.getQueryData(commentsQueryKey);

      updateCommentInCache(commentId, (c) => ({ ...c, content: newContent }));

      return { previousComments };
    },
    onSuccess: () => {
      toast.success(t("editSuccess"));
    },
    onError: (err, variables, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(commentsQueryKey, context.previousComments);
      }
      toast.error(t("editError"));
    },
  });

  // Add Comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ content, fileId }) => {
      return api.post("/v1/posts/comment", { content, postId, fileId });
    },
    onSuccess: (res) => {
      const newComment = res.data.body;
      queryClient.setQueryData(commentsQueryKey, (old) => {
        if (!old) return [newComment];
        return [newComment, ...old];
      });
      toast.success(t("sendSuccess"));
    },
    onError: () => {
      toast.error(t("sendError"));
    }
  });

  // Add Reply mutation
  const addReplyMutation = useMutation({
    mutationFn: async ({ content, fileId, originalCommentId }) => {
      return api.post(`/v1/posts/reply-comment`, {
        originalCommentId,
        content,
        fileId
      });
    },
    onSuccess: (res, variables) => {
      const newReply = res.data.body;
      const { originalCommentId } = variables;

      // Add to replies cache
      queryClient.setQueryData(["replies", originalCommentId], (old) => {
        if (!old) return [newReply];
        return [newReply, ...old];
      });

      // Increment reply count in main comments
      queryClient.setQueryData(commentsQueryKey, (old) => {
        if (!old) return old;
        return old.map(c => c.id === originalCommentId ? { ...c, replyCount: (c.replyCount || 0) + 1 } : c);
      });

      toast.success(t("replySuccess"));
    },
    onError: () => {
      toast.error(t("replyError"));
    }
  });

  return {
    likeComment: likeMutation.mutate,
    deleteComment: deleteMutation.mutate,
    editComment: editMutation.mutate,
    addComment: addCommentMutation.mutateAsync, // Use mutateAsync for form handling if needed
    addReply: addReplyMutation.mutateAsync,
  };
}
