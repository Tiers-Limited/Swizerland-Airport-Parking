'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { Icon } from './Icons';

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  label?: string;
  accept?: string;
  allowedMimeTypes?: string[];
  maxFileSizeMB?: number;
}

const mimeTypeLabelMap: Record<string, string> = {
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
};

export function ImageUpload({
  images,
  onChange,
  maxImages = 8,
  label,
  accept = 'image/*',
  allowedMimeTypes,
  maxFileSizeMB = 10,
}: Readonly<ImageUploadProps>) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const allowedTypesLabel = allowedMimeTypes && allowedMimeTypes.length > 0
    ? allowedMimeTypes.map((type) => mimeTypeLabelMap[type] || type.replace('image/', '').toUpperCase()).join(', ')
    : 'PNG, JPG, WebP';

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = maxImages - images.length;
    if (remaining <= 0) {
      setError('Maximale Bildanzahl erreicht');
      return;
    }

    const filesToUpload = files.slice(0, remaining);
    setUploading(true);
    setError('');

    const newUrls: string[] = [];

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];

      // Validate file
      if (!file.type.startsWith('image/')) {
        setError('Nur Bilddateien erlaubt');
        continue;
      }
      if (allowedMimeTypes && allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.type)) {
        setError(`Nur ${allowedTypesLabel} erlaubt`);
        continue;
      }
      if (file.size > maxFileSizeMB * 1024 * 1024) {
        setError(`Bild ist zu gross (max. ${maxFileSizeMB} MB)`);
        continue;
      }

      try {
        setProgress(Math.round(((i) / filesToUpload.length) * 100));
        const result = await uploadToCloudinary(file, (p) => {
          const baseProgress = (i / filesToUpload.length) * 100;
          const fileProgress = (p / filesToUpload.length);
          setProgress(Math.round(baseProgress + fileProgress));
        });
        newUrls.push(result.secure_url);
      } catch {
        setError('Upload fehlgeschlagen');
      }
    }

    if (newUrls.length > 0) {
      onChange([...images, ...newUrls]);
    }

    setUploading(false);
    setProgress(0);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    const newImages = [...images];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newImages.length) return;
    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
    onChange(newImages);
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((url, index) => (
            <div key={url} className="relative group aspect-4/3 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
              <Image
                src={url}
                alt={`Upload ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              {index === 0 && (
                <span className="absolute top-1.5 left-1.5 bg-baby-blue-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  Cover
                </span>
              )}
              {/* Overlay controls */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => moveImage(index, 'left')}
                    className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors"
                    title="Move left"
                  >
                    <Icon name="ChevronLeft" className="h-4 w-4 text-gray-700" />
                  </button>
                )}
                {index < images.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveImage(index, 'right')}
                    className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors"
                    title="Move right"
                  >
                    <Icon name="ChevronRight" className="h-4 w-4 text-gray-700" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="p-1.5 bg-red-500/90 rounded-lg hover:bg-red-600 transition-colors"
                  title="Remove"
                >
                  <Icon name="X" className="h-4 w-4 text-white" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {images.length < maxImages && (
        <button
          type="button"
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            uploading
              ? 'border-baby-blue-300 bg-baby-blue-50'
              : 'border-gray-300 hover:border-baby-blue-400 hover:bg-baby-blue-50/50'
          }`}
        >
          {uploading ? (
            <div className="space-y-2">
              <div className="w-8 h-8 border-3 border-baby-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-baby-blue-600 font-medium">
                Wird hochgeladen... {progress}%
              </p>
              <div className="w-48 mx-auto bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-baby-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <svg className="h-10 w-10 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-700">Klicken zum Hochladen</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {allowedTypesLabel} • max {maxFileSizeMB} MB • {images.length}/{maxImages}
                </p>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </button>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

export default ImageUpload;
