import { NextRequest, NextResponse } from 'next/server';
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
  comments: Array<{
    id: number;
    body: string;
    created_at: string;
    user: {
      id: number;
      username: string;
    };
    media: {
      String: string;
      Valid: boolean;
    } | null;
  }>;
  interaction?: number; // User's interaction with this post
}

// Define the backend category and comment interfaces
interface BackendCategory {
  id: number;
  name: string;
}

interface BackendComment {
  id: number;
  body: string;
  created_at: string;
  user: {
    id: number;
    username: string;
  };
  media: {
    String: string;
    Valid: boolean;
  } | null;
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
  comments: Array<{
    id: string;
    content: string;
    created_at: string;
    media?: string;
    author: {
      id: string;
      username: string;
    };
  }>;
  created_at: string;
  likes: number;
  dislikes: number;
  interaction?: number; // User's interaction with this post
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
    
    // Get the session cookie
    const sessionCookie = request.cookies.get('session')?.value || '';
    
    // Fetch post with the session cookie to get user-specific data
    const response = await axios.get(
      `${apiUrl}/posts/${postId}`,
      {
        headers: {
          Cookie: sessionCookie ? `session=${sessionCookie}` : '',
        },
        withCredentials: true
      }
    );
    
    if (!response.data) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    const backendPost = response.data;
    
    // Transform the data to match the frontend structure
    const frontendPost: FrontendPost = {
      id: String(backendPost.id),
      title: backendPost.title || undefined,
      content: backendPost.body || '',
      media: backendPost.media && backendPost.media.Valid ? backendPost.media.String : undefined,
      author: {
        id: String(backendPost.user?.id || '0'),
        username: backendPost.user?.username || 'Unknown User'
      },
      categories: (backendPost.categories || []).map((cat: BackendCategory) => ({
        id: String(cat.id),
        name: cat.name
      })),
      comments: (backendPost.comments || []).map((comment: BackendComment) => ({
        id: String(comment.id),
        content: comment.body || '',
        created_at: comment.created_at,
        media: comment.media && comment.media.Valid ? comment.media.String : undefined,
        author: {
          id: String(comment.user?.id || '0'),
          username: comment.user?.username || 'Unknown User'
        }
      })),
      created_at: backendPost.created_at,
      likes: backendPost.likes || 0,
      dislikes: backendPost.dislikes || 0,
      interaction: backendPost.interaction // Include the user's interaction with this post
    };
    
    return NextResponse.json(frontendPost);
  } catch (error) {
    console.error('Error fetching post:', error);
    
    // Handle Axios errors
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const errorMessage = error.response?.data?.error || 'Failed to fetch post';
      
      return NextResponse.json(
        { error: errorMessage },
        { status }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
