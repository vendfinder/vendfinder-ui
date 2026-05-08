import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3004';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check for Authorization header first, then cookies
    let authHeader = request.headers.get('authorization');
    if (!authHeader) {
      const cookieStore = await cookies();
      const token = cookieStore.get('token');
      if (token) {
        authHeader = `Bearer ${token.value}`;
      }
    }

    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Forward to user service
    const res = await fetch(`${USER_SERVICE_URL}/users/${id}/follow`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const error = await res.text();
      console.error('User service error:', error);
      return NextResponse.json(
        { error: 'Failed to follow user' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Follow API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}