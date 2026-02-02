---
name: file-upload
description: File upload, parsing (PDF, PPTX, DOCX, ODT, HTML, MD), and Convex storage for lesson materials
---

# File Upload

Handles uploading lesson materials and extracting text content for AI processing. Supports multiple file formats via drag-and-drop, plus direct text paste as a fallback.

## Overview

- **Upload**: Drag-and-drop or click to select files
- **Storage**: Files stored in Convex file storage via presigned URL pattern
- **Parsing**: Extract text from various formats in a Convex action with image preservation
- **Fallback**: Text paste/type for when file upload isn't needed

## When to Use This Skill

- Building the file upload UI component
- Implementing file parsing logic
- Setting up Convex file storage
- Handling file type validation and errors

## Key Concepts

### Supported Formats

| Format | Extension | Parsing Library | Notes |
|--------|-----------|-----------------|-------|
| PDF | .pdf | `pdf-parse` | Text extraction |
| Word | .docx | `mammoth` | HTML + images as base64 |
| PowerPoint | .pptx | `jszip` | XML text extraction |
| OpenDocument | .odt | `officeparser` | Full AST parsing |
| HTML | .html, .htm | Built-in | Sanitized, scripts removed |
| Markdown | .md | Built-in | Converted to HTML |
| Plain text | .txt | N/A | Direct read |
| RTF | .rtf | Built-in | Formatting stripped |

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
