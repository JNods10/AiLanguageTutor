type OverlayProps = {
  onClose: () => void;
  className?: string;
  "aria-label"?: string;
};

export default function Overlay({
  onClose,
  className = "fixed inset-0 z-40 bg-black/20",
  "aria-label": ariaLabel = "Close",
}: OverlayProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={className}
      onClick={onClose}
    />
  );
}
