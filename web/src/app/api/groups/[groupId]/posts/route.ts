import { NextRequest, NextResponse } from 'next/server';

/**
 * GET handler for retrieving posts for a specific group
 * @param request - The Next.js request object
 * @param params - Route parameters including groupId
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
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
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching group posts:', error);
    return NextResponse.json({ error: 'Failed to fetch group posts' }, { status: 500 });
  }
}

/**
 * POST handler for creating a new post in a group
 * @param request - The Next.js request object
 * @param params - Route parameters including groupId
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;
    
    // Get auth cookie from the request
    const authCookie = request.cookies.get('session')?.value || request.cookies.get('session_token')?.value;
    
    if (!authCookie) {
      console.log('No session cookie found in create group post API');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get request body
    const body = await request.json();
    const { content } = body;
    
    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }
    
    // Forward the request to the backend API
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/groups/${groupId}/posts`;
    console.log(`Creating post at backend URL: ${backendUrl}`);
    
    const formData = new FormData();
    formData.append('content', content);
    
    const response = await fetch(
      backendUrl,
      {
        method: 'POST',
        headers: {
          'Cookie': `session=${authCookie}`,
        },
        body: formData,
        credentials: 'include',
      }
    );
    
    if (!response.ok) {
      console.log(`Backend returned status: ${response.status} when creating group post`);
      throw new Error('Failed to create group post');
    }
    
    console.log('Successfully created group post');
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating group post:', error);
    return NextResponse.json({ error: 'Failed to create group post' }, { status: 500 });
  }
}
