# Phase 1: Project Setup & Upload

Build US-001, US-002 from `docs/PRD.md`.

## Prerequisite

- Phase 0 complete (documentation finalized)
- No code exists yet — this is a greenfield setup

## Reference Documents

- Skills: `convex/`, `file-upload/`, `ui-components/`
- Design: `docs/design.md`
- API Contracts: `docs/api-contracts.md`

---

## Checkpoint 1.1: Project Scaffolding

**Goal:** Working Next.js + Convex + Tailwind + shadcn/ui dev environment

**Files to create:**
```
package.json
tsconfig.json
tailwind.config.ts
postcss.config.js
next.config.js
app/layout.tsx
app/page.tsx
app/globals.css
components/ui/ (shadcn components)
convex/convex.config.ts
```

**Test:** Run `npm run dev` — app loads at localhost:3000 without errors

**Exit criteria:**
- [ ] Next.js 14 app router working
- [ ] Tailwind CSS working (test with a colored div)
- [ ] shadcn/ui installed (at least Button component)
- [ ] Convex dev server connects

---

## Checkpoint 1.2: Convex Backend Setup

**Goal:** Schema defined, basic mutations work

**Files to create:**
```
convex/schema.ts
convex/games.ts
```

**Schema (convex/schema.ts):**
```typescript
// games table with all fields from PRD
// players table
// answers table
// See docs/api-contracts.md for exact types
```

**Mutations/queries to implement:**
- `createGame` mutation — creates game record with content, returns code
- `getGameByCode` query — retrieves game by 6-char code

**Test:**
- Create game via Convex dashboard
- Query returns the created game

**Exit criteria:**
- [ ] Schema passes typecheck
- [ ] createGame mutation works
- [ ] getGameByCode query returns data

---

## Checkpoint 1.3: File Upload Component

**Goal:** Files can be uploaded and stored in Convex

**Files to create:**
```
components/FileUploadZone.tsx
convex/files.ts
```

**Component props:**
```typescript
interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  acceptedTypes: string[]; // ['.pdf', '.pptx', '.docx']
  maxSizeMB: number; // 10
}
```

**Convex functions:**
- `generateUploadUrl` mutation — returns signed upload URL
- `storeFileReference` mutation — stores file metadata

**Test:**
- Drag PDF onto zone
- File appears in Convex storage dashboard

**Exit criteria:**
- [ ] Drag-and-drop works
- [ ] Click to select works
- [ ] PDF, PPTX, DOCX accepted
- [ ] Rejects other file types with error message
- [ ] File stored in Convex file storage

---

## Checkpoint 1.4: Content Parsing

**Goal:** Uploaded files converted to text

**Files to create:**
```
convex/actions/parseFile.ts
```

**Libraries to use:**
- PDF: `pdf-parse` or `pdfjs-dist`
- PPTX: `mammoth` (for docx), custom extraction for pptx
- DOCX: `mammoth`

**Action signature:**
```typescript
// parseFile action
// Input: fileId (Id<"_storage">)
// Output: { text: string, pageCount?: number }
```

**Test:**
- Upload sample PDF → extracted text displayed
- Upload sample PPTX → extracted text displayed
- Upload sample DOCX → extracted text displayed

**Exit criteria:**
- [ ] PDF text extraction works
- [ ] PPTX text extraction works
- [ ] DOCX text extraction works
- [ ] Empty file shows appropriate message
- [ ] Corrupted file shows error, doesn't crash

---

## Checkpoint 1.5: Homepage Form Complete

**Goal:** Full upload + objective form creates game record

**Files to create:**
```
components/TextContentInput.tsx
components/ObjectiveInput.tsx
components/ObjectiveTypeSelector.tsx
components/GenerateButton.tsx
```

**ObjectiveTypeSelector props:**
```typescript
type ObjectiveType = 'understand' | 'explain' | 'apply' | 'distinguish' | 'perform' | 'analyze';

interface ObjectiveTypeSelectorProps {
  value: ObjectiveType;
  onChange: (type: ObjectiveType) => void;
}
```

**Form flow:**
1. User uploads file OR pastes text
2. User enters learning objective
3. User selects objective type (6 buttons)
4. User clicks "Generate Game"
5. Game record created in Convex with status "generating"
6. Redirect to /host/[code] (game generation happens in Phase 2)

**Test:**
- Complete form with pasted text
- Complete form with uploaded PDF
- Game record exists in Convex
- Redirects to /host/[code] page (can be placeholder)

**Exit criteria:**
- [ ] Text input OR file upload required (validation)
- [ ] Learning objective required (validation)
- [ ] Objective type selector shows 6 options
- [ ] Default objective type is 'understand'
- [ ] Generate button disabled until form valid
- [ ] Form submission creates game record
- [ ] Redirects to host page after creation

---

## Test Scenarios

1. **Happy path - text input**
   - Paste "The mitochondria is the powerhouse of the cell..."
   - Enter objective "Understand cell organelles"
   - Select "Understand" type
   - Click Generate → game created, redirected

2. **Happy path - file upload**
   - Drag PDF onto upload zone
   - Wait for parsing
   - Enter objective
   - Select type
   - Click Generate → game created

3. **Validation - missing content**
   - Try to submit with no content → error shown

4. **Validation - missing objective**
   - Add content, leave objective blank → error shown

5. **File type rejection**
   - Try to upload .exe file → rejected with error

6. **Large file handling**
   - Upload 15MB PDF → rejected (max 10MB)

---

## Exit Criteria Summary

When ALL checkpoints pass:
- [ ] 1.1: Project scaffolding complete
- [ ] 1.2: Convex schema and basic mutations work
- [ ] 1.3: File upload stores files in Convex
- [ ] 1.4: PDF/PPTX/DOCX parsing extracts text
- [ ] 1.5: Homepage form creates game record
- [ ] US-001 acceptance criteria in PRD.md checked off
- [ ] US-002 acceptance criteria in PRD.md checked off
- [ ] Typecheck passes (`npm run build`)
- [ ] All test scenarios verified in browser

---

If you can't complete an acceptance criterion without human assistance, skip that part but report what still needs to be done. When ALL acceptance criteria are met and tested:

<promise>PHASE 1 COMPLETE</promise>
