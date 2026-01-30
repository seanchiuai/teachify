"use client";

import { useCallback, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface FileUploadZoneProps {
  onContentExtracted: (text: string) => void;
  onFileUploaded: (storageId: Id<"_storage">) => void;
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
      setUploading(true);
      setFileName(file.name);

      try {
        // Get upload URL
        const uploadUrl = await generateUploadUrl();
        const uploadResult = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!uploadResult.ok) throw new Error("Upload failed");

        const { storageId } = await uploadResult.json();
        onFileUploaded(storageId);

        // Extract text client-side
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
        accept=".pdf,.pptx,.docx"
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
              <span className="text-2xl">✅</span>
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
              <span className="text-3xl">📄</span>
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

  if (file.type === "application/pdf") {
    // Use pdfjs-dist for client-side PDF parsing
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const textParts: string[] = [];
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ');
      textParts.push(pageText);
    }
    
    return textParts.join('\n\n');
  }

  if (
    file.type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return result.value;
  }

  if (
    file.type ===
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
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

  throw new Error("Unsupported file type");
}
