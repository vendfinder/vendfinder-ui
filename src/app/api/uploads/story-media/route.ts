import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL || "http://api-gateway:3000";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const contentType = request.headers.get("content-type");

    const body = await request.arrayBuffer();

    const headers: Record<string, string> = {};
    if (authHeader) headers["Authorization"] = authHeader;
    if (contentType) headers["Content-Type"] = contentType;

    const res = await fetch(`${API_BASE_URL}/api/uploads/story-media`, {
      method: "POST",
      headers,
      body: Buffer.from(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Failed to upload story media" },
      { status: 502 }
    );
  }
}
