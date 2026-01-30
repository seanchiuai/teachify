"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

export const parseFile = action({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const blob = await ctx.storage.get(args.storageId);
    if (!blob) throw new Error("File not found");

    const buffer = Buffer.from(await blob.arrayBuffer());
    const type = blob.type;

    if (type === "application/pdf") {
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(buffer);
      return data.text;
    }

    if (type.includes("wordprocessingml")) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    if (type.includes("presentationml")) {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(buffer);
      const texts: string[] = [];

      for (const [path, file] of Object.entries(zip.files)) {
        if (path.startsWith("ppt/slides/slide") && path.endsWith(".xml")) {
          const content = await (file as { async: (type: string) => Promise<string> }).async("text");
          const matches = content.match(/<a:t>([^<]*)<\/a:t>/g);
          if (matches) {
            texts.push(matches.map((m: string) => m.replace(/<\/?a:t>/g, "")).join(" "));
          }
        }
      }
      return texts.join("\n\n");
    }

    throw new Error("Unsupported file type");
  },
});
