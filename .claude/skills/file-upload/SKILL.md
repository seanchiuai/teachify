---
name: file-upload
description: File upload, parsing (PDF, PPTX, DOCX), and Convex storage for lesson materials
---

# File Upload

Handles uploading lesson materials and extracting text content for AI processing. Supports PDF, PPTX, DOCX file uploads via drag-and-drop, plus direct text paste as a fallback.

## Overview

- **Upload**: Drag-and-drop or click to select files
- **Storage**: Files stored in Convex file storage via presigned URL pattern
- **Parsing**: Extract text from PDF, PPTX, DOCX in a Convex action
- **Fallback**: Text paste/type for when file upload isn't needed

## When to Use This Skill

- Building the file upload UI component
- Implementing file parsing logic
- Setting up Convex file storage
- Handling file type validation and errors

## Key Concepts

### Supported Formats

| Format | Extension | Parsing Library |
|--------|-----------|----------------|
| PDF | .pdf | `pdf-parse` |
| PowerPoint | .pptx | `jszip` (extract XML text) |
| Word | .docx | `mammoth` |
| Plain text | .txt | N/A (direct read) |

### Upload Flow (Convex 3-Step Pattern)

1. Client calls `generateUploadUrl` mutation → gets short-lived presigned URL
2. Client POSTs file to that URL with `Content-Type` header → gets `{ storageId }` in response
3. Client passes `storageId` to a Convex action for parsing, or stores it in a document

**From Convex docs:** `ctx.storage.generateUploadUrl()` returns a `Promise<string>`. The POST response JSON contains `{ storageId: Id<"_storage"> }`.

### File Reading in Actions

- `ctx.storage.get(storageId)` returns `Blob | null` in actions
- `ctx.storage.getUrl(storageId)` returns `string | null` in queries/mutations (public URL)
- Use dynamic `import()` (not `require()`) for parsing libraries in Convex actions

### File Size Limits

- Max file: 10MB (reasonable for lesson materials)
- Client-side validation before upload attempt

## Related Files

- `convex/files.ts` — Upload URL generation, file parsing action
- Homepage upload component

## Reference Files

- [reference.md](reference.md) — Upload and parsing code examples
