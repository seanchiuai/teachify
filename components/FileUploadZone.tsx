"use client";

import { useCallback, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { FileText, Check, Upload, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  const hasAcceptedExt = ACCEPTED_EXTENSIONS.some(ext => nameLower.includes(ext));
  const validMime = ACCEPTED_TYPES.includes(file.type);
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
      data-active={dragActive}
      className="upload-zone"
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
            <div className="w-14 h-14 mx-auto rounded-xl bg-highlight-yellow/20 flex items-center justify-center animate-bounce-subtle">
              <Upload className="w-7 h-7 text-paper-600" />
            </div>
            <p className="text-sm font-medium text-paper-700">Processing {fileName}...</p>
          </div>
        ) : fileName ? (
          <div className="space-y-3">
            <div className="w-14 h-14 mx-auto rounded-xl bg-highlight-green/20 flex items-center justify-center">
              <Check className="w-7 h-7 text-green-600" />
            </div>
            <p className="text-sm font-medium text-green-700">{fileName}</p>
            <p className="text-xs text-paper-400">Drop another file to replace</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`
              w-16 h-16 mx-auto rounded-xl flex items-center justify-center
              transition-all duration-200
              ${dragActive
                ? "bg-highlight-yellow/30 scale-110"
                : "bg-paper-100"
              }
            `}>
              <FileText className="w-8 h-8 text-paper-400" />
            </div>
            <div>
              <p className="font-medium text-paper-700">
                Drop your file here
              </p>
              <p className="text-sm text-paper-400 mt-1">
                or <span className="text-highlight-purple font-medium">browse</span> to upload
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <Badge variant="blue">PDF</Badge>
              <Badge variant="yellow">PPTX</Badge>
              <Badge variant="green">DOCX</Badge>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-center justify-center gap-2 text-highlight-pink animate-scale-in">
          <AlertCircle className="w-4 h-4" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
    </div>
  );
}

async function extractText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const nameLower = file.name.toLowerCase();

  const isPagesFile = nameLower.includes(".pages");
  const isPdfFile = nameLower.endsWith(".pdf") || file.type === "application/pdf";
  const isDocxFile = nameLower.endsWith(".docx") || file.type.includes("wordprocessingml");
  const isPptxFile = nameLower.endsWith(".pptx") || file.type.includes("presentationml");

  // PDF handling
  if (isPdfFile) {
    try {
      const pdfjsLib = await import("pdfjs-dist");
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

  // Apple Pages handling
  if (isPagesFile) {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(buffer);
    const allPaths = Object.keys(zip.files);

    // Try ALL PDF files in archive
    const pdfFiles = allPaths.filter(p => p.toLowerCase().endsWith(".pdf") && !zip.files[p].dir);
    for (const pdfPath of pdfFiles) {
      try {
        const pdfBuffer = await zip.files[pdfPath].async("arraybuffer");
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
        if (parts.length > 0) return parts.join("\n\n");
      } catch {
        // Continue to next method
      }
    }

    // Try text files
    const textParts: string[] = [];
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

    throw new Error("Could not extract text from .pages file. Try a different file format.");
  }

  throw new Error("Unsupported file type");
}
