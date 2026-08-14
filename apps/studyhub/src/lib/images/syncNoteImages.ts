import type { Editor } from "@tiptap/react";

export function getImageIdsFromEditor(editor: Editor) {
  const imageIds = new Set<string>();

  editor.state.doc.descendants((node) => {
    if (node.type.name !== "image") {
      return;
    }

    const imageId = node.attrs.imageId;

    if (typeof imageId === "string" && imageId.length > 0) {
      imageIds.add(imageId);
    }
  });

  return imageIds;
}

export async function restoreNoteImage(imageId: string) {
  const response = await fetch(`/api/note-images/${imageId}`, {
    method: "PATCH",
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    throw new Error(
      data?.error ?? "Billedet kunne ikke gendannes.",
    );
  }
}

export async function softDeleteNoteImage(imageId: string) {
  const response = await fetch(`/api/note-images/${imageId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    throw new Error(
      data?.error ?? "Billedet kunne ikke markeres som slettet.",
    );
  }
}