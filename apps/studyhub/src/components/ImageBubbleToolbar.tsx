"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import {
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignHorizontalJustifyStart,
  Trash2,
} from "lucide-react";

import styles from "./NoteEditor.module.css";

type Props = {
  editor: Editor;
};

type Position = {
  top: number;
  left: number;
};

type ImageAlignment = "left" | "center" | "right";

export default function ImageBubbleToolbar({ editor }: Props) {
  const toolbarRef = useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState<Position | null>(null);
  const [alignment, setAlignmentState] = useState<ImageAlignment>("center");

  useEffect(() => {
    const updateToolbar = () => {
      if (editor.isDestroyed) {
        setPosition(null);
        return;
      }

      const { selection } = editor.state;

      if (
        !(selection instanceof NodeSelection) ||
        selection.node.type.name !== "image"
      ) {
        setPosition(null);
        return;
      }

      const nodeDom = editor.view.nodeDOM(selection.from);

      if (!(nodeDom instanceof HTMLElement)) {
        setPosition(null);
        return;
      }

      const image =
        nodeDom instanceof HTMLImageElement
          ? nodeDom
          : nodeDom.querySelector("img");

      if (!(image instanceof HTMLImageElement)) {
        setPosition(null);
        return;
      }

      const rect = image.getBoundingClientRect();

      const toolbarWidth = toolbarRef.current?.offsetWidth ?? 150;

      const toolbarHeight = toolbarRef.current?.offsetHeight ?? 38;

      const gap = 8;

      let left = rect.right - toolbarWidth;
      let top = rect.top - toolbarHeight - gap;

      left = Math.max(8, Math.min(left, window.innerWidth - toolbarWidth - 8));

      if (top < 8) {
        top = rect.bottom + gap;
      }

      setPosition({
        top,
        left,
      });

      setAlignmentState(
        (selection.node.attrs.alignment as ImageAlignment | undefined) ??
          "center",
      );
    };

    updateToolbar();

    editor.on("selectionUpdate", updateToolbar);
    editor.on("transaction", updateToolbar);

    window.addEventListener("resize", updateToolbar);
    window.addEventListener("scroll", updateToolbar, true);

    return () => {
      editor.off("selectionUpdate", updateToolbar);
      editor.off("transaction", updateToolbar);

      window.removeEventListener("resize", updateToolbar);
      window.removeEventListener("scroll", updateToolbar, true);
    };
  }, [editor]);

  if (!position) {
    return null;
  }

  const setAlignment = (value: ImageAlignment) => {
    if (editor.isDestroyed) {
      return;
    }

    editor
      .chain()
      .focus()
      .updateAttributes("image", {
        alignment: value,
      })
      .run();

    setAlignmentState(value);
  };

  const deleteImage = () => {
    if (editor.isDestroyed) {
      return;
    }

    const { selection } = editor.state;

    if (
      !(selection instanceof NodeSelection) ||
      selection.node.type.name !== "image"
    ) {
      return;
    }

    /*
     * Kun editor-dokumentet ændres her.
     *
     * NoteEditor observerer ændringen og sørger selv for:
     *
     * image forsvinder
     * -> DELETE /api/note-images/:id
     * -> deletedAt sættes
     *
     * Undo
     * -> PATCH
     * -> deletedAt nulstilles
     */
    editor.chain().focus().deleteSelection().run();
  };

  const buttonClass = (active: boolean) =>
    active ? styles.activeButton : styles.toolbarButton;

  return (
    <div
      ref={toolbarRef}
      className={styles.imageFloatingToolbar}
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        zIndex: 1000,
      }}
    >
      <button
        type="button"
        className={buttonClass(alignment === "left")}
        onMouseDown={(event) => {
          event.preventDefault();
          setAlignment("left");
        }}
        aria-label="Align image left"
        title="Align left"
      >
        <AlignHorizontalJustifyStart size={17} />
      </button>

      <button
        type="button"
        className={buttonClass(alignment === "center")}
        onMouseDown={(event) => {
          event.preventDefault();
          setAlignment("center");
        }}
        aria-label="Center image"
        title="Center"
      >
        <AlignHorizontalJustifyCenter size={17} />
      </button>

      <button
        type="button"
        className={buttonClass(alignment === "right")}
        onMouseDown={(event) => {
          event.preventDefault();
          setAlignment("right");
        }}
        aria-label="Align image right"
        title="Align right"
      >
        <AlignHorizontalJustifyEnd size={17} />
      </button>

      <span className={styles.separator} />

      <button
        type="button"
        className={`${styles.toolbarButton} ${styles.imageDeleteButton}`}
        onMouseDown={(event) => {
          event.preventDefault();
          deleteImage();
        }}
        aria-label="Delete image"
        title="Delete image"
      >
        <Trash2 size={17} />
      </button>
    </div>
  );
}
