import z from "zod";

export const IdSchema = z.coerce.number().int().positive();
export const IdObjectSchema = z.object({ id: IdSchema });

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
export const ImageFileSchema = z
  .instanceof(File, { message: "Please select an image file." })
  .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), {
    message: "Please upload a valid image file (JPEG, PNG, or WebP).",
  })
  .refine((file) => file.size <= MAX_FILE_SIZE, {
    message: "The image is too large. Please choose an image smaller than 8 MB.",
  });
