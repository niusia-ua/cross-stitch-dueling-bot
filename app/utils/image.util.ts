import { optimizeImage } from "wasm-image-optimization";

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
    const compressed = await optimizeImage({
      image: await file.arrayBuffer(),
      width: Math.min(width, 1920),
      height: Math.min(height, 1920),
      quality: 80,
      format: "jpeg",
    });

    if (compressed === undefined) {
      throw new ImageCompressionError(`Failed to compress image`, file.name);
    }

    const blob = new Blob([compressed], { type: "image/jpeg" });
    const fileName = file.name.replace(/\.[^.]+$/, ".jpg");

    return new File([blob], fileName, { type: "image/jpeg" });
  } catch (error) {
    if (error instanceof ImageCompressionError) throw error;
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
