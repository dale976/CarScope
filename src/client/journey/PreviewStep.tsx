import type { DataMode, VehiclePreview } from '../../shared/preview';
import { VehiclePreviewCard } from '../VehiclePreview';

export function PreviewStep({
  preview,
  mode,
  busy,
  error,
  onBack,
  onGenerate,
}: {
  preview: VehiclePreview;
  mode: DataMode;
  busy: boolean;
  error: string;
  onBack: () => void;
  onGenerate: () => void;
}) {
  return (
    <>
      <VehiclePreviewCard
        preview={preview}
        mode={mode}
        busy={busy}
        onBack={onBack}
        onGenerate={onGenerate}
      />
      {error && (
        <p className="form-error preview-error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
