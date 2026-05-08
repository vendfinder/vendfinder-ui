import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://api-gateway:3000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '10';

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Forward to backend API
    const res = await fetch(`${API_BASE_URL}/api/users/suggested?limit=${limit}`, {
      headers: { Authorization: authHeader },
    });

    const data = await res.json();

    // If backend doesn't support suggested users yet, return mock data
    if (res.status === 404) {
      return NextResponse.json({
        users: getMockSuggestedUsers(parseInt(limit))
      });
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Failed to fetch suggested users:', error);

    // Fallback to mock data
    const limit = parseInt(new URL(request.url).searchParams.get('limit') || '10');
    return NextResponse.json({
      users: getMockSuggestedUsers(limit)
    });
  }
}

function getMockSuggestedUsers(limit: number) {
  const suggestions = [
    {
      id: 'suggested1',
      username: 'collector_pro',
      displayName: 'Marcus Williams',
      email: 'marcus@example.com',
      role: 'seller',
      bio: 'Sports memorabilia and limited edition collector',
      location: 'Atlanta, GA',
      verified: true,
      sellerLevel: 4,
      profileViews: 7890,
      followersCount: 12456,
      followingCount: 892,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      socialInstagram: '@collectorpro',
      createdAt: '2022-11-20T11:30:00Z',
      isFollowing: false,
      mutualFollowers: 23
    },
    {
      id: 'suggested2',
      username: 'fashion_forward',
      displayName: 'Isabella Rodriguez',
      email: 'isabella@example.com',
      role: 'seller',
      bio: 'High-end fashion curator. Chanel, Hermès, Dior specialist.',
      location: 'Miami, FL',
      verified: true,
      sellerLevel: 5,
      profileViews: 18934,
      followersCount: 25678,
      followingCount: 1234,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
      bannerUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
      socialInstagram: '@fashionforward',
      socialWebsite: 'fashionforward.com',
      createdAt: '2022-08-15T09:45:00Z',
      isFollowing: false,
      mutualFollowers: 18
    },
    {
      id: 'suggested3',
      username: 'tech_treasures',
      displayName: 'James Park',
      email: 'james@example.com',
      role: 'seller',
      bio: 'Rare electronics and vintage tech collector',
      location: 'San Francisco, CA',
      verified: false,
      sellerLevel: 3,
      profileViews: 4567,
      followersCount: 6789,
      followingCount: 2341,
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      createdAt: '2023-02-28T14:20:00Z',
      isFollowing: false,
      mutualFollowers: 7
    },
    {
      id: 'suggested4',
      username: 'art_enthusiast',
      displayName: 'Sophie Anderson',
      email: 'sophie@example.com',
      role: 'buyer',
      bio: 'Contemporary art lover. Always hunting for unique pieces.',
      location: 'Portland, OR',
      verified: false,
      sellerLevel: 2,
      profileViews: 2143,
      followersCount: 3456,
      followingCount: 5678,
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      socialInstagram: '@artenthusiast',
      createdAt: '2023-05-10T16:15:00Z',
      isFollowing: false,
      mutualFollowers: 4
    },
    {
      id: 'suggested5',
      username: 'minimal_maven',
      displayName: 'Oliver Chen',
      email: 'oliver@example.com',
      role: 'seller',
      bio: 'Minimalist aesthetic. Quality over quantity. COS, Muji, Uniqlo.',
      location: 'Vancouver, Canada',
      verified: true,
      sellerLevel: 3,
      profileViews: 5432,
      followersCount: 8765,
      followingCount: 987,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      socialWebsite: 'minimalmaven.co',
      createdAt: '2023-01-08T12:30:00Z',
      isFollowing: false,
      mutualFollowers: 11
    },
    {
      id: 'suggested6',
      username: 'vintage_vinyl',
      displayName: 'Rachel Green',
      email: 'rachel@example.com',
      role: 'seller',
      bio: 'Vinyl records and music memorabilia. Rock, jazz, hip-hop classics.',
      location: 'Nashville, TN',
      verified: false,
      sellerLevel: 2,
      profileViews: 3210,
      followersCount: 4567,
      followingCount: 1890,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      socialInstagram: '@vintagevinyl',
      createdAt: '2023-07-03T08:45:00Z',
      isFollowing: false,
      mutualFollowers: 6
    }
  ];

  return suggestions.slice(0, limit);
}