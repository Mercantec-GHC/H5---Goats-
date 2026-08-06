"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";

import styles from "./NoteEditor.module.css";

type Props = {
  editor: Editor;
};

type Position = {
  top: number;
  left: number;
};

export default function TableBubbleToolbar({ editor }: Props) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [, forceRender] = useState(0);

  useEffect(() => {
    const updatePosition = () => {
      if (editor.isDestroyed || !editor.isActive("table")) {
        setPosition(null);
        return;
      }

      const { from } = editor.state.selection;
      const domAtPosition = editor.view.domAtPos(from).node;

      const element =
        domAtPosition instanceof HTMLElement
          ? domAtPosition
          : domAtPosition.parentElement;

      const table = element?.closest("table");

      if (!table) {
        setPosition(null);
        return;
      }

      const tableRect = table.getBoundingClientRect();
      const toolbarWidth = toolbarRef.current?.offsetWidth ?? 118;
      const toolbarGap = 8;

      let left = tableRect.left - toolbarWidth - toolbarGap;

      if (left < toolbarGap) {
        left = tableRect.right + toolbarGap;
      }

      setPosition({
        top: tableRect.top,
        left,
      });

      // Opdatér disabled/active state på knapperne.
      forceRender((value) => value + 1);
    };

    updatePosition();

    editor.on("selectionUpdate", updatePosition);
    editor.on("transaction", updatePosition);

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      editor.off("selectionUpdate", updatePosition);
      editor.off("transaction", updatePosition);

      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [editor]);

  useEffect(() => {
    if (!position || !toolbarRef.current || editor.isDestroyed) {
      return;
    }

    const { from } = editor.state.selection;
    const domAtPosition = editor.view.domAtPos(from).node;

    const element =
      domAtPosition instanceof HTMLElement
        ? domAtPosition
        : domAtPosition.parentElement;

    const table = element?.closest("table");

    if (!table) {
      return;
    }

    const tableRect = table.getBoundingClientRect();
    const toolbarWidth = toolbarRef.current.offsetWidth;
    const toolbarGap = 8;

    let left = tableRect.left - toolbarWidth - toolbarGap;

    if (left < toolbarGap) {
      left = tableRect.right + toolbarGap;
    }

    setPosition({
      top: tableRect.top,
      left,
    });
  }, [editor, position?.top]);

  if (!position || editor.isDestroyed) {
    return null;
  }

  const runCommand = (command: () => boolean) => {
    if (editor.isDestroyed) {
      return;
    }

    command();
  };

  const canAddRow = editor.can().addRowAfter();
  const canDeleteRow = editor.can().deleteRow();

  const canAddColumn = editor.can().addColumnAfter();
  const canDeleteColumn = editor.can().deleteColumn();

  const canMergeCells = editor.can().mergeCells();
  const canSplitCell = editor.can().splitCell();

  const canToggleHeaderRow = editor.can().toggleHeaderRow();
  const canToggleHeaderColumn = editor.can().toggleHeaderColumn();

  return (
    <div
      ref={toolbarRef}
      className={styles.tableFloatingToolbar}
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        zIndex: 1000,
      }}
    >
      <div className={styles.tableToolbarGroup}>
        <span className={styles.tableToolbarLabel}>Rows</span>

        <button
          type="button"
          className={styles.tableActionButton}
          disabled={!canAddRow}
          onMouseDown={(event) => {
            event.preventDefault();

            runCommand(() => editor.chain().focus().addRowAfter().run());
          }}
        >
          + Row
        </button>

        <button
          type="button"
          className={styles.tableActionButton}
          disabled={!canDeleteRow}
          onMouseDown={(event) => {
            event.preventDefault();

            runCommand(() => editor.chain().focus().deleteRow().run());
          }}
        >
          − Row
        </button>
      </div>

      <div className={styles.tableToolbarDivider} />

      <div className={styles.tableToolbarGroup}>
        <span className={styles.tableToolbarLabel}>Columns</span>

        <button
          type="button"
          className={styles.tableActionButton}
          disabled={!canAddColumn}
          onMouseDown={(event) => {
            event.preventDefault();

            runCommand(() => editor.chain().focus().addColumnAfter().run());
          }}
        >
          + Column
        </button>

        <button
          type="button"
          className={styles.tableActionButton}
          disabled={!canDeleteColumn}
          onMouseDown={(event) => {
            event.preventDefault();

            runCommand(() => editor.chain().focus().deleteColumn().run());
          }}
        >
          − Column
        </button>
      </div>

      <div className={styles.tableToolbarDivider} />

      <div className={styles.tableToolbarGroup}>
        <span className={styles.tableToolbarLabel}>Cells</span>

        <button
          type="button"
          className={styles.tableActionButton}
          disabled={!canMergeCells}
          onMouseDown={(event) => {
            event.preventDefault();

            runCommand(() => editor.chain().focus().mergeCells().run());
          }}
        >
          Merge cells
        </button>

        <button
          type="button"
          className={styles.tableActionButton}
          disabled={!canSplitCell}
          onMouseDown={(event) => {
            event.preventDefault();

            runCommand(() => editor.chain().focus().splitCell().run());
          }}
        >
          Split cell
        </button>
      </div>

      <div className={styles.tableToolbarDivider} />

      <div className={styles.tableToolbarGroup}>
        <span className={styles.tableToolbarLabel}>Headers</span>

        <button
          type="button"
          className={styles.tableActionButton}
          disabled={!canToggleHeaderRow}
          onMouseDown={(event) => {
            event.preventDefault();

            runCommand(() => editor.chain().focus().toggleHeaderRow().run());
          }}
        >
          Header row
        </button>

        <button
          type="button"
          className={styles.tableActionButton}
          disabled={!canToggleHeaderColumn}
          onMouseDown={(event) => {
            event.preventDefault();

            runCommand(() => editor.chain().focus().toggleHeaderColumn().run());
          }}
        >
          Header column
        </button>
      </div>

      <div className={styles.tableToolbarDivider} />

      <button
        type="button"
        className={`${styles.tableActionButton} ${styles.deleteButton}`}
        onMouseDown={(event) => {
          event.preventDefault();

          runCommand(() => editor.chain().focus().deleteTable().run());
        }}
      >
        Delete table
      </button>
    </div>
  );
}
