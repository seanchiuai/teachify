"use client";

import { useCallback, useState } from "react";
import { useAction, useMutation } from "convex/react";
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
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.apple.pages",
  "application/x-iwork-pages-sffpages",
  "application/vnd.apple.keynote",
  "application/x-iwork-keynote-sffkey",
  "text/plain",
  "text/rtf",
  "application/rtf",
];

const ACCEPTED_EXTENSIONS = [
  ".pdf",
  ".ppt",
  ".pptx",
  ".doc",
  ".docx",
  ".pages",
  ".key",
  ".txt",
  ".rtf",
  ".md",
];

function isAcceptedFile(file: File): boolean {
  const nameLower = file.name.toLowerCase();
  const typeLower = (file.type || "").toLowerCase();
  const hasAcceptedExt = ACCEPTED_EXTENSIONS.some((ext) => nameLower.endsWith(ext));
  const validMime = ACCEPTED_TYPES.some((mime) => typeLower === mime || typeLower.startsWith(mime));
  const isIWorkZip =
    (typeLower === "application/zip" || nameLower.endsWith(".zip")) &&
    (nameLower.includes(".pages") || nameLower.includes(".key"));
  return validMime || hasAcceptedExt || isIWorkZip;
}

export function FileUploadZone({
  onContentExtracted,
  onFileUploaded,
}: FileUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parseFile = useAction(api.fileParser.parseFile);
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

        let fileContent = "";

        try {
          fileContent = (await parseFile({ storageId })) || "";
        } catch (parseError) {
          console.error("Server parse failed", parseError);
        }

        if (!fileContent.trim()) {
          fileContent = await extractPlainTextFallback(file);
        }

        if (!fileContent.trim()) {
          throw new Error("We couldn't read any text from that file. Try exporting as PDF or DOCX.");
        }

        onContentExtracted(fileContent.trim());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to process file");
        setFileName(null);
      } finally {
        setUploading(false);
      }
    },
    [generateUploadUrl, onContentExtracted, onFileUploaded, parseFile]
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
        accept=".pdf,.ppt,.pptx,.doc,.docx,.pages,.key,.txt,.rtf,.md,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.apple.pages,application/x-iwork-pages-sffpages,application/vnd.apple.keynote,application/x-iwork-keynote-sffkey,text/plain,application/rtf,text/rtf,application/zip"
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
              <Badge variant="yellow">PPT/PPTX</Badge>
              <Badge variant="green">DOC/DOCX</Badge>
              <Badge variant="purple">Pages/Keynote</Badge>
              <Badge variant="pink">TXT/RTF</Badge>
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

async function extractPlainTextFallback(file: File): Promise<string> {
  const nameLower = file.name.toLowerCase();
  const typeLower = (file.type || "").toLowerCase();

  const asString = async () => (await file.text()).trim();

  if (typeLower.startsWith("text/") || nameLower.endsWith(".txt") || nameLower.endsWith(".md")) {
    return await asString();
  }

  if (typeLower.includes("rtf") || nameLower.endsWith(".rtf")) {
    const raw = await asString();
    return stripRtf(raw);
  }

  return "";
}

function stripRtf(raw: string): string {
  if (!raw.trim().startsWith("{\\rtf")) return raw;

  let text = raw.replace(/\\par[d]?/g, "\n");
  text = text.replace(/\\'([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  text = text.replace(/\\[a-zA-Z]+-?\d* ?/g, "");
  text = text.replace(/[{}]/g, "");
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
}
