import type { DataMode, ReportAction, VehiclePreview } from '../../shared/preview';
import { VehiclePreviewCard } from '../VehiclePreview';

export function PreviewStep({
  preview,
  mode,
  reportAction,
  busy,
  error,
  onBack,
  onGenerate,
}: {
  preview: VehiclePreview;
  mode: DataMode;
  reportAction?: ReportAction;
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
        reportAction={reportAction}
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
