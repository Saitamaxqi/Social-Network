import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const categoryId = searchParams.get('category');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
  
  try {
    const response = await fetch(`${apiUrl}/posts${categoryId ? `?category=${categoryId}` : ''}`);
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const backendPosts = await response.json();
    
    // If backend returns null or not an array, return an empty array
    if (!backendPosts || !Array.isArray(backendPosts)) {
      return NextResponse.json([]);
    }
    
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
      dislikes: post.dislikes || 0
    }));
    
    return NextResponse.json(frontendPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json([], { status: 200 }); // Return empty array instead of error
  }
}
