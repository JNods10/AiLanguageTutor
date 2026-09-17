import { APP_NAME } from "@/lib/constants/app";

export default function BrandLogo() {
  return (
    <div className="flex items-center gap-2">
      <span className="text-lg font-medium text-text-muted" aria-hidden>
        語
      </span>
      <span className="text-base font-semibold tracking-tight">{APP_NAME}</span>
    </div>
  );
}
