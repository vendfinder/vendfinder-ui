import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://api-gateway:3000';

// POST /api/orders/[id]/dispute — Open a dispute on an order
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const token = request.headers.get('authorization');
    const res = await fetch(`${API_BASE_URL}/api/orders/${id}/dispute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: token } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: 'Failed to connect to order service' },
      { status: 502 }
    );
  }
}

// GET /api/orders/[id]/dispute — Get dispute for an order (convenience route)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization');
    const res = await fetch(`${API_BASE_URL}/api/orders/${id}/dispute`, {
      headers: {
        ...(token ? { Authorization: token } : {}),
      },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: 'Failed to connect to order service' },
      { status: 502 }
    );
  }
}
