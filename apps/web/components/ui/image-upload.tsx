'use client';

import { useState, useRef } from 'react';

interface ImageUploadProps {
  onUpload: (urls: string[]) => void;
  maxImages?: number;
}

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export function ImageUpload({ onUpload, maxImages = 5 }: ImageUploadProps) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || previews.length + files.length > maxImages) return;
    setUploading(true);

    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET || '');

      try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        newUrls.push(data.secure_url);
        setPreviews(prev => [...prev, data.secure_url]);
      } catch (err) {
        console.error('Erreur upload:', err);
      }
    }

    onUpload(newUrls);
    setUploading(false);
  }

  function removeImage(index: number) {
    const newPreviews = previews.filter((_, i) => i !== index);
    setPreviews(newPreviews);
    // On prévient le parent qu'on a retiré une image
    onUpload(newPreviews);
  }

  return (
    <div>
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-[var(--border)] rounded-xl p-6 text-center cursor-pointer hover:border-primary hover:bg-primary-light/20 transition-all"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-primary">
            <i className="fa-solid fa-circle-notch fa-spin text-xl" />
            <span className="text-sm font-medium">Envoi en cours...</span>
          </div>
        ) : (
          <>
            <i className="fa-solid fa-cloud-arrow-up text-3xl text-[var(--text-ter)] mb-2 block" />
            <p className="text-sm font-medium text-[var(--text)]">Cliquez pour ajouter des photos</p>
            <p className="text-xs text-[var(--text-ter)] mt-1">{previews.length}/{maxImages} photos ajoutées</p>
          </>
        )}
      </div>

      {/* Aperçu des images uploadées */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mt-4">
          {previews.map((url, index) => (
            <div key={url} className="relative group aspect-square rounded-lg overflow-hidden border border-[var(--border)]">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <i className="fa-solid fa-xmark" />
              </button>
              {index === 0 && (
                <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5">
                  Photo principale
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}