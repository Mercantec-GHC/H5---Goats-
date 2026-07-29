"use client";

import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { Bold, Italic, Strikethrough, Link2, Unlink } from "lucide-react";

import styles from "./NoteEditor.module.css";

type Props = {
  editor: Editor;
};

function normalizeUrl(value: string) {
  const url = value.trim();

  if (!url) {
    return "";
  }

  // Behold allerede gyldige protokoller og særlige links
  if (/^(https?:\/\/|mailto:|tel:)/i.test(url)) {
    return url;
  }

  // google.com bliver til https://google.com
  return `https://${url}`;
}

export default function BubbleToolbar({ editor }: Props) {
  const buttonClass = (active: boolean) =>
    active ? styles.activeButton : styles.toolbarButton;

  const setLink = () => {
    const currentHref =
      (editor.getAttributes("link").href as string | undefined) ?? "";

    const input = window.prompt("Enter URL", currentHref);

    if (input === null) {
      return;
    }

    const url = normalizeUrl(input);

    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    const { from, to, empty } = editor.state.selection;

    if (empty) {
      return;
    }

    editor
      .chain()
      .focus()
      .setLink({
        href: url,
        target: "_blank",
        rel: "noopener noreferrer",
      })
      .setTextSelection(to)
      .unsetMark("link")
      .run();
  };

  const removeLink = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
  };

  return (
    <BubbleMenu
      editor={editor}
      options={{
        placement: "top",
      }}
      shouldShow={({ editor, state }) => {
        const { from, to, empty } = state.selection;

        return (
          editor.isEditable && !empty && from !== to && editor.view.hasFocus()
        );
      }}
    >
      <div className={styles.bubbleToolbar}>
        <button
          type="button"
          className={buttonClass(editor.isActive("bold"))}
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-label="Bold"
          title="Bold"
        >
          <Bold size={16} />
        </button>

        <button
          type="button"
          className={buttonClass(editor.isActive("italic"))}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Italic"
          title="Italic"
        >
          <Italic size={16} />
        </button>

        <button
          type="button"
          className={buttonClass(editor.isActive("strike"))}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          aria-label="Strikethrough"
          title="Strikethrough"
        >
          <Strikethrough size={16} />
        </button>

        <span className={styles.separator} />

        <button
          type="button"
          className={buttonClass(editor.isActive("link"))}
          onClick={setLink}
          aria-label={editor.isActive("link") ? "Edit link" : "Add link"}
          title={editor.isActive("link") ? "Edit link" : "Add link"}
        >
          <Link2 size={16} />
        </button>

        {editor.isActive("link") && (
          <button
            type="button"
            className={styles.toolbarButton}
            onClick={removeLink}
            aria-label="Remove link"
            title="Remove link"
          >
            <Unlink size={16} />
          </button>
        )}
      </div>
    </BubbleMenu>
  );
}
