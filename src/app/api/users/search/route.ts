import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://api-gateway:3000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = searchParams.get('limit') || '20';
    const offset = searchParams.get('offset') || '0';

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ users: [] });
    }

    // Forward search request to backend
    const params = new URLSearchParams({
      q: query,
      limit,
      offset,
    });

    const authHeader = request.headers.get('authorization');
    const res = await fetch(`${API_BASE_URL}/api/users/search?${params}`, {
      headers: authHeader ? { Authorization: authHeader } : {},
    });

    const data = await res.json();

    // If backend doesn't support search yet, return mock data for development
    if (res.status === 404) {
      return NextResponse.json({
        users: generateMockUsers(query, parseInt(limit))
      });
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('User search failed:', error);

    // Fallback to mock data during development
    const query = new URL(request.url).searchParams.get('q') || '';
    const limit = parseInt(new URL(request.url).searchParams.get('limit') || '20');

    return NextResponse.json({
      users: generateMockUsers(query, limit)
    });
  }
}

// Mock data for development/demo purposes
function generateMockUsers(query: string, limit: number) {
  const mockUsers = [
    {
      id: 'user1',
      username: 'sneakerking',
      displayName: 'Michael Jordan',
      email: 'jordan@example.com',
      role: 'seller',
      bio: 'Premium sneaker collector and reseller. Authentic only.',
      location: 'Chicago, IL',
      verified: true,
      sellerLevel: 5,
      profileViews: 15420,
      followersCount: 8934,
      followingCount: 2156,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      socialInstagram: '@sneakerking',
      createdAt: '2023-01-15T08:30:00Z',
      isFollowing: false,
      mutualFollowers: 12
    },
    {
      id: 'user2',
      username: 'streetwear_sarah',
      displayName: 'Sarah Chen',
      email: 'sarah@example.com',
      role: 'buyer',
      bio: 'Streetwear enthusiast from NYC. Love rare finds!',
      location: 'New York, NY',
      verified: false,
      sellerLevel: 2,
      profileViews: 892,
      followersCount: 1243,
      followingCount: 3456,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
      socialInstagram: '@streetwearsarah',
      createdAt: '2023-06-22T14:15:00Z',
      isFollowing: true,
      mutualFollowers: 5
    },
    {
      id: 'user3',
      username: 'vintage_vibes',
      displayName: 'Alex Rivera',
      email: 'alex@example.com',
      role: 'seller',
      bio: 'Vintage fashion curator. 90s and Y2K specialist.',
      location: 'Los Angeles, CA',
      verified: true,
      sellerLevel: 4,
      profileViews: 5678,
      followersCount: 4321,
      followingCount: 987,
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      socialWebsite: 'vintagevibesco.com',
      createdAt: '2023-03-08T10:45:00Z',
      isFollowing: false,
      mutualFollowers: 3
    },
    {
      id: 'user4',
      username: 'hypebeast_hunter',
      displayName: 'David Kim',
      email: 'david@example.com',
      role: 'buyer',
      bio: 'Hunting for the latest drops. Supreme, Off-White, Fear of God.',
      location: 'Seoul, South Korea',
      verified: false,
      sellerLevel: 1,
      profileViews: 234,
      followersCount: 567,
      followingCount: 1890,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      createdAt: '2024-01-12T16:20:00Z',
      isFollowing: false,
      mutualFollowers: 1
    },
    {
      id: 'user5',
      username: 'designer_deals',
      displayName: 'Emma Thompson',
      email: 'emma@example.com',
      role: 'seller',
      bio: 'Luxury designer pieces at accessible prices. Authentication guaranteed.',
      location: 'London, UK',
      verified: true,
      sellerLevel: 3,
      profileViews: 3421,
      followersCount: 2876,
      followingCount: 456,
      bannerUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      socialInstagram: '@designerdeals',
      createdAt: '2023-09-14T09:12:00Z',
      isFollowing: true,
      mutualFollowers: 8
    }
  ];

  // Filter users based on query
  const filtered = mockUsers.filter(user =>
    user.username.toLowerCase().includes(query.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(query.toLowerCase()) ||
    user.bio?.toLowerCase().includes(query.toLowerCase())
  );

  return filtered.slice(0, limit);
}