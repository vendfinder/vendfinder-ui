import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL || "http://api-gateway:3000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    // Forward relevant query params to the backend
    const queryParts: string[] = [];
    const period = searchParams.get("period");
    const size = searchParams.get("size");
    const limit = searchParams.get("limit");

    if (period) queryParts.push(`period=${encodeURIComponent(period)}`);
    if (size) queryParts.push(`size=${encodeURIComponent(size)}`);
    if (limit) queryParts.push(`limit=${encodeURIComponent(limit)}`);

    const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";

    const res = await fetch(
      `${API_BASE_URL}/api/products/${id}/sales-history${queryString}`,
      { next: { revalidate: 60 } }
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
