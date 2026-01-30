"use client";

import { useCallback, useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

const ACCEPTED_TYPES: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
};
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function FileUploadZone({
  onContentExtracted,
  onFileUploaded,
}: {
  onContentExtracted: (content: string) => void;
  onFileUploaded?: (storageId: Id<"_storage">, fileName: string) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const parseFile = useAction(api.fileParser.parseFile);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setFileName(null);

      if (!Object.keys(ACCEPTED_TYPES).includes(file.type)) {
        setError("Unsupported file type. Please upload PDF, PPTX, or DOCX.");
        return;
      }
      if (file.size > MAX_SIZE) {
        setError("File too large. Maximum size is 10MB.");
        return;
      }

      setUploading(true);
      try {
        // Step 1: Get presigned upload URL
        const url = await generateUploadUrl();
        // Step 2: POST file to URL
        const result = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        // Step 3: Extract storageId
        const { storageId } = await result.json();
        setFileName(file.name);
        setUploading(false);
        onFileUploaded?.(storageId, file.name);

        // Step 4: Parse file content
        setParsing(true);
        const content = await parseFile({ storageId });
        onContentExtracted(content);
      } catch {
        setError("Upload failed. Please try again.");
      } finally {
        setUploading(false);
        setParsing(false);
      }
    },
    [generateUploadUrl, parseFile, onContentExtracted, onFileUploaded]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
        isDragging ? "border-primary bg-primary/5" : "border-border"
      }`}
    >
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          <p className="text-muted-foreground">Uploading...</p>
        </div>
      ) : parsing ? (
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          <p className="text-muted-foreground">Extracting content from {fileName}...</p>
        </div>
      ) : fileName ? (
        <div className="flex flex-col items-center gap-2">
          <span className="text-2xl">&#x2705;</span>
          <p className="text-lg font-medium">{fileName}</p>
          <p className="text-sm text-muted-foreground">Content extracted successfully</p>
          <label
            htmlFor="file-input"
            className="mt-2 inline-block cursor-pointer text-primary underline text-sm"
          >
            Upload a different file
          </label>
        </div>
      ) : (
        <>
          <p className="text-lg font-medium">Drag &amp; drop your lesson materials here</p>
          <p className="text-muted-foreground mt-1">PDF, PPTX, DOCX</p>
          <label
            htmlFor="file-input"
            className="mt-4 inline-block cursor-pointer text-primary underline"
          >
            or click to browse
          </label>
        </>
      )}
      <input
        type="file"
        accept=".pdf,.pptx,.docx"
        className="hidden"
        id="file-input"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      {error && <p className="text-destructive mt-4 text-sm">{error}</p>}
    </div>
  );
}
