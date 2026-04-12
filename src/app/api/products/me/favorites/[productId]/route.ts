import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://api-gateway:3000';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const token = request.headers.get('authorization');
    const res = await fetch(
      `${API_BASE_URL}/api/products/me/favorites/${productId}`,
      {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: token } : {}),
        },
      }
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: 'Failed to connect to product service' },
      { status: 502 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const token = request.headers.get('authorization');
    const res = await fetch(
      `${API_BASE_URL}/api/products/me/favorites/${productId}`,
      {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: token } : {}),
        },
      }
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: 'Failed to connect to product service' },
      { status: 502 }
    );
  }
}
