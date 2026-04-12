import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://api-gateway:3000';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ bidId: string }> }
) {
  try {
    const { bidId } = await params;
    const body = await request.json();
    const token = request.headers.get('authorization');
    const res = await fetch(`${API_BASE_URL}/api/products/bids/${bidId}`, {
      method: 'PUT',
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
      { error: 'Failed to connect to product service' },
      { status: 502 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ bidId: string }> }
) {
  try {
    const { bidId } = await params;
    const token = request.headers.get('authorization');
    const res = await fetch(`${API_BASE_URL}/api/products/bids/${bidId}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: token } : {}),
      },
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
