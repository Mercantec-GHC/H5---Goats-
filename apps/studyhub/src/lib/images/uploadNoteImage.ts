export type UploadedNoteImage = {
  id: string;
  url: string;
  originalName: string;
  altText: string;
};

type UploadResponse = {
  image?: UploadedNoteImage;
  error?: string;
};

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function uploadNoteImage(
  noteId: string,
  file: File,
): Promise<UploadedNoteImage> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Kun JPEG, PNG, WebP og GIF er tilladt.");
  }

  if (file.size === 0) {
    throw new Error("Den valgte fil er tom.");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("Billedet må højst fylde 8 MB.");
  }

  const formData = new FormData();

  formData.append("file", file);
  formData.append("altText", file.name);

  const response = await fetch(`/api/notes/${noteId}/images`, {
    method: "POST",
    body: formData,
  });

  const data = (await response.json()) as UploadResponse;

  if (!response.ok) {
    throw new Error(data.error ?? "Billedet kunne ikke uploades.");
  }

  if (!data.image?.url) {
    throw new Error("Upload-endpointet returnerede ingen billed-URL.");
  }

  return data.image;
}