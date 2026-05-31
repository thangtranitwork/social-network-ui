import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

// Hook for form management
export const useForm = (onSubmit) => {
  const tCommon = useTranslations('common');
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = useCallback((e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setPreviewUrl(URL.createObjectURL(f));
    }
  }, []);

  const removeFile = useCallback(() => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  }, [previewUrl]);

  const reset = useCallback(() => {
    setContent("");
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
  }, [previewUrl]);

  const submit = useCallback(async (e, ...args) => {
    e.preventDefault();
    if (!content.trim() && !file) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content, file, ...args);
      reset();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(tCommon("error"));
    } finally {
      setIsSubmitting(false);
    }
  }, [content, file, onSubmit, reset, tCommon]);

  return {
    content,
    setContent,
    file,
    previewUrl,
    isSubmitting,
    handleFileChange,
    removeFile,
    submit,
    reset,
  };
};