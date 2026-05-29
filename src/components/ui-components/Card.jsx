import React from "react";
import clsx from "clsx";

const Card = React.memo(function Card({ children, className = "", elevation = 1, style }) {
  const shadows = {
    0: "shadow-none",
    1: "shadow-sm",
    2: "shadow-md",
    3: "shadow-lg",
  };

  return (
    <div
      className={clsx(
        "bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full block",
        shadows[elevation] || shadows[2],
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
});

export default Card;
