import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://api-gateway:3000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Forward to backend API
    const res = await fetch(`${API_BASE_URL}/api/users/${id}/follow-status`, {
      headers: { Authorization: authHeader },
    });

    const data = await res.json();

    // If backend doesn't support follow status check yet, return mock data
    if (res.status === 404) {
      // For development, randomly return true/false
      const isFollowing = Math.random() > 0.5;
      return NextResponse.json({
        isFollowing,
        followersCount: Math.floor(Math.random() * 10000),
        followingCount: Math.floor(Math.random() * 5000)
      });
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Follow status check failed:', error);

    // Return mock data for development
    return NextResponse.json({
      isFollowing: false,
      followersCount: 0,
      followingCount: 0
    });
  }
}