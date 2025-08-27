import clsx from "clsx";

export default function Button({
  children,
  variant = "primary",
  disabled = false,
  onClick,
  className = "",
  type = "button",
  ...props
}) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-md text-sm font-medium px-4 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 active:opacity-80 focus:ring-[var(--primary)]",
    ghost:
      "bg-transparent border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--border)]",
    outline:
      "bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]",
  };

  const combined = clsx(baseStyles, variants[variant], className);

  return (
    <button
      className={combined}
      onClick={onClick}
      disabled={disabled}
      type={type}
      aria-disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
