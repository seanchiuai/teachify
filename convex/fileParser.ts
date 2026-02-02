"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

type ZipObject = import("jszip").JSZipObject;

// Result type that includes both text and HTML with images
interface ParseResult {
  text: string;
  html?: string;
  images?: Array<{ id: string; contentType: string; data: string }>;
}

export const parseFile = action({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    console.log("parseFile called with storageId:", args.storageId);

    const blob = await ctx.storage.get(args.storageId);
    if (!blob) throw new Error("File not found in storage. Please try uploading again.");

    console.log("File retrieved, type:", blob.type, "size:", blob.size);

    const buffer = Buffer.from(await blob.arrayBuffer());
    const mime = (blob.type || "").toLowerCase();

    const looksLikePdf = buffer.slice(0, 4).toString() === "%PDF";
    const isZipMagic = buffer[0] === 0x50 && buffer[1] === 0x4b;
    const looksLikeHtml = buffer.slice(0, 100).toString().toLowerCase().includes("<!doctype html") ||
                          buffer.slice(0, 100).toString().toLowerCase().includes("<html");

    // --- Shared helpers --------------------------------------------------
    const withTimeout = <T>(promise: Promise<T>, ms: number, message: string): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error(message)), ms)
        ),
      ]);
    };

    const parsePdf = async (pdfBuffer: Buffer) => {
      console.log("Parsing PDF, buffer size:", pdfBuffer.length);
      const pdfParse = (await import("pdf-parse")).default;
      const data = await withTimeout(
        pdfParse(pdfBuffer),
        30000,
        "PDF parsing timed out after 30 seconds"
      );
      console.log("PDF parsed, text length:", data.text.length);
      return data.text.trim();
    };

    // Enhanced DOCX parsing with HTML output and embedded images
    const parseDocx = async (docBuffer: Buffer): Promise<ParseResult> => {
      const mammoth = (await import("mammoth")).default;
      const images: Array<{ id: string; contentType: string; data: string }> = [];
      let imageIndex = 0;

      // Custom image converter to embed images as base64 data URIs
      const imageConverter = mammoth.images.imgElement((image: any) => {
        return image.readAsBase64String().then((imageBuffer: string) => {
          const id = `img-${imageIndex++}`;
          images.push({
            id,
            contentType: image.contentType,
            data: imageBuffer,
          });
          return {
            src: `data:${image.contentType};base64,${imageBuffer}`,
            alt: `Image ${imageIndex}`,
          };
        });
      });

      // Get HTML with images
      const htmlResult = await mammoth.convertToHtml(
        { buffer: docBuffer },
        { convertImage: imageConverter }
      );

      // Also get raw text for AI processing
      const textResult = await mammoth.extractRawText({ buffer: docBuffer });

      return {
        text: textResult.value.trim(),
        html: htmlResult.value.trim(),
        images: images.length > 0 ? images : undefined,
      };
    };

    // ODT parsing using officeparser
    const parseOdt = async (odtBuffer: Buffer): Promise<string> => {
      const { OfficeParser } = await import("officeparser");
      const ast = await OfficeParser.parseOffice(odtBuffer);
      return ast.toText().trim();
    };

    // HTML file sanitization - removes scripts but preserves structure
    const parseHtml = (htmlBuffer: Buffer): ParseResult => {
      let html = htmlBuffer.toString("utf8");

      // Remove script tags and their content
      html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

      // Remove onclick, onerror, onload and other event handlers
      html = html.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "");
      html = html.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, "");

      // Remove javascript: URLs
      html = html.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');

      // Remove style tags (optional - keeps structure cleaner)
      html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

      // Extract text content for AI processing
      const textOnly = html
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, " ")
        .trim();

      return {
        text: textOnly,
        html: html.trim(),
      };
    };

    // Markdown to HTML conversion
    const parseMarkdown = (mdBuffer: Buffer): ParseResult => {
      const md = mdBuffer.toString("utf8");

      // Simple markdown to HTML conversion
      let html = md
        // Headers
        .replace(/^######\s+(.*)$/gm, "<h6>$1</h6>")
        .replace(/^#####\s+(.*)$/gm, "<h5>$1</h5>")
        .replace(/^####\s+(.*)$/gm, "<h4>$1</h4>")
        .replace(/^###\s+(.*)$/gm, "<h3>$1</h3>")
        .replace(/^##\s+(.*)$/gm, "<h2>$1</h2>")
        .replace(/^#\s+(.*)$/gm, "<h1>$1</h1>")
        // Bold and italic
        .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/___(.+?)___/g, "<strong><em>$1</em></strong>")
        .replace(/__(.+?)__/g, "<strong>$1</strong>")
        .replace(/_(.+?)_/g, "<em>$1</em>")
        // Code blocks
        .replace(/```(\w*)\n([\s\S]*?)```/g, "<pre><code>$2</code></pre>")
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        // Lists (simple)
        .replace(/^\*\s+(.*)$/gm, "<li>$1</li>")
        .replace(/^-\s+(.*)$/gm, "<li>$1</li>")
        .replace(/^\d+\.\s+(.*)$/gm, "<li>$1</li>")
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
        // Images
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
        // Paragraphs (lines not already tagged)
        .replace(/^(?!<[hluop]|<li|<pre|<code)(.+)$/gm, "<p>$1</p>")
        // Clean up empty paragraphs
        .replace(/<p>\s*<\/p>/g, "");

      return {
        text: md.trim(),
        html: html.trim(),
      };
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

    // Clean iWork protobuf text by removing styling garbage
    const cleanIWorkText = (text: string): string => {
      // Known font names and style markers to remove
      const noisePatterns = [
        /TimesNewRomanPS(MT)?/gi,
        /ArialMT?/gi,
        /Helvetica/gi,
        /CourierNew/gi,
        /\b(header|footer|label|body|cell|row|column|style|Level\d+|Row|Column)\w*\b/gi,
        /\b(Mf|BY|Bz|Yr|FV|BD|XN|MB|fY|pA|Ae|EY|VZ|ZW)\b/g,
        /\bfffj\b/gi,
        /\b[A-Z][a-z]?[A-Z][a-z]?\b/g, // CamelCase fragments like "Highb", "Lowb"
        /\b[vrnijzfx]{1,3}\b/gi, // Random single/double letters
        /\s[A-Za-z]{1,2}\s/g, // Single/double letter words
        /[^a-zA-Z0-9\s.,!?'-]/g, // Non-text characters
      ];

      let cleaned = text;
      for (const pattern of noisePatterns) {
        cleaned = cleaned.replace(pattern, " ");
      }

      // Remove repeated words
      cleaned = cleaned.replace(/\b(\w+)(\s+\1)+\b/gi, "$1");

      // Clean up whitespace
      cleaned = cleaned.replace(/\s+/g, " ").trim();

      // Remove very short "sentences" (less than 20 chars between periods)
      cleaned = cleaned.replace(/\.\s*[^.]{1,20}\s*\./g, ". ");

      return cleaned;
    };

    // Extract readable sentences from garbled protobuf text
    const extractSentences = (text: string): string => {
      // First clean the text
      const cleaned = cleanIWorkText(text);

      // Find sequences of words that form readable sentences (5+ words of 3+ chars each)
      const sentencePattern = /(?:[A-Za-z]{3,}\s+){4,}[A-Za-z]{3,}/g;
      const matches = cleaned.match(sentencePattern) || [];

      // Join and deduplicate
      const seen = new Set<string>();
      const unique = matches.filter(m => {
        const normalized = m.toLowerCase().trim();
        if (seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
      });

      return unique.join(". ").replace(/\s+/g, " ").trim();
    };

    // --- Routing logic ---------------------------------------------------
    // PDF files
    if (mime.includes("pdf") || looksLikePdf) {
      try {
        return await parsePdf(buffer);
      } catch (e) {
        throw new Error("Failed to parse PDF. The file may be corrupted or password-protected.");
      }
    }

    // HTML files (check before text/* since text/html is a subtype)
    if (mime.includes("text/html") || mime.includes("application/xhtml") || looksLikeHtml) {
      const result = parseHtml(buffer);
      return result.text;
    }

    // Markdown files
    if (mime.includes("text/markdown") || mime.includes("text/x-markdown")) {
      const result = parseMarkdown(buffer);
      return result.text;
    }

    // Word documents (DOCX)
    if (mime.includes("wordprocessingml")) {
      try {
        const result = await parseDocx(buffer);
        return result.text;
      } catch (e) {
        throw new Error("Failed to parse Word document. The file may be corrupted.");
      }
    }

    // PowerPoint presentations
    if (mime.includes("presentationml")) {
      try {
        return await parsePptx(buffer);
      } catch (e) {
        throw new Error("Failed to parse PowerPoint file. The file may be corrupted.");
      }
    }

    // OpenDocument Text (ODT)
    if (mime.includes("opendocument.text") || mime.includes("application/vnd.oasis.opendocument.text")) {
      try {
        return await parseOdt(buffer);
      } catch (e) {
        throw new Error("Failed to parse ODT file. The file may be corrupted or in an unsupported format.");
      }
    }

    // RTF files
    if (mime.includes("rtf")) {
      return stripRtf(parsePlain(buffer));
    }

    // Plain text files (including .txt)
    if (mime.startsWith("text/")) {
      return parsePlain(buffer);
    }

    // ZIP-based format detection (fallback for files with incorrect MIME types)
    if (isZipMagic) {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(buffer);
      const paths = Object.keys(zip.files);

      // DOCX detection
      if (paths.some((p) => p.startsWith("word/"))) {
        try {
          const result = await parseDocx(buffer);
          return result.text;
        } catch (e) {
          throw new Error("Failed to parse Word document. The file may be corrupted.");
        }
      }

      // PPTX detection
      if (paths.some((p) => p.startsWith("ppt/"))) {
        try {
          return await parsePptx(buffer, zip);
        } catch (e) {
          throw new Error("Failed to parse PowerPoint file. The file may be corrupted.");
        }
      }

      // ODT detection (OpenDocument)
      if (paths.some((p) => p === "content.xml" || p === "mimetype")) {
        try {
          return await parseOdt(buffer);
        } catch (e) {
          throw new Error("Failed to parse OpenDocument file. Try exporting as PDF or DOCX.");
        }
      }

    }

    // Unsupported file type - provide helpful guidance
    throw new Error(
      "Unsupported file format. Please upload one of: PDF, DOCX, PPTX, ODT, HTML, Markdown, TXT, or RTF."
    );
  },
});
