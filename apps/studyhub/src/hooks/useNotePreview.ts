"use client";

import { useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";
import { toBlob } from "html-to-image";

const LOCAL_PREVIEW_DEBOUNCE_MS = 1500;
const PREVIEW_UPLOAD_DEBOUNCE_MS = 20_000;

const PREVIEW_WIDTH = 720;
const PREVIEW_HEIGHT = 480;

export function useNotePreview(
  editor: Editor | null,
  noteId: string,
) {
  const latestPreviewBlobRef = useRef<Blob | null>(null);
  const previewIsDirtyRef = useRef(false);

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return;
    }

    let generateTimeout: ReturnType<typeof setTimeout> | null = null;
    let uploadTimeout: ReturnType<typeof setTimeout> | null = null;

    let isGenerating = false;
    let isUploading = false;

    let generateAgain = false;
    let uploadAgain = false;

    let disposed = false;

    const clearGenerateTimeout = () => {
      if (generateTimeout) {
        clearTimeout(generateTimeout);
        generateTimeout = null;
      }
    };

    const clearUploadTimeout = () => {
      if (uploadTimeout) {
        clearTimeout(uploadTimeout);
        uploadTimeout = null;
      }
    };

    const uploadPreview = async ({
      keepalive = false,
    }: {
      keepalive?: boolean;
    } = {}) => {
      const blob = latestPreviewBlobRef.current;

      if (!blob || !previewIsDirtyRef.current) {
        return;
      }

      if (isUploading) {
        uploadAgain = true;
        return;
      }

      isUploading = true;

      const blobBeingUploaded = blob;

      try {
        const formData = new FormData();

        formData.append(
          "file",
          blobBeingUploaded,
          `note-${noteId}-preview.webp`,
        );

        const response = await fetch(
          `/api/notes/${noteId}/preview`,
          {
            method: "POST",
            body: formData,
            keepalive,
          },
        );

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;

          throw new Error(
            data?.error ?? "Preview kunne ikke uploades.",
          );
        }

        /*
         * Previewet er kun clean, hvis den uploadede blob
         * stadig er den nyeste version.
         */
        if (latestPreviewBlobRef.current === blobBeingUploaded) {
          previewIsDirtyRef.current = false;
        }
      } catch (error) {
        if (!disposed) {
          console.error("Note preview upload failed:", error);
        }
      } finally {
        isUploading = false;

        if (uploadAgain && !disposed) {
          uploadAgain = false;
          void uploadPreview();
        }
      }
    };

    const generatePreview = async () => {
      if (disposed || editor.isDestroyed) {
        return;
      }

      if (isGenerating) {
        generateAgain = true;
        return;
      }

      isGenerating = true;

      try {
        const editorElement = editor.view.dom;

        if (!editorElement.isConnected) {
          return;
        }

        await waitForImages(editorElement);

        if (
          disposed ||
          editor.isDestroyed ||
          !editorElement.isConnected
        ) {
          return;
        }

        const blob = await toBlob(editorElement, {
          cacheBust: true,
          pixelRatio: 1,

          width: PREVIEW_WIDTH,
          height: PREVIEW_HEIGHT,

          backgroundColor: "#ffffff",

          style: {
            width: `${PREVIEW_WIDTH}px`,
            height: `${PREVIEW_HEIGHT}px`,
            overflow: "hidden",
            padding: "24px",
            boxSizing: "border-box",
          },

          filter: (node) => {
            if (!(node instanceof HTMLElement)) {
              return true;
            }

            if (
              node.hasAttribute("data-resize-handle") ||
              node.classList.contains("ProseMirror-gapcursor") ||
              node.classList.contains("collaboration-carets__caret") ||
              node.classList.contains("collaboration-carets__label")
            ) {
              return false;
            }

            return true;
          },
        });

        if (!blob) {
          throw new Error(
            "Kunne ikke generere preview-billedet.",
          );
        }

        const webpBlob = await convertBlobToWebP(blob);

        latestPreviewBlobRef.current = webpBlob;
        previewIsDirtyRef.current = true;
      } catch (error) {
        if (!disposed) {
          console.error(
            "Note preview generation failed:",
            error,
          );
        }
      } finally {
        isGenerating = false;

        if (generateAgain && !disposed) {
          generateAgain = false;

          clearGenerateTimeout();

          generateTimeout = setTimeout(() => {
            void generatePreview();
          }, LOCAL_PREVIEW_DEBOUNCE_MS);
        }
      }
    };

    const schedulePreview = () => {
      clearGenerateTimeout();
      clearUploadTimeout();

      /*
       * Lav preview lokalt relativt hurtigt.
       */
      generateTimeout = setTimeout(() => {
        void generatePreview();
      }, LOCAL_PREVIEW_DEBOUNCE_MS);

      /*
       * Upload kun hvis brugeren har været inaktiv i 20 sekunder.
       */
      uploadTimeout = setTimeout(() => {
        void uploadPreview();
      }, PREVIEW_UPLOAD_DEBOUNCE_MS);
    };

    /*
     * Upload seneste genererede preview med det samme.
     *
     * Vi forsøger ikke at generere et nyt screenshot her,
     * fordi editor-DOM'en kan være ved at blive unmounted.
     */
    const flushPreview = () => {
      clearUploadTimeout();

      if (!previewIsDirtyRef.current) {
        return;
      }

      void uploadPreview({
        keepalive: true,
      });
    };

    const handlePageHide = () => {
      flushPreview();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushPreview();
      }
    };

    editor.on("update", schedulePreview);

    window.addEventListener("pagehide", handlePageHide);

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      /*
       * Vigtigt:
       * flush først, mens hookens state stadig er aktiv.
       */
      flushPreview();

      editor.off("update", schedulePreview);

      window.removeEventListener(
        "pagehide",
        handlePageHide,
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );

      clearGenerateTimeout();
      clearUploadTimeout();

      disposed = true;
    };
  }, [editor, noteId]);
}

async function convertBlobToWebP(
  blob: Blob,
): Promise<Blob> {
  const objectUrl = URL.createObjectURL(blob);

  try {
    const image = await loadImage(objectUrl);

    const canvas = document.createElement("canvas");

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error(
        "Kunne ikke oprette canvas context.",
      );
    }

    context.fillStyle = "#ffffff";

    context.fillRect(
      0,
      0,
      canvas.width,
      canvas.height,
    );

    context.drawImage(image, 0, 0);

    const webpBlob = await new Promise<Blob | null>(
      (resolve) => {
        canvas.toBlob(
          resolve,
          "image/webp",
          0.82,
        );
      },
    );

    if (!webpBlob) {
      throw new Error(
        "Kunne ikke konvertere preview til WebP.",
      );
    }

    return webpBlob;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(
  src: string,
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      resolve(image);
    };

    image.onerror = () => {
      reject(
        new Error(
          "Kunne ikke indlæse det genererede preview.",
        ),
      );
    };

    image.src = src;
  });
}

async function waitForImages(
  root: HTMLElement,
) {
  const images = Array.from(
    root.querySelectorAll("img"),
  );

  await Promise.all(
    images.map(async (image) => {
      if (
        image.complete &&
        image.naturalWidth > 0
      ) {
        return;
      }

      try {
        await image.decode();
      } catch {
        await new Promise<void>((resolve) => {
          const done = () => resolve();

          image.addEventListener(
            "load",
            done,
            { once: true },
          );

          image.addEventListener(
            "error",
            done,
            { once: true },
          );
        });
      }
    }),
  );
}