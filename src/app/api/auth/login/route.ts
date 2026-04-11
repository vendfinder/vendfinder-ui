import { NextRequest, NextResponse } from "next/server";

const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || "http://user-service:3004";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const res = await fetch(`${USER_SERVICE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to auth service" },
      { status: 502 }
    );
  }
}
