import { cn } from "@/lib/utils/cn";

type SectionLabelProps = {
  children: React.ReactNode;
  className?: string;
};

export default function SectionLabel({ children, className }: SectionLabelProps) {
  return (
    <p
      className={cn(
        "text-[11px] font-medium uppercase tracking-wider text-text-subtle",
        className,
      )}
    >
      {children}
    </p>
  );
}
