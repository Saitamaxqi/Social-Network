//Get endpoint for groupm posts using axios
import { NextRequest, NextResponse } from 'next/server';

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

export async function GET(request: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    const { groupId } = params;
    
    // Get auth cookie from the request
    const authCookie = request.cookies.get('session')?.value || request.cookies.get('session_token')?.value;
    
    if (!authCookie) {
      console.log('No session cookie found in group posts API');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Forward the request to the backend API
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/groups/${groupId}/posts`;
    console.log(`Forwarding to backend URL: ${backendUrl}`);
    
    const response = await fetch(
      backendUrl,
      {
        headers: {
          'Cookie': `session=${authCookie}`,
        },
        credentials: 'include',
      }
    );
    
    if (!response.ok) {
      console.log(`Backend returned status: ${response.status} when fetching group posts`);
      throw new Error('Failed to fetch group posts');
    }
    
    console.log('Successfully fetched group posts');
    
    const backendPosts = await response.json();
    
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
      dislikes: post.dislikes || 0,
      interaction: post.interaction, // Include the user's interaction with this post
      groupId: groupId // Add the group ID
    }));
    
    return NextResponse.json(frontendPosts);
  } catch (error) {
    console.error('Error fetching group posts:', error);
    return NextResponse.json({ error: 'Failed to fetch group posts' }, { status: 500 });
  }
}


export async function POST(request: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    const { groupId } = params;
    
    // Get auth cookie from the request
    const authCookie = request.cookies.get('session')?.value || request.cookies.get('session_token')?.value;
    
    if (!authCookie) {
      console.log('No session cookie found in group posts API');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get form data from the request
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const body = formData.get('body') as string || formData.get('content') as string; // Support both field names for compatibility
    const media = formData.get('media') as File | null;
    const categories = formData.get('categories') as string;

    // Validate required fields
    if (!body) {
      return NextResponse.json({ error: 'Post body is required' }, { status: 400 });
    }

    // Create a new FormData object for the backend
    const backendFormData = new FormData();
    backendFormData.append('title', title);
    backendFormData.append('body', body); // Using body field to match Post model
    if (media) {
      backendFormData.append('media', media);
    }
    // Add categories if provided
    if (categories) {
      backendFormData.append('categories', categories);
    }

    // Forward the request to the backend API
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/groups/${groupId}/posts`;
    console.log(`Creating post at backend URL: ${backendUrl}`);
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Cookie': `session=${authCookie}`,
      },
      body: backendFormData,
      credentials: 'include'
    });
    
    if (!response.ok) {
      console.log(`Backend returned status: ${response.status} when creating group post`);
      throw new Error('Failed to create group post');
    }
    
    const post = await response.json();
    console.log('Successfully created group post');
    return NextResponse.json(post);
  } catch (error) {
    console.error('Error creating group post:', error);
    return NextResponse.json({ error: 'Failed to create group post' }, { status: 500 });
  }
}