"use client"

import Modal from "./Modal"
import { AlertCircle } from "lucide-react"
import { useTranslations } from "next-intl"

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = "danger" // "danger", "warning", "info"
}) {
  const t = useTranslations('common');

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: <AlertCircle className="w-12 h-12 text-red-500" />,
          button: "bg-red-500 hover:bg-red-600 text-white"
        };
      case "warning":
        return {
          icon: <AlertCircle className="w-12 h-12 text-yellow-500" />,
          button: "bg-yellow-500 hover:bg-yellow-600 text-white"
        };
      case "info":
      default:
        return {
          icon: <AlertCircle className="w-12 h-12 text-blue-500" />,
          button: "bg-blue-500 hover:bg-blue-600 text-white"
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="small">
      <div className="flex flex-col items-center justify-center p-6 text-center h-full">
        <div className="mb-4">
          {styles.icon}
        </div>
        <h3 className="text-lg font-bold mb-2 text-[var(--foreground)]">
          {title || t('confirm')}
        </h3>
        <p className="text-sm text-muted-foreground mb-8">
          {message}
        </p>
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--accent)] transition-colors font-medium text-sm"
          >
            {cancelText || t('cancel')}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-2.5 rounded-xl transition-colors font-medium text-sm shadow-sm ${styles.button}`}
          >
            {confirmText || t('confirm')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
