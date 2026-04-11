import { NextRequest, NextResponse } from "next/server";

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://user-service:3004";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.headers.get("authorization");
    const res = await fetch(`${USER_SERVICE_URL}/api/kyc/documents/${id}/reprocess`, {
      method: "POST",
      headers: { ...(token ? { Authorization: token } : {}) },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Failed to connect to user service" }, { status: 502 });
  }
}