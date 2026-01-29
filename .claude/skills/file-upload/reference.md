# File Upload Reference

Code examples for file upload and parsing in LessonPlay.

## Drag-and-Drop Upload Component

```tsx
"use client";
import { useCallback, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

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
      // Step 1: Get presigned upload URL from Convex
      const url = await generateUploadUrl();
      // Step 2: POST file directly to that URL
      const result = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      // Step 3: Extract storageId from response
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
import { mutation } from "./_generated/server";

// Explicit args form (required by Convex for public mutations)
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
```

**From Convex docs:** `ctx.storage.generateUploadUrl()` returns a `Promise<string>` — a short-lived URL that accepts POST requests. The POST response is JSON containing `{ storageId: Id<"_storage"> }`.

## File Parsing Action

Convex actions can read file blobs from storage with `ctx.storage.get(storageId)`. This returns a `Blob | null`.

```typescript
// convex/files.ts
import { action } from "./_generated/server";
import { v } from "convex/values";

export const parseFile = action({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    // ctx.storage.get() returns Blob | null in actions
    const blob = await ctx.storage.get(args.storageId);
    if (!blob) throw new Error("File not found");

    const buffer = Buffer.from(await blob.arrayBuffer());
    const type = blob.type;

    if (type === "application/pdf") {
      // pdf-parse: npm install pdf-parse
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(buffer);
      return data.text;
    }

    if (type.includes("wordprocessingml")) {
      // mammoth: npm install mammoth
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    if (type.includes("presentationml")) {
      // jszip: npm install jszip
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(buffer);
      const texts: string[] = [];

      for (const [path, file] of Object.entries(zip.files)) {
        if (path.startsWith("ppt/slides/slide") && path.endsWith(".xml")) {
          const content = await (file as any).async("text");
          // Extract text between <a:t> tags (OOXML text runs)
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

**Note:** Convex actions run in a Node.js environment. Use dynamic `import()` instead of `require()` for ESM compatibility. Install parsing deps: `npm install pdf-parse mammoth jszip`.

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
