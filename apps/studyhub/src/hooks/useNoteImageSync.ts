"use client";

import { useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";

import {
  getImageIdsFromEditor,
  restoreNoteImage,
  softDeleteNoteImage,
} from "@/lib/images/syncNoteImages";

export function useNoteImageSync(editor: Editor | null) {
  const previousImageIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return;
    }

    previousImageIdsRef.current = getImageIdsFromEditor(editor);

    const syncImages = () => {
      if (editor.isDestroyed) {
        return;
      }

      const previousImageIds = previousImageIdsRef.current;
      const currentImageIds = getImageIdsFromEditor(editor);

      for (const imageId of currentImageIds) {
        if (!previousImageIds.has(imageId)) {
          void restoreNoteImage(imageId).catch((error) => {
            console.error(
              `Could not restore image ${imageId}:`,
              error,
            );
          });
        }
      }

      for (const imageId of previousImageIds) {
        if (!currentImageIds.has(imageId)) {
          void softDeleteNoteImage(imageId).catch((error) => {
            console.error(
              `Could not soft-delete image ${imageId}:`,
              error,
            );
          });
        }
      }

      previousImageIdsRef.current = currentImageIds;
    };

    editor.on("update", syncImages);

    return () => {
      editor.off("update", syncImages);
    };
  }, [editor]);
}