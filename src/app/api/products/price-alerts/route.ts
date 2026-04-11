import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL || "http://api-gateway:3000";

// GET /api/products/price-alerts — list current user's price alerts
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization");
    const searchParams = request.nextUrl.searchParams.toString();
    const url = `${API_BASE_URL}/api/products/me/price-alerts${searchParams ? `?${searchParams}` : ""}`;
    const res = await fetch(url, {
      headers: {
        ...(token ? { Authorization: token } : {}),
      },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to product service" },
      { status: 502 }
    );
  }
}

// DELETE /api/products/price-alerts — delete a price alert by alertId in body
export async function DELETE(request: NextRequest) {
  try {
    const { alertId } = await request.json();
    const token = request.headers.get("authorization");
    const res = await fetch(
      `${API_BASE_URL}/api/products/price-alerts/${alertId}`,
      {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: token } : {}),
        },
      }
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to product service" },
      { status: 502 }
    );
  }
}
