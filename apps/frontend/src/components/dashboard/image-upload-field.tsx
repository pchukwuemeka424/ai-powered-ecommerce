'use client';

import { useRef, useState } from 'react';
import { storesApi } from '@/lib/api';
import { assetUrl, normalizeUploadStorageValue } from '@/lib/asset-url';
import { Button } from '@/components/ui';
import { Loader2, Upload, X } from 'lucide-react';

const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;

type Props = {
  tenantId: string;
  label: string;
  hint?: string;
  /** Stored value: `/uploads/...` or external https URL */
  value: string;
  onChange: (pathOrUrl: string) => void;
  compact?: boolean;
  /** Client-side max size before upload (default 5 MB, matches API). */
  maxSizeBytes?: number;
  /** Called right before the upload request (after validation). */
  onUploadStart?: () => void;
  /** Called after a successful upload, before `onChange`. */
  onUploadSuccess?: () => void;
};

export function ImageUploadField({
  tenantId,
  label,
  hint,
  value,
  onChange,
  compact,
  maxSizeBytes = DEFAULT_MAX_BYTES,
  onUploadStart,
  onUploadSuccess,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    if (file.size > maxSizeBytes) {
      const limitLabel =
        maxSizeBytes >= 1024 * 1024
          ? `${Math.round(maxSizeBytes / (1024 * 1024))} MB`
          : `${Math.round(maxSizeBytes / 1024)} KB`;
      setError(`File is too large (max ${limitLabel}).`);
      return;
    }
    setUploading(true);
    onUploadStart?.();
    try {
      const { path, url } = await storesApi.uploadImage(tenantId, file);
      onUploadSuccess?.();
      onChange(normalizeUploadStorageValue(path, url));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  const preview = value ? assetUrl(value) : '';

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-neutral-700">{label}</label>
      {hint && <p className="text-xs text-neutral-500">{hint}</p>}

      <div className={`flex flex-col sm:flex-row gap-3 items-start ${compact ? '' : ''}`}>
        {preview && (
          <div className="relative shrink-0 rounded-lg border border-neutral-200 overflow-hidden bg-neutral-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt=""
              className={
                compact
                  ? 'h-16 w-auto max-w-[200px] object-contain object-left'
                  : 'w-full max-w-md max-h-48 object-cover object-center'
              }
            />
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute top-1 right-1 p-1 rounded-md bg-black/60 text-white hover:bg-black/80"
              aria-label="Remove image"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={onPick}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Uploading…
              </>
            ) : (
              <>
                <Upload size={14} /> {preview ? 'Replace image' : 'Upload image'}
              </>
            )}
          </Button>
          <p className="text-[11px] text-neutral-400">
            JPEG, PNG, WebP, or GIF · max {maxSizeBytes >= 1024 * 1024 ? `${Math.round(maxSizeBytes / (1024 * 1024))} MB` : `${Math.round(maxSizeBytes / 1024)} KB`}
          </p>
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
