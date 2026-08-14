import Image from "@tiptap/extension-image";

export type ImageAlignment = "left" | "center" | "right";

export const StudyHubImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),

      imageId: {
        default: null,

        parseHTML: (element) => element.getAttribute("data-image-id"),

        renderHTML: (attributes) => {
          if (!attributes.imageId) {
            return {};
          }

          return {
            "data-image-id": attributes.imageId,
          };
        },
      },

      alignment: {
        default: "center",

        parseHTML: (element) =>
          (element.getAttribute("data-alignment") as ImageAlignment | null) ??
          "center",

        renderHTML: (attributes) => ({
          "data-alignment": attributes.alignment ?? "center",
        }),
      },
    };
  },
}).configure({
  inline: false,
  allowBase64: false,

  resize: {
    enabled: true,

    directions: [
      "top-left",
      "top-right",
      "bottom-left",
      "bottom-right",
    ],

    minWidth: 100,
    minHeight: 60,

    alwaysPreserveAspectRatio: true,
  },
});