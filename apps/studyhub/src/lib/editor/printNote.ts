import type { Editor } from "@tiptap/react";

export function printNote(editor: Editor) {
  if (editor.isDestroyed) {
    return;
  }

  const printWindow = window.open("", "_blank", "width=900,height=700");

  if (!printWindow) {
    window.alert(
      "Browseren blokerede printvinduet. Tillad popups og prøv igen.",
    );
    return;
  }

  const documentHtml = editor.getHTML();

  printWindow.document.open();

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="da">
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />

        <title>StudyHub-note</title>

        <style>
          @page {
            size: A4;
            margin: 20mm;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            color: #111827;
            background: #ffffff;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 11pt;
            line-height: 1.6;
          }

          h1 {
            margin: 0 0 16px;
            font-size: 24pt;
            line-height: 1.2;
          }

          h2 {
            margin: 24px 0 10px;
            font-size: 18pt;
            line-height: 1.3;
          }

          h3 {
            margin: 20px 0 8px;
            font-size: 14pt;
            line-height: 1.3;
          }

          p {
            margin: 0 0 10px;
          }

          ul,
          ol {
            margin: 8px 0 12px;
            padding-left: 24px;
          }

          li {
            margin: 3px 0;
          }

          a {
            color: #2563eb;
            text-decoration: underline;
          }

          mark {
            color: inherit;
            background: #fef08a;
            padding: 0 2px;
            border-radius: 2px;
          }

          blockquote {
            margin: 16px 0;
            padding-left: 14px;
            color: #4b5563;
            border-left: 3px solid #d1d5db;
          }

          pre {
            overflow-wrap: anywhere;
            white-space: pre-wrap;
            padding: 12px;
            background: #f3f4f6;
            border-radius: 6px;
          }

          code {
            font-family: "SFMono-Regular", Consolas, monospace;
          }

          hr {
            margin: 24px 0;
            border: 0;
            border-top: 1px solid #d1d5db;
          }

          img {
            display: block;
            max-width: 100%;
            height: auto;
            margin: 16px auto;
            break-inside: avoid;
          }

          table {
            width: 100%;
            margin: 16px 0;
            border-collapse: collapse;
            table-layout: fixed;
          }

          th,
          td {
            padding: 8px 10px;
            border: 1px solid #9ca3af;
            text-align: left;
            vertical-align: top;
            overflow-wrap: anywhere;
          }

          th {
            background: #f3f4f6;
            font-weight: 600;
          }

          th p,
          td p {
            margin: 0;
          }

          th ul,
          th ol,
          td ul,
          td ol {
            margin: 0;
            padding-left: 20px;
          }

          table,
          blockquote,
          pre,
          img {
            break-inside: avoid;
          }

          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }

            a {
              color: inherit;
            }
          }
        </style>
      </head>

      <body>
        <main>
          ${documentHtml}
        </main>
      </body>
    </html>
  `);

  printWindow.document.close();

  printWindow.addEventListener(
    "load",
    () => {
      printWindow.focus();
      printWindow.print();
    },
    { once: true },
  );
}