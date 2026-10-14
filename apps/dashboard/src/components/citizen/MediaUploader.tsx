"use client";

import React, { useRef, useCallback } from "react";
import { Plus, X, FileText, ImageIcon } from "lucide-react";
import { cn } from "../ui";
import type { MediaItem } from "../../types/citizen";

interface MediaUploaderProps {
  images: MediaItem[];
  documents: MediaItem[];
  onImagesChange: (images: MediaItem[]) => void;
  onDocumentsChange: (documents: MediaItem[]) => void;
  maxImages?: number;
  maxDocuments?: number;
  className?: string;
}

export function MediaUploader({
  images,
  documents,
  onImagesChange,
  onDocumentsChange,
  maxImages = 3,
  maxDocuments = 1,
  className,
}: MediaUploaderProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const remaining = maxImages - images.length;
      const selected = files.slice(0, remaining);

      const newItems: MediaItem[] = selected.map((f) => ({
        uri: URL.createObjectURL(f),
        type: "image" as const,
        name: f.name,
        file: f,
      }));

      onImagesChange([...images, ...newItems]);
      e.target.value = "";
    },
    [images, maxImages, onImagesChange]
  );

  const handleDocumentSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      const f = files[0];
      const newItem: MediaItem = {
        uri: URL.createObjectURL(f),
        type: "document" as const,
        name: f.name,
        file: f,
      };

      documents.forEach((d) => URL.revokeObjectURL(d.uri));
      onDocumentsChange([newItem]);
      e.target.value = "";
    },
    [documents, onDocumentsChange]
  );

  const removeImage = useCallback(
    (index: number) => {
      URL.revokeObjectURL(images[index].uri);
      const updated = images.filter((_, i) => i !== index);
      onImagesChange(updated);
    },
    [images, onImagesChange]
  );

  const removeDocument = useCallback(() => {
    documents.forEach((d) => URL.revokeObjectURL(d.uri));
    onDocumentsChange([]);
  }, [documents, onDocumentsChange]);

  const canAddImages = images.length < maxImages;
  const canAddDocuments = documents.length < maxDocuments;

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <p className="text-caption text-secondary mb-2">
          Photos ({images.length}/{maxImages})
        </p>
        <div className="flex flex-wrap gap-3">
          {images.map((img, i) => (
            <div
              key={img.uri}
              className="relative w-20 h-20 rounded-xl overflow-hidden border border-border bg-surface shrink-0 group"
            >
              <img
                src={img.uri}
                alt={img.name || `Upload ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-brand/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                aria-label={`Remove image ${i + 1}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {canAddImages && (
            <button
              onClick={() => imageInputRef.current?.click()}
              className="w-20 h-20 rounded-xl border-2 border-dashed border-border bg-surface flex flex-col items-center justify-center gap-1 hover:bg-border/20 transition-colors cursor-pointer"
            >
              <Plus className="w-5 h-5 text-muted" />
              <span className="text-caption text-muted">Photo</span>
            </button>
          )}
        </div>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={handleImageSelect}
        />
      </div>

      <div>
        <p className="text-caption text-secondary mb-2">
          Document ({documents.length}/{maxDocuments})
        </p>
        <div className="flex flex-wrap gap-3">
          {documents.map((doc) => (
            <div
              key={doc.uri}
              className="relative flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-surface group max-w-full"
            >
              <FileText className="w-5 h-5 text-muted shrink-0" />
              <span className="text-body text-text truncate">
                {doc.name || "Document"}
              </span>
              <button
                onClick={removeDocument}
                className="w-5 h-5 rounded-full bg-brand/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                aria-label="Remove document"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {canAddDocuments && (
            <button
              onClick={() => docInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border bg-surface hover:bg-border/20 transition-colors cursor-pointer"
            >
              <Plus className="w-5 h-5 text-muted" />
              <span className="text-body text-secondary">
                {maxDocuments === 1 ? "Add document" : "Add document (supports PDF, DOC)"}
              </span>
            </button>
          )}
        </div>
        <input
          ref={docInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
          className="hidden"
          onChange={handleDocumentSelect}
        />
      </div>
    </div>
  );
}
