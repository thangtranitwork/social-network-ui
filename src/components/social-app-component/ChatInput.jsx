"use client"

import { useEffect, useRef } from "react";
import GifPicker from "./GifPicker";
import VoiceRecorder from "./VoiceRecorder";

export default function ChatInput({
  input,
  setInput,
  isConnected,
  selectedFile,
  editingMessage,
  uploading,
  disabled = false,
  loading = false,
  onSend,
  onSendFile,
  onSendGif,
  onSendVoice,
  onSaveEdit,
  onCancelEdit,
  onCancelFile,
  onFileSelect,
  onKeyDown,
  onFocus,  // ✅ Typing focus handler từ useTypingNotification
  onBlur,   // ✅ Typing blur handler từ useTypingNotification
  placeholder,
}) {
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)
  // Auto focus input when component mounts or editing mode changes
  useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus()
    }
  }, [editingMessage, disabled])

  useEffect(() => {
    console.log("✅ useEffect chạy, textareaRef:", textareaRef.current, "disabled:", disabled);
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus();
      console.log("✅ textarea.focus() đã gọi");
    }
  }, [editingMessage, disabled]);

  const handleSendClick = () => {
    if (disabled || loading) return

    if (selectedFile) {
      onSendFile()
    } else if (editingMessage) {
      onSaveEdit()
    } else {
      onSend()
    }
  }

  const handleFileClick = () => {
    if (disabled || loading) return
    fileInputRef.current?.click()
  }

  // ✅ Handle textarea focus với proper logging
  const handleTextareaFocus = (e) => {
    console.log("📝 ChatInput: Textarea focused - calling typing focus handler")
    // Gọi typing notification focus handler từ useTypingNotification
    if (onFocus) {
      try {
        onFocus(e)
        // console.log("✅ Typing focus handler called successfully")
      } catch (error) {
        // console.error("❌ Error calling typing focus handler:", error)
      }
    } else {
      console.warn("⚠️ No onFocus handler provided to ChatInput")
    }
  }

  // ✅ Handle textarea blur với proper logging
  const handleTextareaBlur = (e) => {
    // console.log("📝 ChatInput: Textarea blurred - calling typing blur handler")

    // Gọi typing notification blur handler từ useTypingNotification
    if (onBlur) {
      try {
        onBlur(e)
        console.log("✅ Typing blur handler called successfully")
      } catch (error) {
        console.error("❌ Error calling typing blur handler:", error)
      }
    } else {
      console.warn("⚠️ No onBlur handler provided to ChatInput")
    }
  }

  // ✅ Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value
    setInput(value)

    // TODO: Có thể thêm logic gửi typing status qua socket
    // console.log("📝 User is typing:", value.length > 0)
  }

  // Check if we can send - either has text content or has file
  const canSend = () => {
    if (disabled || loading) return false

    if (editingMessage) {
      return input.trim().length > 0
    }

    // Can send if has file OR has text content (but not necessarily both)
    return selectedFile || input.trim().length > 0
  }

  const renderSendButton = () => {
    if (loading) {
      return (
        <button
          disabled
          className="flex items-center justify-center w-9 h-9 bg-blue-600/50 text-white rounded-xl cursor-not-allowed opacity-50 flex-shrink-0"
        >
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        </button>
      )
    }

    const active = canSend()
    return (
      <button
        type="button"
        onClick={handleSendClick}
        disabled={!active}
        className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all flex-shrink-0 ${
          !active
            ? "bg-[var(--accent)] text-[var(--muted-foreground)] opacity-55 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/25 active:scale-[0.97]"
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    )
  }

  return (
    <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--card)]">
      {/* Editing indicator */}
      {editingMessage && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm">✏️</span>
            <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">Đang sửa tin nhắn</span>
          </div>
          <button
            onClick={onCancelEdit}
            className="flex items-center justify-center w-5 h-5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* File preview */}
      {selectedFile && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl mb-2">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <span className="text-sm">📎</span>
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 truncate">{selectedFile.name}</span>
          </div>
          <button
            onClick={onCancelFile}
            disabled={uploading}
            className="flex items-center justify-center w-5 h-5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-2"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Main input area */}
      <div className="flex items-end space-x-2">
        {/* Actions Button Group */}
        <div className="flex items-center space-x-1 flex-shrink-0 mb-[1px]">
          {/* File upload button */}
          <button
            type="button"
            onClick={handleFileClick}
            disabled={disabled || loading}
            className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all ${
              disabled || loading
                ? "text-[var(--muted-foreground)] opacity-50 cursor-not-allowed"
                : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
            }`}
            title="Đính kèm file"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
          </button>

          {/* Gif picker button */}
          <GifPicker onSend={onSendGif} disabled={disabled || loading} />

          {/* Voice recorder button */}
          <VoiceRecorder onSend={onSendVoice} disabled={disabled || loading} />
        </div>

        {/* Input field */}
        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={onKeyDown}
            onFocus={handleTextareaFocus}
            onBlur={handleTextareaBlur}
            disabled={disabled}
            placeholder={selectedFile ? "Thêm mô tả cho file (tùy chọn)..." : placeholder}
            className={`w-full px-3 py-2 border border-[var(--border)] rounded-xl resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-[var(--background)] text-[var(--foreground)] transition-all text-sm block ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            rows={1}
            style={{
              minHeight: "36px",
              maxHeight: "120px",
            }}
          />
        </div>

        {/* Send button */}
        <div className="flex-shrink-0 mb-[1px]">
          {renderSendButton()}
        </div>

        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" onChange={onFileSelect} className="hidden" accept="*/*" />
      </div>
    </div>
  )
}