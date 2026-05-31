"use client"

import { useState, useEffect } from "react"
import Modal from "../ui-components/Modal"
import toast from "react-hot-toast"
import api from "@/utils/axios"
import { useTranslations } from "next-intl"

export default function SharePostModal({
                                           isOpen,
                                           onClose,
                                           post,
                                       }) {
    const t = useTranslations("post.editModal")
    const tPost = useTranslations("post")
    const tCommon = useTranslations("common")
    const [shareContent, setShareContent] = useState("")
    const [sharePrivacy, setSharePrivacy] = useState("FRIEND")
    const [isSharing, setIsSharing] = useState(false)
    useEffect(() => {
        if (isOpen) {
            const storedPrivacy = localStorage.getItem("defaultPrivacy")
            if ((storedPrivacy)) {
                setSharePrivacy(storedPrivacy)
            } else {
                setSharePrivacy("FRIEND") // fallback
            }
        }
    }, [isOpen])
    const handleSharePost = async () => {
        if (isSharing) return

        setIsSharing(true)
        try {
            const res = await api.post("/v1/posts/share", {
                content: shareContent,
                privacy: sharePrivacy,
                originalPostId: post.id,
            })
            if(res.data.code===200){
            toast.success(t("success"))
            // Reset form
            setShareContent("")
            setSharePrivacy("FRIEND")

            }

            onClose()
        } catch (err) {
            if(err.response.data.code===5005){
            toast.error(tPost("error"))
            }
        } finally {
            setIsSharing(false)
        }
    }

    const handleClose = () => {
        if (isSharing) return

        // Reset form on close
        setShareContent("")
        setSharePrivacy("FRIEND")
        onClose()
    }

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            handleSharePost()
        }
    }

    return (
        <Modal isOpen={isOpen} size="medium" onClose={handleClose}>
            <div className="p-4 w-full max-w-md mx-auto">
                <h2 className="text-lg font-semibold mb-4 text-[var(--card-foreground)]">
                    {tPost("share")}
                </h2>

                <div className="mb-4">
                    <label className="block text-sm mb-2 text-[var(--card-foreground)]">
                        {tPost("createModal.privacyLabel")}
                    </label>
                    <select
                        className="w-full p-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--card-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                        value={sharePrivacy}
                        onChange={(e) => setSharePrivacy(e.target.value)}
                        disabled={isSharing}
                    >
                        <option value="PUBLIC">{tPost("privacy.public")}</option>
                        <option value="FRIEND">{tPost("privacy.friend")}</option>
                        <option value="PRIVATE">{tPost("privacy.private")}</option>
                    </select>
                </div>

                <div className="mb-4">
                    <label className="block text-sm mb-2 text-[var(--card-foreground)]">
                        {t("shareContent")}
                    </label>
                    <textarea
                        className="w-full p-3 border border-[var(--border)] rounded-lg resize-none bg-[var(--card)] text-[var(--card-foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                        placeholder={t("sharePlaceholder")}
                        rows={4}
                        value={shareContent}
                        onChange={(e) => setShareContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isSharing}
                        maxLength={10000}
                    />
                <div className={`text-xs text-[var(--muted-foreground)] mt-1 text-right ${shareContent.length > 10000 && "text-red-500"}`}>
                        {shareContent.length}/10000
                    </div>
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 border border-[var(--border)] rounded-lg text-[var(--card-foreground)] hover:bg-[var(--input)] transition-colors disabled:opacity-50"
                        disabled={isSharing}
                    >
                        {tCommon("cancel")}
                    </button>
                    <button
                        onClick={handleSharePost}
                        className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50"
                        disabled={isSharing || shareContent.length > 10000}
                    >
                        {isSharing ? tCommon("loading") : tPost("share")}
                    </button>
                </div>
            </div>
        </Modal>
    )
}