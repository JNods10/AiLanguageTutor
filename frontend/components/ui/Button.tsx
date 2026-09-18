import { cn } from "@/lib/utils/cn";

const variantStyles = {
  primary: "bg-foreground text-background disabled:opacity-30",
  secondary:
    "border border-border bg-surface-muted text-text-muted disabled:opacity-60",
  ghost: "text-text-muted hover:bg-surface-muted hover:text-foreground",
  tab: "text-text-muted hover:text-foreground data-[active=true]:bg-surface-muted data-[active=true]:text-foreground",
} as const;

const sizeStyles = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "px-6 py-2.5 text-sm",
  icon: "h-8 w-8",
  "icon-lg": "h-10 w-10",
} as const;

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
  active?: boolean;
};

export default function Button({
  variant = "secondary",
  size = "md",
  active,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      data-active={active}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
