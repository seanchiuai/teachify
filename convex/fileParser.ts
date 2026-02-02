"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

type ZipObject = import("jszip").JSZipObject;

export const parseFile = action({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const blob = await ctx.storage.get(args.storageId);
    if (!blob) throw new Error("File not found");

    const buffer = Buffer.from(await blob.arrayBuffer());
    const mime = (blob.type || "").toLowerCase();

    const looksLikePdf = buffer.slice(0, 4).toString() === "%PDF";
    const isZipMagic = buffer[0] === 0x50 && buffer[1] === 0x4b;

    // --- Shared helpers --------------------------------------------------
    const parsePdf = async (pdfBuffer: Buffer) => {
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(pdfBuffer);
      return data.text.trim();
    };

    const parseDocx = async (docBuffer: Buffer) => {
      const mammoth = (await import("mammoth")).default;
      const result = await mammoth.extractRawText({ buffer: docBuffer });
      return result.value.trim();
    };

    const parsePlain = (buf: Buffer) => buf.toString("utf8").trim();

    const stripRtf = (raw: string) => {
      if (!raw.trim().startsWith("{\\rtf")) return raw.trim();
      let text = raw.replace(/\\par[d]?/g, "\n");
      text = text.replace(/\\'([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
      text = text.replace(/\\[a-zA-Z]+-?\\d* ?/g, "");
      text = text.replace(/[{}]/g, "");
      text = text.replace(/\n{3,}/g, "\n\n");
      return text.trim();
    };

    const normalizeText = (text: string) => text.replace(/\s+/g, " ").trim();

    const filterMeaningfulStrings = (parts: string[]) => {
      const seen = new Set<string>();
      return parts
        .map((p) => normalizeText(p))
        .filter((p) => {
          if (!p || seen.has(p)) return false;
          seen.add(p);
          const wordCount = p.split(/\s+/).length;
          const alphaRatio = (p.match(/[a-zA-Z]/g)?.length || 0) / p.length;
          const hasSentencePunc = /[.?!]/.test(p);
          const hasSpace = p.includes(" ");
          const hasLower = /[a-z]/.test(p);
          const looksLikeStyle = /^[A-Za-z0-9._-]+$/.test(p);
          return (
            p.length >= 25 &&
            wordCount >= 5 &&
            alphaRatio >= 0.55 &&
            hasSpace &&
            hasLower &&
            !looksLikeStyle &&
            (hasSentencePunc || wordCount >= 8)
          );
        });
    };

    const extractTextFromXml = (xml: string) => {
      const withoutTags = xml.replace(/<[^>]+>/g, " ");
      return normalizeText(
        withoutTags
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, "\"")
          .replace(/&#39;/g, "'")
      );
    };

    const parsePptx = async (pptBuffer: Buffer, zipFromCaller?: any) => {
      const JSZip = (await import("jszip")).default;
      const zip = zipFromCaller ?? (await JSZip.loadAsync(pptBuffer));
      const texts: string[] = [];

      for (const [path, file] of Object.entries(zip.files)) {
        if (!path.startsWith("ppt/") || !path.endsWith(".xml")) continue;
        const content = await (file as { async: (type: string) => Promise<string> }).async("text");
        const cleaned = extractTextFromXml(content);
        if (cleaned) texts.push(cleaned);
      }

      return normalizeText(texts.join(" "));
    };

    const extractProtobufText = (data: Uint8Array) => {
      let raw = "";
      for (let i = 0; i < data.length; i++) {
        const byte = data[i];
        if (byte >= 32 && byte <= 126) raw += String.fromCharCode(byte);
        else if (byte === 10 || byte === 13) raw += "\n";
        else raw += "\x00";
      }

      let cleaned = raw.replace(/\x00+/g, " ");
      cleaned = cleaned.replace(/\s[^a-zA-Z\s]{1,2}\s/g, " ");
      cleaned = cleaned.replace(/\s[^a-zA-Z\s]([A-Za-z])/g, " $1");
      cleaned = cleaned.replace(/([a-zA-Z])[^a-zA-Z\s]{1,2}\s/g, "$1 ");
      cleaned = cleaned.replace(/\s+/g, " ");
      cleaned = cleaned.replace(/\s[a-zA-Z]{1,2}\s/g, " ");
      return cleaned.trim();
    };

    const parseIWork = async (zip: any) => {
      const paths = Object.keys(zip.files);

      // 1) Prefer embedded/previews as PDF (most reliable text)
      const pdfPaths = paths.filter((p) => p.toLowerCase().endsWith(".pdf") && !zip.files[p].dir);
      for (const pdfPath of pdfPaths) {
        try {
          const pdfBuffer = await zip.files[pdfPath].async("nodebuffer");
          const text = await parsePdf(pdfBuffer);
          if (text && text.length > 30) return text;
        } catch {
          // try next candidate
        }
      }

      // 2) Newer iWork files bundle Index.zip containing .iwa protobufs
      const indexZipPath = paths.find((p) => p.toLowerCase().endsWith("index.zip"));
      if (indexZipPath) {
        try {
          const JSZip = (await import("jszip")).default;
          const innerZip = await JSZip.loadAsync(await zip.files[indexZipPath].async("nodebuffer"));
          const innerPdf = Object.keys(innerZip.files).find(
            (p) => p.toLowerCase().endsWith(".pdf") && !innerZip.files[p].dir
          );
          if (innerPdf) {
            try {
              const pdfBuffer = await innerZip.files[innerPdf].async("nodebuffer");
              const text = await parsePdf(pdfBuffer);
              if (text && text.length > 30) return text;
            } catch {
              // continue to iwa parsing
            }
          }
          const iwaFiles = Object.keys(innerZip.files)
            .filter((p) => p.toLowerCase().endsWith(".iwa"))
            .sort((a, b) => (a.toLowerCase().includes("document") ? -1 : b.toLowerCase().includes("document") ? 1 : 0));

          const strings: string[] = [];
          const { parseIwa } = await import("keynote-parser2");

          const visit = (val: any) => {
            if (!val) return;
            if (typeof val === "string") {
              const normalized = normalizeText(val);
              if (normalized.length > 0) strings.push(normalized);
              return;
            }
            if (Array.isArray(val)) {
              val.forEach(visit);
              return;
            }
            if (typeof val === "object") {
              for (const v of Object.values(val)) visit(v);
            }
          };

          for (const iwaPath of iwaFiles) {
            try {
              const data = await innerZip.files[iwaPath].async("uint8array");
              try {
                const parsed = parseIwa(Buffer.from(data));
                visit(parsed);
              } catch {
                const fallback = extractProtobufText(data);
                if (fallback.length > 0) strings.push(fallback);
              }
            } catch {
              // ignore and continue
            }
          }

          const filtered = filterMeaningfulStrings(strings);
          const merged = normalizeText(filtered.join(" "));
          if (merged.length > 0) return merged;
        } catch {
          // fallback to other methods
        }
      }

      // 3) Legacy iWork files ship index.apxl XML
      const apxlPath = paths.find((p) => p.toLowerCase().endsWith("index.apxl"));
      if (apxlPath) {
        const xml = await zip.files[apxlPath].async("string");
        const text = xml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        if (text) return text;
      }

      // 4) Any other XML/TXT payloads as last resort
      for (const path of Object.keys(zip.files)) {
        const file = zip.files[path] as ZipObject;
        if (!file || file.dir) continue;
        const lower = path.toLowerCase();
        if (lower.endsWith(".txt")) {
          const txt = (await file.async("string")).trim();
          if (txt) return txt;
        }
        if (lower.endsWith(".xml")) {
          const xml = await file.async("string");
          const text = xml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
          if (text.length > 50) return text;
        }
      }

      throw new Error("Could not extract text from iWork archive");
    };

    // --- Routing logic ---------------------------------------------------
    if (mime.includes("pdf") || looksLikePdf) {
      return await parsePdf(buffer);
    }

    if (mime.includes("wordprocessingml")) {
      return await parseDocx(buffer);
    }

    if (mime.includes("presentationml")) {
      return await parsePptx(buffer);
    }

    if (mime.includes("rtf")) {
      return stripRtf(parsePlain(buffer));
    }

    if (mime.startsWith("text/")) {
      return parsePlain(buffer);
    }

    if (
      mime.includes("apple.pages") ||
      mime.includes("iwork-pages") ||
      mime.includes("apple.keynote") ||
      mime.includes("iwork-keynote")
    ) {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(buffer);
      return await parseIWork(zip);
    }

    if (isZipMagic) {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(buffer);
      const paths = Object.keys(zip.files);

      if (paths.some((p) => p.startsWith("word/"))) {
        return await parseDocx(buffer);
      }

      if (paths.some((p) => p.startsWith("ppt/"))) {
        return await parsePptx(buffer, zip);
      }

      if (paths.some((p) => p.toLowerCase().endsWith(".iwa") || p.toLowerCase().includes("index.zip") || p.toLowerCase().includes("index.apxl"))) {
        return await parseIWork(zip);
      }
    }

    throw new Error("Unsupported or unrecognized file type");
  },
});
