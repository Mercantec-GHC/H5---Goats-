import type { EditorProps } from "@tiptap/pm/view";

import { uploadNoteImage } from "@/lib/images/uploadNoteImage";

export function createImageDropHandler(
  noteId: string,
): NonNullable<EditorProps["handleDrop"]> {
  return (view, event) => {
    const files = Array.from(event.dataTransfer?.files ?? []);

    const imageFiles = files.filter((file) =>
      file.type.startsWith("image/"),
    );

    /*
     * Ikke et image-drop.
     * Lad ProseMirror håndtere eventet normalt.
     */
    if (imageFiles.length === 0) {
      return false;
    }

    event.preventDefault();

    const position = view.posAtCoords({
      left: event.clientX,
      top: event.clientY,
    });

    if (!position) {
      return true;
    }

    const dropPosition = position.pos;

    void (async () => {
      let currentPosition = dropPosition;

      for (const file of imageFiles) {
        try {
          /*
           * Upload først til API -> database -> R2.
           */
          const image = await uploadNoteImage(noteId, file);

          if (view.isDestroyed) {
            return;
          }

          const imageNodeType = view.state.schema.nodes.image;

          if (!imageNodeType) {
            console.error(
              "Image node type is not registered in the editor schema.",
            );
            return;
          }

          /*
           * Opret image-node med database-ID.
           */
          const imageNode = imageNodeType.create({
            src: image.url,
            imageId: image.id,
            alt: image.altText || image.originalName || file.name,
            title: image.originalName || file.name,
            alignment: "center",
          });

          /*
           * Indsæt billedet på drop-positionen.
           */
          const transaction = view.state.tr.insert(
            currentPosition,
            imageNode,
          );

          view.dispatch(transaction);

          /*
           * Hvis flere billeder droppes samtidig,
           * indsæt næste efter det foregående.
           */
          currentPosition += imageNode.nodeSize;
        } catch (error) {
          console.error("Dropped image upload failed:", error);
        }
      }
    })();

    return true;
  };
}