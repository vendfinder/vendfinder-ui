import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3004';

export async function GET(
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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '20';

    // Forward request to user service
    const response = await fetch(`${USER_SERVICE_URL}/users/${id}/following?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('User service error:', error);

      return NextResponse.json(
        { error: 'Failed to fetch following' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform snake_case to camelCase for consistency
    const transformedData = {
      ...data,
      following: data.following?.map((user: any) => ({
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        verified: user.verified,
        followersCount: user.followers_count,
        followingCount: user.following_count,
        bio: user.bio
      })) || []
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

