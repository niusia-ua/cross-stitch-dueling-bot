import { optimizeImage } from "wasm-image-optimization";

const MAX_DIMENSION = 1920;

export class ImageCompressionError extends Error {
  readonly fileName: string;

  constructor(message: string, fileName: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ImageCompressionError";

    this.fileName = fileName;
  }
}

export async function compressImage(file: File): Promise<File> {
  try {
    const { width, height } = await getImageDimensions(file);
    const ratio = Math.min(1, MAX_DIMENSION / Math.max(width, height));

    const compressed = await optimizeImage({
      image: await file.arrayBuffer(),
      width: Math.round(width * ratio),
      height: Math.round(height * ratio),
      quality: 80,
      format: "jpeg",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new File([compressed.data as any], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
  } catch (error) {
    throw new ImageCompressionError(`Failed to compress image`, file.name, { cause: error });
  }
}

function getImageDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      const dimensions = {
        width: img.naturalWidth,
        height: img.naturalHeight,
      };

      URL.revokeObjectURL(img.src);

      resolve(dimensions);
    };

    img.onerror = (err) => reject(err.toString());
  });
}
