import { Extension } from "@tiptap/core";
import type { MarkType, Node as ProseMirrorNode } from "@tiptap/pm/model";
import {
  TextSelection,
  type EditorState,
  type Transaction,
} from "@tiptap/pm/state";

function hasMark(
  node: ProseMirrorNode | null | undefined,
  markType: MarkType,
) {
  return node?.marks.some((mark) => mark.type === markType) ?? false;
}

function selectionContainsOnlyLinkedText(
  state: EditorState,
  linkType: MarkType,
) {
  const { selection } = state;

  if (selection.empty) {
    return false;
  }

  let containsText = false;
  let containsUnlinkedText = false;

  state.doc.nodesBetween(selection.from, selection.to, (node) => {
    if (!node.isText) {
      return;
    }

    containsText = true;

    if (!hasMark(node, linkType)) {
      containsUnlinkedText = true;
    }
  });

  return containsText && !containsUnlinkedText;
}

function deleteLinkedSelection(
  state: EditorState,
  linkType: MarkType,
): Transaction | null {
  if (!selectionContainsOnlyLinkedText(state, linkType)) {
    return null;
  }

  return state.tr
    .deleteSelection()
    .removeStoredMark(linkType)
    .scrollIntoView();
}

function deleteLastLinkedCharacterBackward(
  state: EditorState,
  linkType: MarkType,
): Transaction | null {
  const { selection } = state;

  if (
    !(selection instanceof TextSelection) ||
    !selection.empty ||
    !selection.$cursor
  ) {
    return null;
  }

  const { $cursor } = selection;
  const nodeBefore = $cursor.nodeBefore;

  if (
    !nodeBefore?.isText ||
    !hasMark(nodeBefore, linkType)
  ) {
    return null;
  }

  /*
   * Vi griber kun Backspace, når der kun er ét linktegn tilbage
   * direkte før markøren.
   */
  if (nodeBefore.textContent.length !== 1) {
    return null;
  }

  const cursorPosition = selection.from;

  return state.tr
    .delete(cursorPosition - 1, cursorPosition)
    .removeStoredMark(linkType)
    .scrollIntoView();
}

function deleteLastLinkedCharacterForward(
  state: EditorState,
  linkType: MarkType,
): Transaction | null {
  const { selection } = state;

  if (
    !(selection instanceof TextSelection) ||
    !selection.empty ||
    !selection.$cursor
  ) {
    return null;
  }

  const { $cursor } = selection;
  const nodeAfter = $cursor.nodeAfter;

  if (
    !nodeAfter?.isText ||
    !hasMark(nodeAfter, linkType)
  ) {
    return null;
  }

  /*
   * Samme logik for Delete-tasten, når der kun er ét linktegn
   * direkte efter markøren.
   */
  if (nodeAfter.textContent.length !== 1) {
    return null;
  }

  const cursorPosition = selection.from;

  return state.tr
    .delete(cursorPosition, cursorPosition + 1)
    .removeStoredMark(linkType)
    .scrollIntoView();
}

export const ClearLinkOnDelete = Extension.create({
  name: "clearLinkOnDelete",

  priority: 1000,

  addKeyboardShortcuts() {
    return {
      Backspace: () => {
        const { state, view } = this.editor;
        const linkType = state.schema.marks.link;

        if (!linkType) {
          return false;
        }

        const transaction =
          deleteLinkedSelection(state, linkType) ??
          deleteLastLinkedCharacterBackward(state, linkType);

        if (!transaction) {
          return false;
        }

        view.dispatch(transaction);

        return true;
      },

      Delete: () => {
        const { state, view } = this.editor;
        const linkType = state.schema.marks.link;

        if (!linkType) {
          return false;
        }

        const transaction =
          deleteLinkedSelection(state, linkType) ??
          deleteLastLinkedCharacterForward(state, linkType);

        if (!transaction) {
          return false;
        }

        view.dispatch(transaction);

        return true;
      },
    };
  },
});