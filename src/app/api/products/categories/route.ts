import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://api-gateway:3000';

export async function GET() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/products/categories`, {
      next: { revalidate: 300 },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: 'Failed to connect to product service' },
      { status: 502 }
    );
  }
}
