import { cn } from "@/lib/utils/cn";

type ContentContainerProps = {
  children: React.ReactNode;
  className?: string;
};

/** Centers chat content at a consistent max width. */
export default function ContentContainer({
  children,
  className,
}: ContentContainerProps) {
  return (
    <div className={cn("mx-auto w-full max-w-2xl", className)}>{children}</div>
  );
}
