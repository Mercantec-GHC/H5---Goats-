"use client";

import { useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";
import { toBlob } from "html-to-image";

const LOCAL_PREVIEW_DEBOUNCE_MS = 1000;
const PREVIEW_UPLOAD_DEBOUNCE_MS = 3000;

const PREVIEW_WIDTH = 720;
const PREVIEW_HEIGHT = 480;

type PreviewStatus =
  | "idle"
  | "dirty"
  | "generating"
  | "ready"
  | "uploading";

export function useNotePreview(
  editor: Editor | null,
  noteId: string,
) {
  const latestPreviewBlobRef = useRef<Blob | null>(null);

  const statusRef = useRef<PreviewStatus>("idle");

  /*
   * Dokumentet kan være ændret siden sidste genererede preview.
   */
  const documentVersionRef = useRef(0);

  /*
   * Versionen som den seneste preview-blob repræsenterer.
   */
  const previewVersionRef = useRef(0);

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return;
    }

    let generateTimeout: ReturnType<typeof setTimeout> | null = null;
    let uploadTimeout: ReturnType<typeof setTimeout> | null = null;

    let disposed = false;

    /*
     * Bruges når en ændring kommer,
     * mens generation eller upload allerede kører.
     */
    let pendingGeneration = false;
    let pendingUpload = false;

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
      if (disposed) {
        return;
      }

      const blob = latestPreviewBlobRef.current;

      if (!blob) {
        return;
      }

      /*
       * Hvis den allerede uploader,
       * så bed den om at køre igen bagefter.
       */
      if (statusRef.current === "uploading") {
        pendingUpload = true;
        return;
      }

      const uploadedVersion = previewVersionRef.current;

      statusRef.current = "uploading";

      try {
        const formData = new FormData();

        formData.append(
          "file",
          blob,
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
            | {
                error?: string;
              }
            | null;

          throw new Error(
            data?.error ?? "Preview kunne ikke uploades.",
          );
        }

        /*
         * Hvis dokumentet ikke har ændret sig siden
         * previewet blev genereret, er vi helt clean.
         */
        if (
          previewVersionRef.current === uploadedVersion &&
          documentVersionRef.current === uploadedVersion
        ) {
          statusRef.current = "idle";
        } else {
          statusRef.current = "dirty";
        }
      } catch (error) {
        statusRef.current = "ready";

        if (!disposed) {
          console.error(
            "Note preview upload failed:",
            error,
          );
        }
      } finally {
        if (pendingUpload && !disposed) {
          pendingUpload = false;

          void uploadPreview();
        }
      }
    };

    const generatePreview = async () => {
      if (disposed || editor.isDestroyed) {
        return;
      }

      /*
       * Der kører allerede en generation.
       * Kør igen bagefter hvis dokumentet blev ændret.
       */
      if (statusRef.current === "generating") {
        pendingGeneration = true;
        return;
      }

      const versionBeingGenerated =
        documentVersionRef.current;

      statusRef.current = "generating";

      try {
        const editorElement = editor.view.dom;

        if (!editorElement.isConnected) {
          statusRef.current = "dirty";
          return;
        }

        await waitForImages(editorElement);

        if (
          disposed ||
          editor.isDestroyed ||
          !editorElement.isConnected
        ) {
          statusRef.current = "dirty";
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
              node.classList.contains(
                "collaboration-carets__caret",
              ) ||
              node.classList.contains(
                "collaboration-carets__label",
              )
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
        previewVersionRef.current =
          versionBeingGenerated;

        /*
         * Hvis dokumentet blev ændret under generationen,
         * er dette preview allerede gammelt.
         */
        if (
          documentVersionRef.current !==
          versionBeingGenerated
        ) {
          statusRef.current = "dirty";
          pendingGeneration = true;
        } else {
          statusRef.current = "ready";
        }
      } catch (error) {
        statusRef.current = "dirty";

        if (!disposed) {
          console.error(
            "Note preview generation failed:",
            error,
          );
        }
      } finally {
        if (pendingGeneration && !disposed) {
          pendingGeneration = false;

          clearGenerateTimeout();

          generateTimeout = setTimeout(() => {
            void generatePreview();
          }, LOCAL_PREVIEW_DEBOUNCE_MS);
        }
      }
    };

    const schedulePreview = () => {
      /*
       * Dokumentet har nu en ny version.
       */
      documentVersionRef.current += 1;

      statusRef.current = "dirty";

      clearGenerateTimeout();
      clearUploadTimeout();

      /*
       * Lav thumbnail lokalt efter kort inaktivitet.
       */
      generateTimeout = setTimeout(() => {
        void generatePreview();
      }, LOCAL_PREVIEW_DEBOUNCE_MS);

      /*
       * Upload efter længere inaktivitet.
       *
       * Hvis blob endnu ikke findes,
       * sørger flushPreview for at generere først.
       */
      uploadTimeout = setTimeout(() => {
        void flushPreview();
      }, PREVIEW_UPLOAD_DEBOUNCE_MS);
    };

    const flushPreview = async ({
      keepalive = false,
    }: {
      keepalive?: boolean;
    } = {}) => {
      if (disposed || editor.isDestroyed) {
        return;
      }

      clearGenerateTimeout();
      clearUploadTimeout();

      /*
       * Hvis dokumentets aktuelle version ikke allerede
       * findes som preview, generér den først.
       */
      if (
        !latestPreviewBlobRef.current ||
        previewVersionRef.current !==
          documentVersionRef.current
      ) {
        await generatePreview();
      }

      /*
       * Generation kan have fejlet eller editoren kan være
       * blevet destroyed undervejs.
       */
      if (
        disposed ||
        editor.isDestroyed ||
        !latestPreviewBlobRef.current
      ) {
        return;
      }

      /*
       * Upload kun hvis preview-versionen svarer
       * til dokumentets seneste version.
       */
      if (
        previewVersionRef.current ===
        documentVersionRef.current
      ) {
        await uploadPreview({
          keepalive,
        });
      }
    };

    const handlePageHide = () => {
      void flushPreview({
        keepalive: true,
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        void flushPreview({
          keepalive: true,
        });
      }
    };

    editor.on("update", schedulePreview);

    window.addEventListener(
      "pagehide",
      handlePageHide,
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      /*
       * Forsøg at gemme den nyeste preview-version
       * inden editoren forsvinder.
       */
      void flushPreview({
        keepalive: true,
      });

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

      /*
       * Sæt disposed sidst, så flushPreview får
       * mulighed for at starte først.
       */
      queueMicrotask(() => {
        disposed = true;
      });
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
            {
              once: true,
            },
          );

          image.addEventListener(
            "error",
            done,
            {
              once: true,
            },
          );
        });
      }
    }),
  );
}