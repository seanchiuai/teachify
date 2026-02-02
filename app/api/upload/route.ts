import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    // Get the upload URL from Convex
    const uploadUrl = await convex.mutation(api.files.generateUploadUrl, {});

    // Get the file from the request
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Upload to Convex storage
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });

    if (!uploadResponse.ok) {
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    const { storageId } = await uploadResponse.json();

    // Parse the file
    let content = "";
    try {
      content = await convex.action(api.fileParser.parseFile, { storageId }) || "";
    } catch (e) {
      console.error("Parse error:", e);
    }

    return NextResponse.json({ storageId, content });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
