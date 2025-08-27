"use client";

import React from "react";
import clsx from "clsx";

export default function Heading({ children, className = "" }) {
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
