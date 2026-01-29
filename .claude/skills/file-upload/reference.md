# File Upload Reference

Code examples for file upload and parsing in LessonPlay.

## Drag-and-Drop Upload Component

```tsx
"use client";
import { useCallback, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const ACCEPTED_TYPES = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
};
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function FileUploadZone({
  onFileUploaded,
}: {
  onFileUploaded: (storageId: string, fileName: string) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
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
      const url = await generateUploadUrl();
      const result = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      onFileUploaded(storageId, file.name);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }, [generateUploadUrl, onFileUploaded]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
        isDragging ? "border-primary bg-primary/5" : "border-border"
      }`}
    >
      {uploading ? (
        <p>Uploading...</p>
      ) : (
        <>
          <p className="text-lg font-medium">Drag & drop your lesson materials here</p>
          <p className="text-muted-foreground mt-1">PDF, PPTX, DOCX</p>
          <input
            type="file"
            accept=".pdf,.pptx,.docx"
            className="hidden"
            id="file-input"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <label htmlFor="file-input" className="mt-4 inline-block cursor-pointer text-primary underline">
            or click to browse
          </label>
        </>
      )}
      {error && <p className="text-destructive mt-2 text-sm">{error}</p>}
    </div>
  );
}
```

## Convex File Storage Mutation

```typescript
// convex/files.ts
import { mutation, action } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});
```

## File Parsing Action

```typescript
// convex/files.ts
export const parseFile = action({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const blob = await ctx.storage.get(args.storageId);
    if (!blob) throw new Error("File not found");

    const buffer = await blob.arrayBuffer();
    const uint8 = new Uint8Array(buffer);

    // Detect type by checking file content
    const type = blob.type;

    if (type === "application/pdf") {
      const pdfParse = require("pdf-parse");
      const data = await pdfParse(Buffer.from(uint8));
      return data.text;
    }

    if (type.includes("wordprocessingml")) {
      const mammoth = require("mammoth");
      const result = await mammoth.extractRawText({ buffer: Buffer.from(uint8) });
      return result.value;
    }

    if (type.includes("presentationml")) {
      // PPTX parsing — extract text from slides
      const JSZip = require("jszip");
      const zip = await JSZip.loadAsync(uint8);
      const texts: string[] = [];

      for (const [path, file] of Object.entries(zip.files)) {
        if (path.startsWith("ppt/slides/slide") && path.endsWith(".xml")) {
          const content = await (file as any).async("text");
          // Extract text between <a:t> tags
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
```

## Text Input Fallback

```tsx
export function TextContentInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (text: string) => void;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Paste or type lesson content here..."
      className="w-full min-h-[160px] rounded-lg border border-border p-4 text-sm resize-y"
    />
  );
}
```
