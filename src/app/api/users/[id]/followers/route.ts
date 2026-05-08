import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://api-gateway:3000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';

    // Forward to backend API
    const authHeader = request.headers.get('authorization');
    const res = await fetch(`${API_BASE_URL}/api/users/${id}/followers?limit=${limit}&offset=${offset}`, {
      headers: authHeader ? { Authorization: authHeader } : {},
    });

    const data = await res.json();

    // If backend doesn't support followers yet, return mock data
    if (res.status === 404) {
      return NextResponse.json({
        followers: getMockFollowers(parseInt(limit))
      });
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Failed to fetch followers:', error);

    // Return mock data for development
    const limit = parseInt(new URL(request.url).searchParams.get('limit') || '50');
    return NextResponse.json({
      followers: getMockFollowers(limit)
    });
  }
}

function getMockFollowers(limit: number) {
  const followers = [
    {
      id: 'follower1',
      username: 'sneaker_enthusiast',
      displayName: 'Jordan Williams',
      email: 'jordan@example.com',
      role: 'buyer',
      bio: 'Sneaker collector since 2010. Always looking for rare finds.',
      location: 'Atlanta, GA',
      verified: false,
      sellerLevel: 2,
      profileViews: 892,
      followersCount: 1234,
      followingCount: 567,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      socialInstagram: '@sneakerenthusiast',
      createdAt: '2023-04-15T10:30:00Z',
      isFollowing: false,
      mutualFollowers: 5
    },
    {
      id: 'follower2',
      username: 'fashion_forward',
      displayName: 'Emma Thompson',
      email: 'emma@example.com',
      role: 'seller',
      bio: 'High-end fashion curator. Specializing in designer pieces.',
      location: 'Los Angeles, CA',
      verified: true,
      sellerLevel: 4,
      profileViews: 5432,
      followersCount: 8976,
      followingCount: 1234,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
      socialInstagram: '@fashionforward',
      socialWebsite: 'emmafashion.com',
      createdAt: '2023-02-08T14:45:00Z',
      isFollowing: true,
      mutualFollowers: 12
    },
    {
      id: 'follower3',
      username: 'streetwear_king',
      displayName: 'Carlos Rodriguez',
      email: 'carlos@example.com',
      role: 'seller',
      bio: 'Streetwear specialist. Supreme, BAPE, Off-White, and more.',
      location: 'Chicago, IL',
      verified: true,
      sellerLevel: 5,
      profileViews: 12456,
      followersCount: 15678,
      followingCount: 892,
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      socialInstagram: '@streetwearking',
      createdAt: '2022-11-20T09:15:00Z',
      isFollowing: false,
      mutualFollowers: 8
    },
    {
      id: 'follower4',
      username: 'vintage_vibes',
      displayName: 'Sophie Anderson',
      email: 'sophie@example.com',
      role: 'buyer',
      bio: 'Vintage clothing lover. 80s and 90s aesthetic enthusiast.',
      location: 'Portland, OR',
      verified: false,
      sellerLevel: 1,
      profileViews: 456,
      followersCount: 789,
      followingCount: 1567,
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      socialInstagram: '@vintagevibes',
      createdAt: '2023-08-12T16:20:00Z',
      isFollowing: false,
      mutualFollowers: 3
    },
    {
      id: 'follower5',
      username: 'tech_collector',
      displayName: 'David Kim',
      email: 'david@example.com',
      role: 'seller',
      bio: 'Electronics and gadget collector. Vintage to modern tech.',
      location: 'Seattle, WA',
      verified: false,
      sellerLevel: 3,
      profileViews: 2345,
      followersCount: 4567,
      followingCount: 890,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      createdAt: '2023-06-05T11:30:00Z',
      isFollowing: true,
      mutualFollowers: 7
    }
  ];

  return followers.slice(0, limit);
}