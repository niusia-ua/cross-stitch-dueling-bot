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
    const compressed = await optimizeImage({
      image: await file.arrayBuffer(),
      width: 1920,
      height: 1920,
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
