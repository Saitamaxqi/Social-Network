import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import axios from 'axios';

// Define the backend post structure
interface BackendPost {
  id: number;
  title: string;
  body: string;
  media: {
    String: string;
    Valid: boolean;
  } | null;
  likes: number;
  dislikes: number;
  created_at: string;
  user: {
    id: number;
    username: string;
  };
  categories: Array<{
    id: number;
    name: string;
  }>;
  interaction?: number; // User's interaction with this post
  group_id?: {
    Int64: number;
    Valid: boolean;
  };
}

// Define the frontend post structure
interface FrontendPost {
  id: string;
  title?: string;
  content: string;
  media?: string;
  author: {
    id: string;
    username: string;
  };
  categories: Array<{
    id: string;
    name: string;
  }>;
  created_at: string;
  likes: number;
  dislikes: number;
  interaction?: number; // User's interaction with this post
  groupId?: string; // Group ID if the post belongs to a group
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const categoryId = searchParams.get('category');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
  
  try {
    // Get the session cookie
    const sessionCookie = request.cookies.get('session')?.value || '';
    
    // Fetch posts with the session cookie to get user-specific data
    const response = await axios.get(
      `${apiUrl}/posts${categoryId ? `?category=${categoryId}` : ''}`,
      {
        headers: {
          Cookie: sessionCookie ? `session=${sessionCookie}` : '',
        },
        withCredentials: true
      }
    );
    
    if (!response.data || !Array.isArray(response.data)) {
      return NextResponse.json([]);
    }
    
    const backendPosts = response.data;
    
    // Transform the data to match the frontend structure
    const frontendPosts: FrontendPost[] = backendPosts.map((post: BackendPost) => ({
      id: String(post.id),
      title: post.title || undefined,
      content: post.body || '',
      media: post.media && post.media.Valid ? post.media.String : undefined,
      author: {
        id: String(post.user?.id || '0'),
        username: post.user?.username || 'Unknown User'
      },
      categories: (post.categories || []).map(cat => ({
        id: String(cat.id),
        name: cat.name
      })),
      created_at: post.created_at,
      likes: post.likes || 0,
      dislikes: post.dislikes || 0,
      interaction: post.interaction, // Include the user's interaction with this post
      groupId: post.group_id && post.group_id.Valid ? String(post.group_id.Int64) : undefined
    }));
    
    return NextResponse.json(frontendPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json([], { status: 200 }); // Return empty array instead of error
  }
}
