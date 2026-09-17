import type { Correction } from "@/lib/types/chat";
import SectionLabel from "@/components/ui/SectionLabel";
import { Tag } from "@/components/ui/Badge";
import { ExternalLinkIcon } from "@/components/ui/icons";

type CorrectionCardProps = {
  correction: Correction;
};

export default function CorrectionCard({ correction }: CorrectionCardProps) {
  return (
    <div className="mt-2 max-w-[85%] rounded-lg border border-border bg-surface px-4 py-3">
      <SectionLabel className="mb-2 text-[10px] tracking-widest">
        Correction
      </SectionLabel>

      <p className="text-sm leading-relaxed">
        <span className="text-text-muted line-through">{correction.original}</span>
        <span className="mx-2 text-text-subtle">→</span>
        <span className="font-semibold">{correction.corrected}</span>
      </p>

      <p className="mt-2 text-xs leading-relaxed text-text-muted">
        {correction.explanation}
      </p>

      {correction.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {correction.tags.map((tag) => (
            <Tag key={tag} label={tag} icon={<ExternalLinkIcon />} />
          ))}
        </div>
      )}
    </div>
  );
}
