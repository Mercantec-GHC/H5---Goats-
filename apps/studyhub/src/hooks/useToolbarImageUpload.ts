"use client";

import { useRef, useState } from "react";
import type { Editor } from "@tiptap/react";

import { uploadNoteImage } from "@/lib/images/uploadNoteImage";

export function useToolbarImageUpload(
  editor: Editor,
  noteId: string,
) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState("");

  const openImagePicker = () => {
    if (editor.isDestroyed || isUploadingImage) {
      return;
    }

    setImageUploadError("");
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file || editor.isDestroyed) {
      return;
    }

    setImageUploadError("");
    setIsUploadingImage(true);

    try {
      const image = await uploadNoteImage(noteId, file);

      if (editor.isDestroyed) {
        return;
      }

      const inserted = editor
        .chain()
        .focus()
        .insertContent({
          type: "image",
          attrs: {
            src: image.url,
            imageId: image.id,
            alt: image.altText || image.originalName || file.name,
            title: image.originalName || file.name,
            alignment: "center",
          },
        })
        .run();

      if (!inserted) {
        throw new Error(
          "Billedet blev uploadet, men kunne ikke indsættes.",
        );
      }
    } catch (error) {
      console.error("Image upload failed:", error);

      setImageUploadError(
        error instanceof Error
          ? error.message
          : "Der skete en ukendt fejl under upload.",
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  return {
    fileInputRef,
    isUploadingImage,
    imageUploadError,
    openImagePicker,
    handleImageUpload,
  };
}