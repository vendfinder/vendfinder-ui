import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL || "http://api-gateway:3000";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization");
    const res = await fetch(`${API_BASE_URL}/api/orders/me/sales`, {
      headers: {
        ...(token ? { Authorization: token } : {}),
      },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to order service" },
      { status: 502 }
    );
  }
}
