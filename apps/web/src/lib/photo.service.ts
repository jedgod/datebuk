/**
 * Photo Upload Service
 * Handles validation, compression, and storage of staff passport photos
 */

export interface PhotoValidationResult {
  isValid: boolean;
  error?: string;
}

export interface PhotoMeta {
  url: string;
  size: number;
  dimensions: {
    width: number;
    height: number;
  };
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const MIN_WIDTH = 300;
const MIN_HEIGHT = 300;
const TARGET_SIZE = 400; // 400x400 for staff photos

/**
 * Validates photo file
 */
export function validatePhoto(file: File): PhotoValidationResult {
  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid image type. Please use JPEG, PNG, or WebP.',
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: 'Image too large. Maximum size is 2MB.',
    };
  }

  return { isValid: true };
}

/**
 * Gets image dimensions from File
 */
export async function getImageDimensions(file: File): Promise<{
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Validates image resolution
 */
export async function validateResolution(
  file: File
): Promise<PhotoValidationResult> {
  try {
    const dimensions = await getImageDimensions(file);

    if (
      dimensions.width < MIN_WIDTH ||
      dimensions.height < MIN_HEIGHT
    ) {
      return {
        isValid: false,
        error: `Image resolution too low. Minimum ${MIN_WIDTH}x${MIN_HEIGHT}px required.`,
      };
    }

    return { isValid: true };
  } catch (err) {
    return {
      isValid: false,
      error: 'Failed to validate image dimensions.',
    };
  }
}

/**
 * Compresses image using Canvas API
 */
export async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Set canvas size to target size
        canvas.width = TARGET_SIZE;
        canvas.height = TARGET_SIZE;

        // Calculate aspect ratio and position image on canvas
        const scale = Math.max(
          TARGET_SIZE / img.width,
          TARGET_SIZE / img.height
        );
        const x = (TARGET_SIZE - img.width * scale) / 2;
        const y = (TARGET_SIZE - img.height * scale) / 2;

        // Draw image centered on canvas
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, TARGET_SIZE, TARGET_SIZE);
        ctx.drawImage(
          img,
          x,
          y,
          img.width * scale,
          img.height * scale
        );

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          0.9
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for compression'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Converts blob to base64 for storage
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Full photo upload pipeline
 */
export async function processPhoto(file: File): Promise<PhotoMeta> {
  // Validate file
  const validation = validatePhoto(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Validate resolution
  const resolutionCheck = await validateResolution(file);
  if (!resolutionCheck.isValid) {
    throw new Error(resolutionCheck.error);
  }

  // Compress image
  const compressed = await compressImage(file);

  // Get final dimensions
  const dimensions = await getImageDimensions(
    new File([compressed], 'photo.jpg', { type: 'image/jpeg' })
  );

  // Convert to base64
  const base64 = await blobToBase64(compressed);

  return {
    url: base64,
    size: compressed.size,
    dimensions,
  };
}
