import { cn } from "@/lib/utils/cn";

type BadgeProps = {
  children: React.ReactNode;
  className?: string;
};

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-text-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}

type TagProps = {
  label: string;
  icon?: React.ReactNode;
};

export function Tag({ label, icon }: TagProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-text-muted">
      {label}
      {icon}
    </span>
  );
}
