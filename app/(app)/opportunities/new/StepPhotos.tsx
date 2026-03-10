'use client'

import { useRef } from 'react'
import { PhotoFile } from '@/types'
import { compressImage } from '@/lib/utils'

interface Props {
  photos: PhotoFile[]
  onPhotosChange: (photos: PhotoFile[]) => void
  onNext: () => void
}

const MAX_PHOTOS = 5

export default function StepPhotos({ photos, onPhotosChange, onNext }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  async function addFiles(files: FileList | null) {
    if (!files) return

    const remaining = MAX_PHOTOS - photos.length
    const toAdd = Array.from(files).slice(0, remaining)

    const newPhotos: PhotoFile[] = await Promise.all(
      toAdd.map(async (file) => {
        // Compress before preview/upload
        let blob: Blob = file
        try {
          blob = await compressImage(file, 1200, 0.82)
        } catch {
          blob = file
        }
        const compressedFile = new File([blob], file.name, { type: 'image/jpeg' })
        const preview = URL.createObjectURL(blob)
        return {
          id: crypto.randomUUID(),
          file: compressedFile,
          preview,
        }
      })
    )

    onPhotosChange([...photos, ...newPhotos])
  }

  function removePhoto(id: string) {
    onPhotosChange(photos.filter((p) => p.id !== id))
  }

  const canContinue = photos.length > 0
  const canAddMore = photos.length < MAX_PHOTOS

  return (
    <div className="space-y-5">
      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.preview}
                alt="Captured photo"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => removePhoto(photo.id)}
                className="absolute top-1 right-1 w-7 h-7 bg-black/60 text-white rounded-full
                           flex items-center justify-center text-xs leading-none"
                aria-label="Remove photo"
              >
                ×
              </button>
            </div>
          ))}
          {/* Empty slots */}
          {canAddMore && (
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-300
                         flex items-center justify-center text-gray-400 bg-gray-50 active:bg-gray-100"
            >
              <span className="text-2xl">+</span>
            </button>
          )}
        </div>
      )}

      {/* Add photo buttons */}
      {photos.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <div className="text-5xl mb-3">📷</div>
          <p className="text-gray-600 font-medium">Take photos of the issue</p>
          <p className="text-gray-400 text-sm mt-1">Up to {MAX_PHOTOS} photos</p>
        </div>
      )}

      {canAddMore && (
        <div className="grid grid-cols-2 gap-3">
          {/* Camera (mobile native) */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="btn-primary"
          >
            <CameraIcon />
            Take Photo
          </button>
          {/* Gallery / file picker */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary"
          >
            <GalleryIcon />
            From Gallery
          </button>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple={false}
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />

      {/* Photo count indicator */}
      {photos.length > 0 && (
        <p className="text-center text-sm text-gray-400">
          {photos.length} of {MAX_PHOTOS} photos added
        </p>
      )}

      {/* Continue */}
      <button
        onClick={onNext}
        disabled={!canContinue}
        className="btn-primary"
      >
        Analyze Photos
        <ArrowRightIcon />
      </button>

      <p className="text-center text-xs text-gray-400">
        AI will analyze your photos and suggest a service category
      </p>
    </div>
  )
}

function CameraIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function GalleryIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}
