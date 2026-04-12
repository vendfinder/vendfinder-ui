import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://api-gateway:3000';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    const res = await fetch(`${API_BASE_URL}/api/auth/seller-status`, {
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
