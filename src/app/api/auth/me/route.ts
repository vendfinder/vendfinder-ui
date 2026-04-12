import { NextRequest, NextResponse } from 'next/server';

const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || 'http://user-service:3004';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    const res = await fetch(`${USER_SERVICE_URL}/auth/me`, {
      headers: authHeader ? { Authorization: authHeader } : {},
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: 'Failed to connect to auth service' },
      { status: 502 }
    );
  }
}
