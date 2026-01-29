---
name: file-upload
description: File upload, parsing (PDF, PPTX, DOCX), and Convex storage for lesson materials
---

# File Upload

Handles uploading lesson materials and extracting text content for AI processing. Supports PDF, PPTX, DOCX file uploads via drag-and-drop, plus direct text paste as a fallback.

## Overview

- **Upload**: Drag-and-drop or click to select files
- **Storage**: Files stored in Convex file storage
- **Parsing**: Extract text from PDF, PPTX, DOCX server-side
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
| PDF | .pdf | pdf-parse |
| PowerPoint | .pptx | pptx-parser or mammoth |
| Word | .docx | mammoth |
| Plain text | .txt | N/A (direct read) |

### Upload Flow

1. User drops file on upload zone → client validates file type
2. Client calls `generateUploadUrl` mutation → gets presigned URL
3. Client uploads file to presigned URL → gets `storageId`
4. Client sends `storageId` to a Convex action for parsing
5. Action fetches file content, parses text, returns extracted text

### File Size Limits

- Max file: 10MB (reasonable for lesson materials)
- Client-side validation before upload attempt

## Related Files

- `convex/files.ts` — Upload URL generation, file parsing action
- Homepage upload component

## Reference Files

- [reference.md](reference.md) — Upload and parsing code examples
