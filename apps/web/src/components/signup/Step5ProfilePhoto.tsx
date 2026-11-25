"use client";
import { useRef } from "react";

interface Step5Props {
  values: any;
  errors: any;
  onChange: (field: string, value: any) => void;
}

export default function Step5ProfilePhoto({ values, errors, onChange }: Step5Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const currentPhotos = values.photos || [];
    const remainingSlots = 6 - currentPhotos.length;
    const filesToAdd = files.slice(0, remainingSlots);

    // Convert files to data URLs
    const readers = filesToAdd.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then((dataUrls) => {
      onChange('photos', [...currentPhotos, ...dataUrls]);
    });
  };

  const removePhoto = (index: number) => {
    const currentPhotos = values.photos || [];
    onChange('photos', currentPhotos.filter((_: any, i: number) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900">Add your photos</h2>
        <p className="mt-2 text-sm text-gray-600">
          Upload at least 1 photo to continue (4-6 recommended)
        </p>
      </div>

      <div className="space-y-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={values.photos?.length >= 6}
          className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          📸 Upload Photos
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        {values.photos && values.photos.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {values.photos.map((photo: string, index: number) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={photo}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {errors.photos && (
          <p className="text-sm text-red-600">{errors.photos}</p>
        )}

        <p className="text-sm text-center text-gray-600">
          {values.photos?.length || 0}/6 photos
          {values.photos?.length < 1 && ' • You need at least 1 to continue'}
        </p>

        <div className="mt-6 p-4 bg-blue-50 rounded-xl">
          <p className="text-sm text-blue-900 font-semibold">💡 Photo Tips</p>
          <ul className="mt-2 text-xs text-blue-800 space-y-1">
            <li>• Clear, recent photos work best</li>
            <li>• Show your face in at least one photo</li>
            <li>• Variety helps: hobbies, travel, candid moments</li>
            <li>• 4-6 photos get 3x more matches</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
