"use client";

import { useCallback, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { FileText, Check } from "lucide-react";

interface FileUploadZoneProps {
  onContentExtracted: (text: string) => void;
  onFileUploaded: (storageId: Id<"_storage">) => void;
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.apple.pages",
  "application/x-iwork-pages-sffpages",
];

const ACCEPTED_EXTENSIONS = [".pdf", ".pptx", ".docx", ".pages"];

function isAcceptedFile(file: File): boolean {
  const nameLower = file.name.toLowerCase();

  // Check if filename contains any accepted extension (handles .pages.zip case)
  const hasAcceptedExt = ACCEPTED_EXTENSIONS.some(ext => nameLower.includes(ext));

  // Check MIME type
  const validMime = ACCEPTED_TYPES.includes(file.type);

  // Accept .zip files that contain .pages in the name (macOS .pages files)
  const isPagesZip = (file.type === "application/zip" || nameLower.endsWith(".zip")) && nameLower.includes(".pages");

  return validMime || hasAcceptedExt || isPagesZip;
}

export function FileUploadZone({
  onContentExtracted,
  onFileUploaded,
}: FileUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      if (!isAcceptedFile(file)) {
        setError("Unsupported file type");
        return;
      }

      setUploading(true);
      setFileName(file.name);

      try {
        const uploadUrl = await generateUploadUrl();
        const uploadResult = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });
        if (!uploadResult.ok) throw new Error("Upload failed");

        const { storageId } = await uploadResult.json();
        onFileUploaded(storageId);

        const fileContent = await extractText(file);
        onContentExtracted(fileContent);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to process file");
        setFileName(null);
      } finally {
        setUploading(false);
      }
    },
    [generateUploadUrl, onContentExtracted, onFileUploaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        relative rounded-2xl border-2 border-dashed p-8 text-center
        transition-all duration-300 cursor-pointer group
        ${dragActive
          ? "border-primary bg-primary/10 glow-primary"
          : "border-border/50 hover:border-primary/50 glass"
        }
      `}
    >
      <input
        type="file"
        accept=".pdf,.pptx,.docx,.pages,.zip,application/vnd.apple.pages,application/zip"
        onChange={handleInputChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />

      <div className="pointer-events-none">
        {uploading ? (
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
            <p className="text-sm font-medium text-primary">Processing {fileName}...</p>
          </div>
        ) : fileName ? (
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="w-6 h-6 text-green-400" />
            </div>
            <p className="text-sm font-medium text-green-400">{fileName}</p>
            <p className="text-xs text-muted-foreground">Drop another file to replace</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className={`
              w-16 h-16 mx-auto rounded-2xl flex items-center justify-center
              transition-all duration-300
              ${dragActive
                ? "bg-primary/30 scale-110"
                : "bg-muted group-hover:bg-primary/20"
              }
            `}>
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                Drop your file here
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or <span className="text-primary font-medium">browse</span> to upload
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <span className="px-3 py-1 text-xs rounded-full bg-primary/20 text-primary">PDF</span>
              <span className="px-3 py-1 text-xs rounded-full bg-accent/20 text-accent">PPTX</span>
              <span className="px-3 py-1 text-xs rounded-full bg-secondary/20 text-secondary">DOCX</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-4 text-sm text-destructive animate-scale-in">{error}</p>
      )}
    </div>
  );
}

async function extractText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const nameLower = file.name.toLowerCase();

  // Determine file type - check for .pages anywhere in name (handles .pages.zip)
  const isPagesFile = nameLower.includes(".pages");
  const isPdfFile = nameLower.endsWith(".pdf") || file.type === "application/pdf";
  const isDocxFile = nameLower.endsWith(".docx") || file.type.includes("wordprocessingml");
  const isPptxFile = nameLower.endsWith(".pptx") || file.type.includes("presentationml");

  // PDF handling
  if (isPdfFile) {
    try {
      const pdfjsLib = await import("pdfjs-dist");

      // Use legacy build for better compatibility
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(buffer),
        useSystemFonts: true,
      });

      const pdf = await loadingTask.promise;
      const textParts: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ");
        textParts.push(pageText);
      }

      return textParts.join("\n\n");
    } catch (pdfError) {
      console.error("PDF parsing error:", pdfError);
      throw new Error("Failed to parse PDF. Please try a different file.");
    }
  }

  // DOCX handling
  if (isDocxFile) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return result.value;
  }

  // PPTX handling
  if (isPptxFile) {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(buffer);
    const slideTexts: string[] = [];
    const slideFiles = Object.keys(zip.files).filter(
      (name) => name.startsWith("ppt/slides/slide") && name.endsWith(".xml")
    );
    slideFiles.sort();
    for (const slidePath of slideFiles) {
      const xml = await zip.files[slidePath].async("string");
      const textContent = xml
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      slideTexts.push(textContent);
    }
    return slideTexts.join("\n\n");
  }

  // Apple Pages handling (.pages files are ZIP archives, also handles .pages.zip)
  if (isPagesFile) {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(buffer);

    // Debug: log all files in archive
    const allPaths = Object.keys(zip.files);
    console.log("Pages ZIP contents:", allPaths);

    // Handle double-zipped .pages.zip files (ZIP containing .pages folder)
    const hasNestedStructure = allPaths.some(p => p.endsWith(".pages/") || p.match(/\.pages\/[^/]+$/));
    if (hasNestedStructure) {
      console.log("Detected nested .pages structure");
    }

    const textParts: string[] = [];

    // Helper to extract text from PDF buffer
    async function extractPdfText(pdfBuffer: ArrayBuffer): Promise<string[]> {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) }).promise;
      const parts: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
        if (pageText.trim()) parts.push(pageText);
      }
      return parts;
    }

    // Method 1: Try ALL PDF files in archive (case-insensitive search)
    const pdfFiles = allPaths.filter(p => p.toLowerCase().endsWith(".pdf") && !zip.files[p].dir);
    console.log("Found PDF files in archive:", pdfFiles);

    for (const pdfPath of pdfFiles) {
      try {
        console.log("Trying to extract from PDF:", pdfPath);
        const pdfBuffer = await zip.files[pdfPath].async("arraybuffer");
        const extracted = await extractPdfText(pdfBuffer);
        if (extracted.length > 0) {
          console.log("Successfully extracted text from:", pdfPath);
          return extracted.join("\n\n");
        }
      } catch (e) {
        console.log("PDF extraction failed for:", pdfPath, e);
      }
    }

    // Method 2: Try nested Index.zip (Pages Creator Studio / modern .pages)
    const indexZipPath = allPaths.find(p => p.toLowerCase().endsWith("index.zip"));
    if (indexZipPath) {
      try {
        console.log("Found nested Index.zip:", indexZipPath);
        const indexBuffer = await zip.files[indexZipPath].async("arraybuffer");
        const indexZip = await JSZip.loadAsync(indexBuffer);
        const indexPaths = Object.keys(indexZip.files);
        console.log("Index.zip contents:", indexPaths);

        // Helper: Extract and clean text from protobuf binary data
        function extractProtobufText(data: Uint8Array): string {
          // First pass: extract all printable characters, replacing control bytes with markers
          let raw = "";
          for (let i = 0; i < data.length; i++) {
            const byte = data[i];
            // Printable ASCII (space to tilde)
            if (byte >= 32 && byte <= 126) {
              raw += String.fromCharCode(byte);
            } else if (byte === 10 || byte === 13) {
              // Newlines
              raw += "\n";
            } else {
              // Control byte - use marker for later cleaning
              raw += "\x00";
            }
          }

          // Second pass: clean up the text
          // Replace sequences of markers with single space
          let cleaned = raw.replace(/\x00+/g, " ");
          // Remove garbage at word boundaries (single chars before/after spaces)
          cleaned = cleaned.replace(/\s[^a-zA-Z\s]{1,2}\s/g, " ");
          // Remove leading garbage from words (digit/symbol before letter)
          cleaned = cleaned.replace(/\s[^a-zA-Z\s]([A-Za-z])/g, " $1");
          // Remove trailing garbage from words
          cleaned = cleaned.replace(/([a-zA-Z])[^a-zA-Z\s]{1,2}\s/g, "$1 ");
          // Clean up multiple spaces
          cleaned = cleaned.replace(/\s+/g, " ");
          // Remove very short fragments
          cleaned = cleaned.replace(/\s[a-zA-Z]{1,2}\s/g, " ");

          return cleaned.trim();
        }

        // Helper: Split text into sentences and filter for quality
        function extractSentences(text: string): string[] {
          // Split on sentence boundaries
          const sentences = text.split(/(?<=[.!?])\s+/);

          return sentences.filter(s => {
            // Must be reasonably long
            if (s.length < 30) return false;
            // Must have multiple words
            const words = s.split(/\s+/);
            if (words.length < 5) return false;
            // Most characters should be alphanumeric or space
            const alphaCount = (s.match(/[a-zA-Z\s]/g) || []).length;
            if (alphaCount / s.length < 0.85) return false;
            // Should start with capital letter
            if (!s.match(/^[A-Z]/)) return false;
            return true;
          });
        }

        // Extract from .iwa files (Document.iwa typically has main content)
        const iwaFiles = indexPaths.filter(p => p.toLowerCase().endsWith(".iwa"));
        // Prioritize Document.iwa
        iwaFiles.sort((a, b) => {
          if (a.toLowerCase().includes("document")) return -1;
          if (b.toLowerCase().includes("document")) return 1;
          return 0;
        });
        console.log("Found .iwa files:", iwaFiles);

        let allText = "";
        for (const iwaPath of iwaFiles) {
          try {
            const iwaData = await indexZip.files[iwaPath].async("uint8array");
            const text = extractProtobufText(iwaData);
            if (text.length > 50) {
              allText += text + " ";
            }
          } catch (e) {
            console.log("Failed to process:", iwaPath, e);
          }
        }

        if (allText.length > 100) {
          // Extract clean sentences
          const sentences = extractSentences(allText);
          if (sentences.length > 0) {
            const result = sentences.join(" ");
            console.log(`Successfully extracted ${sentences.length} sentences from Index.zip`);
            return result;
          }

          // Fallback: return cleaned text even without sentence filtering
          console.log("Returning cleaned text without sentence filtering");
          return allText.trim();
        }
      } catch (e) {
        console.log("Index.zip extraction failed:", e);
      }
    }

    // Method 3: Try text files in archive
    for (const [path, zipEntry] of Object.entries(zip.files)) {
      if (path.toLowerCase().endsWith(".txt") && !zipEntry.dir) {
        try {
          const content = await zipEntry.async("string");
          if (content.trim()) textParts.push(content.trim());
        } catch {
          // Skip
        }
      }
    }
    if (textParts.length > 0) return textParts.join("\n\n");

    // Method 4: Try XML content (Pages '09 and earlier)
    for (const [path, zipEntry] of Object.entries(zip.files)) {
      if (path.toLowerCase().endsWith(".xml") && !zipEntry.dir) {
        try {
          const xml = await zipEntry.async("string");
          const textContent = xml
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
          if (textContent.length > 50) textParts.push(textContent);
        } catch {
          // Skip
        }
      }
    }
    if (textParts.length > 0) return textParts.join("\n\n");

    console.log("No extractable content found. Archive contents:", allPaths);
    throw new Error("Could not extract text from .pages file. Try a different file format.");
  }

  throw new Error("Unsupported file type");
}
