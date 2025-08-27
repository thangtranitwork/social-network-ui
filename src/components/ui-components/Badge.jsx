"use client";

import React from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

export default function Badge({ children, className = "", asNotification = false }) {
  if (asNotification) {
    return (
      <AnimatePresence>
        {children ? (
          <motion.span
            key="notification-badge"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={clsx(
              "absolute -top-1 -right-1 z-10",
              "bg-red-500 text-white text-[10px] px-1.5 py-[2px] rounded-full shadow-md",
              className
            )}
          >
            {children > 99 ? "99+" : children}
          </motion.span>
        ) : null}
      </AnimatePresence>
    );
  }

  // Default text label badge
  return (
    <span
      className={clsx(
        "block tracking-wide font-semibold text-[var(--foreground)]",
        "text-xs sm:text-sm md:text-base",
        className
      )}
    >
      {children}
    </span>
  );
}
